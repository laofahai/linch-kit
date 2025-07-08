'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { EnterpriseAuthExtensions, MFAManager } from '@linch-kit/auth'
import type { LinchKitUser, LinchKitSession } from '@linch-kit/auth'

// 使用 LinchKit Auth 的类型定义
interface User extends LinchKitUser {
  role: string
}

interface AuthSession extends LinchKitSession {
  token: string
}

// LinchKit Auth 管理器
class LinchKitAuthManager {
  private enterpriseAuth: EnterpriseAuthExtensions
  private mfaManager: MFAManager

  constructor(_config: unknown) {
    this.enterpriseAuth = new EnterpriseAuthExtensions({
      tenantId: 'starter-app',
      enableMFA: false, // 演示应用暂时禁用 MFA
      enableAuditLog: true,
      enableRoleBasedAccess: true,
    })

    this.mfaManager = new MFAManager({
      enabled: false,
      methods: ['totp'],
      issuer: 'LinchKit Starter',
    })
  }

  async getSession(): Promise<AuthSession | null> {
    const stored = localStorage.getItem('linchkit-session')
    if (!stored) return null

    const session = JSON.parse(stored)
    // 检查会话是否过期
    if (new Date(session.expiresAt) < new Date()) {
      await this.destroySession()
      return null
    }

    return session
  }

  async createSession(user: User): Promise<AuthSession> {
    const session: AuthSession = {
      id: `session-${Date.now()}`,
      token: `token-${Date.now()}`,
      userId: user.id,
      tenantId: 'starter-app',
      user,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1小时后过期
    }
    localStorage.setItem('linchkit-session', JSON.stringify(session))
    return session
  }

  async destroySession(): Promise<void> {
    localStorage.removeItem('linchkit-session')
  }

  async refreshSession(_token: string): Promise<AuthSession> {
    const stored = localStorage.getItem('linchkit-session')
    if (!stored) throw new Error('No session found')

    const session = JSON.parse(stored)
    session.expiresAt = new Date(Date.now() + 3600000)
    localStorage.setItem('linchkit-session', JSON.stringify(session))
    return session
  }

  async validateUserAccess(user: User): Promise<boolean> {
    return await this.enterpriseAuth.checkUserAccess(user)
  }
}

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
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
  const [authManager] = useState(
    () =>
      new LinchKitAuthManager({
        tenantId: 'starter-app',
        enableMFA: false,
        enableAuditLog: true,
        enableRoleBasedAccess: true,
      })
  )

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
    const sessions = localStorage.getItem('linchkit-session') ? 1 : 0
    const lastActivity = session ? session.createdAt : null
    const permissions = user ? ['read', 'write', user.role === 'admin' ? 'admin' : 'user'] : []

    return {
      sessionCount: sessions,
      lastActivity,
      permissions,
    }
  }

  const signIn = async (email: string, _password: string) => {
    try {
      setIsLoading(true)
      // 演示用户 - 实际应用中会调用真实的认证API
      const mockUser: User = {
        id: 'demo-user-1',
        email,
        name: email.split('@')[0],
        role: 'user',
        tenantId: 'starter-app',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // 验证用户访问权限
      const hasAccess = await authManager.validateUserAccess(mockUser)
      if (!hasAccess) {
        throw new Error('用户无权限访问此应用')
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

  const signOut = async () => {
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
      await signOut()
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    refreshSession,
    validateAuth,
    getAuthStats,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
