'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
// 客户端轻量级日志实现，避免导入服务端代码
const clientLogger = {
  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && console?.error) {
      console.error(message, error, context)
    }
  },
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error | null
  errorInfo?: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到客户端日志
    clientLogger.error('React Error Boundary 捕获错误', error, {
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  override render() {
    if (this.state.hasError) {
      // 如果有自定义的 fallback，使用自定义的
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo)
      }

      // 默认错误页面
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">应用出现错误</h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                应用运行时出现了一个错误，我们已经记录了这个问题。请刷新页面重试。
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 函数式组件的错误边界 Hook
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode
) {
  return function WithErrorBoundaryComponent(props: T) {
    return (
      <ErrorBoundary {...(fallback && { fallback })}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
