'use client'
/**
 * AuthProvider React组件
 * 基于NextAuth.js的认证上下文提供器
 */

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

export interface AuthProviderProps {
  children: ReactNode
  session?: any
}

/**
 * LinchKit认证提供器组件
 * 包装NextAuth.js的SessionProvider，提供统一的认证上下文
 */
export function AuthProvider({ children, session }: AuthProviderProps): ReactNode {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
