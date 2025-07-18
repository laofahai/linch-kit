/**
 * @linch-kit/auth 增强JWT认证服务
 * 
 * 基于JWT的企业级认证服务实现
 * 集成黑名单机制、速率限制和安全防护
 * 
 * @author LinchKit Team
 * @since 0.2.0
 */

import { randomUUID } from 'crypto'

import { logger } from '@linch-kit/core/server'
import { sign, verify, type JwtPayload } from 'jsonwebtoken'

import type { 
  IAuthService, 
  AuthRequest, 
  AuthResult, 
  Session, 
  LinchKitUser, 
  JWTPayload
} from '../types'
import { JWTBlacklistManager, type JWTBlacklistManagerConfig } from '../security/jwt-blacklist-manager'
import { RateLimiter, type RateLimitConfig, rateLimitPresets } from '../security/rate-limiter'

/**
 * 增强JWT认证服务配置
 */
export interface EnhancedJWTAuthServiceConfig {
  /** JWT配置 */
  jwtSecret: string
  accessTokenExpiry: string
  refreshTokenExpiry: string
  algorithm: 'HS256' | 'HS384' | 'HS512'
  issuer?: string
  audience?: string
  
  /** 安全配置 */
  security?: {
    /** 是否启用黑名单机制 */
    enableBlacklist?: boolean
    /** 黑名单管理器配置 */
    blacklistConfig?: Partial<JWTBlacklistManagerConfig>
    
    /** 是否启用速率限制 */
    enableRateLimit?: boolean
    /** 速率限制配置 */
    rateLimitConfig?: Partial<RateLimitConfig>
    
    /** 是否启用渐进式延迟 */
    enableProgressiveDelay?: boolean
    /** 最大并发会话数 */
    maxConcurrentSessions?: number
  }
}

/**
 * 增强JWT认证服务实现
 * 
 * 提供企业级JWT认证功能：
 * - 用户认证和令牌生成
 * - 令牌验证和会话管理
 * - 令牌刷新和续期
 * - 会话撤销和管理
 * - JWT黑名单机制
 * - 速率限制和暴力破解防护
 * - 多设备会话管理
 */
export class EnhancedJWTAuthService implements IAuthService {
  private readonly config: EnhancedJWTAuthServiceConfig
  private readonly activeSessions = new Map<string, Session>()
  private readonly refreshTokens = new Map<string, { userId: string; sessionId: string; expiresAt: Date }>()
  private readonly userSessions = new Map<string, Set<string>>() // userId -> Set<sessionId>
  
  private readonly blacklistManager?: JWTBlacklistManager
  private readonly rateLimiter?: RateLimiter

