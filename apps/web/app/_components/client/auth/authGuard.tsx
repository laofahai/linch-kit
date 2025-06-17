'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/_providers/authProvider'

type AuthGuardProps = {
  children: React.ReactNode
  permissions?: string[]
  fallback?: React.ReactNode
}

export function AuthGuard({ children, permissions = [], fallback }: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkPermission } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [isLoading, isAuthenticated, router])

  // 权限检查
  const hasPermission = permissions.every(perm => checkPermission(perm))

  if (isLoading || !isAuthenticated) {
    return (
      fallback || (
        <div className="flex justify-center items-center h-screen">
          <div>loading...</div>
        </div>
      )
    )
  }

  if (!hasPermission) {
    return (
      fallback || (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              You don't have permission to view this page
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
