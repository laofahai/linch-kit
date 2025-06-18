import { useSession, signIn, signOut } from 'next-auth/react'
import { useMemo } from 'react'
import type { 
  UseAuthReturn, 
  UsePermissionsReturn, 
  User, 
  Session,
  PermissionCheck 
} from './types-new'
import { hasPermission, hasRole, hasAnyRole, hasAllRoles } from './config-new'

/**
 * 🎯 统一的认证 Hook
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession()

  return {
    user: session?.user || null,
    session: session || null,
    status: status as 'loading' | 'authenticated' | 'unauthenticated',
    signIn: async (provider?: string, options?: any) => {
      await signIn(provider, options)
    },
    signOut: async (options?: any) => {
      await signOut(options)
    },
    update
  }
}

/**
 * 🛡️ 权限管理 Hook
 */
export function usePermissions(
  checkFn?: PermissionCheck
): UsePermissionsReturn {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user?.permissions) return []
    return user.permissions.map(perm => {
      const [resource, action] = perm.split(':')
      return { resource, action }
    })
  }, [user?.permissions])

  const roles = useMemo(() => {
    return user?.roles || []
  }, [user?.roles])

  return {
    hasPermission: (resource: string, action: string, context?: any) => {
      return hasPermission(user, resource, action, context, checkFn)
    },
    hasRole: (role: string) => {
      return hasRole(user, role)
    },
    permissions,
    roles
  }
}

/**
 * 🔐 角色检查 Hook
 */
export function useRole() {
  const { user } = useAuth()

  return {
    hasRole: (role: string) => hasRole(user, role),
    hasAnyRole: (roles: string[]) => hasAnyRole(user, roles),
    hasAllRoles: (roles: string[]) => hasAllRoles(user, roles),
    roles: user?.roles || [],
    isAdmin: hasRole(user, 'admin'),
    isModerator: hasRole(user, 'moderator'),
    isUser: hasRole(user, 'user')
  }
}

/**
 * 🎛️ 权限检查 Hook（特定资源）
 */
export function useResourcePermissions(resource: string) {
  const { hasPermission } = usePermissions()

  return {
    canRead: hasPermission(resource, 'read'),
    canCreate: hasPermission(resource, 'create'),
    canUpdate: hasPermission(resource, 'update'),
    canDelete: hasPermission(resource, 'delete'),
    canManage: hasPermission(resource, '*'),
    hasPermission: (action: string, context?: any) => 
      hasPermission(resource, action, context)
  }
}

/**
 * 👤 用户信息 Hook
 */
export function useUser() {
  const { user, status, update } = useAuth()

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
    updateUser: update,
    // 便捷属性
    id: user?.id,
    name: user?.name,
    email: user?.email,
    username: user?.username,
    avatar: user?.avatar,
    provider: user?.provider
  }
}

/**
 * 🔄 会话管理 Hook
 */
export function useSession() {
  const { session, status, update } = useAuth()

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    update,
    refresh: () => update(),
    // 便捷方法
    getAccessToken: () => session?.accessToken,
    getRefreshToken: () => session?.refreshToken,
    isExpired: () => {
      if (!session?.expires) return false
      return new Date(session.expires) < new Date()
    }
  }
}

/**
 * 🚪 登录/登出 Hook
 */
export function useAuthActions() {
  const { signIn, signOut } = useAuth()

  return {
    signIn,
    signOut,
    // 便捷方法
    signInWithGoogle: () => signIn('google'),
    signInWithGitHub: () => signIn('github'),
    signInWithCredentials: (credentials: Record<string, any>) => 
      signIn('credentials', credentials),
    signInWithSharedToken: () => signIn('shared-token'),
    signOutAndRedirect: (callbackUrl?: string) => 
      signOut({ callbackUrl })
  }
}

/**
 * 🎯 组合 Hook - 常用功能组合
 */
export function useAuthState() {
  const auth = useAuth()
  const permissions = usePermissions()
  const role = useRole()

  return {
    ...auth,
    ...permissions,
    ...role,
    // 便捷状态
    isAdmin: role.isAdmin,
    isModerator: role.isModerator,
    canManageUsers: permissions.hasPermission('users', 'manage'),
    canCreatePosts: permissions.hasPermission('posts', 'create'),
    canModeratePosts: permissions.hasPermission('posts', 'moderate')
  }
}

/**
 * 🔒 权限守卫 Hook
 */
export function usePermissionGuard(
  resource: string, 
  action: string, 
  options?: {
    redirectTo?: string
    fallback?: React.ComponentType
    onUnauthorized?: () => void
  }
) {
  const { hasPermission } = usePermissions()
  const { status } = useAuth()

  const isAuthorized = hasPermission(resource, action)
  const isLoading = status === 'loading'

  // 处理未授权情况
  if (!isLoading && !isAuthorized && options?.onUnauthorized) {
    options.onUnauthorized()
  }

  return {
    isAuthorized,
    isLoading,
    canAccess: isAuthorized,
    shouldRedirect: !isLoading && !isAuthorized && options?.redirectTo,
    redirectTo: options?.redirectTo,
    fallback: options?.fallback
  }
}

/**
 * 📊 使用统计 Hook（可选）
 */
export function useAuthStats() {
  const { user, status } = useAuth()
  const { roles, permissions } = usePermissions()

  return {
    isAuthenticated: status === 'authenticated',
    userProvider: user?.provider,
    roleCount: roles.length,
    permissionCount: permissions.length,
    hasMultipleRoles: roles.length > 1,
    lastSignIn: user?.metadata?.lastSignIn,
    signInCount: user?.metadata?.signInCount || 0
  }
}
