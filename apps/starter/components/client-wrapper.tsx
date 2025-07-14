'use client'

import { ErrorBoundary } from '@linch-kit/ui/client'
import { ErrorHandler } from '@/lib/errors'

interface ClientWrapperProps {
  children: React.ReactNode
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <ErrorBoundary
      fallback={(errorProps) => {
        // 使用 LinchKit 错误处理系统记录错误
        const error = (errorProps as unknown as { error?: Error }).error || new Error('Unknown error')
        ErrorHandler.logError(error, {
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        })

        return (
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-2 text-xl font-bold text-red-600">应用错误</h2>
              <p className="text-gray-700 mb-4">
                {ErrorHandler.getUserMessage(error)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        )
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
