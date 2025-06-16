import React, { useEffect, useState } from 'react'

import { AuthManager, SessionUser } from '../src'

import { AuthContext } from './authContext'

interface AuthProviderProps {
  children: React.ReactNode
  authManager: AuthManager
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children, authManager }: AuthProviderProps) => {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    authManager.getSession().then(setUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
