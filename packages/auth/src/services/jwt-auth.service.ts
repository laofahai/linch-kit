/**
 * @linch-kit/auth JWT认证服务
 * 
 * 基于JWT的生产级认证服务实现
 * 支持令牌生成、验证、刷新和会话管理
 * 
 * @author LinchKit Team
 * @since 0.1.0
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
import { 
  createAuthPerformanceMonitor as createNewAuthPerformanceMonitor,
  type IAuthPerformanceMonitor as INewAuthPerformanceMonitor
} from '../monitoring/auth-performance-monitor'

/**
 * JWT认证服务配置
 */
export interface JWTAuthServiceConfig {
  jwtSecret: string
  accessTokenExpiry: string
  refreshTokenExpiry: string
  algorithm: 'HS256' | 'HS384' | 'HS512'
  issuer?: string
  audience?: string
}

/**
 * JWT认证服务实现
 * 
 * 提供基于JWT的认证功能：
 * - 用户认证和令牌生成
 * - 令牌验证和会话管理
 * - 令牌刷新和续期
 * - 会话撤销和管理
 */
export class JWTAuthService implements IAuthService {
  private readonly config: JWTAuthServiceConfig
  private readonly activeSessions = new Map<string, Session>()
  private readonly refreshTokens = new Map<string, { userId: string; sessionId: string; expiresAt: Date }>()
  private readonly performanceMonitor: INewAuthPerformanceMonitor

