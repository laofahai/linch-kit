/**
 * Console 认证服务
 * 基于@linch-kit/auth的企业级认证功能实现
 */

import { Logger } from '@linch-kit/core/client'

// 模拟用户数据类型
interface User {
  id: string
  email: string
  name: string
  role: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

/**
 * Console 认证服务类
 * 集成@linch-kit/auth认证系统
 */
export class ConsoleAuthService {
  private static instance: ConsoleAuthService | null = null
  private currentUser: User | null = null

  private constructor() {}

  /**
   * 获取服务实例
   */
  static getInstance(): ConsoleAuthService {
    if (!ConsoleAuthService.instance) {
      ConsoleAuthService.instance = new ConsoleAuthService()
    }
    return ConsoleAuthService.instance
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      Logger.info('Console login attempt:', { email: credentials.email })

      // 模拟认证逻辑 - 稍后集成@linch-kit/auth
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 演示用户数据
      if (credentials.email === 'admin@linchkit.com' && credentials.password === 'admin123') {
        const user: User = {
          id: '1',
          email: 'admin@linchkit.com',
          name: 'LinchKit Admin',
          role: 'admin'
        }

        // 设置会话
        this.currentUser = user
        this.setSessionCookie(user)

        Logger.info('Console login successful:', { userId: user.id })
        return { success: true, user, token: 'mock-jwt-token' }
      }

      if (credentials.email === 'user@linchkit.com' && credentials.password === 'user123') {
        const user: User = {
          id: '2',
          email: 'user@linchkit.com',
          name: 'LinchKit User',
          role: 'user'
        }

        this.currentUser = user
        this.setSessionCookie(user)

        Logger.info('Console login successful:', { userId: user.id })
        return { success: true, user, token: 'mock-jwt-token' }
      }

      Logger.warn('Console login failed: Invalid credentials')
      return { success: false, error: '邮箱或密码错误' }
    } catch (error) {
      Logger.error('Console login error:', error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: '登录过程中发生错误' }
    }
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      Logger.info('Console register attempt:', { email: data.email })

      // 模拟注册逻辑
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 简单验证
      if (data.email === 'admin@linchkit.com') {
        return { success: false, error: '该邮箱已被注册' }
      }

      const user: User = {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        role: 'user'
      }

      this.currentUser = user
      this.setSessionCookie(user)

      Logger.info('Console register successful:', { userId: user.id })
      return { success: true, user, token: 'mock-jwt-token' }
    } catch (error) {
      Logger.error('Console register error:', error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: '注册过程中发生错误' }
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      Logger.info('Console logout:', { userId: this.currentUser?.id })
      
      this.currentUser = null
      this.clearSessionCookie()
      
      Logger.info('Console logout successful')
    } catch (error) {
      Logger.error('Console logout error:', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  /**
   * 设置会话Cookie
   */
  private setSessionCookie(user: User): void {
    if (typeof document !== 'undefined') {
      const sessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
      
      // 设置会话cookie (30天过期)
      document.cookie = `session=${JSON.stringify(sessionData)}; path=/; max-age=${30 * 24 * 60 * 60}`
    }
  }

  /**
   * 清除会话Cookie
   */
  private clearSessionCookie(): void {
    if (typeof document !== 'undefined') {
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  /**
   * 从Cookie恢复会话
   */
  restoreSession(): void {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session='))
      
      if (sessionCookie) {
        try {
          const sessionValue = sessionCookie.split('=')[1]
          if (sessionValue) {
            const sessionData = JSON.parse(sessionValue)
            this.currentUser = sessionData
            Logger.info('Console session restored:', { userId: sessionData.id })
          }
        } catch (error) {
          Logger.warn('Failed to restore session:', { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })
          this.clearSessionCookie()
        }
      }
    }
  }
}

// 导出单例实例
export const consoleAuthService = ConsoleAuthService.getInstance()