/**
 * 用户类型定义 - 使用 LinchKit 标准类型
 * 移除重复实现，直接使用 @linch-kit/auth 的类型定义
 */

import { type LinchKitUser, UserSchema } from '@linch-kit/auth'

/**
 * 应用层用户类型 - 兼容现有代码
 * 使用 LinchKitUser 作为基础，添加应用特定的字段
 */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  lastActiveAt?: string | null
}

/**
 * 转换 LinchKitUser 到应用层 User 格式
 */
export function toAppUser(linchKitUser: LinchKitUser): User {
  return {
    id: linchKitUser.id,
    email: linchKitUser.email,
    name: linchKitUser.name || '',
    avatar: linchKitUser.image || undefined,
    role:
      ((linchKitUser.metadata?.role as string)?.toUpperCase() as 'USER' | 'ADMIN' | 'MODERATOR') ||
      'USER',
    status: (linchKitUser.status?.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
    createdAt: linchKitUser.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: linchKitUser.updatedAt?.toISOString() || new Date().toISOString(),
    lastLoginAt: linchKitUser.lastLoginAt?.toISOString() || null,
    lastActiveAt: null, // 应用特定字段
  }
}

/**
 * 转换应用层 User 到 LinchKitUser 格式
 */
export function toLinchKitUser(appUser: User): LinchKitUser {
  return {
    id: appUser.id,
    email: appUser.email,
    name: appUser.name,
    image: appUser.avatar,
    status: appUser.status.toLowerCase() as 'active' | 'inactive' | 'disabled' | 'pending',
    createdAt: new Date(appUser.createdAt),
    updatedAt: new Date(appUser.updatedAt),
    lastLoginAt: appUser.lastLoginAt ? new Date(appUser.lastLoginAt) : null,
    metadata: {
      role: appUser.role,
    },
  }
}

// 简化的创建和更新类型
export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>

// 兼容性导出
export { type LinchKitUser, UserSchema }

// 重导出 LinchKitUser 作为标准用户类型
export { type LinchKitUser as StandardUser }
