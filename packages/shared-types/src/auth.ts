/**
 * 认证相关共享类型
 * @module shared-types/auth
 */

/**
 * 用户接口
 */
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  roles?: string[]
  permissions?: string[]
  tenantId?: string
  metadata?: Record<string, unknown>
}

/**
 * 会话接口
 */
export interface Session {
  user: User
  tenantId?: string
  permissions?: string[]
  roles?: string[]
  expiresAt?: Date
}

/**
 * 权限检查结果
 */
export interface PermissionResult {
  granted: boolean
  reason?: string
  conditions?: Record<string, unknown>
}

/**
 * 认证状态
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error'

/**
 * 认证错误
 */
export interface AuthError {
  code: string
  message: string
  details?: Record<string, unknown>
}