/**
 * @linch-kit/auth Mock认证服务
 * 
 * 用于开发和测试的模拟认证实现
 * 锁定现有的模拟功能，确保测试稳定性
 * 
 * @author LinchKit Team
 * @since 0.1.0
 */

import { nanoid } from 'nanoid'

import type { 
  IAuthService, 
  AuthRequest, 
  AuthResult, 
  Session, 
  LinchKitUser 
} from '../types'

/**
 * Mock认证服务实现
 * 
 * 提供稳定的模拟认证功能，用于：
 * - 开发环境快速测试
 * - 单元测试和集成测试
 * - 功能开关的回退实现
 */
export class MockAuthService implements IAuthService {
  private readonly mockUsers: Map<string, LinchKitUser> = new Map()
  private readonly mockSessions: Map<string, Session> = new Map()
  private readonly mockCredentials: Map<string, string> = new Map()

  constructor() {
    // 初始化模拟用户数据
    this.initializeMockData()
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData(): void {
    // 创建测试用户
    const testUser: LinchKitUser = {
      id: 'test-user-123',
      email: 'test@linchkit.com',
      name: 'Test User',
      image: null,
      tenantId: 'test-tenant',
      status: 'active',
      emailVerified: new Date(),
      birthday: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      metadata: {
        isTestUser: true
      }
    }

    this.mockUsers.set(testUser.id, testUser)
    this.mockCredentials.set(testUser.email, 'test-password')
  }

  /**
   * 用户认证
   */
  async authenticate(request: AuthRequest): Promise<AuthResult> {
    const { provider, credentials } = request

    if (provider === 'credentials') {
      const email = credentials.email as string
      const password = credentials.password as string

      // 模拟认证延迟
      await new Promise(resolve => setTimeout(resolve, 100))

      const expectedPassword = this.mockCredentials.get(email)
      if (expectedPassword && password === expectedPassword) {
        const user = Array.from(this.mockUsers.values()).find(u => u.email === email)
        
        if (user) {
          const session = await this.createMockSession(user)
          
          return {
            success: true,
            user,
            tokens: {
              accessToken: session.accessToken,
              refreshToken: session.refreshToken || '',
              expiresIn: 3600
            }
          }
        }
      }
    }

    return {
      success: false,
      error: 'Invalid credentials'
    }
  }

  /**
   * 验证会话
   */
  async validateSession(token: string): Promise<Session | null> {
    const session = this.mockSessions.get(token)
    
    if (!session) {
      return null
    }

    // 检查会话是否过期
    if (session.expiresAt < new Date()) {
      this.mockSessions.delete(token)
      return null
    }

    // 更新最后访问时间
    session.lastAccessedAt = new Date()
    
    return session
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<Session | null> {
    // 查找对应的会话
    const session = Array.from(this.mockSessions.values()).find(
      s => s.refreshToken === refreshToken
    )

    if (!session) {
      return null
    }

    // 创建新的访问令牌
    const newAccessToken = `mock-token-${nanoid()}`
    const newRefreshToken = `mock-refresh-${nanoid()}`

    // 删除旧会话
    this.mockSessions.delete(session.accessToken)

    // 创建新会话
    const newSession: Session = {
      ...session,
      id: nanoid(),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1小时后过期
      lastAccessedAt: new Date()
    }

    this.mockSessions.set(newAccessToken, newSession)
    
    return newSession
  }

  /**
   * 注销会话
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const session = Array.from(this.mockSessions.values()).find(
      s => s.id === sessionId
    )

    if (session) {
      this.mockSessions.delete(session.accessToken)
      return true
    }

    return false
  }

  /**
   * 注销用户的所有会话
   */
  async revokeAllSessions(userId: string): Promise<number> {
    let revokedCount = 0
    
    for (const [token, session] of this.mockSessions.entries()) {
      if (session.userId === userId) {
        this.mockSessions.delete(token)
        revokedCount++
      }
    }

    return revokedCount
  }

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<LinchKitUser | null> {
    return this.mockUsers.get(userId) || null
  }

  /**
   * 验证用户凭据
   */
  async validateCredentials(credentials: Record<string, unknown>): Promise<LinchKitUser | null> {
    const email = credentials.email as string
    const password = credentials.password as string

    const expectedPassword = this.mockCredentials.get(email)
    if (expectedPassword && password === expectedPassword) {
      return Array.from(this.mockUsers.values()).find(u => u.email === email) || null
    }

    return null
  }

  /**
   * 检查服务健康状态
   */
  async isHealthy(): Promise<boolean> {
    return true
  }

  /**
   * 获取服务实现类型
   */
  getServiceType(): 'mock' {
    return 'mock'
  }

  /**
   * 创建模拟会话
   */
  private async createMockSession(user: LinchKitUser): Promise<Session> {
    const sessionId = nanoid()
    const accessToken = `mock-token-${nanoid()}`
    const refreshToken = `mock-refresh-${nanoid()}`
    
    const session: Session = {
      id: sessionId,
      userId: user.id,
      accessToken,
      refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1小时后过期
      lastAccessedAt: new Date(),
      metadata: {
        userAgent: 'mock-user-agent',
        ipAddress: '127.0.0.1'
      }
    }

    this.mockSessions.set(accessToken, session)
    
    return session
  }

  /**
   * 添加模拟用户（用于测试）
   */
  addMockUser(user: LinchKitUser, password: string): void {
    this.mockUsers.set(user.id, user)
    this.mockCredentials.set(user.email, password)
  }

  /**
   * 获取所有模拟会话（用于测试）
   */
  getAllMockSessions(): Session[] {
    return Array.from(this.mockSessions.values())
  }

  /**
   * 清除所有模拟数据（用于测试）
   */
  clearMockData(): void {
    this.mockUsers.clear()
    this.mockSessions.clear()
    this.mockCredentials.clear()
    this.initializeMockData()
  }
}