/**
 * @linch-kit/auth 客户端导出
 * 
 * 客户端安全的Auth功能导出
 * 不包含任何Node.js专用依赖
 * 
 * @author LinchKit Team
 * @since 0.2.0
 */

// ==================== NextAuth.js 客户端功能 ====================
export { getSession, signIn, signOut, useSession, SessionProvider as AuthProvider } from 'next-auth/react'
export { SessionProvider } from 'next-auth/react'

// ==================== 客户端类型定义 ====================
import {
  LinchKitUser,
  User,
  LinchKitSession,
  LinchKitAuthConfig,
  AuthRequest,
  AuthResult,
  Session,
  JWTPayload,
  Role,
  Permission,
  PermissionAction,
  PermissionSubject,
  PermissionContext,
  PermissionCheck,
  MFAMethod,
  TOTPSetup,
  MFAVerification,
  AuditEventType,
  AuditLog,
  PasswordPolicyConfig,
  AuthConfig,
  AuthError,
  PermissionError,
  IAuthProvider,
  IPermissionChecker,
  ISessionManager,
  IAuditLogger,
  IAuthService,
} from './types/index'

export type {
  LinchKitUser,
  User,
  LinchKitSession,
  LinchKitAuthConfig,
  AuthRequest,
  AuthResult,
  Session,
  JWTPayload,
  Role,
  Permission,
  PermissionAction,
  PermissionSubject,
  PermissionContext,
  PermissionCheck,
  MFAMethod,
  TOTPSetup,
  MFAVerification,
  AuditEventType,
  AuditLog,
  PasswordPolicyConfig,
  AuthConfig,
  AuthError,
  PermissionError,
  IAuthProvider,
  IPermissionChecker,
  ISessionManager,
  IAuditLogger,
  IAuthService,
}

// ==================== 客户端Schema ====================
export {
  UserSchema,
  AuthRequestSchema,
  AuthResultSchema,
  JWTPayloadSchema,
  SessionSchema,
  RoleSchema,
  PermissionSchema,
  PermissionContextSchema,
  PermissionCheckSchema,
  TOTPSetupSchema,
  MFAVerificationSchema,
  AuditLogSchema,
  PasswordPolicyConfigSchema,
  AuthConfigSchema,
} from './types/index'

// ==================== 客户端工具函数 ====================
/**
 * 检查用户是否具有特定权限（客户端版本）
 * 这是一个简化版本，真实的权限检查应该在服务端进行
 */
export function hasPermission(
  user: LinchKitUser | null,
  _action: PermissionAction,
  _subject: PermissionSubject
): boolean {
  if (!user) return false
  
  // 客户端简单检查，实际权限验证应该在服务端
  console.warn('客户端权限检查仅用于UI显示，实际权限验证必须在服务端进行')
  return true
}

/**
 * 获取用户角色列表（客户端版本）
 */
export function getUserRoles(user: LinchKitUser | null): string[] {
  if (!user) return []
  return [] // 实际角色信息应该从服务端获取
}

/**
 * 检查用户是否具有特定角色（客户端版本）
 */
export function hasRole(user: LinchKitUser | null, _role: string): boolean {
  if (!user) return false
  
  // 客户端简单检查，实际角色验证应该在服务端
  console.warn('客户端角色检查仅用于UI显示，实际角色验证必须在服务端进行')
  return true
}

// ==================== 客户端常量 ====================
export const CLIENT_SAFE_AUTH_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
} as const
