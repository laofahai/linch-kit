/**
 * Starter 应用的 Sidebar 布局组件
 * 
 * 简单可靠的侧边栏实现，不依赖复杂的第三方组件
 */

'use client'

import React, { ReactNode, useState } from 'react'
import { cn } from '@linch-kit/ui/utils'
import { Button, Separator } from '@linch-kit/ui'
import { 
  Menu, 
  X, 
  Home, 
  Settings, 
  Users, 
  BarChart3,
  FileText,
  Zap
} from 'lucide-react'

export interface AppSidebarLayoutProps {
  /** 页面内容 */
  children: ReactNode
  /** 页面标题 */
  title?: string
  /** 面包屑导航 */
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  /** 自定义类名 */
  className?: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

// Starter 应用的导航项目
const starterNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, active: true },
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Admin', href: '/admin', icon: Zap },
  { label: 'tRPC Demo', href: '/trpc-demo', icon: BarChart3 },
  { label: 'Test Sidebar', href: '/test-sidebar', icon: FileText },
]

/**
 * Starter 应用的 Sidebar 布局
 */
export function AppSidebarLayout({
  children,
  title = 'LinchKit Dashboard',
  breadcrumbs = [],
  className
}: AppSidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={cn('flex min-h-screen bg-gray-50', className)}>
      {/* Sidebar */}
      <div 
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">L</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">LinchKit</div>
                <div className="text-xs text-gray-500">Starter App</div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white text-sm font-bold">L</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {starterNavItems.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    item.active 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </a>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs text-gray-500 text-center">
              © 2024 LinchKit Starter
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="mr-4"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>

          <Separator orientation="vertical" className="mr-4 h-6" />

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">{title}</span>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-300">/</span>
                {crumb.href ? (
                  <a href={crumb.href} className="text-gray-700 hover:text-gray-900">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * Sidebar 页面容器
 */
export interface AppPageProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function AppPage({
  title,
  description,
  actions,
  children,
  className
}: AppPageProps) {
  return (
    <div className={cn('p-6', className)}>
      {/* Page Header */}
      {(title || description || actions) && (
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-2 text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
            
            {actions && (
              <div className="ml-6 flex items-center space-x-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}