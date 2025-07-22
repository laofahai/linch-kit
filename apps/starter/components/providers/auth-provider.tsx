/**
 * Auth Provider
 * 集成 @linch-kit/auth 包的完整认证状态管理
 */

'use client'

import { Logger } from '@linch-kit/core/client'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface Session {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

interface AuthContextValue {
  // 状态
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // 操作
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<{ success: boolean; error?: string }>
  
  // 工具
  getAuthHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = Boolean(user && session)

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        Logger.debug('[Auth] Initializing authentication state')
        
        // 从localStorage或cookie恢复会话
        const savedSession = localStorage.getItem('auth-session')
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession)
            const session = {
              ...sessionData,
              expiresAt: new Date(sessionData.expiresAt)
            }
            
            // 检查会话是否过期
            if (session.expiresAt.getTime() > Date.now()) {
              setSession(session)
              
              // 尝试获取用户信息
              await loadUserFromSession(session)
            } else {
              Logger.info('[Auth] Saved session expired, clearing')
              localStorage.removeItem('auth-session')
            }
          } catch (error) {
            Logger.error('[Auth] Failed to parse saved session:', error)
            localStorage.removeItem('auth-session')
          }
        }
      } catch (error) {
        Logger.error('[Auth] Failed to initialize authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // 从会话加载用户信息
  const loadUserFromSession = async (session: Session) => {
    try {
      Logger.debug('[Auth] Loading user from session')
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        Logger.info('[Auth] User loaded successfully:', userData.id)
      } else {
        Logger.warn('[Auth] Failed to load user, status:', response.status)
        if (response.status === 401) {
          // Token无效，清除会话
          await clearSession()
        }
      }
    } catch (error) {
      Logger.error('[Auth] Failed to load user from session:', error)
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      Logger.info('[Auth] Attempting login for:', email.slice(0, 3) + '***')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      
      if (result.success && result.user && result.tokens) {
        const sessionData = {
          id: result.sessionId || 'session-' + Date.now(),
          userId: result.user.id,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15分钟
        }
        
        setUser(result.user)
        setSession(sessionData)
        
        // 保存到localStorage
        localStorage.setItem('auth-session', JSON.stringify(sessionData))
        
        Logger.info('[Auth] Login successful for user:', result.user.id)
        return { success: true }
      } else {
        Logger.warn('[Auth] Login failed:', result.error)
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      Logger.error('[Auth] Login error:', error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // 登出
  const logout = async () => {
    try {
      Logger.info('[Auth] Logging out')
      
      if (session) {
        // 调用登出API（可选）
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (error) {
          Logger.warn('[Auth] Failed to call logout API:', error)
        }
      }
      
      await clearSession()
      Logger.info('[Auth] Logout completed')
    } catch (error) {
      Logger.error('[Auth] Logout error:', error)
    }
  }

  // 清除会话
  const clearSession = async () => {
    setUser(null)
    setSession(null)
    localStorage.removeItem('auth-session')
  }

  // 刷新Token
  const refreshToken = async () => {
    try {
      if (!session?.refreshToken) {
        return { success: false, error: 'No refresh token available' }
      }
      
      Logger.debug('[Auth] Refreshing access token')
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      })
      
      const result = await response.json()
      
      if (result.success && result.tokens) {
        const updatedSession = {
          ...session,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
        
        setSession(updatedSession)
        localStorage.setItem('auth-session', JSON.stringify(updatedSession))
        
        Logger.info('[Auth] Token refreshed successfully')
        return { success: true }
      } else {
        Logger.warn('[Auth] Token refresh failed:', result.error)
        await clearSession()
        return { success: false, error: result.error || 'Token refresh failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      Logger.error('[Auth] Token refresh error:', error)
      await clearSession()
      return { success: false, error: errorMessage }
    }
  }

  // 获取认证头
  const getAuthHeaders = () => {
    if (!session?.accessToken) {
      return {}
    }
    
    return {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  // 自动刷新Token（在过期前5分钟）
  useEffect(() => {
    if (!session) return

    const timeUntilExpiry = session.expiresAt.getTime() - Date.now()
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 30 * 1000) // 提前5分钟或最少30秒

    const timeoutId = setTimeout(() => {
      Logger.debug('[Auth] Auto-refreshing token')
      refreshToken()
    }, refreshTime)

    return () => { clearTimeout(timeoutId); }
  }, [session])

  const contextValue: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    getAuthHeaders
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}