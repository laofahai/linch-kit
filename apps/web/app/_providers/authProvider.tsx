'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { AuthManager } from '@flex-report/auth'
import type { SessionUser } from '@flex-report/auth'
import { getSessionUser } from '@/_lib/trpc/server/middleware/auth'
import { trpc } from '@/_lib/trpc/client'

type AuthContextType = {
  user: SessionUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  checkPermission: (resource: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authManager, setAuthManager] = useState<AuthManager | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      const manager = await AuthManager.init(process.env.NEXT_PUBLIC_AUTH_STRATEGY)
      setAuthManager(manager)

      // 检查现有会话
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionToken='))
        ?.split('=')[1]

      if (token) {
        const sessionUser = await manager.getSession()
        setUser(sessionUser)
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  const signOut = async () => {
    if (!authManager) return

    // await authManager.getStrategy().signOut();
    document.cookie = 'sessionToken=; Max-Age=0; path=/'
    setUser(null)
  }

  const checkPermission = (resource: string): boolean => {
    if (!user || !authManager) return false
    return authManager.hasPermission(resource)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
