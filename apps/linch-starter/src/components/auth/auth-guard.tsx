'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '../../contexts/auth-context'

/**
 * 认证守卫组件属性
 * @description 路由保护组件的配置选项
 * @since 2025-06-20
 */
interface AuthGuardProps {
  children: React.ReactNode
  /** 是否需要认证，默认为 true */
  requireAuth?: boolean
  /** 需要的角色列表，为空表示任何已认证用户都可以访问 */
  requiredRoles?: string[]
  /** 认证失败时的重定向路径，默认为 '/auth/login' */
  redirectTo?: string
  /** 权限不足时的重定向路径，默认为 '/' */
  fallbackTo?: string
  /** 加载时显示的组件 */
  loadingComponent?: React.ReactNode
  /** 权限不足时显示的组件 */
  unauthorizedComponent?: React.ReactNode
}

/**
 * 默认加载组件
 * @description 认证状态检查时显示的加载界面
 * @since 2025-06-20
 */
const DefaultLoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

/**
 * 默认未授权组件
 * @description 权限不足时显示的界面
 * @since 2025-06-20
 */
const DefaultUnauthorizedComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
)

/**
 * 认证守卫组件
 * @description 保护需要认证的路由，检查用户权限
 * @param props - 组件属性
 * @since 2025-06-20
 * 
 * @example
 * ```tsx
 * // 基础认证保护
 * <AuthGuard>
 *   <UserManagementPage />
 * </AuthGuard>
 * 
 * // 需要管理员权限
 * <AuthGuard requiredRoles={['admin']}>
 *   <AdminPanel />
 * </AuthGuard>
 * 
 * // 公开页面（不需要认证）
 * <AuthGuard requireAuth={false}>
 *   <PublicContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requiredRoles = [],
  redirectTo = '/auth/login',
  fallbackTo = '/',
  loadingComponent,
  unauthorizedComponent,
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  /**
   * 检查用户是否有所需角色
   * @description 验证用户角色权限，包含空值保护
   * @param userRoles - 用户角色列表（可能为空）
   * @param requiredRoles - 需要的角色列表
   * @returns 是否有权限
   * @since 2025-06-20
   */
  const hasRequiredRoles = (userRoles: string[] | undefined, requiredRoles: string[]): boolean => {
    if (requiredRoles.length === 0) return true
    const roles = userRoles || []
    return requiredRoles.some(role => roles.includes(role))
  }

  /**
   * 处理认证和权限检查
   * @description 根据认证状态和权限要求进行重定向
   * @since 2025-06-20
   */
  useEffect(() => {
    // 如果还在加载中，不做任何操作
    if (isLoading) return

    // 如果不需要认证，直接显示内容
    if (!requireAuth) return

    // 如果需要认证但用户未登录，重定向到登录页
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login')
      router.push(redirectTo)
      return
    }

    // 如果需要特定角色但用户没有权限，重定向到回退页面
    if (requiredRoles.length > 0 && user && !hasRequiredRoles(user.roles, requiredRoles)) {
      console.log('User lacks required roles, redirecting to fallback')
      router.push(fallbackTo)
      return
    }
  }, [isLoading, isAuthenticated, user, requireAuth, requiredRoles, redirectTo, fallbackTo, router])

  // 显示加载状态
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />
  }

  // 如果不需要认证，直接显示内容
  if (!requireAuth) {
    return <>{children}</>
  }

  // 如果用户未认证，显示加载状态（等待重定向）
  if (!isAuthenticated) {
    return loadingComponent || <DefaultLoadingComponent />
  }

  // 如果需要特定角色但用户没有权限，显示未授权界面
  if (requiredRoles.length > 0 && user && !hasRequiredRoles(user.roles, requiredRoles)) {
    return unauthorizedComponent || <DefaultUnauthorizedComponent />
  }

  // 所有检查通过，显示受保护的内容
  return <>{children}</>
}

/**
 * 管理员守卫组件
 * @description 只允许管理员访问的路由保护
 * @param props - 组件属性
 * @since 2025-06-20
 * 
 * @example
 * ```tsx
 * <AdminGuard>
 *   <AdminDashboard />
 * </AdminGuard>
 * ```
 */
export function AdminGuard({
  children,
  ...props
}: Omit<AuthGuardProps, 'requiredRoles'>) {
  return (
    <AuthGuard requiredRoles={['admin']} {...props}>
      {children}
    </AuthGuard>
  )
}

/**
 * 公开路由组件
 * @description 不需要认证的公开页面
 * @param props - 组件属性
 * @since 2025-06-20
 * 
 * @example
 * ```tsx
 * <PublicRoute>
 *   <LandingPage />
 * </PublicRoute>
 * ```
 */
export function PublicRoute({
  children,
  ...props
}: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={false} {...props}>
      {children}
    </AuthGuard>
  )
}

/**
 * 认证重定向组件
 * @description 已认证用户访问登录/注册页面时重定向到主页
 * @param children - 子组件
 * @param redirectTo - 重定向目标，默认为 '/users'
 * @since 2025-06-20
 * 
 * @example
 * ```tsx
 * <AuthRedirect>
 *   <LoginPage />
 * </AuthRedirect>
 * ```
 */
export function AuthRedirect({
  children,
  redirectTo = '/users',
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('User already authenticated, redirecting')
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  // 如果正在加载或已认证，显示加载状态
  if (isLoading || isAuthenticated) {
    return <DefaultLoadingComponent />
  }

  // 未认证用户显示登录/注册页面
  return <>{children}</>
}
