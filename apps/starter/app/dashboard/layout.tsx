import React from 'react'
import { redirect } from 'next/navigation'

import { getAuthContext } from '@/lib/auth'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authContext = await getAuthContext()

  if (!authContext.isAuthenticated) {
    redirect('/sign-in?redirect=/dashboard')
  }

  // 获取用户权限 - 恢复之前注释的功能
  const userPermissions = []
  if (authContext.user) {
    userPermissions.push('console:access')
    if (authContext.isAdmin) {
      userPermissions.push('console:admin', 'tenant:manage', 'user:manage')
    }
    if (authContext.isSuperAdmin) {
      userPermissions.push('console:super-admin', 'system:manage')
    }
  }

  return (
    <DashboardSidebar
      user={authContext.user}
      isAdmin={authContext.isAdmin}
      isSuperAdmin={authContext.isSuperAdmin}
      userPermissions={userPermissions}
    >
      {children}
    </DashboardSidebar>
  )
}
