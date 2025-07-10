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
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Settings, 
  Package, 
  Shield,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

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
    redirect('/sign-in?redirect=/admin')
  }

  // 严格的管理员权限检查
  const hasAdminAccess =
    (session.user as { role?: string })?.role === 'SUPER_ADMIN' ||
    (session.user as { role?: string })?.role === 'TENANT_ADMIN'

  if (!hasAdminAccess) {
    redirect('/dashboard')
  }

  // 管理员权限列表
  const adminPermissions = [
    'console:access',
    'console:admin',
    'system:manage',
    'tenant:manage',
    'user:manage',
    'extension:manage',
    'security:manage',
  ]

  return (
    <ConsoleProvider
      config={{
        basePath: '/admin',
        features: [
          'dashboard',
          'users',
          'tenants',
          'extensions',
          'security',
          'settings',
        ],
        theme: { 
          primary: '#ef4444', // 管理界面使用红色主题
          mode: 'admin' 
        },
      }}
      tenantId={(session.user as { tenantId?: string })?.tenantId}
      permissions={adminPermissions}
      language="zh-CN"
    >
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar className="border-r border-red-200 dark:border-red-800">
            <SidebarHeader className="border-b border-red-200 dark:border-red-800 p-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <h2 className="font-semibold text-red-900 dark:text-red-100">
                    LinchKit Admin
                  </h2>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    系统管理控制台
                  </p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-4">
              <nav className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20" 
                  asChild
                >
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    系统概览
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20" 
                  asChild
                >
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    用户管理
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20" 
                  asChild
                >
                  <Link href="/admin/tenants">
                    <Building className="mr-2 h-4 w-4" />
                    租户管理
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20" 
                  asChild
                >
                  <Link href="/admin/extensions">
                    <Package className="mr-2 h-4 w-4" />
                    Extension管理
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20" 
                  asChild
                >
                  <Link href="/admin/security">
                    <Shield className="mr-2 h-4 w-4" />
                    安全管理
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20" 
                  asChild
                >
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    系统设置
                  </Link>
                </Button>
                
                <hr className="my-4 border-red-200 dark:border-red-800" />
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                  asChild
                >
                  <Link href="/dashboard">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    返回业务面板
                  </Link>
                </Button>
              </nav>
            </SidebarContent>
          </Sidebar>
          
          <SidebarInset className="flex-1">
            <main className="p-6 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ConsoleProvider>
  )
}