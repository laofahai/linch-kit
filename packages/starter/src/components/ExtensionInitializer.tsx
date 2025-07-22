'use client'

import { useEffect, useState } from 'react'
import { useStarterContext } from './StarterProvider'
import type { ExtensionIntegration } from '../types'

export interface ExtensionInitializerProps {
  /** 扩展加载完成回调 */
  onExtensionsLoaded?: (extensions: ExtensionIntegration[]) => void
  /** 扩展加载错误回调 */
  onError?: (error: Error) => void
}

/**
 * Extension Initializer Component
 * 负责初始化和加载Starter应用的扩展
 */
export function ExtensionInitializer({
  onExtensionsLoaded,
  onError
}: ExtensionInitializerProps) {
  const { config } = useStarterContext()
  const [isLoading, setIsLoading] = useState(true)
  const [extensions, setExtensions] = useState<ExtensionIntegration[]>([])

  useEffect(() => {
    const initializeExtensions = async () => {
      try {
        setIsLoading(true)
        
        // 从配置中创建扩展集成对象
        const extensionIntegrations: ExtensionIntegration[] = config.extensions.map(name => ({
          name,
          version: '1.0.0',
          enabled: true,
          config: {},
        }))

        setExtensions(extensionIntegrations)
        onExtensionsLoaded?.(extensionIntegrations)
      } catch (error) {
        const extensionError = error instanceof Error ? error : new Error('Unknown error')
        onError?.(extensionError)
      } finally {
        setIsLoading(false)
      }
    }

    void initializeExtensions()
  }, [config.extensions, onExtensionsLoaded, onError])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        <span className="ml-2">Loading extensions...</span>
      </div>
    )
  }

  return null
}