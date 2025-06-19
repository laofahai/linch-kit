'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '@/_providers/authProvider'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requirePermissions?: string[]
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = '/login',
  requirePermissions = []
}: AuthGuardProps) {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, user, checkPermission } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  // 显示加载状态
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  // 未认证，不渲染内容（将重定向）
  if (!isAuthenticated) {
    return null
  }

  // 检查权限
  if (requirePermissions.length > 0) {
    const hasAllPermissions = requirePermissions.every(permission => 
      checkPermission(permission)
    )

    if (!hasAllPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t('auth.permissions.accessDenied')}</h2>
            <p className="text-muted-foreground">
              {t('auth.permissions.noPermission')}
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// 权限检查 Hook
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

// 权限检查 Hook
export function useRequirePermissions(permissions: string[]) {
  const { checkPermission, isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return false
  }

  return permissions.every(permission => checkPermission(permission))
}