  constructor(config: JWTAuthServiceConfig, performanceMonitor?: INewAuthPerformanceMonitor) {
    this.config = config
    this.performanceMonitor = performanceMonitor || createNewAuthPerformanceMonitor(logger)
    this.validateConfig()
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
    const timer = this.performanceMonitor.startAuthTimer('login', {
      provider: request.provider,
      hasCredentials: !!request.credentials
    })

    try {
      logger.info('JWT认证开始', {
        service: 'jwt-auth-service',
        provider: request.provider,
        hasCredentials: !!request.credentials
      })

      // 验证用户凭据
      const user = await this.validateCredentials(request.credentials)
      if (!user) {
        logger.warn('用户凭据验证失败', {
          service: 'jwt-auth-service',
          provider: request.provider
        })
        
        await timer.failure({
          errorCode: 'INVALID_CREDENTIALS',
          errorMessage: 'Invalid credentials',
          authMethod: request.provider
        })

        return {
          success: false,
          error: 'Invalid credentials'
        }
      }

      // 生成JWT令牌
      const sessionId = randomUUID()
      const { accessToken, refreshToken } = await this.generateTokens(user, sessionId)

      // 创建会话
      await this.createSession(user, sessionId, accessToken, refreshToken)

      logger.info('JWT认证成功', {
        service: 'jwt-auth-service',
        userId: user.id,
        sessionId
      })

      await timer.success({
        userId: user.id,
        sessionId,
        authMethod: request.provider
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
      logger.error('JWT认证失败', error instanceof Error ? error : undefined, {
        service: 'jwt-auth-service',
        provider: request.provider
      })

      await timer.error(error instanceof Error ? error : new Error('Authentication failed'), {
        authMethod: request.provider
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
    const timer = this.performanceMonitor.startAuthTimer('validate_token')

    try {
      // 验证JWT令牌
      const payload = verify(token, this.config.jwtSecret, {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as JwtPayload & JWTPayload

      if (!payload.sub || !payload.jti) {
        logger.warn('JWT令牌载荷无效', {
          service: 'jwt-auth-service',
          hasSubject: !!payload.sub,
          hasJti: !!payload.jti
        })
        
        await timer.failure({
          errorCode: 'INVALID_TOKEN_PAYLOAD',
          errorMessage: 'Invalid token payload',
          authMethod: 'jwt'
        })

        return null
      }

      // 查找会话
      const session = this.activeSessions.get(payload.jti)
      if (!session) {
        logger.warn('会话不存在', {
          service: 'jwt-auth-service',
          sessionId: payload.jti
        })
        
        await timer.failure({
          errorCode: 'SESSION_NOT_FOUND',
          errorMessage: 'Session not found',
          authMethod: 'jwt'
        })

        return null
      }

      // 检查会话是否过期
      if (session.expiresAt < new Date()) {
        logger.warn('会话已过期', {
          service: 'jwt-auth-service',
          sessionId: payload.jti,
          expiresAt: session.expiresAt
        })
        this.activeSessions.delete(payload.jti)
        
        await timer.failure({
          errorCode: 'SESSION_EXPIRED',
          errorMessage: 'Session expired',
          authMethod: 'jwt'
        })

        return null
      }

      // 更新最后访问时间
      session.lastAccessedAt = new Date()
      
      await timer.success({
        userId: session.userId,
        sessionId: payload.jti,
        authMethod: 'jwt'
      })
      
      return session
    } catch (error) {
      logger.error('会话验证失败', error instanceof Error ? error : undefined, {
        service: 'jwt-auth-service'
      })
      
      await timer.error(error instanceof Error ? error : new Error('Session validation failed'), {
        authMethod: 'jwt'
      })
      
      return null
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<Session | null> {
    const timer = this.performanceMonitor.startAuthTimer('refresh_token')

    try {
      // 验证刷新令牌
      const refreshData = this.refreshTokens.get(refreshToken)
      if (!refreshData) {
        logger.warn('刷新令牌不存在', {
          service: 'jwt-auth-service'
        })
        
        await timer.failure({
          errorCode: 'REFRESH_TOKEN_NOT_FOUND',
          errorMessage: 'Refresh token not found',
          authMethod: 'jwt'
        })

        return null
      }

      // 检查令牌是否过期
      if (refreshData.expiresAt < new Date()) {
        logger.warn('刷新令牌已过期', {
          service: 'jwt-auth-service',
          expiresAt: refreshData.expiresAt
        })
        this.refreshTokens.delete(refreshToken)
        
        await timer.failure({
          errorCode: 'REFRESH_TOKEN_EXPIRED',
          errorMessage: 'Refresh token expired',
          authMethod: 'jwt'
        })

        return null
      }

      // 获取用户信息
      const user = await this.getUser(refreshData.userId)
      if (!user) {
        logger.warn('用户不存在', {
          service: 'jwt-auth-service',
          userId: refreshData.userId
        })
        
        await timer.failure({
          errorCode: 'USER_NOT_FOUND',
          errorMessage: 'User not found',
          authMethod: 'jwt'
        })

        return null
      }

      // 撤销旧会话
      this.activeSessions.delete(refreshData.sessionId)
      this.refreshTokens.delete(refreshToken)

      // 生成新令牌
      const newSessionId = randomUUID()
      const tokens = await this.generateTokens(user, newSessionId)

      // 创建新会话
      const newSession = await this.createSession(user, newSessionId, tokens.accessToken, tokens.refreshToken)

      logger.info('令牌刷新成功', {
        service: 'jwt-auth-service',
        userId: user.id,
        oldSessionId: refreshData.sessionId,
        newSessionId
      })

      await timer.success({
        userId: user.id,
        sessionId: newSessionId,
        authMethod: 'jwt'
      })

      return newSession
    } catch (error) {
      logger.error('令牌刷新失败', error instanceof Error ? error : undefined, {
        service: 'jwt-auth-service'
      })
      
      await timer.error(error instanceof Error ? error : new Error('Token refresh failed'), {
        authMethod: 'jwt'
      })
      
      return null
    }
  }

  /**
   * 注销会话
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const timer = this.performanceMonitor.startAuthTimer('session_destroy')

    try {
      const session = this.activeSessions.get(sessionId)
      if (!session) {
        await timer.failure({
          errorCode: 'SESSION_NOT_FOUND',
          errorMessage: 'Session not found',
          authMethod: 'jwt'
        })
        return false
      }

      // 删除会话
      this.activeSessions.delete(sessionId)

      // 查找并删除关联的刷新令牌
      for (const [refreshToken, data] of this.refreshTokens.entries()) {
        if (data.sessionId === sessionId) {
          this.refreshTokens.delete(refreshToken)
          break
        }
      }

      logger.info('会话注销成功', {
        service: 'jwt-auth-service',
        sessionId,
        userId: session.userId
      })

      await timer.success({
        userId: session.userId,
        sessionId,
        authMethod: 'jwt'
      })

      return true
    } catch (error) {
      logger.error('会话注销失败', error instanceof Error ? error : undefined, {
        service: 'jwt-auth-service',
        sessionId
      })
      
      await timer.error(error instanceof Error ? error : new Error('Session revocation failed'), {
        authMethod: 'jwt'
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

      // 删除所有用户会话
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId) {
          this.activeSessions.delete(sessionId)
          revokedCount++
        }
      }

      // 删除所有用户刷新令牌
      for (const [refreshToken, data] of this.refreshTokens.entries()) {
        if (data.userId === userId) {
          this.refreshTokens.delete(refreshToken)
        }
      }

      logger.info('用户所有会话注销成功', {
        service: 'jwt-auth-service',
        userId,
        revokedCount
      })

      return revokedCount
    } catch (error) {
      logger.error('批量会话注销失败', error instanceof Error ? error : undefined, {
        service: 'jwt-auth-service',
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
        expiresIn: '5s', // Give enough time for verification
        algorithm: this.config.algorithm
      })

      // 验证测试令牌
      verify(testToken, this.config.jwtSecret, {
        algorithms: [this.config.algorithm]
      })

      return true
    } catch (error) {
      logger.error('JWT服务健康检查失败', error instanceof Error ? error : undefined, {
        service: 'jwt-auth-service'
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
    refreshToken: string
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
        userAgent: 'JWT-Service',
        ipAddress: '127.0.0.1'
      }
    }

    // 存储会话
    this.activeSessions.set(sessionId, session)

    return session
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
 * 创建JWT认证服务实例
 */
export function createJWTAuthService(config: JWTAuthServiceConfig, performanceMonitor?: INewAuthPerformanceMonitor): JWTAuthService {
  return new JWTAuthService(config, performanceMonitor)
}

/**
 * 默认JWT认证服务配置
 * 
 * ⚠️  安全警告：必须在生产环境中设置 JWT_SECRET 环境变量
 * ⚠️  配置将通过 ConfigManager 强制验证环境变量
 */
export const defaultJWTAuthServiceConfig: JWTAuthServiceConfig = {
  jwtSecret: process.env.JWT_SECRET!, // 强制要求环境变量
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'linch-kit-auth',
  audience: 'linch-kit-app'
}