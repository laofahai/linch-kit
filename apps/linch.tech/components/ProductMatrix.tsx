'use client'

import React from 'react'
import Link from 'next/link'
import { Package, Database, Palette, Shield, Zap, Code, Layers, Globe } from 'lucide-react'

export function ProductMatrix() {

  const packages = [
    {
      category: '核心框架',
      icon: Package,
      items: [
        {
          name: '@linch-kit/core',
          title: '核心框架',
          description: 'CLI 工具、配置管理和实用程序',
          status: 'stable',
          icon: Code,
          downloads: '10K+',
          href: '/docs/getting-started'
        },
        {
          name: '@linch-kit/schema',
          title: '模式系统',
          description: '模式定义、验证和类型生成',
          status: 'stable',
          icon: Layers,
          downloads: '8K+',
          href: '/docs/core-concepts'
        }
      ]
    },
    {
      category: '数据层',
      icon: Database,
      items: [
        {
          name: '@linch-kit/crud',
          title: 'CRUD 操作',
          description: '类型安全的 CRUD 操作和自动验证',
          status: 'stable',
          icon: Database,
          downloads: '6K+',
          href: '/docs/api'
        },
        {
          name: '@linch-kit/trpc',
          title: 'tRPC 集成',
          description: 'tRPC 集成和模式驱动的 API 生成',
          status: 'stable',
          icon: Globe,
          downloads: '4K+',
          href: '/docs/api'
        }
      ]
    },
    {
      category: 'UI 和认证',
      icon: Palette,
      items: [
        {
          name: '@linch-kit/ui',
          title: 'UI 组件',
          description: '基于 Tailwind CSS 的现代 React 组件',
          status: 'stable',
          icon: Palette,
          downloads: '5K+',
          href: '/docs/examples'
        },
        {
          name: '@linch-kit/auth-core',
          title: '身份认证',
          description: '支持多租户的身份认证系统',
          status: 'beta',
          icon: Shield,
          downloads: '2K+',
          href: '/docs/examples'
        }
      ]
    }
  ]

  const statusColors = {
    stable: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    beta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    alpha: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const statusLabels = {
    stable: '稳定版',
    beta: '测试版',
    alpha: '预览版'
  }


  return (
    <div className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-9xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            完整生态系统
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            模块化包，无缝协作
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 xl:gap-10">
          {packages.map((category) => {
            const CategoryIcon = category.icon
            return (
              <div key={category.category} className="flex flex-col">
                <div className="flex items-center mb-6">
                  <CategoryIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.category}
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <ItemIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
                            <div>
                              <h4 className="font-mono text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.title}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status as keyof typeof statusColors]}`}>
                            {statusLabels[item.status as keyof typeof statusLabels]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Zap className="w-3 h-3 mr-1" />
                            <span>AI 优化</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.downloads} 下载量
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部说明 */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              所有包都为 AI 优先开发设计，提供完整的 TypeScript 支持
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
