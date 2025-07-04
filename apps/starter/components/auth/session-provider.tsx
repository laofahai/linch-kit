'use client'

/**
 * NextAuth.js 会话提供者
 * 使用 @linch-kit/auth 包
 */

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

interface AuthSessionProviderProps {
  children: ReactNode
  session: Session | null
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // 每5分钟刷新一次
      refetchOnWindowFocus={true} // 窗口获得焦点时刷新
    >
      {children}
    </SessionProvider>
  )
}