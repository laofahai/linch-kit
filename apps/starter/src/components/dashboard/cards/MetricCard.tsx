import { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: LucideIcon
  color: string
  bgColor: string
}

export function MetricCard({ title, value, change, icon: Icon, color, bgColor }: MetricCardProps) {
  const isPositive = change >= 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <div className="mt-2 flex items-center">
            <span
              className={cn(
                'text-sm font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
          </div>
        </div>
        <div className={cn('p-3 rounded-lg', bgColor)}>
          <Icon className={cn('w-6 h-6', color)} />
        </div>
      </div>
    </div>
  )
}