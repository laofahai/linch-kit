'use client'

import React, { ComponentType } from 'react'
import { Home, Settings, Users, BarChart3, Package, LogOut, User, LucideIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '../server/avatar'

import { Button } from './button'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from './sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

/**
 * 导航菜单项配置
 */
export interface NavigationItem {
  /** 菜单项的唯一标识 */
  key: string
  /** 显示的文本 */
  label: string
  /** 链接地址 */
  href: string
  /** 图标组件 */
  icon: LucideIcon
  /** 是否需要管理员权限 */
  requireAdmin?: boolean
  /** 需要的具体权限 */
  requiredPermissions?: string[]
  /** 子菜单项 */
  children?: NavigationItem[]
}

/**
 * 用户信息接口
 */
export interface DashboardUser {
  /** 用户ID */
  id: string
  /** 用户名称 */
  name?: string | undefined
  /** 用户邮箱 */
  email?: string | undefined
  /** 头像URL */
  image?: string | undefined
  /** 用户角色 */
  role: string
  /** 用户权限列表 */
  permissions: string[]
}

/**
 * DashboardLayoutShell 组件属性（框架无关的纯UI组件）
 */
export interface DashboardLayoutShellProps {
  /** 子组件 */
  children: React.ReactNode
  /** 当前用户信息 */
  user: DashboardUser
  /** 是否为管理员 */
  isAdmin: boolean
  /** 是否为超级管理员 */
  isSuperAdmin: boolean
  /** 自定义导航菜单 */
  navigationItems?: NavigationItem[]
  /** Link 组件 (如 Next.js Link) */
  LinkComponent?: ComponentType<{ href: string; children: React.ReactNode; className?: string }>
  /** 登出回调函数 */
  onSignOut?: () => void | Promise<void>
  /** 侧边栏默认是否展开 */
  defaultOpen?: boolean
  /** 应用标题 */
  appTitle?: string
  /** 页面标题 */
  pageTitle?: string
  /** 自定义侧边栏宽度 */
  sidebarWidth?: string
  /** 自定义样式类名 */
  className?: string
}

/**
 * 默认导航菜单配置
 */
const defaultNavigationItems: NavigationItem[] = [
  {
    key: 'dashboard',
    label: '仪表板',
    href: '/dashboard',
    icon: Home,
  },
  {
    key: 'users',
    label: '用户',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    key: 'admin',
    label: '管理中心',
    href: '/dashboard/admin',
    icon: BarChart3,
    requireAdmin: true,
  },
  {
    key: 'extensions',
    label: 'Extensions',
    href: '/dashboard/admin/extensions',
    icon: Package,
    requireAdmin: true,
    requiredPermissions: ['console:admin'],
  },
  {
    key: 'settings',
    label: '设置',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

/**
 * Dashboard 布局Shell组件（框架无关）
 *
 * 提供完整的后台管理界面布局结构，包括侧边栏导航、用户信息显示和权限控制
 * 通过依赖注入模式接收 LinkComponent，保持框架无关性
 */
export function DashboardLayoutShell({
  children,
  user,
  isAdmin,
  isSuperAdmin,
  navigationItems = defaultNavigationItems,
  LinkComponent = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
  onSignOut,
  defaultOpen = true,
  appTitle = 'LinchKit',
  pageTitle = 'Dashboard',
  sidebarWidth = '16rem',
  className = '',
}: DashboardLayoutShellProps) {
  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut()
    }
  }

  // 权限检查函数
  const hasPermission = (permission: string) => user.permissions.includes(permission)

  // 检查菜单项是否应该显示
  const shouldShowMenuItem = (item: NavigationItem): boolean => {
    // 检查管理员权限
    if (item.requireAdmin && !isAdmin) {
      return false
    }

    // 检查具体权限
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.some(permission => hasPermission(permission))
    }

    return true
  }

  // 获取用户名首字母
  const getUserInitials = (name?: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  // 获取角色显示文本
  const getRoleDisplay = () => {
    if (isSuperAdmin) return '超级管理员'
    if (isAdmin) return '管理员'
    return '用户'
  }

  // 渲染导航菜单
  const renderNavigationItem = (item: NavigationItem) => {
    if (!shouldShowMenuItem(item)) {
      return null
    }

    const IconComponent = item.icon

    return (
      <Button key={item.key} variant="ghost" className="w-full justify-start" asChild>
        <LinkComponent href={item.href}>
          <IconComponent className="mr-2 h-4 w-4" />
          {item.label}
        </LinkComponent>
      </Button>
    )
  }

  const sidebarStyle = {
    '--sidebar-width': sidebarWidth,
    '--sidebar-width-icon': '3rem',
    '--sidebar-width-mobile': '18rem',
  } as React.CSSProperties

  return (
    <div className={className}>
      <SidebarProvider defaultOpen={defaultOpen} style={sidebarStyle}>
        <Sidebar>
          {/* 侧边栏头部 */}
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{appTitle}</h2>
            </div>
          </SidebarHeader>

          {/* 导航菜单 */}
          <SidebarContent className="p-4">
            <nav className="space-y-2">{navigationItems.map(renderNavigationItem)}</nav>
          </SidebarContent>

          {/* 用户信息底部 */}
          <SidebarFooter className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto p-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || ''} alt={user.name || ''} />
                      <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{user.name || '未知用户'}</span>
                      <span className="text-xs text-muted-foreground">{getRoleDisplay()}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <LinkComponent href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    个人资料
                  </LinkComponent>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* 主内容区域 */}
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium">{pageTitle}</span>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

/**
 * 简化版 Dashboard 布局组件
 *
 * 只包含基本功能的轻量级版本
 */
export function SimpleDashboardLayout({
  children,
  user,
  appTitle = 'App',
  pageTitle = 'Dashboard',
}: {
  children: React.ReactNode
  user: Pick<DashboardUser, 'name' | 'image'>
  appTitle?: string
  pageTitle?: string
}) {
  return (
    <DashboardLayoutShell
      user={{
        id: 'simple-user',
        name: user.name,
        image: user.image,
        role: 'user',
        permissions: [],
      }}
      isAdmin={false}
      isSuperAdmin={false}
      navigationItems={[
        {
          key: 'dashboard',
          label: '首页',
          href: '/dashboard',
          icon: Home,
        },
        {
          key: 'settings',
          label: '设置',
          href: '/dashboard/settings',
          icon: Settings,
        },
      ]}
      appTitle={appTitle}
      pageTitle={pageTitle}
    >
      {children}
    </DashboardLayoutShell>
  )
}
