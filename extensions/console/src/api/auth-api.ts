/**
 * Console认证API客户端
 * 连接starter应用的认证API，提供真实的认证数据访问
 */

interface User {
  id: string
  email: string
  name: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

interface Session {
  id: string
  userId: string
  isActive: boolean
  createdAt: string
  expiresAt: string
  deviceInfo?: string
  userEmail?: string
  userName?: string
}

interface AuthConfig {
  key: string
  value: unknown
  category: string
  description: string
  isSecret: boolean
  isRequired: boolean
  type: 'string' | 'number' | 'boolean' | 'json'
}

interface AuthMetrics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  activeSessions: number
  recentLogins: number
  failedAttempts: number
}

/**
 * Console认证API客户端类
 */
export class ConsoleAuthApiClient {
  private baseUrl: string
  private adminToken: string | null = null

  constructor(baseUrl: string = '/api/console/auth') {
    this.baseUrl = baseUrl
  }

  /**
   * 设置管理员令牌
   */
  setAdminToken(token: string) {
    this.adminToken = token
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`
    }

    return headers
  }

  /**
   * 获取所有用户列表
   */
  async getUsers(options?: {
    search?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ users: User[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.search) params.append('search', options.search)
      if (options?.status) params.append('status', options.status)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`${this.baseUrl}/users?${params}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  /**
   * 获取所有会话列表
   */
  async getSessions(options?: {
    search?: string
    status?: string
    userId?: string
    limit?: number
    offset?: number
  }): Promise<{ sessions: Session[]; total: number }> {
    try {
      const params = new URLSearchParams()
      if (options?.search) params.append('search', options.search)
      if (options?.status) params.append('status', options.status)
      if (options?.userId) params.append('userId', options.userId)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`${this.baseUrl}/sessions?${params}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching sessions:', error)
      throw error
    }
  }

  /**
   * 撤销指定会话
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to revoke session: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error revoking session:', error)
      throw error
    }
  }

  /**
   * 获取用户的所有会话
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/sessions`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user sessions: ${response.status}`)
      }

      const data = await response.json()
      return data.sessions || []
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      throw error
    }
  }

  /**
   * 获取认证配置
   */
  async getAuthConfigs(): Promise<AuthConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/configs`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch auth configs: ${response.status}`)
      }

      const data = await response.json()
      return data.configs || []
    } catch (error) {
      console.error('Error fetching auth configs:', error)
      throw error
    }
  }

  /**
   * 更新认证配置
   */
  async updateAuthConfig(key: string, value: unknown): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/configs/${key}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ value }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update auth config: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating auth config:', error)
      throw error
    }
  }

  /**
   * 获取认证指标
   */
  async getAuthMetrics(): Promise<AuthMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch auth metrics: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching auth metrics:', error)
      throw error
    }
  }

  /**
   * 强制用户下线
   */
  async forceUserLogout(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to force user logout: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error forcing user logout:', error)
      throw error
    }
  }

  /**
   * 禁用/启用用户
   */
  async setUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to set user status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error setting user status:', error)
      throw error
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}

// 创建默认实例
export const consoleAuthApiClient = new ConsoleAuthApiClient()