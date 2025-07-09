'use client'

import React from 'react'
import { redirect } from 'next/navigation'
import { useSession } from '@linch-kit/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">检查权限中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/sign-in?redirect=/dashboard/admin')
  }

  // 权限检查
  const hasAdminAccess =
    (session.user as { role?: string })?.role === 'SUPER_ADMIN' ||
    (session.user as { role?: string })?.role === 'TENANT_ADMIN'

  if (!hasAdminAccess) {
    redirect('/dashboard')
  }

  // admin 布局复用父级 dashboard 布局
  return <>{children}</>
}
