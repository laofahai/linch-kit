/**
 * 用户状态管理Context
 * 提供全局用户状态管理和认证相关功能
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  name: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

export interface Session {
  id: string
  isActive: boolean
  createdAt: string
  expiresAt: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
}

interface AuthContextType {
  user: User | null
  sessions: Session[]
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  revokeSession: (sessionId: string) => Promise<void>
  clearError: () => void
  error: string | null
}

const UserContext = createContext<AuthContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 检查用户认证状态
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      
      // 获取用户信息
      const userResponse = await fetch('/api/auth/user')
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.success) {
          setUser(userData.user)
          
          // 获取用户会话
          try {
            const sessionsResponse = await fetch('/api/auth/user/sessions')
            if (sessionsResponse.ok) {
              const sessionsData = await sessionsResponse.json()
              setSessions(sessionsData.sessions || [])
            }
          } catch (error) {
            console.error('Failed to load sessions:', error)
          }
        } else {
          setUser(null)
          setSessions([])
        }
      } else if (userResponse.status === 401) {
        // 未认证，清除用户数据
        setUser(null)
        setSessions([])
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // 登录功能
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // 存储token到cookie
        document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${data.expiresIn}; SameSite=Lax`
        
        // 更新用户状态
        await checkAuthStatus()
        return true
      } else {
        setError(data.error || '登录失败')
        return false
      }
    } catch (error) {
      setError('网络连接失败，请检查网络后重试')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // 注册功能
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (data.success) {
        // 注册成功后自动登录
        return await login(email, password)
      } else {
        setError(data.error || '注册失败')
        return false
      }
    } catch (error) {
      setError('网络连接失败，请检查网络后重试')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // 登出功能
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      
      // 调用后端登出API
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('Logout API call failed:', error)
      }

      // 清除本地状态
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      setUser(null)
      setSessions([])
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 刷新用户信息
  const refreshUser = async (): Promise<void> => {
    await checkAuthStatus()
  }

  // 撤销会话
  const revokeSession = async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/auth/user/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        await checkAuthStatus()
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
    }
  }

  // 清除错误
  const clearError = () => {
    setError(null)
  }

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value: AuthContextType = {
    user,
    sessions,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    revokeSession,
    clearError,
    error
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// 自定义Hook使用Context
export function useAuth() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider')
  }
  return context
}

// 受保护路由组件
interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}