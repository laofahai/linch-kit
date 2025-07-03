/**
 * Console 布局组件
 * 
 * 提供 Console 模块的基础布局结构，使用简单可靠的自定义 sidebar
 */

'use client'

import React, { ReactNode } from 'react'
import { cn } from '@linch-kit/ui/utils'
import { ModernSidebar, ModernPage } from '../layout/ModernSidebar'

export interface ConsoleLayoutProps {
  /** 页面标题 */
  title?: string
  /** 页面描述 */
  description?: string
  /** 页面操作按钮 */
  actions?: ReactNode
  /** 面包屑导航项 */
  breadcrumbItems?: Array<{
    label: string
    href?: string
  }>
  /** 页面内容 */
  children: ReactNode
  /** 自定义样式类名 */
  className?: string
  /** 是否显示侧边栏 */
  showSidebar?: boolean
}

/**
 * Console 页面布局 - 使用简单可靠的自定义 sidebar
 */
export function ConsoleLayout({
  title,
  description,
  actions,
  breadcrumbItems,
  children,
  className,
  showSidebar = true
}: ConsoleLayoutProps) {
  // 如果不显示侧边栏，直接返回内容
  if (!showSidebar) {
    return (
      <div className={cn('console-layout', className)}>
        {/* 页面头部 */}
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
        
        {/* 页面内容 */}
        <div className="console-content">
          {children}
        </div>
      </div>
    )
  }

  return (
    <ModernSidebar
      title="LinchKit"
      subtitle="Console"
      breadcrumbs={breadcrumbItems}
      className={className}
      user={{
        name: 'Admin User',
        email: 'admin@linchkit.com'
      }}
    >
      <ModernPage
        title={title}
        description={description}
        actions={actions}
      >
        {children}
      </ModernPage>
    </ModernSidebar>
  )
}

/**
 * Console 页面头部
 */
export interface ConsolePageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function ConsolePageHeader({
  title,
  description,
  actions,
  className
}: ConsolePageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
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
  )
}

/**
 * Console 内容区域
 */
export interface ConsoleContentProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function ConsoleContent({
  children,
  className,
  padding = 'md'
}: ConsoleContentProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  return (
    <div className={cn('console-content', paddingClasses[padding], className)}>
      {children}
    </div>
  )
}

/**
 * Console 侧边栏布局
 */
export interface ConsoleSidebarLayoutProps {
  /** 侧边栏内容 */
  sidebar: ReactNode
  /** 主内容 */
  children: ReactNode
  /** 侧边栏宽度 */
  sidebarWidth?: 'sm' | 'md' | 'lg'
  /** 侧边栏位置 */
  sidebarPosition?: 'left' | 'right'
  /** 是否可折叠 */
  collapsible?: boolean
  /** 自定义样式类名 */
  className?: string
}

export function ConsoleSidebarLayout({
  sidebar,
  children,
  sidebarWidth = 'md',
  sidebarPosition = 'left',
  collapsible = false,
  className
}: ConsoleSidebarLayoutProps) {
  const sidebarWidthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96'
  }
  
  return (
    <div className={cn('flex gap-6', className)}>
      {sidebarPosition === 'left' && (
        <aside className={cn(
          'console-sidebar flex-shrink-0',
          sidebarWidthClasses[sidebarWidth]
        )}>
          {sidebar}
        </aside>
      )}
      
      <main className="console-main flex-1 min-w-0">
        {children}
      </main>
      
      {sidebarPosition === 'right' && (
        <aside className={cn(
          'console-sidebar flex-shrink-0',
          sidebarWidthClasses[sidebarWidth]
        )}>
          {sidebar}
        </aside>
      )}
    </div>
  )
}