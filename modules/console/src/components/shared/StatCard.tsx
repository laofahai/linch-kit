/**
 * 统计卡片组件
 * 
 * 用于显示各种统计数据的卡片组件
 */

'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@linch-kit/ui'
import { cn } from '@linch-kit/ui/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface StatCardProps {
  /** 标题 */
  title: string
  /** 主要数值 */
  value: string | number
  /** 描述 */
  description?: string
  /** 图标 */
  icon?: ReactNode
  /** 变化趋势 */
  trend?: {
    /** 变化值 */
    value: number
    /** 变化类型 */
    type: 'increase' | 'decrease' | 'neutral'
    /** 变化描述 */
    label?: string
  }
  /** 颜色主题 */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  /** 是否加载中 */
  loading?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 点击事件 */
  onClick?: () => void
}

/**
 * 统计卡片
 */
export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  loading = false,
  className,
  onClick
}: StatCardProps) {
  const variantClasses = {
    default: 'border-gray-200',
    primary: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50'
  }
  
  const iconColors = {
    default: 'text-gray-600',
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  }
  
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.type) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'neutral':
        return <Minus className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }
  
  const getTrendColor = () => {
    if (!trend) return ''
    
    switch (trend.type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
      default:
        return ''
    }
  }
  
  if (loading) {
    return (
      <Card className={cn('stat-card', variantClasses[variant], className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card 
      className={cn(
        'stat-card transition-all duration-200',
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* 趋势和描述 */}
            <div className="flex items-center space-x-2">
              {trend && (
                <div className={cn('flex items-center space-x-1', getTrendColor())}>
                  {getTrendIcon()}
                  <span className="text-sm font-medium">
                    {trend.value > 0 && trend.type !== 'neutral' && '+'}
                    {trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-sm text-gray-600">
                      {trend.label}
                    </span>
                  )}
                </div>
              )}
              
              {description && !trend && (
                <p className="text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {icon && (
            <div className={cn('flex-shrink-0 ml-4', iconColors[variant])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 统计卡片网格
 */
export interface StatGridProps {
  /** 统计项列表 */
  stats: StatCardProps[]
  /** 列数 */
  columns?: 1 | 2 | 3 | 4
  /** 间距 */
  gap?: 'sm' | 'md' | 'lg'
  /** 自定义样式类名 */
  className?: string
}

export function StatGrid({
  stats,
  columns = 3,
  gap = 'md',
  className
}: StatGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }
  
  return (
    <div className={cn(
      'stat-grid grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          {...stat}
        />
      ))}
    </div>
  )
}

/**
 * 迷你统计卡片
 */
export interface MiniStatCardProps {
  /** 标题 */
  title: string
  /** 数值 */
  value: string | number
  /** 图标 */
  icon?: ReactNode
  /** 颜色 */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  /** 自定义样式类名 */
  className?: string
}

export function MiniStatCard({
  title,
  value,
  icon,
  color = 'blue',
  className
}: MiniStatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white',
    gray: 'bg-gray-500 text-white'
  }
  
  return (
    <div className={cn(
      'mini-stat-card rounded-lg p-4 flex items-center space-x-3',
      colorClasses[color],
      className
    )}>
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium opacity-90 truncate">
          {title}
        </p>
        <p className="text-xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  )
}