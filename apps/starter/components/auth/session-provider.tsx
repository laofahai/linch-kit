'use client'

/**
 * NextAuth.js 会话提供者 - LinchKit Core增强
 * 集成LinchKit日志和监控
 */

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { Logger } from '@linch-kit/core/client'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

interface AuthSessionProviderProps {
  children: ReactNode
  session: Session | null
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  useEffect(() => {
    Logger.info('Auth Session Provider initialized', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })
  }, [session])

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
