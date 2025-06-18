import React from 'react'
import { useAuth, usePermissions, useRole, usePermissionGuard } from './hooks'
import type { User } from './types-new'

// === 权限组件 ===

interface PermissionGuardProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

/**
 * 🛡️ 权限守卫组件
 */
export function PermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback = null,
  loading = null 
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions()
  const { status } = useAuth()

  if (status === 'loading') {
    return <>{loading}</>
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RoleGuardProps {
  role: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean // 是否需要所有角色
}

/**
 * 👑 角色守卫组件
 */
export function RoleGuard({ 
  role, 
  children, 
  fallback = null,
  requireAll = false 
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, hasAllRoles } = useRole()

  const hasAccess = Array.isArray(role)
    ? requireAll 
      ? hasAllRoles(role)
      : hasAnyRole(role)
    : hasRole(role)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
  requireAuth?: boolean
}

/**
 * 🔐 认证守卫组件
 */
export function AuthGuard({ 
  children, 
  fallback = null,
  loading = null,
  requireAuth = true 
}: AuthGuardProps) {
  const { status } = useAuth()

  if (status === 'loading') {
    return <>{loading}</>
  }

  const isAuthenticated = status === 'authenticated'

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>
  }

  if (!requireAuth && isAuthenticated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// === 用户信息组件 ===

interface UserAvatarProps {
  user?: User | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fallback?: React.ReactNode
}

/**
 * 👤 用户头像组件
 */
export function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  fallback 
}: UserAvatarProps) {
  const { user: currentUser } = useAuth()
  const displayUser = user || currentUser

  if (!displayUser) {
    return <>{fallback}</>
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const initials = displayUser.name
    ? displayUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : displayUser.email?.[0]?.toUpperCase() || '?'

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden`}>
      {displayUser.avatar ? (
        <img 
          src={displayUser.avatar} 
          alt={displayUser.name || displayUser.email || 'User'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-gray-600">{initials}</span>
      )}
    </div>
  )
}

interface UserInfoProps {
  user?: User | null
  showEmail?: boolean
  showProvider?: boolean
  showRoles?: boolean
  className?: string
}

/**
 * ℹ️ 用户信息组件
 */
export function UserInfo({ 
  user, 
  showEmail = true,
  showProvider = false,
  showRoles = false,
  className = '' 
}: UserInfoProps) {
  const { user: currentUser } = useAuth()
  const displayUser = user || currentUser

  if (!displayUser) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-3">
        <UserAvatar user={displayUser} />
        <div>
          <div className="font-medium text-gray-900">
            {displayUser.name || displayUser.username || 'Unknown User'}
          </div>
          {showEmail && displayUser.email && (
            <div className="text-sm text-gray-500">{displayUser.email}</div>
          )}
          {showProvider && displayUser.provider && (
            <div className="text-xs text-gray-400">via {displayUser.provider}</div>
          )}
          {showRoles && displayUser.roles && displayUser.roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {displayUser.roles.map(role => (
                <span 
                  key={role}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// === 登录/登出组件 ===

interface SignInButtonProps {
  provider?: string
  children?: React.ReactNode
  className?: string
  onSignIn?: () => void
}

/**
 * 🚪 登录按钮组件
 */
export function SignInButton({ 
  provider, 
  children = 'Sign In', 
  className = '',
  onSignIn 
}: SignInButtonProps) {
  const { signIn } = useAuth()

  const handleSignIn = async () => {
    await signIn(provider)
    onSignIn?.()
  }

  return (
    <button 
      onClick={handleSignIn}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  )
}

interface SignOutButtonProps {
  children?: React.ReactNode
  className?: string
  onSignOut?: () => void
}

/**
 * 🚪 登出按钮组件
 */
export function SignOutButton({ 
  children = 'Sign Out', 
  className = '',
  onSignOut 
}: SignOutButtonProps) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    onSignOut?.()
  }

  return (
    <button 
      onClick={handleSignOut}
      className={`px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ${className}`}
    >
      {children}
    </button>
  )
}

// === 条件渲染组件 ===

interface ConditionalRenderProps {
  condition: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * 🔀 条件渲染组件
 */
export function ConditionalRender({ condition, children, fallback = null }: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>
}

// === 高阶组件 ===

/**
 * 🛡️ 权限高阶组件
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  action: string,
  fallback?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard 
        resource={resource} 
        action={action}
        fallback={fallback ? <fallback /> : null}
      >
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * 👑 角色高阶组件
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string | string[],
  fallback?: React.ComponentType
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <RoleGuard 
        role={role}
        fallback={fallback ? <fallback /> : null}
      >
        <Component {...props} />
      </RoleGuard>
    )
  }
}

/**
 * 🔐 认证高阶组件
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType
) {
  return function AuthWrappedComponent(props: P) {
    return (
      <AuthGuard fallback={fallback ? <fallback /> : null}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
