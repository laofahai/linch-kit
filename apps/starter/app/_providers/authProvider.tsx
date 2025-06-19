'use client'

import { createContext, useContext } from 'react'
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react'

// 临时类型定义，直到 auth-core 包构建完成
interface AuthUser {
  id: string
  name?: string
  email?: string
  image?: string
  role?: string
  permissions?: string[]
}

type AuthContextType = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  checkPermission: (resource: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // 从 session 中获取 user
  const user = session?.user as AuthUser | null
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
