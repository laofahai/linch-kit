'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardLayoutShell, type DashboardLayoutShellProps } from '@linch-kit/ui/client'

/**
 * 智能 Dashboard 布局组件（Next.js 适配）
 * 
 * 这个组件组合了来自 @linch-kit/ui 的 DashboardLayoutShell，
 * 并为其注入 Next.js 特定的功能（如路由、导航等）
 */
export interface DashboardLayoutProps extends Omit<DashboardLayoutShellProps, 'LinkComponent'> {
  /** 自定义路由处理 */
  onNavigate?: (href: string) => void
}

export function DashboardLayout(props: DashboardLayoutProps) {
  const pathname = usePathname()
  
  // Next.js Link 组件包装，支持 active 状态等
  const NextLinkComponent = ({ href, children, className = '' }: { 
    href: string; 
    children: React.ReactNode; 
    className?: string 
  }) => {
    const isActive = pathname === href
    const finalClassName = `${className} ${isActive ? 'bg-accent text-accent-foreground' : ''}`
    
    return (
      <Link href={href} className={finalClassName}>
        {children}
      </Link>
    )
  }

  return (
    <DashboardLayoutShell
      {...props}
      LinkComponent={NextLinkComponent}
    />
  )
}

// 向后兼容的导出
export { DashboardLayoutShell } from '@linch-kit/ui/client'
export type { DashboardLayoutShellProps, DashboardUser, NavigationItem } from '@linch-kit/ui/client'