'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Logger } from '@linch-kit/core/client'
import { initializeLinchKit, validateEnvironment, type LinchKitContext } from '@/lib/linchkit'

interface LinchKitContextType {
  context: LinchKitContext | null
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
  reinitialize: () => Promise<void>
}

const LinchKitReactContext = createContext<LinchKitContextType | null>(null)

interface LinchKitProviderProps {
  children: ReactNode
}

export function LinchKitProvider({ children }: LinchKitProviderProps) {
  const [context, setContext] = useState<LinchKitContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      Logger.info('LinchKit Provider 正在初始化...')
      
      // 验证环境配置
      const envValidation = validateEnvironment()
      if (!envValidation.valid) {
        throw new Error(`Environment validation failed: ${envValidation.errors.join(', ')}`)
      }
      
      // 初始化 LinchKit 上下文
      const linchKitContext = await initializeLinchKit()
      
      setContext(linchKitContext)
      setIsInitialized(true)
      Logger.info('LinchKit Provider initialized successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize LinchKit')
      Logger.error('LinchKit Provider initialization failed:', error)
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const reinitialize = async () => {
    Logger.info('Reinitializing LinchKit Provider...')
    await initialize()
  }

  useEffect(() => {
    initialize()
  }, [])

  const value: LinchKitContextType = {
    context,
    isInitialized,
    isLoading,
    error,
    reinitialize,
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-2 text-xl font-bold text-red-600">LinchKit 初始化错误</h2>
          <p className="text-gray-700">{error.message}</p>
          <p className="mt-4 text-sm text-gray-500">请检查环境变量配置是否正确</p>
          <button
            onClick={reinitialize}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            重试初始化
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-600">正在初始化 LinchKit 框架...</p>
        </div>
      </div>
    )
  }

  return (
    <LinchKitReactContext.Provider value={value}>
      {children}
    </LinchKitReactContext.Provider>
  )
}

/**
 * Hook for accessing LinchKit context
 */
export function useLinchKit(): LinchKitContextType {
  const context = useContext(LinchKitReactContext)
  
  if (!context) {
    throw new Error('useLinchKit must be used within a LinchKitProvider')
  }
  
  return context
}

/**
 * Hook for accessing LinchKit configuration
 */
export function useLinchKitConfig<T = unknown>(path: string): T | undefined {
  const { context } = useLinchKit()
  
  if (!context?.config) {
    return undefined
  }

  const keys = path.split('.')
  let value: unknown = context.config

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return value as T
}

/**
 * Hook for checking if a feature is enabled
 */
export function useFeatureFlag(feature: string): boolean {
  const features = useLinchKitConfig<Record<string, boolean>>('features')
  return features?.[feature] ?? false
}
