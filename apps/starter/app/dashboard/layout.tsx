'use client'

import React from 'react'
import { redirect } from 'next/navigation'
import { useSession } from '@linch-kit/auth'
import { ConsoleProvider } from '@linch-kit/console'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
} from '@linch-kit/ui/client'
import { Button } from '@linch-kit/ui/server'
import { Home, Settings, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/sign-in?redirect=/dashboard')
  }

  const isAdmin =
    (session.user as { role?: string })?.role === 'SUPER_ADMIN' ||
    (session.user as { role?: string })?.role === 'TENANT_ADMIN'

  // 获取用户权限
  const userPermissions = []
  if (session.user) {
    userPermissions.push('console:access')
    if (isAdmin) {
      userPermissions.push('console:admin', 'tenant:manage', 'user:manage')
    }
  }

  return (
    <ConsoleProvider
      config={{
        basePath: '/dashboard/admin',
        features: ['dashboard', 'tenants', 'users', 'settings'],
        theme: { primary: '#3b82f6' },
      }}
      tenantId={(session.user as { tenantId?: string })?.tenantId}
      permissions={userPermissions}
      language="zh-CN"
    >
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h2 className="font-semibold">LinchKit</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  仪表板
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/users">
                  <Users className="mr-2 h-4 w-4" />
                  用户
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/admin">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    管理中心
                  </Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </Link>
              </Button>
            </nav>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <main className="p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ConsoleProvider>
  )
}
