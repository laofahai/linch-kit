import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppSidebarLayout } from '../../../components/layout/AppSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/sign-in?redirect=/dashboard/admin')
  }

  // 检查是否有管理员权限
  const hasAdminAccess =
    (session.user as { role?: string })?.role === 'SUPER_ADMIN' ||
    (session.user as { role?: string })?.role === 'TENANT_ADMIN'

  if (!hasAdminAccess) {
    redirect('/dashboard')
  }

  return (
    <AppSidebarLayout
      title="管理中心"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: '管理中心', href: '/dashboard/admin' },
      ]}
    >
      {children}
    </AppSidebarLayout>
  )
}
