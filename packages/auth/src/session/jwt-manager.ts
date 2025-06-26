/**
 * @linch-kit/auth JWT会话管理器
 * 基于JWT实现无状态会话管理
 */

import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { LRUCache } from 'lru-cache'
import type { 
  User, 
  Session, 
  JWTPayload, 
  AuthConfig,
  ISessionManager 
} from '../types'

/**
 * JWT会话管理器
 * 
 * 设计原则：
 * - 无状态JWT令牌设计
 * - 支持令牌刷新机制
 * - 黑名单管理防止令牌滥用
 * - 多设备并发会话控制
 * - 安全的令牌生成和验证
 */
export class JWTSessionManager implements ISessionManager {
  private config: AuthConfig['jwt']
  private blacklistCache: LRUCache<string, boolean>
  private userSessionsCache: LRUCache<string, Set<string>>

  constructor(config: AuthConfig['jwt']) {
    this.config = config
    
    // 黑名单缓存 - 存储已撤销的令牌
    this.blacklistCache = new LRUCache<string, boolean>({
      max: 50000,
      ttl: this.parseDurationToMs(config.accessTokenExpiry) * 2 // 两倍访问令牌有效期
    })

    // 用户会话缓存 - 跟踪每个用户的活跃会话
    this.userSessionsCache = new LRUCache<string, Set<string>>({
      max: 10000,
      ttl: this.parseDurationToMs(config.refreshTokenExpiry)
    })
  }

  /**
   * 创建新会话
   */
  public async create(user: User, metadata?: any): Promise<Session> {
    const sessionId = this.generateSessionId()
    const currentTime = new Date()
    
    // 生成JWT载荷
    const payload: JWTPayload = {
      sub: user.id,
      iat: Math.floor(currentTime.getTime() / 1000),
      exp: Math.floor((currentTime.getTime() + this.parseDurationToMs(this.config.accessTokenExpiry)) / 1000),
      jti: sessionId,
      roles: await this.getUserRoles(user.id),
      permissions: await this.getUserPermissions(user.id),
      tenantId: metadata?.tenantId
    }

    // 生成访问令牌
    const accessToken = jwt.sign(payload, this.config.secret, {
      algorithm: this.config.algorithm as jwt.Algorithm
    } as jwt.SignOptions)

    // 生成刷新令牌
    const refreshToken = this.generateRefreshToken(user.id, sessionId)

    // 创建会话对象
    const session: Session = {
      id: sessionId,
      userId: user.id,
      accessToken,
      refreshToken,
      createdAt: currentTime,
      expiresAt: new Date(currentTime.getTime() + this.parseDurationToMs(this.config.accessTokenExpiry)),
      metadata
    }

    // 添加到用户会话跟踪
    await this.trackUserSession(user.id, sessionId)

    // 检查并执行会话数量限制
    await this.enforceSessionLimit(user.id)

    return session
  }

