/**
 * @linch-kit/auth 类型定义
 * 基于 NextAuth.js 的企业级认证和权限管理类型系统
 *
 * 遵循 LinchKit "不重复造轮子" 原则
 * 扩展 NextAuth.js 类型以支持企业级特性
 */

import { z } from 'zod'
import type { User as NextAuthUser, Session as NextAuthSession, Account, Profile } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// ============================================================================
// NextAuth.js 扩展类型
// ============================================================================

/**
 * LinchKit 用户类型 - 扩展 NextAuth.js User
 */
export interface LinchKitUser extends NextAuthUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  tenantId?: string
  status?: 'active' | 'inactive' | 'disabled' | 'pending'
  emailVerified?: Date | null
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
  metadata?: Record<string, unknown>
}

/**
 * 用户类型别名 - 为了向后兼容
 */
export type User = LinchKitUser

/**
 * 用户 Zod Schema
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  tenantId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'disabled', 'pending']).optional(),
  emailVerified: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastLoginAt: z.date().nullable().optional(),
  metadata: z.record(z.unknown()).optional()
})

/**
 * LinchKit 会话类型 - 扩展 NextAuth.js Session
 */
export interface LinchKitSession extends NextAuthSession {
  user: LinchKitUser
  tenantId?: string
  permissions?: string[]
  roles?: string[]
}

// ============================================================================
// LinchKit 认证配置类型
// ============================================================================

/**
 * LinchKit 认证配置
 */
export interface LinchKitAuthConfig {
  providers?: {
    github?: {
      clientId: string
      clientSecret: string
    }
    google?: {
      clientId: string
      clientSecret: string
    }
    credentials?: {
      authorize: (credentials: Record<string, unknown>) => Promise<LinchKitUser | null>
    }
  }
  // 注意：数据库集成已移至 @linch-kit/trpc 包
  session?: {
    maxAge?: number
  }
  jwt?: {
    maxAge?: number
  }
  pages?: {
    signIn?: string
    signOut?: string
    error?: string
    verifyRequest?: string
    newUser?: string
  }
  callbacks?: {
    beforeSignIn?: (params: { user: LinchKitUser; account: Account | null; profile?: Profile }) => Promise<boolean>
    extendSession?: (session: LinchKitSession, token: JWT) => Promise<LinchKitSession>
    extendJWT?: (token: JWT, user?: LinchKitUser, account?: Account | null) => Promise<JWT>
  }
  events?: {
    onSignIn?: (params: { user: LinchKitUser; account: Account | null; profile?: Profile }) => Promise<void>
    onSignOut?: (params: { session?: LinchKitSession; token?: JWT }) => Promise<void>
  }
  debug?: boolean
}

// 注意：Prisma 适配器配置已移至 @linch-kit/trpc 包

/**
 * 认证请求
 */
export const AuthRequestSchema = z.object({
  provider: z.string(),
  credentials: z.record(z.unknown()),
  metadata: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    deviceFingerprint: z.string().optional()
  }).optional()
})

export type AuthRequest = z.infer<typeof AuthRequestSchema>

/**
 * 认证结果
 */
export const AuthResultSchema = z.object({
  success: z.boolean(),
  user: UserSchema.optional(),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number()
  }).optional(),
  error: z.string().optional(),
  requiredActions: z.array(z.enum(['email_verification', 'mfa_setup', 'password_change'])).optional()
})

export type AuthResult = z.infer<typeof AuthResultSchema>

// ============================================================================
// 会话管理类型
// ============================================================================

/**
 * JWT载荷
 */
export const JWTPayloadSchema = z.object({
  sub: z.string(), // 用户ID
  iat: z.number(), // 签发时间
  exp: z.number(), // 过期时间
  jti: z.string(), // JWT ID
  roles: z.array(z.string()),
  permissions: z.array(z.string()).optional(),
  tenantId: z.string().optional()
})

export type JWTPayload = z.infer<typeof JWTPayloadSchema>

/**
 * 会话信息
 */
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date(),
  lastAccessedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
})

export type Session = z.infer<typeof SessionSchema>

// ============================================================================
// 权限系统类型
// ============================================================================

/**
 * 权限动作
 */
export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage' 
  | 'execute'
  | 'view'
  | 'edit'
  | 'publish'
  | 'approve'

/**
 * 权限主体
 */
export type PermissionSubject = 
  | 'User' 
  | 'Role' 
  | 'Permission'
  | 'Project' 
  | 'File' 
  | 'Post' 
  | 'Comment'
  | 'all'
  | string

/**
 * 角色定义
 */
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  inherits: z.array(z.string()).optional(), // 继承的角色
  isSystemRole: z.boolean().default(false),
  tenantId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Role = z.infer<typeof RoleSchema>

/**
 * 权限定义
 */
export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  action: z.string(),
  subject: z.string(),
  conditions: z.record(z.unknown()).optional(), // CASL条件
  fields: z.array(z.string()).optional(), // 字段级权限
  description: z.string().optional(),
  isSystemPermission: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Permission = z.infer<typeof PermissionSchema>

