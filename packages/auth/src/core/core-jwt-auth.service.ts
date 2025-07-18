/**
 * @linch-kit/auth 核心JWT认证服务
 * 
 * 环境无关的核心认证逻辑，通过依赖注入支持Edge Runtime和Node.js环境
 * 100%复用现有JWTAuthService的核心逻辑
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

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

import type { IKeyProvider } from './key-provider.interface'

/**
 * 生成UUID（兼容Edge Runtime）
 */
function generateUUID(): string {
  // 优先使用Web标准API
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  
  // 备用方案：使用Node.js crypto（仅在Server Runtime中可用）
  if (typeof require !== 'undefined') {
    try {
      const { randomUUID } = require('crypto')
      return randomUUID()
    } catch {
      // 如果require失败，使用简单的UUID生成
    }
  }
  
  // 最后的备用方案：简单的UUID生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 核心JWT认证服务配置
 */
export interface CoreJWTAuthServiceConfig {
  accessTokenExpiry: string
  refreshTokenExpiry: string
  algorithm: 'HS256' | 'HS384' | 'HS512'
  issuer?: string
  audience?: string
}

/**
 * 会话存储接口
 * 
 * 抽象会话存储逻辑，支持内存、Redis等不同存储后端
 */
export interface ISessionStorage {
  /**
   * 获取会话
   */
  getSession(sessionId: string): Promise<Session | null>

  /**
   * 存储会话
   */
  setSession(sessionId: string, session: Session): Promise<void>

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): Promise<boolean>

  /**
   * 删除用户的所有会话
   */
  deleteUserSessions(userId: string): Promise<number>

  /**
   * 清理过期会话
   */
  cleanExpiredSessions(): Promise<number>
}

/**
 * 刷新令牌存储接口
 */
export interface IRefreshTokenStorage {
  /**
   * 获取刷新令牌信息
   */
  getRefreshToken(token: string): Promise<{ userId: string; sessionId: string; expiresAt: Date } | null>

  /**
   * 存储刷新令牌
   */
  setRefreshToken(token: string, data: { userId: string; sessionId: string; expiresAt: Date }): Promise<void>

  /**
   * 删除刷新令牌
   */
  deleteRefreshToken(token: string): Promise<boolean>

  /**
   * 删除用户的所有刷新令牌
   */
  deleteUserRefreshTokens(userId: string): Promise<number>

  /**
   * 清理过期刷新令牌
   */
  cleanExpiredTokens(): Promise<number>
}

/**
 * 内存会话存储实现
 */
export class InMemorySessionStorage implements ISessionStorage {
  private readonly sessions = new Map<string, Session>()

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null
  }

  async setSession(sessionId: string, session: Session): Promise<void> {
    this.sessions.set(sessionId, session)
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId)
  }

  async deleteUserSessions(userId: string): Promise<number> {
    let count = 0
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId)
        count++
      }
    }
    return count
  }

  async cleanExpiredSessions(): Promise<number> {
    const now = new Date()
    let count = 0
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId)
        count++
      }
    }
    return count
  }
}

/**
 * 内存刷新令牌存储实现
 */
export class InMemoryRefreshTokenStorage implements IRefreshTokenStorage {
  private readonly tokens = new Map<string, { userId: string; sessionId: string; expiresAt: Date }>()

  async getRefreshToken(token: string): Promise<{ userId: string; sessionId: string; expiresAt: Date } | null> {
    return this.tokens.get(token) || null
  }

  async setRefreshToken(token: string, data: { userId: string; sessionId: string; expiresAt: Date }): Promise<void> {
    this.tokens.set(token, data)
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    return this.tokens.delete(token)
  }

  async deleteUserRefreshTokens(userId: string): Promise<number> {
    let count = 0
    for (const [token, data] of this.tokens.entries()) {
      if (data.userId === userId) {
        this.tokens.delete(token)
        count++
      }
    }
    return count
  }

  async cleanExpiredTokens(): Promise<number> {
    const now = new Date()
    let count = 0
    for (const [token, data] of this.tokens.entries()) {
      if (data.expiresAt < now) {
        this.tokens.delete(token)
        count++
      }
    }
    return count
  }
}

/**
 * 用户数据提供者接口
 */
export interface IUserProvider {
  /**
   * 获取用户信息
   */
  getUser(userId: string): Promise<LinchKitUser | null>

  /**
   * 验证用户凭据
   */
  validateCredentials(credentials: Record<string, unknown>): Promise<LinchKitUser | null>
}

/**
 * 默认用户提供者（模拟实现）
 */
export class MockUserProvider implements IUserProvider {
  async getUser(userId: string): Promise<LinchKitUser | null> {
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

  async validateCredentials(credentials: Record<string, unknown>): Promise<LinchKitUser | null> {
    const { email, password } = credentials
    
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
}

/**
 * 日志记录器接口
 */
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, error?: Error, meta?: Record<string, unknown>): void
}

