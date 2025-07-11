/**
 * 用户实体定义 - 优化重复问题，统一使用 LinchKit 标准
 */

// 直接使用 LinchKit 认证系统的用户类型
export { type LinchKitUser as User, type LinchKitUser, UserSchema } from '@linch-kit/auth'

// 简化类型定义，基于 LinchKitUser
import type { LinchKitUser } from '@linch-kit/auth'

export type UserCreate = Omit<LinchKitUser, 'id' | 'createdAt' | 'updatedAt'>
export type UserUpdate = Partial<Omit<LinchKitUser, 'id' | 'createdAt' | 'updatedAt'>>

/**
 * 应用特定的用户工具函数
 */
export function getUserDisplayName(user: LinchKitUser): string {
  return user.name || user.email.split('@')[0]
}

export function isAdminUser(user: LinchKitUser): boolean {
  return user.metadata?.role === 'admin'
}

export function isActiveUser(user: LinchKitUser): boolean {
  return user.status === 'active'
}
