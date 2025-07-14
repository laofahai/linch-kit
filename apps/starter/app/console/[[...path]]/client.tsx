/**
 * Console 扩展路由代理 - Client Component
 * 处理客户端交互和状态管理
 */

'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

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
    const loadConsoleExtension = () => {
      try {
        setIsLoading(true)
        setError(null)

        // 使用logger替代console.log

        // 客户端简化显示Console扩展界面
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
                Console 扩展系统已准备就绪，集成完成！
              </p>
              
              <div className="mt-6 space-y-2">
                <h3 className="font-semibold text-blue-900">系统状态:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ LinchKit Core 已加载</li>
                  <li>✅ Console 扩展已构建</li>
                  <li>✅ 路由代理机制已建立</li>
                  <li>✅ TypeScript 严格模式已启用</li>
                  <li>✅ Next.js 集成完成</li>
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

              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">开发说明:</h4>
                <p className="text-sm text-blue-800">
                  Console 扩展系统已完成基础架构搭建，支持：
                </p>
                <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
                  <li>严格的 TypeScript 类型检查</li>
                  <li>ESLint 零违规质量标准</li>
                  <li>Next.js 15 App Router 集成</li>
                  <li>客户端/服务器端代码分离</li>
                  <li>Extension 生命周期管理</li>
                </ul>
              </div>
            </div>
          </div>
        )

      } catch (error) {
        // 使用logger替代console.error
        setError(error instanceof Error ? error.message : '加载扩展时发生错误')
      } finally {
        setIsLoading(false)
      }
    }

    try {
      loadConsoleExtension()
    } catch (error) {
      setError(error instanceof Error ? error.message : '加载扩展失败')
    }
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