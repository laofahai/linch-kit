'use client'

import { PluginSystem, Logger } from '@linch-kit/core'
import { useEffect, useState } from 'react'

export default function Home() {
  const [pluginCount, setPluginCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeLinchKit = async () => {
      try {
        Logger.info('LinchKit Starter 应用启动', { timestamp: new Date().toISOString() })
        
        // 获取已启动的插件数量
        const plugins = PluginSystem.getStartedPlugins()
        setPluginCount(plugins.length)
        setIsInitialized(true)
        
        Logger.info('LinchKit 核心功能初始化完成', { pluginCount: plugins.length })
      } catch (error) {
        Logger.error('LinchKit 初始化失败', 
          error instanceof Error ? error : new Error(String(error))
        )
      }
    }

    initializeLinchKit()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            LinchKit Starter
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            AI-First 全栈开发框架 - 企业级生产应用
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
            <div className={`w-3 h-3 rounded-full mr-2 ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              {isInitialized ? 'LinchKit 核心已初始化' : '正在初始化...'}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              核心功能
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              基于 @linch-kit/core 的基础设施
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>插件系统:</span>
                <span className="font-medium">{pluginCount} 个插件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>日志系统:</span>
                <span className="font-medium text-green-600">已启用</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              技术栈
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              现代化全栈技术组合
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Next.js 15.3.4</li>
              <li>• React 19</li>
              <li>• TypeScript 5</li>
              <li>• Tailwind CSS 4</li>
              <li>• Turbopack</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              LinchKit 包
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              已集成的功能模块
            </p>
            <ul className="space-y-1 text-sm">
              <li>• @linch-kit/core</li>
              <li>• @linch-kit/schema</li>
              <li>• @linch-kit/auth</li>
              <li>• @linch-kit/crud</li>
              <li>• @linch-kit/trpc</li>
              <li>• @linch-kit/ui</li>
              <li>• @linch-kit/console</li>
            </ul>
          </div>
        </div>

        {/* 导航链接 */}
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-12">
          <a
            href="/dashboard"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-primary/20 dark:border-primary/30"
          >
            <h3 className="text-lg font-semibold text-primary dark:text-primary mb-2">
              📊 业务 Dashboard
            </h3>
            <p className="text-primary/80 dark:text-primary/80 text-sm">
              查看用户数据、文章内容等业务指标
            </p>
          </a>
          
          <a
            href="/admin"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-primary/20 dark:border-primary/30"
          >
            <h3 className="text-lg font-semibold text-primary dark:text-primary mb-2">
              ⚙️ 管理控制台
            </h3>
            <p className="text-primary/80 dark:text-primary/80 text-sm">
              企业级管理功能，基于 Console 模块
            </p>
          </a>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 dark:text-gray-400">
            LinchKit Framework - 让 AI 驱动的全栈开发变得简单
          </p>
        </div>
      </div>
    </div>
  )
}