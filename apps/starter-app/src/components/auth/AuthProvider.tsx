'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// import { AuthManager } from '@linch-kit/auth'
// import type { User, AuthSession } from '@linch-kit/auth'

// 临时类型定义，避免构建错误
interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date
  updatedAt: Date
}

interface AuthSession {
  id: string
  token: string
  user: User
  createdAt: Date
  expiresAt: Date
}

// 模拟AuthManager类
class AuthManager {
  constructor(config: any) {}
  
  async getSession(): Promise<AuthSession | null> {
    const stored = localStorage.getItem('demo-session')
    return stored ? JSON.parse(stored) : null
  }
  
  async createSession(user: User): Promise<AuthSession> {
    const session: AuthSession = {
      id: `session-${Date.now()}`,
      token: `token-${Date.now()}`,
      user,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1小时后过期
    }
    localStorage.setItem('demo-session', JSON.stringify(session))
    return session
  }
  
  async destroySession(): Promise<void> {
    localStorage.removeItem('demo-session')
  }
  
  async refreshSession(token: string): Promise<AuthSession> {
    const stored = localStorage.getItem('demo-session')
    if (!stored) throw new Error('No session found')
    
    const session = JSON.parse(stored)
    session.expiresAt = new Date(Date.now() + 3600000)
    localStorage.setItem('demo-session', JSON.stringify(session))
    return session
  }
}

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  validateAuth: () => { isValid: boolean; message: string }
  getAuthStats: () => { sessionCount: number; lastActivity: Date | null; permissions: string[] }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authManager] = useState(() => new AuthManager({
    providers: {
      jwt: {
        secret: process.env.NEXT_PUBLIC_JWT_SECRET || 'demo-secret-key',
        expiresIn: '1h'
      }
    },
    session: {
      strategy: 'jwt',
      storage: 'localStorage'
    }
  }))

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      const existingSession = await authManager.getSession()
      if (existingSession) {
        setSession(existingSession)
        setUser(existingSession.user)
      }
    } catch (error) {
      console.error('认证初始化失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateAuth = () => {
    if (!session || !user) {
      return { isValid: false, message: '用户未登录' }
    }
    
    if (session.expiresAt < new Date()) {
      return { isValid: false, message: '会话已过期' }
    }
    
    return { isValid: true, message: '认证状态正常' }
  }

  const getAuthStats = () => {
    const sessions = localStorage.getItem('demo-session') ? 1 : 0
    const lastActivity = session ? session.createdAt : null
    const permissions = user ? ['read', 'write', user.role === 'admin' ? 'admin' : 'user'] : []
    
    return {
      sessionCount: sessions,
      lastActivity,
      permissions
    }
  }

  const login = async (email: string, _password: string) => {
    try {
      setIsLoading(true)
      // 演示用户 - 实际应用中会调用真实的认证API
      const mockUser: User = {
        id: 'demo-user-1',
        email,
        name: email.split('@')[0],
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const newSession = await authManager.createSession(mockUser)
      setSession(newSession)
      setUser(mockUser)
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await authManager.destroySession()
      setSession(null)
      setUser(null)
    } catch (error) {
      console.error('注销失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      if (!session) return
      const refreshedSession = await authManager.refreshSession(session.token)
      setSession(refreshedSession)
    } catch (error) {
      console.error('会话刷新失败:', error)
      // 如果刷新失败，清除会话
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    login,
    logout,
    refreshSession,
    validateAuth,
    getAuthStats
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}