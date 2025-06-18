// === 核心类型定义 ===

export interface User {
  id: string
  username?: string
  name?: string
  email?: string
  avatar?: string
  permissions?: string[]
  roles?: string[]
  provider?: string
  sourceId?: string
  metadata?: Record<string, any>
}

export interface Session {
  user: User
  expires: string
  accessToken?: string
  refreshToken?: string
}

// === 权限系统 ===

export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
}

// === 认证配置 ===

export interface AuthConfig {
  providers: AuthProvider[]
  session?: SessionConfig
  permissions?: PermissionConfig
  pages?: PagesConfig
  callbacks?: AuthCallbacks
  events?: AuthEvents
}

export interface SessionConfig {
  strategy: 'jwt' | 'database'
  maxAge?: number
  updateAge?: number
  generateSessionToken?: () => string
}

export interface PermissionConfig {
  roles?: Role[]
  defaultRole?: string
  checkPermission?: (user: User, permission: Permission) => boolean
}

export interface PagesConfig {
  signIn?: string
  signOut?: string
  error?: string
  verifyRequest?: string
  newUser?: string
}

export interface AuthCallbacks {
  signIn?: (params: { user: User; account: any; profile: any }) => boolean | Promise<boolean>
  redirect?: (params: { url: string; baseUrl: string }) => string | Promise<string>
  session?: (params: { session: Session; token: any }) => Session | Promise<Session>
  jwt?: (params: { token: any; user?: User; account?: any }) => any | Promise<any>
}

export interface AuthEvents {
  signIn?: (message: { user: User; account: any; profile: any; isNewUser: boolean }) => void | Promise<void>
  signOut?: (message: { session: Session; token: any }) => void | Promise<void>
  createUser?: (message: { user: User }) => void | Promise<void>
  updateUser?: (message: { user: User }) => void | Promise<void>
  linkAccount?: (message: { user: User; account: any; profile: any }) => void | Promise<void>
  session?: (message: { session: Session; token: any }) => void | Promise<void>
}

// === 认证提供者 ===

export interface AuthProvider {
  id: string
  name: string
  type: 'oauth' | 'credentials' | 'email' | 'custom'
  config: Record<string, any>
}

export interface OAuthProvider extends AuthProvider {
  type: 'oauth'
  config: {
    clientId: string
    clientSecret: string
    scope?: string
    authorizationUrl?: string
    tokenUrl?: string
    userInfoUrl?: string
  }
}

export interface CredentialsProvider extends AuthProvider {
  type: 'credentials'
  config: {
    authorize: (credentials: Record<string, any>) => Promise<User | null>
    credentials?: Record<string, any>
  }
}

export interface SharedTokenProvider extends AuthProvider {
  type: 'custom'
  config: {
    token: string
    apiUrl: string
    userEndpoint?: string
  }
}

// === 权限检查 ===

export type PermissionCheck = (
  user: User,
  resource: string,
  action: string,
  context?: any
) => boolean | Promise<boolean>

export type RoleCheck = (
  user: User,
  role: string
) => boolean

// === Hook 类型 ===

export interface UseAuthReturn {
  user: User | null
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  signIn: (provider?: string, options?: any) => Promise<void>
  signOut: (options?: any) => Promise<void>
  update: (data?: any) => Promise<Session | null>
}

export interface UsePermissionsReturn {
  hasPermission: (resource: string, action: string, context?: any) => boolean
  hasRole: (role: string) => boolean
  permissions: Permission[]
  roles: string[]
}

// === 错误类型 ===

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

export class PermissionError extends AuthError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403)
    this.name = 'PermissionError'
  }
}

// === 向后兼容类型 ===

import { DefaultSession, DefaultUser } from 'next-auth'

export interface LegacyUser extends DefaultUser {
  username: string
  mobile?: string
  permissions: string[]
  provider: 'shared-token' | 'clerk'
  sourceId?: string
  [key: string]: any
}

export interface LegacySession extends DefaultSession {
  user: LegacyUser
  error?: 'RefreshAccessTokenError' | 'InvalidToken' | 'SourceNotFound'
}

export interface JWT {
  id: string
  username: string
  name?: string | null
  email?: string | null
  permissions: string[]
  provider: 'shared-token' | 'clerk'
  sourceId?: string
}