/**
 * 控制台日志记录器（Edge Runtime兼容）
 */
export class ConsoleLogger implements ILogger {
  info(message: string, meta?: Record<string, unknown>): void {
     
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  warn(message: string, meta?: Record<string, unknown>): void {
     
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
     
    console.error(`[ERROR] ${message}`, error, meta ? JSON.stringify(meta) : '')
  }
}

/**
 * 核心JWT认证服务
 * 
 * 环境无关的认证逻辑实现，通过依赖注入支持不同运行时环境
 * 100%复用并增强原有JWTAuthService的核心功能
 */
export class CoreJWTAuthService implements IAuthService {
  private readonly config: CoreJWTAuthServiceConfig
  private readonly keyProvider: IKeyProvider
  private readonly sessionStorage: ISessionStorage
  private readonly refreshTokenStorage: IRefreshTokenStorage
  private readonly userProvider: IUserProvider
  private readonly logger: ILogger
  private readonly performanceMonitor: INewAuthPerformanceMonitor

  constructor(
    config: CoreJWTAuthServiceConfig,
    keyProvider: IKeyProvider,
    options: {
      sessionStorage?: ISessionStorage
      refreshTokenStorage?: IRefreshTokenStorage
      userProvider?: IUserProvider
      logger?: ILogger
    } = {}
  ) {
    this.config = config
    this.keyProvider = keyProvider
    this.sessionStorage = options.sessionStorage || new InMemorySessionStorage()
    this.refreshTokenStorage = options.refreshTokenStorage || new InMemoryRefreshTokenStorage()
    this.userProvider = options.userProvider || new MockUserProvider()
    this.logger = options.logger || new ConsoleLogger()
    this.performanceMonitor = createNewAuthPerformanceMonitor(this.logger)

    this.validateConfig()
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    try {
      this.parseExpiryToSeconds(this.config.accessTokenExpiry)
      this.parseExpiryToSeconds(this.config.refreshTokenExpiry)
    } catch (error) {
      throw new Error(`Invalid expiry format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 用户认证
   * 
   * 100%复用原有逻辑，但通过依赖注入支持不同环境
   */
  async authenticate(request: AuthRequest): Promise<AuthResult> {
    const timer = this.performanceMonitor.startAuthTimer('login', {
      provider: request.provider,
      hasCredentials: !!request.credentials
    })

    try {
      this.logger.info('JWT认证开始', {
        service: 'core-jwt-auth-service',
        provider: request.provider,
        hasCredentials: !!request.credentials
      })

      // 验证用户凭据
      const user = await this.userProvider.validateCredentials(request.credentials)
      if (!user) {
        this.logger.warn('用户凭据验证失败', {
          service: 'core-jwt-auth-service',
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
      const sessionId = generateUUID()
      const { accessToken, refreshToken } = await this.generateTokens(user, sessionId)

      // 创建会话
      await this.createSession(user, sessionId, accessToken, refreshToken)

      this.logger.info('JWT认证成功', {
        service: 'core-jwt-auth-service',
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
      this.logger.error('JWT认证失败', error instanceof Error ? error : undefined, {
        service: 'core-jwt-auth-service',
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
      const jwtSecret = await this.keyProvider.getJWTSecret()
      
      // 验证JWT令牌
      const payload = verify(token, jwtSecret, {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as JwtPayload & JWTPayload

      if (!payload.sub || !payload.jti) {
        this.logger.warn('JWT令牌载荷无效', {
          service: 'core-jwt-auth-service',
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
      const session = await this.sessionStorage.getSession(payload.jti)
      if (!session) {
        this.logger.warn('会话不存在', {
          service: 'core-jwt-auth-service',
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
        this.logger.warn('会话已过期', {
          service: 'core-jwt-auth-service',
          sessionId: payload.jti,
          expiresAt: session.expiresAt
        })
        await this.sessionStorage.deleteSession(payload.jti)
        
        await timer.failure({
          errorCode: 'SESSION_EXPIRED',
          errorMessage: 'Session expired',
          authMethod: 'jwt'
        })

        return null
      }

      // 更新最后访问时间
      session.lastAccessedAt = new Date()
      await this.sessionStorage.setSession(payload.jti, session)
      
      await timer.success({
        userId: session.userId,
        sessionId: payload.jti,
        authMethod: 'jwt'
      })
      
      return session
    } catch (error) {
      this.logger.error('会话验证失败', error instanceof Error ? error : undefined, {
        service: 'core-jwt-auth-service'
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
      const refreshData = await this.refreshTokenStorage.getRefreshToken(refreshToken)
      if (!refreshData) {
        this.logger.warn('刷新令牌不存在', {
          service: 'core-jwt-auth-service'
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
        this.logger.warn('刷新令牌已过期', {
          service: 'core-jwt-auth-service',
          expiresAt: refreshData.expiresAt
        })
        await this.refreshTokenStorage.deleteRefreshToken(refreshToken)
        
        await timer.failure({
          errorCode: 'REFRESH_TOKEN_EXPIRED',
          errorMessage: 'Refresh token expired',
          authMethod: 'jwt'
        })

        return null
      }

      // 获取用户信息
      const user = await this.userProvider.getUser(refreshData.userId)
      if (!user) {
        this.logger.warn('用户不存在', {
          service: 'core-jwt-auth-service',
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
      await this.sessionStorage.deleteSession(refreshData.sessionId)
      await this.refreshTokenStorage.deleteRefreshToken(refreshToken)

      // 生成新令牌
      const newSessionId = generateUUID()
      const tokens = await this.generateTokens(user, newSessionId)

      // 创建新会话
      const newSession = await this.createSession(user, newSessionId, tokens.accessToken, tokens.refreshToken)

      this.logger.info('令牌刷新成功', {
        service: 'core-jwt-auth-service',
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
      this.logger.error('令牌刷新失败', error instanceof Error ? error : undefined, {
        service: 'core-jwt-auth-service'
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
      const session = await this.sessionStorage.getSession(sessionId)
      if (!session) {
        await timer.failure({
          errorCode: 'SESSION_NOT_FOUND',
          errorMessage: 'Session not found',
          authMethod: 'jwt'
        })
        return false
      }

      // 删除会话
      await this.sessionStorage.deleteSession(sessionId)

      // 查找并删除关联的刷新令牌
      // 注意：这里的实现可能需要优化，实际项目中可以建立索引
      await this.refreshTokenStorage.deleteUserRefreshTokens(session.userId)

      this.logger.info('会话注销成功', {
        service: 'core-jwt-auth-service',
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
      this.logger.error('会话注销失败', error instanceof Error ? error : undefined, {
        service: 'core-jwt-auth-service',
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
      const sessionCount = await this.sessionStorage.deleteUserSessions(userId)
      const tokenCount = await this.refreshTokenStorage.deleteUserRefreshTokens(userId)

      this.logger.info('用户所有会话注销成功', {
        service: 'core-jwt-auth-service',
        userId,
        revokedSessions: sessionCount,
        revokedTokens: tokenCount
      })

      return sessionCount
    } catch (error) {
      this.logger.error('批量会话注销失败', error instanceof Error ? error : undefined, {
        service: 'core-jwt-auth-service',
        userId
      })
      return 0
    }
  }

  /**
   * 检查服务健康状态
   */
  async isHealthy(): Promise<boolean> {
    try {
      // 检查密钥提供者
      if (!(await this.keyProvider.isHealthy())) {
        return false
      }

      // 测试JWT操作
      const jwtSecret = await this.keyProvider.getJWTSecret()
      const testPayload = { test: true }
      const testToken = sign(testPayload, jwtSecret, {
        expiresIn: '1s',
        algorithm: this.config.algorithm
      })

      // 验证测试令牌
      verify(testToken, jwtSecret, {
        algorithms: [this.config.algorithm]
      })

      return true
    } catch (error) {
      this.logger.error('JWT服务健康检查失败', error instanceof Error ? error : undefined, {
        service: 'core-jwt-auth-service'
      })
      return false
    }
  }

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<LinchKitUser | null> {
    return this.userProvider.getUser(userId)
  }

  /**
   * 验证用户凭据
   */
  async validateCredentials(credentials: Record<string, unknown>): Promise<LinchKitUser | null> {
    return this.userProvider.validateCredentials(credentials)
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
    const jwtSecret = await this.keyProvider.getJWTSecret()
    
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

    const accessToken = sign(accessPayload, jwtSecret, {
      algorithm: this.config.algorithm,
      issuer: this.config.issuer,
      audience: this.config.audience
    })

    // 生成刷新令牌
    const refreshToken = generateUUID()
    const refreshExpiresAt = new Date(Date.now() + this.parseExpiryToSeconds(this.config.refreshTokenExpiry) * 1000)

    // 存储刷新令牌
    await this.refreshTokenStorage.setRefreshToken(refreshToken, {
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
        userAgent: 'Core-JWT-Service',
        ipAddress: '127.0.0.1'
      }
    }

    // 存储会话
    await this.sessionStorage.setSession(sessionId, session)

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
 * 创建核心JWT认证服务实例
 */
export function createCoreJWTAuthService(
  config: CoreJWTAuthServiceConfig,
  keyProvider: IKeyProvider,
  options?: {
    sessionStorage?: ISessionStorage
    refreshTokenStorage?: IRefreshTokenStorage
    userProvider?: IUserProvider
    logger?: ILogger
  }
): CoreJWTAuthService {
  return new CoreJWTAuthService(config, keyProvider, options)
}

/**
 * 默认核心JWT认证服务配置
 */
export const defaultCoreJWTAuthServiceConfig: CoreJWTAuthServiceConfig = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'linch-kit-auth',
  audience: 'linch-kit-app'
}