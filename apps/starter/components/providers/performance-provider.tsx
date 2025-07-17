'use client'

/**
 * 应用性能监控 Provider
 * 集成 @linch-kit/core 的性能监控功能
 */

import { PageLoadingProvider, PerformanceMonitor } from '@linch-kit/core/client'
import type { ReactNode } from 'react'

interface AppPerformanceProviderProps {
  children: ReactNode
  enableDevMonitor?: boolean
}

export function AppPerformanceProvider({ 
  children, 
  enableDevMonitor = true 
}: AppPerformanceProviderProps) {
  return (
    <PageLoadingProvider>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children as any}
      {enableDevMonitor && <PerformanceMonitor />}
    </PageLoadingProvider>
  )
}

// 导出性能监控钩子，便于组件使用
export { usePageLoading } from '@linch-kit/core/client'