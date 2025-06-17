'use client'

import { createContext, useContext } from 'react'
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react'
import type { User } from '../src'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  checkPermission: (resource: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * 全局认证状态提供者
 * 提供用户信息、认证状态、权限检查等功能
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()

  // 从 session 中获取 user
  const user = session?.user as User | null
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!user

  // 检查权限的函数
  const hasPermission = (permission: string) => {
    if (!user?.permissions?.length) return false
    return user.permissions.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signOut: nextAuthSignOut,
        checkPermission: hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext 必须在 AuthProvider 内使用')
  }
  return context
}

export default AuthProvider
