/**
 * 认证配置 - 使用 @linch-kit/auth 适配器
 * 修复重复实现：现在基于 LinchKit 认证包而非自定义实现
 */

import NextAuth from 'next-auth'
import { nextAuthConfig } from './auth-config'
// TODO: 等待 @linch-kit/auth 包实现完整的适配器功能
// import { createLinchKitAuthConfig } from '@linch-kit/auth'

// 临时使用标准 NextAuth 配置，待 LinchKit 认证适配器完成后切换
export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthConfig)

// 临时保留简化的认证工具函数，待 LinchKit 包完成后替换
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
    isSuperAdmin: userRole === 'SUPER_ADMIN',
  }
}
