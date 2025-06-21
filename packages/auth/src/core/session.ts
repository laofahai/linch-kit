import type { AuthUser, AuthSession } from '../types/auth'

/**
 * 会话管理器接口
 */
export interface SessionManager {
  /**
   * 创建会话
   */
  createSession(user: AuthUser, options?: {
    maxAge?: number
    metadata?: Record<string, any>
  }): Promise<AuthSession>

  /**
   * 获取会话
   */
  getSession(sessionToken: string): Promise<AuthSession | null>

  /**
   * 更新会话
   */
  updateSession(sessionToken: string, updates: Partial<AuthSession>): Promise<AuthSession | null>

  /**
   * 删除会话
   */
  deleteSession(sessionToken: string): Promise<void>

  /**
   * 删除用户的所有会话
   */
  deleteUserSessions(userId: string): Promise<void>

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): Promise<number>
}

/**
 * 内存会话管理器（用于开发和测试）
 */
export class MemorySessionManager implements SessionManager {
  private sessions = new Map<string, AuthSession>()

  async createSession(user: AuthUser, options?: {
    maxAge?: number
    metadata?: Record<string, any>
  }): Promise<AuthSession> {
    const sessionToken = this.generateSessionToken()
    const maxAge = options?.maxAge || 30 * 24 * 60 * 60 * 1000 // 30 days
    const expires = new Date(Date.now() + maxAge).toISOString()

    const session: AuthSession = {
      user,
      expires,
      sessionToken,
      ...options?.metadata
    }

    this.sessions.set(sessionToken, session)
    return session
  }

  async getSession(sessionToken: string): Promise<AuthSession | null> {
    const session = this.sessions.get(sessionToken)
    
    if (!session) {
      return null
    }

    // 检查是否过期
    if (new Date(session.expires) < new Date()) {
      this.sessions.delete(sessionToken)
      return null
    }

    return session
  }

  async updateSession(sessionToken: string, updates: Partial<AuthSession>): Promise<AuthSession | null> {
    const session = await this.getSession(sessionToken)
    
    if (!session) {
      return null
    }

    const updatedSession = { ...session, ...updates }
    this.sessions.set(sessionToken, updatedSession)
    return updatedSession
  }

  async deleteSession(sessionToken: string): Promise<void> {
    this.sessions.delete(sessionToken)
  }

  async deleteUserSessions(userId: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.user.id === userId) {
        this.sessions.delete(token)
      }
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    let cleaned = 0
    const now = new Date()

    for (const [token, session] of this.sessions.entries()) {
      if (new Date(session.expires) < now) {
        this.sessions.delete(token)
        cleaned++
      }
    }

    return cleaned
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}

/**
 * 会话工具函数
 */
export const sessionUtils = {
  /**
   * 检查会话是否有效
   */
  isSessionValid(session: AuthSession): boolean {
    return new Date(session.expires) > new Date()
  },

  /**
   * 检查会话是否即将过期
   */
  isSessionExpiringSoon(session: AuthSession, thresholdMinutes: number = 30): boolean {
    const expiresAt = new Date(session.expires)
    const threshold = new Date(Date.now() + thresholdMinutes * 60 * 1000)
    return expiresAt < threshold
  },

  /**
   * 延长会话有效期
   */
  extendSession(session: AuthSession, extensionMs: number): AuthSession {
    const newExpires = new Date(Date.now() + extensionMs).toISOString()
    return {
      ...session,
      expires: newExpires
    }
  },

  /**
   * 从会话中提取用户信息
   */
  getUserFromSession(session: AuthSession): AuthUser {
    return session.user
  }
}

/**
 * 创建会话管理器
 */
export function createSessionManager(
  type: 'memory' | 'custom' = 'memory',
  customManager?: SessionManager
): SessionManager {
  if (type === 'custom' && customManager) {
    return customManager
  }
  
  return new MemorySessionManager()
}
