import type {
  AuthConfig,
  AuthProvider,
  OAuthProvider,
  CredentialsProvider,
  SharedTokenProvider,
  PermissionCheck,
  User,
  Permission
} from './types'

/**
 * 🎯 创建认证配置 - 统一的配置入口
 */
export function createAuthConfig(config: AuthConfig): AuthConfig {
  return {
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      ...config.session
    },
    pages: {
      signIn: '/auth/signin',
      signOut: '/auth/signout',
      error: '/auth/error',
      ...config.pages
    },
    permissions: {
      defaultRole: 'user',
      checkPermission: defaultPermissionCheck,
      ...config.permissions
    },
    ...config
  }
}

/**
 * 🔐 认证提供者工厂函数
 */

// Google OAuth 提供者
export function googleProvider(config: {
  clientId: string
  clientSecret: string
  scope?: string
}): OAuthProvider {
  return {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    config: {
      scope: 'openid email profile',
      ...config
    }
  }
}

// GitHub OAuth 提供者
export function githubProvider(config: {
  clientId: string
  clientSecret: string
  scope?: string
}): OAuthProvider {
  return {
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
    config: {
      scope: 'user:email',
      ...config
    }
  }
}

// 凭据提供者
export function credentialsProvider(config: {
  authorize: (credentials: Record<string, any>) => Promise<User | null>
  credentials?: Record<string, any>
}): CredentialsProvider {
  return {
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    config
  }
}

// 共享令牌提供者
export function sharedTokenProvider(config: {
  token: string
  apiUrl: string
  userEndpoint?: string
}): SharedTokenProvider {
  return {
    id: 'shared-token',
    name: 'Shared Token',
    type: 'custom',
    config: {
      userEndpoint: '/api/user',
      ...config
    }
  }
}

/**
 * 🛡️ 权限检查函数
 */

// 默认权限检查逻辑
export const defaultPermissionCheck: PermissionCheck = (user, resource, action, context) => {
  if (!user.permissions) return false

  // 检查具体权限
  const permission = `${resource}:${action}`
  if (user.permissions.includes(permission)) return true

  // 检查通配符权限
  const wildcardPermission = `${resource}:*`
  if (user.permissions.includes(wildcardPermission)) return true

  // 检查管理员权限
  if (user.permissions.includes('*:*') || user.roles?.includes('admin')) return true

  return false
}

// 基于角色的权限检查
export const roleBasedPermissionCheck: PermissionCheck = (user, resource, action, context) => {
  if (!user.roles) return false

  // 管理员拥有所有权限
  if (user.roles.includes('admin')) return true

  // 根据角色检查权限
  const rolePermissions: Record<string, string[]> = {
    user: ['profile:read', 'profile:update'],
    moderator: ['posts:read', 'posts:update', 'comments:moderate'],
    admin: ['*:*']
  }

  for (const role of user.roles) {
    const permissions = rolePermissions[role] || []
    const permission = `${resource}:${action}`

    if (permissions.includes(permission) || permissions.includes(`${resource}:*`) || permissions.includes('*:*')) {
      return true
    }
  }

  return false
}

/**
 * 🎛️ 权限工具函数
 */

export function hasPermission(
  user: User | null,
  resource: string,
  action: string,
  context?: any,
  checkFn: PermissionCheck = defaultPermissionCheck
): boolean {
  if (!user) return false
  return checkFn(user, resource, action, context)
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user || !user.roles) return false
  return user.roles.includes(role)
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user || !user.roles) return false
  return roles.some(role => user.roles!.includes(role))
}

export function hasAllRoles(user: User | null, roles: string[]): boolean {
  if (!user || !user.roles) return false
  return roles.every(role => user.roles!.includes(role))
}
