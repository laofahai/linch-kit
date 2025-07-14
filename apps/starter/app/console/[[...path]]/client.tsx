/**
 * Console 扩展路由代理 - Client Component
 * 处理客户端交互和状态管理
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { starterIntegrationManager } from '@linch-kit/console'
import { Logger } from '@linch-kit/core/client'

interface ConsolePageClientProps {
  extensionPath: string
  fullPath: string
}

export function ConsolePageClient({ extensionPath, fullPath }: ConsolePageClientProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState<React.ReactNode>(null)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const loadConsoleExtension = async () => {
      try {
        setIsLoading(true)
        setError(null)

        Logger.debug('Loading console extension for path:', fullPath)

        // 获取集成状态
        const state = starterIntegrationManager.getState()
        
        if (!state.initialized) {
          Logger.debug('Integration manager not initialized, waiting...')
          // 等待初始化完成
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // 获取所有路由
        const routes = starterIntegrationManager.getAllRoutes()
        Logger.debug('Available routes:', routes)

        // 查找匹配的路由
        const matchedRoute = routes.find(route => 
          fullPath.startsWith(route.path) || route.path === '/console'
        )

        if (matchedRoute) {
          Logger.debug('Matched route:', matchedRoute)
          
          // 这里应该动态加载对应的组件
          // 暂时显示开发中状态
          setContent(
            <div className="container mx-auto p-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">
                  Console 扩展
                </h2>
                <p className="text-blue-700 mb-4">
                  路径: {fullPath}
                </p>
                <p className="text-blue-600">
                  Console 扩展正在开发中，集成机制已就绪。
                </p>
                
                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold text-blue-900">集成状态:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ StarterIntegrationManager 已初始化</li>
                    <li>✅ 路由代理机制已建立</li>
                    <li>✅ 扩展加载器已配置</li>
                    <li>🔄 Console 组件集成开发中</li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold text-blue-900">路径信息:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>扩展路径: {extensionPath || '(根路径)'}</li>
                    <li>完整路径: {fullPath}</li>
                    <li>当前路径: {pathname}</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        } else {
          setContent(
            <div className="container mx-auto p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-yellow-800 mb-2">
                  路由未找到
                </h2>
                <p className="text-yellow-700">
                  未找到路径 "{fullPath}" 对应的扩展路由
                </p>
                <div className="mt-4">
                  <p className="text-sm text-yellow-600">
                    可用路由: {routes.map(r => r.path).join(', ') || '无'}
                  </p>
                </div>
              </div>
            </div>
          )
        }

      } catch (error) {
        Logger.error('Failed to load console extension:', error)
        setError(error instanceof Error ? error.message : '加载扩展时发生错误')
      } finally {
        setIsLoading(false)
      }
    }

    loadConsoleExtension()
  }, [pathname, fullPath, extensionPath])

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载扩展中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">加载错误</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return <>{content}</>
}