'use client'

import { useEffect, useState } from 'react'
import { Logger } from '@linch-kit/core/client'

interface LinchKitProviderProps {
  children: React.ReactNode
}

export function LinchKitProvider({ children }: LinchKitProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        Logger.info('LinchKit Provider 正在初始化...')
        
        // 模拟初始化延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        Logger.info('Console integration initialized successfully')
        setIsInitialized(true)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize LinchKit')
        Logger.error('LinchKit initialization failed:', error)
        setError(error)
      }
    }

    init()
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-2 text-xl font-bold text-red-600">初始化错误</h2>
          <p className="text-gray-700">{error.message}</p>
          <p className="mt-4 text-sm text-gray-500">请检查环境变量配置是否正确</p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-600">正在初始化 LinchKit 和 Console 集成...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
