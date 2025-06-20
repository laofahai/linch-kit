'use client'

import React from 'react'

const featureIcons = ['🤖', '📋', '🛡️', '🔧']
const featureColors = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500'
]

const featuresData = [
  {
    title: 'AI 驱动开发',
    description: '智能代码生成和自动化开发流程',
    items: ['智能代码补全', '自动生成 API', '智能错误修复']
  },
  {
    title: '类型安全',
    description: '端到端的 TypeScript 类型安全保障',
    items: ['完整类型推导', '编译时检查', '运行时验证']
  },
  {
    title: '企业级安全',
    description: '内置安全最佳实践和合规性支持',
    items: ['身份认证', '权限控制', '数据加密']
  },
  {
    title: '开发工具',
    description: '丰富的开发工具和调试支持',
    items: ['CLI 工具', '可视化调试', '性能监控']
  }
]

export function Features() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-9xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            核心特性
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            为现代开发而生
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-9xl sm:mt-20 lg:mt-24">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-10">
            {featuresData.map((feature, index) => (
              <div key={feature.title} className="relative group">
                <div className="relative h-full p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-lg hover:ring-gray-300 dark:hover:ring-gray-600 transition-all duration-300">
                  {/* Icon */}
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${featureColors[index]} mb-6`}>
                    <span className="text-2xl">{featureIcons[index]}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Feature list */}
                  <ul className="space-y-2">
                    {feature.items.slice(0, 3).map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="flex items-start text-sm">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></div>
                        <span className="text-gray-600 dark:text-gray-400 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
