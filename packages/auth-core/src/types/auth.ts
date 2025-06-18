import type { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

/**
 * 核心认证用户接口 - 预留基础字段，其他完全由用户自定义
 *
 * 基础字段：
 * - id: 必需，用户唯一标识
 * - name: 可选，用户显示名称
 * - email: 可选，考虑到国内用户习惯，不强制要求
 */
export interface AuthUser {
  id: string
  name?: string
  email?: string
  [key: string]: any  // 允许用户完全自定义：phone, username, avatar, roles 等
}

/**
 * 核心会话接口
 */
export interface AuthSession {
  user: AuthUser
  expires: string
  [key: string]: any  // 允许用户扩展
}

/**
 * 认证提供者配置
 */
export interface AuthProvider {
  id: string
  name: string
  type: 'oauth' | 'credentials' | 'shared-token' | 'custom'
  options: Record<string, any>
}

/**
 * OAuth 提供者配置
 */
export interface OAuthProvider extends AuthProvider {
  type: 'oauth'
  options: {
    clientId: string
    clientSecret: string
    scope?: string
    authorizationUrl?: string
    tokenUrl?: string
    userInfoUrl?: string
  }
}

/**
 * 凭据提供者配置
 */
export interface CredentialsProvider extends AuthProvider {
  type: 'credentials'
  options: {
    authorize: (credentials: Record<string, string>) => Promise<AuthUser | null>
    credentials?: Record<string, {
      label: string
      type: string
      placeholder?: string
    }>
  }
}

/**
 * 共享令牌提供者配置
 */
export interface SharedTokenProvider extends AuthProvider {
  type: 'shared-token'
  options: {
    token: string
    apiUrl: string
    userEndpoint?: string
    headers?: Record<string, string>
  }
}

/**
 * 权限检查函数类型
 */
export type PermissionCheck = (
  user: AuthUser,
  resource: string,
  action: string,
  context?: any
) => boolean | Promise<boolean>

/**
 * 角色检查函数类型
 */
export type RoleCheck = (
  user: AuthUser,
  role: string | string[],
  context?: any
) => boolean | Promise<boolean>

/**
 * 多租户配置
 */
export interface MultiTenantConfig {
  enabled: boolean
  tenantResolver: (request: any) => string | Promise<string>
  tenantField?: string  // 用户实体中的租户字段名，默认 'tenantId'
}

/**
 * 权限系统配置
 */
export interface PermissionConfig {
  strategy: 'rbac' | 'abac' | 'custom'
  roles?: string[]
  checkPermission: PermissionCheck
  checkRole?: RoleCheck
}

/**
 * 会话配置
 */
export interface SessionConfig {
  strategy: 'jwt' | 'database'
  maxAge?: number
  updateAge?: number
  generateSessionToken?: () => string
}

/**
 * Auth Core 主配置
 */
export interface AuthCoreConfig {
  /** 用户实体定义（可选，用户可完全自定义） */
  userEntity?: any
  
  /** 认证提供者 */
  providers: AuthProvider[]
  
  /** 权限配置 */
  permissions?: PermissionConfig
  
  /** 会话配置 */
  session?: SessionConfig
  
  /** 多租户配置 */
  multiTenant?: MultiTenantConfig
  
  /** 自定义回调 */
  callbacks?: {
    signIn?: (user: AuthUser, account: any, profile: any) => boolean | Promise<boolean>
    session?: (session: AuthSession, user: AuthUser) => AuthSession | Promise<AuthSession>
    jwt?: (token: JWT, user: AuthUser) => JWT | Promise<JWT>
  }
  
  /** 页面配置 */
  pages?: {
    signIn?: string
    signOut?: string
    error?: string
  }
  
  /** 调试模式 */
  debug?: boolean
}

/**
 * NextAuth 适配器返回类型
 */
export interface NextAuthAdapter {
  options: NextAuthOptions
  config: AuthCoreConfig
}

/**
 * 认证错误类型
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * 权限错误类型
 */
export class PermissionError extends AuthError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403)
    this.name = 'PermissionError'
  }
}