  /**
   * 验证会话令牌
   */
  public async validate(token: string): Promise<Session | null> {
    try {
      // 验证JWT令牌
      const payload = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm as jwt.Algorithm]
      } as jwt.VerifyOptions) as JWTPayload

      // 检查黑名单
      if (this.isTokenBlacklisted(payload.jti)) {
        return null
      }

      // 检查用户状态
      const user = await this.getUser(payload.sub)
      if (!user || user.status !== 'active') {
        return null
      }

      // 创建会话对象
      const session: Session = {
        id: payload.jti,
        userId: payload.sub,
        accessToken: token,
        createdAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        lastAccessedAt: new Date()
      }

      return session
    } catch (error) {
      console.error('Token validation failed:', error)
      return null
    }
  }

  /**
   * 刷新会话令牌
   */
  public async refresh(refreshToken: string): Promise<Session | null> {
    try {
      // 验证刷新令牌格式
      const refreshPayload = this.parseRefreshToken(refreshToken)
      if (!refreshPayload) {
        return null
      }

      // 检查刷新令牌是否在黑名单中
      if (this.isTokenBlacklisted(refreshPayload.sessionId)) {
        return null
      }

      // 获取用户信息
      const user = await this.getUser(refreshPayload.userId)
      if (!user || user.status !== 'active') {
        return null
      }

      // 检查会话是否仍然有效
      const userSessions = this.userSessionsCache.get(refreshPayload.userId)
      if (!userSessions || !userSessions.has(refreshPayload.sessionId)) {
        return null
      }

      // 撤销旧的访问令牌
      this.blacklistCache.set(refreshPayload.sessionId, true)

      // 创建新会话
      return await this.create(user, { refreshedFrom: refreshPayload.sessionId })
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  /**
   * 撤销单个会话
   */
  public async revoke(sessionId: string): Promise<boolean> {
    try {
      // 添加到黑名单
      this.blacklistCache.set(sessionId, true)

      // 从所有用户会话中移除
      for (const [userId, sessions] of this.userSessionsCache.entries()) {
        if (sessions.has(sessionId)) {
          sessions.delete(sessionId)
          if (sessions.size === 0) {
            this.userSessionsCache.delete(userId)
          } else {
            this.userSessionsCache.set(userId, sessions)
          }
          break
        }
      }

      return true
    } catch (error) {
      console.error('Session revocation failed:', error)
      return false
    }
  }

  /**
   * 撤销用户的所有会话
   */
  public async revokeAll(userId: string): Promise<number> {
    try {
      const userSessions = this.userSessionsCache.get(userId)
      if (!userSessions) {
        return 0
      }

      // 将所有会话添加到黑名单
      for (const sessionId of userSessions) {
        this.blacklistCache.set(sessionId, true)
      }

      const revokedCount = userSessions.size

      // 清除用户会话缓存
      this.userSessionsCache.delete(userId)

      return revokedCount
    } catch (error) {
      console.error('All sessions revocation failed:', error)
      return 0
    }
  }

  /**
   * 获取用户活跃会话数量
   */
  public getUserActiveSessionCount(userId: string): number {
    const userSessions = this.userSessionsCache.get(userId)
    return userSessions ? userSessions.size : 0
  }

  /**
   * 获取用户所有活跃会话ID
   */
  public getUserActiveSessions(userId: string): string[] {
    const userSessions = this.userSessionsCache.get(userId)
    return userSessions ? Array.from(userSessions) : []
  }

  /**
   * 清理过期的黑名单令牌
   */
  public cleanupExpiredTokens(): void {
    // LRU缓存会自动清理过期项，这里可以执行额外的清理逻辑
    console.log('Cleaning up expired tokens...')
  }

  /**
   * 获取会话统计信息
   */
  public getSessionStats(): {
    blacklistedTokens: number
    activeUserSessions: number
    totalActiveSessions: number
  } {
    let totalActiveSessions = 0
    for (const sessions of this.userSessionsCache.values()) {
      totalActiveSessions += sessions.size
    }

    return {
      blacklistedTokens: this.blacklistCache.size,
      activeUserSessions: this.userSessionsCache.size,
      totalActiveSessions
    }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * 生成刷新令牌
   */
  private generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      userId,
      sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    }
    
    return jwt.sign(payload, this.config.secret, {
      algorithm: this.config.algorithm as jwt.Algorithm,
      expiresIn: this.config.refreshTokenExpiry
    } as jwt.SignOptions)
  }

  /**
   * 解析刷新令牌
   */
  private parseRefreshToken(refreshToken: string): { userId: string; sessionId: string } | null {
    try {
      const payload = jwt.verify(refreshToken, this.config.secret, {
        algorithms: [this.config.algorithm as jwt.Algorithm]
      } as jwt.VerifyOptions) as any

      if (payload.type !== 'refresh') {
        return null
      }

      return {
        userId: payload.userId,
        sessionId: payload.sessionId
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 检查令牌是否在黑名单中
   */
  private isTokenBlacklisted(sessionId: string): boolean {
    return this.blacklistCache.get(sessionId) === true
  }

  /**
   * 跟踪用户会话
   */
  private async trackUserSession(userId: string, sessionId: string): Promise<void> {
    let userSessions = this.userSessionsCache.get(userId)
    if (!userSessions) {
      userSessions = new Set()
    }
    
    userSessions.add(sessionId)
    this.userSessionsCache.set(userId, userSessions)
  }

  /**
   * 执行会话数量限制
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const userSessions = this.userSessionsCache.get(userId)
    if (!userSessions) return

    const maxSessions = 5 // 从配置中获取
    if (userSessions.size > maxSessions) {
      // 移除最旧的会话
      const sessionsArray = Array.from(userSessions)
      const sessionsToRemove = sessionsArray.slice(0, userSessions.size - maxSessions)
      
      for (const sessionId of sessionsToRemove) {
        this.blacklistCache.set(sessionId, true)
        userSessions.delete(sessionId)
      }
      
      this.userSessionsCache.set(userId, userSessions)
    }
  }

  /**
   * 获取用户角色
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    // TODO: 从数据库获取用户角色
    return ['user'] // 示例数据
  }

  /**
   * 获取用户权限
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    // TODO: 从数据库获取用户权限
    return [] // 示例数据
  }

  /**
   * 获取用户信息
   */
  private async getUser(userId: string): Promise<User | null> {
    // TODO: 从数据库获取用户信息
    // 示例实现
    if (userId === '1') {
      return {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    return null
  }

  /**
   * 解析时间字符串为毫秒
   */
  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/)
    if (!match) return 15 * 60 * 1000 // 默认15分钟

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 15 * 60 * 1000
    }
  }
}