'use client'

import { ErrorBoundary } from '@linch-kit/ui/client'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
