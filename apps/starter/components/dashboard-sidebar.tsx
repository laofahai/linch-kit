'use client'

import React from 'react'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@linch-kit/ui/client'
import { Button } from '@linch-kit/ui/server'
import { Avatar, AvatarFallback, AvatarImage } from '@linch-kit/ui/server'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@linch-kit/ui/client'
import { Home, Settings, Users, BarChart3, Package, LogOut, User } from 'lucide-react'
import Link from 'next/link'
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

  // 权限检查函数
  const hasPermission = (permission: string) => userPermissions.includes(permission)

  const getUserInitials = (name?: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const getRoleDisplay = () => {
    if (isSuperAdmin) return '超级管理员'
    if (isAdmin) return '管理员'
    return '用户'
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3rem',
          '--sidebar-width-mobile': '18rem',
        } as React.CSSProperties
      }
    >
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center gap-2">
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
              <>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/admin">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    管理中心
                  </Link>
                </Button>
                {hasPermission('console:admin') && (
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/dashboard/admin/extensions">
                      <Package className="mr-2 h-4 w-4" />
                      Extensions
                    </Link>
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                设置
              </Link>
            </Button>
          </nav>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={(user as { image?: string })?.image || ''}
                      alt={(user as { name?: string })?.name || ''}
                    />
                    <AvatarFallback>
                      {getUserInitials((user as { name?: string })?.name || undefined)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">
                      {(user as { name?: string })?.name || '未知用户'}
                    </span>
                    <span className="text-xs text-muted-foreground">{getRoleDisplay()}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
