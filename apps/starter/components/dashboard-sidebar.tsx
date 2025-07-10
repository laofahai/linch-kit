'use client'

import React from 'react'
import { DashboardLayout, type DashboardUser } from '@linch-kit/ui/client'
import { signOut } from 'next-auth/react'

interface DashboardSidebarProps {
  children: React.ReactNode
  user: unknown // 使用unknown类型避免复杂的类型匹配
  isAdmin: boolean
  isSuperAdmin: boolean
  userPermissions: string[]
}

export function DashboardSidebar({
  children,
  user,
  isAdmin,
  isSuperAdmin,
  userPermissions,
}: DashboardSidebarProps) {
  const handleSignOut = async () => {
    await signOut()
  }

  // 转换用户数据为 DashboardUser 类型
  const dashboardUser: DashboardUser = {
    id: (user as { id?: string })?.id || 'unknown',
    name: (user as { name?: string })?.name,
    email: (user as { email?: string })?.email,
    image: (user as { image?: string })?.image,
    role: isSuperAdmin ? 'super-admin' : isAdmin ? 'admin' : 'user',
    permissions: userPermissions,
  }

  return (
    <DashboardLayout
      user={dashboardUser}
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
      onSignOut={handleSignOut}
      appTitle="LinchKit"
      pageTitle="Dashboard"
    >
      {children}
    </DashboardLayout>
  )
}
