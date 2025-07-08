'use client'

import { Component, ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 开发环境下输出错误详情
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误界面
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误界面
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">出现错误</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。
            </p>

            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                刷新页面
              </button>

              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                返回上页
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface NotFoundProps {
  title?: string
  message?: string
  backUrl?: string
  backText?: string
}

export const NotFound: React.FC<NotFoundProps> = ({
  title = '页面未找到',
  message = '抱歉，您访问的页面不存在或已被移动。',
  backUrl = '/',
  backText = '返回首页',
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <div className="space-y-4">
          <a
            href={backUrl}
            className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {backText}
          </a>

          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            返回上页
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