/**
 * 权限上下文
 */
export const PermissionContextSchema = z.object({
  tenantId: z.string().optional(),
  projectId: z.string().optional(),
  departmentId: z.string().optional(),
  location: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  ipAddress: z.string().optional(),
  currentTime: z.date().optional()
})

export type PermissionContext = z.infer<typeof PermissionContextSchema>

/**
 * 权限检查请求
 */
export const PermissionCheckSchema = z.object({
  userId: z.string(),
  action: z.string(),
  subject: z.union([z.string(), z.record(z.unknown())]),
  context: PermissionContextSchema.optional()
})

export type PermissionCheck = z.infer<typeof PermissionCheckSchema>

// ============================================================================
// 多因子认证类型
// ============================================================================

/**
 * MFA方法类型
 */
export type MFAMethod = 'totp' | 'sms' | 'email' | 'backup_codes'

/**
 * TOTP设置
 */
export const TOTPSetupSchema = z.object({
  secret: z.string(),
  qrCode: z.string(),
  backupCodes: z.array(z.string())
})

export type TOTPSetup = z.infer<typeof TOTPSetupSchema>

/**
 * MFA验证请求
 */
export const MFAVerificationSchema = z.object({
  userId: z.string(),
  method: z.string(),
  token: z.string()
})

export type MFAVerification = z.infer<typeof MFAVerificationSchema>

// ============================================================================
// 审计日志类型
// ============================================================================

/**
 * 审计事件类型
 */
export type AuditEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'role_assigned'
  | 'role_removed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'account_locked'
  | 'account_unlocked'

/**
 * 审计日志记录
 */
export const AuditLogSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  userId: z.string().optional(),
  actorId: z.string().optional(), // 执行操作的用户
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  result: z.enum(['success', 'failure', 'warning']),
  timestamp: z.date(),
  tenantId: z.string().optional()
})

export type AuditLog = z.infer<typeof AuditLogSchema>

// ============================================================================
// 配置类型
// ============================================================================

/**
 * 密码策略配置
 */
export const PasswordPolicyConfigSchema = z.object({
  minLength: z.number().min(6).default(8),
  maxLength: z.number().max(128).default(64),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSymbols: z.boolean().default(false),
  preventReuse: z.number().min(0).default(3), // 防止重复使用最近N个密码
  saltRounds: z.number().min(10).max(15).default(12)
})

export type PasswordPolicyConfig = z.infer<typeof PasswordPolicyConfigSchema>

/**
 * 认证配置
 */
export const AuthConfigSchema = z.object({
  // JWT配置
  jwt: z.object({
    secret: z.string(),
    accessTokenExpiry: z.string().default('15m'),
    refreshTokenExpiry: z.string().default('7d'),
    algorithm: z.enum(['HS256', 'HS384', 'HS512']).default('HS256')
  }),
  
  // 会话配置
  session: z.object({
    maxConcurrentSessions: z.number().default(5),
    maxInactiveTime: z.string().default('30m'),
    extendOnActivity: z.boolean().default(true)
  }),
  
  // 安全配置
  security: z.object({
    maxLoginAttempts: z.number().default(5),
    lockoutDuration: z.string().default('30m'),
    passwordPolicy: PasswordPolicyConfigSchema,
    requireEmailVerification: z.boolean().default(true),
    mfaRequired: z.boolean().default(false)
  }),
  
  // 提供商配置
  providers: z.record(z.object({
    enabled: z.boolean().default(false),
    config: z.record(z.unknown()).optional()
  })).optional()
})

export type AuthConfig = z.infer<typeof AuthConfigSchema>

// ============================================================================
// 错误类型
// ============================================================================

/**
 * 认证错误类型
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * 权限错误类型
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

// ============================================================================
// 接口定义
// ============================================================================

/**
 * 认证提供商接口
 */
export interface IAuthProvider {
  readonly name: string
  authenticate(request: AuthRequest): Promise<AuthResult>
  validate?(user: any): Promise<LinchKitUser | null>
}

/**
 * 权限检查器接口
 */
export interface IPermissionChecker {
  check(user: LinchKitUser, action: PermissionAction, subject: PermissionSubject | any, context?: PermissionContext): Promise<boolean>
  checkMultiple(user: LinchKitUser, checks: PermissionCheck[], context?: PermissionContext): Promise<Record<string, boolean>>
  getAccessibleResources(user: LinchKitUser, action: PermissionAction, resourceType: PermissionSubject): Promise<any>
}

/**
 * 会话管理器接口
 */
export interface ISessionManager {
  create(user: LinchKitUser, metadata?: any): Promise<Session>
  validate(token: string): Promise<Session | null>
  refresh(refreshToken: string): Promise<Session | null>
  revoke(sessionId: string): Promise<boolean>
  revokeAll(userId: string): Promise<number>
}

/**
 * 审计日志记录器接口
 */
export interface IAuditLogger {
  log(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>
  query(filters: Partial<AuditLog>, options?: { limit?: number; offset?: number }): Promise<AuditLog[]>
}