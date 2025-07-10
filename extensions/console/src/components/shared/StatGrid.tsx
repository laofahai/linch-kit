/**
 * 统计卡片网格组件
 *
 * 用于展示多个统计卡片的网格布局
 */

import React from 'react'
import { cn } from '@linch-kit/ui/shared'

/**
 * 统计网格属性
 */
export interface StatGridProps {
  /** 子组件 */
  children: React.ReactNode
  /** 自定义样式类名 */
  className?: string
  /** 列数配置 */
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

/**
 * 统计卡片网格组件
 */
export function StatGrid({
  children,
  className,
  columns = { sm: 1, md: 2, lg: 4, xl: 4 },
}: StatGridProps) {
  const gridClasses = cn(
    'grid gap-4',
    {
      'sm:grid-cols-1': columns.sm === 1,
      'sm:grid-cols-2': columns.sm === 2,
      'sm:grid-cols-3': columns.sm === 3,
      'sm:grid-cols-4': columns.sm === 4,
      'md:grid-cols-1': columns.md === 1,
      'md:grid-cols-2': columns.md === 2,
      'md:grid-cols-3': columns.md === 3,
      'md:grid-cols-4': columns.md === 4,
      'lg:grid-cols-1': columns.lg === 1,
      'lg:grid-cols-2': columns.lg === 2,
      'lg:grid-cols-3': columns.lg === 3,
      'lg:grid-cols-4': columns.lg === 4,
      'xl:grid-cols-1': columns.xl === 1,
      'xl:grid-cols-2': columns.xl === 2,
      'xl:grid-cols-3': columns.xl === 3,
      'xl:grid-cols-4': columns.xl === 4,
    },
    className
  )

  return <div className={gridClasses}>{children}</div>
}

export default StatGrid
