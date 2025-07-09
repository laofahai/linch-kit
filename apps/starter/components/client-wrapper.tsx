'use client'

import { ErrorBoundary } from '@linch-kit/ui/client'
import { PageLoadingProvider, PerformanceMonitor, MonitoringProvider } from '@linch-kit/core'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <PageLoadingProvider>
        {children}
        <PerformanceMonitor />
        <MonitoringProvider />
      </PageLoadingProvider>
    </ErrorBoundary>
  )
}