  constructor(config: EnhancedJWTAuthServiceConfig) {
    this.config = config
    this.validateConfig()
    
    // 初始化安全组件
    if (config.security?.enableBlacklist) {
      this.blacklistManager = new JWTBlacklistManager(config.security.blacklistConfig)
    }
    
    if (config.security?.enableRateLimit) {
      this.rateLimiter = new RateLimiter(
        config.security.rateLimitConfig || rateLimitPresets.strict
      )
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.jwtSecret) {
      throw new Error('JWT secret is required')
    }
    if (this.config.jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long')
    }
    
    // 验证过期时间格式
    try {
      this.parseExpiryToSeconds(this.config.accessTokenExpiry)
      this.parseExpiryToSeconds(this.config.refreshTokenExpiry)
    } catch (error) {
      throw new Error(`Invalid expiry format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 用户认证
   */
  async authenticate(request: AuthRequest): Promise<AuthResult> {
    const ipAddress = request.metadata?.ipAddress as string || 'unknown'
    
    try {
      logger.info('增强JWT认证开始', {
        service: 'enhanced-jwt-auth-service',
        provider: request.provider,
        ipAddress,
        hasCredentials: !!request.credentials
      })

      // 速率限制检查
      if (this.rateLimiter) {
        const rateLimit = await this.rateLimiter.checkLimit(ipAddress, 'login')
        if (!rateLimit.allowed) {
          logger.warn('认证请求被速率限制拒绝', {
            service: 'enhanced-jwt-auth-service',
            ipAddress,
            lockedUntil: rateLimit.lockedUntil
          })
          
          return {
            success: false,
            error: 'Too many login attempts. Please try again later.'
          }
        }
      }

      // 验证用户凭据
      const user = await this.validateCredentials(request.credentials)
      
      // 记录认证尝试
      if (this.rateLimiter) {
        await this.rateLimiter.recordAttempt({
          identifier: ipAddress,
          type: 'login',
          success: !!user,
          metadata: {
            userAgent: request.metadata?.userAgent,
            provider: request.provider
          }
        })
      }
      
      if (!user) {
        logger.warn('用户凭据验证失败', {
          service: 'enhanced-jwt-auth-service',
          provider: request.provider,
          ipAddress
        })
        return {
          success: false,
          error: 'Invalid credentials'
        }
      }

      // 检查并发会话限制
      if (this.config.security?.maxConcurrentSessions) {
        await this.enforceConcurrentSessionLimit(user.id)
      }

      // 生成JWT令牌
      const sessionId = randomUUID()
      const { accessToken, refreshToken } = await this.generateTokens(user, sessionId)

      // 创建会话
      await this.createSession(user, sessionId, accessToken, refreshToken, request.metadata)

      logger.info('增强JWT认证成功', {
        service: 'enhanced-jwt-auth-service',
        userId: user.id,
        sessionId,
        ipAddress
      })

      return {
        success: true,
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.parseExpiryToSeconds(this.config.accessTokenExpiry)
        }
      }
    } catch (error) {
      logger.error('增强JWT认证失败', error instanceof Error ? error : undefined, {
        service: 'enhanced-jwt-auth-service',
        provider: request.provider,
        ipAddress
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * 验证会话
   */
  async validateSession(token: string): Promise<Session | null> {
    try {
      // 验证JWT令牌
      const payload = verify(token, this.config.jwtSecret, {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as JwtPayload & JWTPayload

      if (!payload.sub || !payload.jti) {
        logger.warn('JWT令牌载荷无效', {
          service: 'enhanced-jwt-auth-service',
          hasSubject: !!payload.sub,
          hasJti: !!payload.jti
        })
        return null
      }

      // 检查令牌是否在黑名单中
      if (this.blacklistManager) {
        const isBlacklisted = await this.blacklistManager.isTokenBlacklisted(payload.jti)
        if (isBlacklisted) {
          logger.warn('检测到黑名单令牌访问', {
            service: 'enhanced-jwt-auth-service',
            jti: payload.jti,
            userId: payload.sub
          })
          return null
        }
      }

      // 查找会话
      const session = this.activeSessions.get(payload.jti)
      if (!session) {
        logger.warn('会话不存在', {
          service: 'enhanced-jwt-auth-service',
          sessionId: payload.jti
        })
        return null
      }

      // 检查会话是否过期
      if (session.expiresAt < new Date()) {
        logger.warn('会话已过期', {
          service: 'enhanced-jwt-auth-service',
          sessionId: payload.jti,
          expiresAt: session.expiresAt
        })
        
        // 清理过期会话
        await this.cleanupExpiredSession(payload.jti)
        return null
      }

      // 更新最后访问时间
      session.lastAccessedAt = new Date()
      
      return session
    } catch (error) {
      logger.error('会话验证失败', error instanceof Error ? error : undefined, {
        service: 'enhanced-jwt-auth-service'
      })
      return null
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<Session | null> {
    try {
      // 验证刷新令牌
      const refreshData = this.refreshTokens.get(refreshToken)
      if (!refreshData) {
        logger.warn('刷新令牌不存在', {
          service: 'enhanced-jwt-auth-service'
        })
        return null
      }

      // 检查令牌是否过期
      if (refreshData.expiresAt < new Date()) {
        logger.warn('刷新令牌已过期', {
          service: 'enhanced-jwt-auth-service',
          expiresAt: refreshData.expiresAt
        })
        this.refreshTokens.delete(refreshToken)
        return null
      }

      // 获取用户信息
      const user = await this.getUser(refreshData.userId)
      if (!user) {
        logger.warn('用户不存在', {
          service: 'enhanced-jwt-auth-service',
          userId: refreshData.userId
        })
        return null
      }

      // 撤销旧会话（添加到黑名单）
      const oldSession = this.activeSessions.get(refreshData.sessionId)
      if (oldSession && this.blacklistManager) {
        await this.blacklistManager.blacklistToken({
          jti: refreshData.sessionId,
          expiresAt: oldSession.expiresAt,
          reason: 'security',
          userId: user.id
        })
      }

      // 清理旧会话
      await this.cleanupSession(refreshData.sessionId)
      this.refreshTokens.delete(refreshToken)

      // 生成新令牌
      const newSessionId = randomUUID()
      const tokens = await this.generateTokens(user, newSessionId)

      // 创建新会话
      const newSession = await this.createSession(user, newSessionId, tokens.accessToken, tokens.refreshToken)

      logger.info('令牌刷新成功', {
        service: 'enhanced-jwt-auth-service',
        userId: user.id,
        oldSessionId: refreshData.sessionId,
        newSessionId
      })

      return newSession
    } catch (error) {
      logger.error('令牌刷新失败', error instanceof Error ? error : undefined, {
        service: 'enhanced-jwt-auth-service'
      })
      return null
    }
  }

  /**
   * 注销会话
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId)
      if (!session) {
        return false
      }

      // 将令牌添加到黑名单
      if (this.blacklistManager) {
        await this.blacklistManager.blacklistToken({
          jti: sessionId,
          expiresAt: session.expiresAt,
          reason: 'logout',
          userId: session.userId
        })
      }

      // 清理会话
      await this.cleanupSession(sessionId)

      logger.info('会话注销成功', {
        service: 'enhanced-jwt-auth-service',
        sessionId,
        userId: session.userId
      })

      return true
    } catch (error) {
      logger.error('会话注销失败', error instanceof Error ? error : undefined, {
        service: 'enhanced-jwt-auth-service',
        sessionId
      })
      return false
    }
  }

  /**
   * 注销用户的所有会话
   */
  async revokeAllSessions(userId: string): Promise<number> {
    try {
      let revokedCount = 0
      const userSessionIds = this.userSessions.get(userId) || new Set()

      // 批量撤销会话
      for (const sessionId of userSessionIds) {
        const session = this.activeSessions.get(sessionId)
        if (session) {
          // 将令牌添加到黑名单
          if (this.blacklistManager) {
            await this.blacklistManager.blacklistToken({
              jti: sessionId,
              expiresAt: session.expiresAt,
              reason: 'admin',
              userId
            })
          }

          await this.cleanupSession(sessionId)
          revokedCount++
        }
      }

      // 清理用户会话记录
      this.userSessions.delete(userId)

      logger.info('用户所有会话注销成功', {
        service: 'enhanced-jwt-auth-service',
        userId,
        revokedCount
      })

      return revokedCount
    } catch (error) {
      logger.error('批量会话注销失败', error instanceof Error ? error : undefined, {
        service: 'enhanced-jwt-auth-service',
        userId
      })
      return 0
    }
  }

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<LinchKitUser | null> {
    // 在实际实现中，这里应该从数据库或用户存储中获取用户信息
    // 为了演示，我们返回一个模拟用户
    if (userId === 'test-user-id') {
      return {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    return null
  }

  /**
   * 验证用户凭据
   */
  async validateCredentials(credentials: Record<string, unknown>): Promise<LinchKitUser | null> {
    const { email, password } = credentials

    // 在实际实现中，这里应该验证用户凭据
    // 为了演示，我们使用简单的硬编码验证
    if (email === 'test@example.com' && password === 'password123') {
      return {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    return null
  }

  /**
   * 检查服务健康状态
   */
  async isHealthy(): Promise<boolean> {
    try {
      // 检查JWT secret是否可用
      const testPayload = { test: true }
      const testToken = sign(testPayload, this.config.jwtSecret, {
        expiresIn: '1s',
        algorithm: this.config.algorithm
      })

      // 验证测试令牌
      verify(testToken, this.config.jwtSecret, {
        algorithms: [this.config.algorithm]
      })

      return true
    } catch (error) {
      logger.error('增强JWT服务健康检查失败', error instanceof Error ? error : undefined, {
        service: 'enhanced-jwt-auth-service'
      })
      return false
    }
  }

  /**
   * 获取服务实现类型
   */
  getServiceType(): 'jwt' {
    return 'jwt'
  }

  /**
   * 获取用户活跃会话
   */
  async getUserActiveSessions(userId: string): Promise<Session[]> {
    const sessionIds = this.userSessions.get(userId) || new Set()
    const sessions: Session[] = []

    for (const sessionId of sessionIds) {
      const session = this.activeSessions.get(sessionId)
      if (session && session.expiresAt > new Date()) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * 销毁服务并清理资源
   */
  destroy(): void {
    this.blacklistManager?.destroy()
    this.rateLimiter?.destroy()
  }

  /**
   * 生成JWT令牌对
   */
  private async generateTokens(user: LinchKitUser, sessionId: string): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const now = Math.floor(Date.now() / 1000)
    
    // 生成访问令牌
    const accessPayload: JWTPayload = {
      sub: user.id,
      iat: now,
      exp: now + this.parseExpiryToSeconds(this.config.accessTokenExpiry),
      jti: sessionId,
      roles: [], // 在实际实现中，这里应该从用户数据中获取角色
      permissions: [], // 在实际实现中，这里应该从用户数据中获取权限
      tenantId: user.tenantId
    }

    const accessToken = sign(accessPayload, this.config.jwtSecret, {
      algorithm: this.config.algorithm,
      issuer: this.config.issuer,
      audience: this.config.audience
    })

    // 生成刷新令牌
    const refreshToken = randomUUID()
    const refreshExpiresAt = new Date(Date.now() + this.parseExpiryToSeconds(this.config.refreshTokenExpiry) * 1000)

    // 存储刷新令牌
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      sessionId,
      expiresAt: refreshExpiresAt
    })

    return { accessToken, refreshToken }
  }

  /**
   * 创建会话
   */
  private async createSession(
    user: LinchKitUser,
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    metadata?: Record<string, unknown>
  ): Promise<Session> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.parseExpiryToSeconds(this.config.accessTokenExpiry) * 1000)

    const session: Session = {
      id: sessionId,
      userId: user.id,
      accessToken,
      refreshToken,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      metadata: {
        userAgent: metadata?.userAgent || 'Enhanced-JWT-Service',
        ipAddress: metadata?.ipAddress || '127.0.0.1',
        deviceFingerprint: metadata?.deviceFingerprint
      }
    }

    // 存储会话
    this.activeSessions.set(sessionId, session)

    // 记录用户会话
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set())
    }
    this.userSessions.get(user.id)!.add(sessionId)

    return session
  }

  /**
   * 清理会话
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      // 删除会话
      this.activeSessions.delete(sessionId)

      // 删除用户会话记录
      const userSessionIds = this.userSessions.get(session.userId)
      if (userSessionIds) {
        userSessionIds.delete(sessionId)
        if (userSessionIds.size === 0) {
          this.userSessions.delete(session.userId)
        }
      }

      // 查找并删除关联的刷新令牌
      for (const [refreshToken, data] of this.refreshTokens.entries()) {
        if (data.sessionId === sessionId) {
          this.refreshTokens.delete(refreshToken)
          break
        }
      }
    }
  }

  /**
   * 清理过期会话
   */
  private async cleanupExpiredSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (session && this.blacklistManager) {
      // 将过期令牌添加到黑名单
      await this.blacklistManager.blacklistToken({
        jti: sessionId,
        expiresAt: session.expiresAt,
        reason: 'expired',
        userId: session.userId
      })
    }
    
    await this.cleanupSession(sessionId)
  }

  /**
   * 强制执行并发会话限制
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const maxSessions = this.config.security?.maxConcurrentSessions || 5
    const userSessionIds = this.userSessions.get(userId) || new Set()

    if (userSessionIds.size >= maxSessions) {
      // 找到最老的会话并撤销
      const sessions = Array.from(userSessionIds)
        .map(id => this.activeSessions.get(id))
        .filter(session => session)
        .sort((a, b) => a!.createdAt.getTime() - b!.createdAt.getTime())

      const sessionsToRevoke = sessions.slice(0, sessions.length - maxSessions + 1)
      
      for (const session of sessionsToRevoke) {
        if (session) {
          await this.revokeSession(session.id)
        }
      }

      logger.info('强制执行并发会话限制', {
        service: 'enhanced-jwt-auth-service',
        userId,
        maxSessions,
        revokedCount: sessionsToRevoke.length
      })
    }
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`)
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 's':
        return value
      case 'm':
        return value * 60
      case 'h':
        return value * 3600
      case 'd':
        return value * 86400
      default:
        throw new Error(`Invalid expiry unit: ${unit}`)
    }
  }
}

/**
 * 创建增强JWT认证服务实例
 */
export function createEnhancedJWTAuthService(config: EnhancedJWTAuthServiceConfig): EnhancedJWTAuthService {
  return new EnhancedJWTAuthService(config)
}

/**
 * 默认增强JWT认证服务配置
 * 
 * ⚠️  安全警告：必须在生产环境中设置 JWT_SECRET 环境变量
 * ⚠️  配置将通过 ConfigManager 强制验证环境变量
 */
export const defaultEnhancedJWTAuthServiceConfig: EnhancedJWTAuthServiceConfig = {
  jwtSecret: process.env.JWT_SECRET!, // 强制要求环境变量
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'linch-kit-auth',
  audience: 'linch-kit-app',
  security: {
    enableBlacklist: true,
    enableRateLimit: true,
    enableProgressiveDelay: true,
    maxConcurrentSessions: 5
  }
}