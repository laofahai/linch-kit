'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { trpc } from '../lib/trpc-provider'

/**
 * 认证用户信息类型
 * @description 用户基本信息和权限
 * @since 2025-06-20
 */
export interface AuthUser {
  id: string
  email: string
  name: string
  username?: string
  status: string
  roles: string[]
}

/**
 * 会话信息类型
 * @description 会话令牌和过期时间
 * @since 2025-06-20
 */
export interface AuthSession {
  token: string
  expiresAt: Date
}

/**
 * 认证上下文类型
 * @description 认证状态和操作方法
 * @since 2025-06-20
 */
interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}

/**
 * 认证上下文
 * @description 全局认证状态管理
 * @since 2025-06-20
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 认证提供者组件
 * @description 管理全局认证状态和会话
 * @param children - 子组件
 * @since 2025-06-20
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // tRPC mutations
  const loginMutation = trpc.auth.login.useMutation()
  const registerMutation = trpc.auth.register.useMutation()
  const logoutMutation = trpc.auth.logout.useMutation()
  const refreshMutation = trpc.auth.refresh.useMutation()

  /**
   * 从 localStorage 恢复会话
   * @description 应用启动时恢复用户会话
   * @since 2025-06-20
   */
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedToken = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setSession({
            token: storedToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          })
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        // 清除损坏的数据
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  /**
   * 登录方法
   * @description 用户登录并设置会话
   * @param email - 邮箱地址
   * @param password - 密码
   * @throws {Error} 登录失败时抛出错误
   * @since 2025-06-20
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const result = await loginMutation.mutateAsync({ email, password })
      
      // 设置用户和会话状态
      setUser(result.user)
      setSession({
        token: result.session.token,
        expiresAt: new Date(result.session.expiresAt),
      })

      // 存储到 localStorage
      localStorage.setItem('authToken', result.session.token)
      localStorage.setItem('user', JSON.stringify(result.user))

      // 重定向到用户管理页面
      router.push('/users')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * 注册方法
   * @description 用户注册并自动登录
   * @param email - 邮箱地址
   * @param name - 用户姓名
   * @param password - 密码
   * @throws {Error} 注册失败时抛出错误
   * @since 2025-06-20
   */
  const register = async (email: string, name: string, password: string): Promise<void> => {
    try {
      const result = await registerMutation.mutateAsync({ email, name, password })
      
      // 设置用户和会话状态
      setUser(result.user)
      setSession({
        token: result.session.token,
        expiresAt: new Date(result.session.expiresAt),
      })

      // 存储到 localStorage
      localStorage.setItem('authToken', result.session.token)
      localStorage.setItem('user', JSON.stringify(result.user))

      // 重定向到用户管理页面
      router.push('/users')
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * 登出方法
   * @description 清除用户会话并重定向
   * @since 2025-06-20
   */
  const logout = () => {
    try {
      // 调用服务端登出（可选，用于清理服务端会话）
      if (session?.token) {
        logoutMutation.mutate()
      }
    } catch (error) {
      console.error('Server logout failed:', error)
      // 即使服务端登出失败，也要清理客户端状态
    } finally {
      // 清理客户端状态
      setUser(null)
      setSession(null)
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      
      // 重定向到登录页面
      router.push('/auth/login')
    }
  }

  /**
   * 刷新会话方法
   * @description 延长会话过期时间
   * @throws {Error} 刷新失败时抛出错误
   * @since 2025-06-20
   */
  const refreshSession = async (): Promise<void> => {
    try {
      if (!session) {
        throw new Error('No active session to refresh')
      }

      const result = await refreshMutation.mutateAsync()
      
      // 更新会话状态
      setSession({
        token: result.session.token,
        expiresAt: new Date(result.session.expiresAt),
      })

      // 更新 localStorage
      localStorage.setItem('authToken', result.session.token)
    } catch (error) {
      console.error('Session refresh failed:', error)
      // 刷新失败时登出用户
      logout()
      throw error
    }
  }

  /**
   * 检查会话是否过期
   * @description 定期检查会话状态
   * @since 2025-06-20
   */
  useEffect(() => {
    if (!session) return

    const checkSessionExpiry = () => {
      const now = new Date()
      const expiresAt = new Date(session.expiresAt)
      
      // 如果会话已过期，自动登出
      if (now >= expiresAt) {
        console.log('Session expired, logging out')
        logout()
        return
      }

      // 如果会话在1小时内过期，自动刷新
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (expiresAt <= oneHourFromNow) {
        console.log('Session expiring soon, refreshing')
        refreshSession().catch(() => {
          // 刷新失败已在 refreshSession 中处理
        })
      }
    }

    // 立即检查一次
    checkSessionExpiry()

    // 每5分钟检查一次
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [session])

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    register,
    logout,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证上下文的 Hook
 * @description 获取认证状态和操作方法
 * @returns 认证上下文
 * @throws {Error} 在 AuthProvider 外使用时抛出错误
 * @since 2025-06-20
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
