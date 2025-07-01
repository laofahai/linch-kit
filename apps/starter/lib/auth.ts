/**
 * NextAuth.js 配置和认证函数
 * 重构自之前的 auth.ts 文件，现在使用 NextAuth.js 5.0
 */

import NextAuth from 'next-auth'
import { nextAuthConfig } from './auth-config'

// 导出 NextAuth handlers
export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthConfig)

// 导出认证相关的函数供服务器端使用
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('需要登录')
  }
  
  return user
}

export async function requireAdmin() {
  const session = await auth()
  const user = session?.user
  
  if (!user) {
    throw new Error('需要登录')
  }
  
  const userRole = (session as unknown as { roles?: string[] })?.roles?.[0] || 'USER'
  if (userRole !== 'TENANT_ADMIN' && userRole !== 'SUPER_ADMIN') {
    throw new Error('需要管理员权限')
  }
  
  return user
}

export async function requireSuperAdmin() {
  const session = await auth()
  const user = session?.user
  
  if (!user) {
    throw new Error('需要登录')
  }
  
  const userRole = (session as unknown as { roles?: string[] })?.roles?.[0] || 'USER'
  if (userRole !== 'SUPER_ADMIN') {
    throw new Error('需要超级管理员权限')
  }
  
  return user
}

export async function getAuthContext() {
  const session = await auth()
  const user = session?.user || null
  const userRole = (session as unknown as { roles?: string[] })?.roles?.[0] || 'USER'
  
  return {
    user,
    isAuthenticated: !!user,
    isAdmin: userRole === 'TENANT_ADMIN' || userRole === 'SUPER_ADMIN',
    isSuperAdmin: userRole === 'SUPER_ADMIN'
  }
}