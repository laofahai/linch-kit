/**
 * @linch-kit/auth TOTP多因子认证管理器
 * 基于 speakeasy 和 qrcode 实现
 */

import { randomBytes } from 'crypto'

import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'

import type { User, TOTPSetup, MFAVerification } from '../types'

/**
 * TOTP配置选项
 */
export interface TOTPConfig {
  serviceName: string
  issuer: string
  window?: number // 时间窗口容错（秒）
  keyLength?: number // 密钥长度
  backupCodesCount?: number // 备用码数量
}

/**
 * TOTP多因子认证管理器
 * 
 * 设计原则：
 * - 基于speakeasy成熟库实现TOTP
 * - 提供备用码作为恢复机制
 * - 支持时间窗口容错
 * - 安全的密钥生成和管理
 * - 防重放攻击保护
 */
export class TOTPManager {
  private config: TOTPConfig
  private usedTokensCache: Map<string, Set<string>> // 防重放缓存

  constructor(config: TOTPConfig) {
    this.config = {
      window: 30, // 默认30秒窗口
      keyLength: 32, // 默认32字节密钥
      backupCodesCount: 10, // 默认10个备用码
      ...config
    }
    
    this.usedTokensCache = new Map()
    
    // 定期清理过期的token缓存
    setInterval(() => this.cleanupUsedTokens(), 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 为用户设置TOTP
   */
  public async setupTOTP(user: User): Promise<TOTPSetup> {
    // 使用speakeasy生成密钥
    const secret = speakeasy.generateSecret({
      name: user.email,
      issuer: this.config.issuer,
      length: this.config.keyLength || 32
    })
    
    // 生成二维码
    const qrCode = await this.generateQRCode(secret.otpauth_url!)
    
    // 生成备用码
    const backupCodes = this.generateBackupCodes()
    
    // TODO: 存储到数据库
    // await this.storeTOTPSecret(user.id, secret.base32, backupCodes)
    
    return {
      secret: secret.base32!,
      qrCode,
      backupCodes
    }
  }

  /**
   * 验证TOTP令牌
   */
  public async verifyTOTP(verification: MFAVerification): Promise<boolean> {
    const { userId, token } = verification
    
    try {
      // 检查是否已使用过该token（防重放攻击）
      if (this.isTokenUsed(userId, token)) {
        return false
      }
      
      // 获取用户的TOTP密钥
      const secret = await this.getUserTOTPSecret(userId)
      if (!secret) {
        return false
      }
      
      // 使用speakeasy验证TOTP令牌
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: this.config.window || 1
      })
      
      if (isValid) {
        // 标记token为已使用
        this.markTokenAsUsed(userId, token)
        
        // 记录成功验证
        await this.logMFAEvent(userId, 'totp_verify_success', { token: token.substring(0, 2) + '****' })
        
        return true
      }
      
      // 记录失败验证
      await this.logMFAEvent(userId, 'totp_verify_failed', { token: token.substring(0, 2) + '****' })
      
      return false
    } catch (error) {
      console.error('TOTP verification error:', error)
      await this.logMFAEvent(userId, 'totp_verify_error', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  /**
   * 验证备用码
   */
  public async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    try {
      // 获取用户的备用码
      const userBackupCodes = await this.getUserBackupCodes(userId)
      if (!userBackupCodes || userBackupCodes.length === 0) {
        return false
      }
      
      // 查找匹配的备用码
      const codeIndex = userBackupCodes.findIndex(code => code === backupCode)
      if (codeIndex === -1) {
        await this.logMFAEvent(userId, 'backup_code_verify_failed', { code: backupCode.substring(0, 2) + '****' })
        return false
      }
      
      // 移除已使用的备用码
      userBackupCodes.splice(codeIndex, 1)
      await this.updateUserBackupCodes(userId, userBackupCodes)
      
      // 记录成功验证
      await this.logMFAEvent(userId, 'backup_code_verify_success', { 
        code: backupCode.substring(0, 2) + '****',
        remainingCodes: userBackupCodes.length
      })
      
      // 如果备用码不足，发出警告
      if (userBackupCodes.length <= 2) {
        await this.logMFAEvent(userId, 'backup_codes_low', { remainingCodes: userBackupCodes.length })
      }
      
      return true
    } catch (error) {
      console.error('Backup code verification error:', error)
      await this.logMFAEvent(userId, 'backup_code_verify_error', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  /**
   * 重新生成备用码
   */
  public async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newBackupCodes = this.generateBackupCodes()
    
    // 更新数据库中的备用码
    await this.updateUserBackupCodes(userId, newBackupCodes)
    
    // 记录备用码重新生成
    await this.logMFAEvent(userId, 'backup_codes_regenerated', { count: newBackupCodes.length })
    
    return newBackupCodes
  }

  /**
   * 禁用用户的TOTP
   */
  public async disableTOTP(userId: string): Promise<boolean> {
    try {
      // 从数据库中移除TOTP密钥和备用码
      await this.removeTOTPSecret(userId)
      await this.updateUserBackupCodes(userId, [])
      
      // 清理缓存
      this.usedTokensCache.delete(userId)
      
      // 记录TOTP禁用
      await this.logMFAEvent(userId, 'totp_disabled')
      
      return true
    } catch (error) {
      console.error('Failed to disable TOTP:', error)
      return false
    }
  }

  /**
   * 检查用户是否启用了TOTP
   */
  public async isTOTPEnabled(userId: string): Promise<boolean> {
    const secret = await this.getUserTOTPSecret(userId)
    return secret !== null
  }

  /**
   * 获取用户剩余备用码数量
   */
  public async getRemainingBackupCodes(userId: string): Promise<number> {
    const backupCodes = await this.getUserBackupCodes(userId)
    return backupCodes ? backupCodes.length : 0
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 生成TOTP密钥（已通过speakeasy.generateSecret替代）
   */
  private generateSecret(): string {
    // 这个方法已被setupTOTP中的speakeasy.generateSecret替代
    throw new Error('Use speakeasy.generateSecret in setupTOTP method')
  }

  /**
   * 生成TOTP URI（已通过speakeasy.generateSecret的otpauth_url替代）
   */
  private generateTOTPUri(_email: string, _secret: string): string {
    // 这个方法已被speakeasy.generateSecret的otpauth_url替代
    throw new Error('Use speakeasy.generateSecret otpauth_url in setupTOTP method')
  }

  /**
   * 生成二维码
   */
  private async generateQRCode(uri: string): Promise<string> {
    try {
      const qrCodeDataURL = await new Promise<string>((resolve, reject) => {
        QRCode.toDataURL(uri, {
          errorCorrectionLevel: 'M',
          type: 'image/png' as unknown,
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        } as unknown, (err: unknown, url: string) => {
          if (err) reject(err)
          else resolve(url)
        })
      })
      return qrCodeDataURL
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * 生成备用码
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    
    for (let i = 0; i < this.config.backupCodesCount!; i++) {
      // 生成8位随机码
      const code = randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
    }
    
    return codes
  }

  /**
   * 检查token是否已被使用
   */
  private isTokenUsed(userId: string, token: string): boolean {
    const userTokens = this.usedTokensCache.get(userId)
    return userTokens ? userTokens.has(token) : false
  }

  /**
   * 标记token为已使用
   */
  private markTokenAsUsed(userId: string, token: string): void {
    let userTokens = this.usedTokensCache.get(userId)
    if (!userTokens) {
      userTokens = new Set()
      this.usedTokensCache.set(userId, userTokens)
    }
    userTokens.add(token)
  }

  /**
   * 清理过期的token缓存
   */
  private cleanupUsedTokens(): void {
    // TOTP令牌在时间窗口后自动过期，清理所有缓存
    this.usedTokensCache.clear()
    console.log('Cleaned up used TOTP tokens cache')
  }

  /**
   * 记录MFA事件
   */
  private async logMFAEvent(userId: string, eventType: string, details?: unknown): Promise<void> {
    const eventData = {
      userId,
      eventType,
      timestamp: new Date(),
      details
    }
    
    console.log('MFA event:', eventData)
    
    // TODO: 集成审计日志系统
    // await auditLogger.log({
    //   eventType,
    //   userId,
    //   details,
    //   result: 'success',
    //   timestamp: new Date()
    // })
  }

  // 数据库操作方法（TODO: 实现）
  private async getUserTOTPSecret(userId: string): Promise<string | null> {
    // TODO: 从数据库获取用户的TOTP密钥
    console.log(`Getting TOTP secret for user ${userId}`)
    return null
  }

  private async getUserBackupCodes(userId: string): Promise<string[] | null> {
    // TODO: 从数据库获取用户的备用码
    console.log(`Getting backup codes for user ${userId}`)
    return null
  }

  private async updateUserBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    // TODO: 更新数据库中的备用码
    console.log(`Updating backup codes for user ${userId}`, { count: backupCodes.length })
  }

  private async removeTOTPSecret(userId: string): Promise<void> {
    // TODO: 从数据库移除TOTP密钥
    console.log(`Removing TOTP secret for user ${userId}`)
  }
}