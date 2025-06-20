'use client'

import React from 'react'
import { Star, Users, GitFork, Heart, Zap, Globe } from 'lucide-react'

export function SocialProof() {

  // 移除虚假统计数据，保留真实的社区特性

  const features = [
    {
      icon: Zap,
      title: '高效开发',
      description: 'AI 驱动工具提升开发效率'
    },
    {
      icon: Globe,
      title: '开源社区',
      description: '欢迎全球开发者参与贡献'
    },
    {
      icon: Heart,
      title: '开发者友好',
      description: '专注于开发者体验'
    },
    {
      icon: GitFork,
      title: '开源免费',
      description: 'MIT 许可证，商业使用免费'
    }
  ]

  return (
    <div className="bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div className="mx-auto max-w-9xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:max-w-none">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              开源社区驱动
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
              与开发者社区一起构建更好的开发体验
            </p>
          </div>

          {/* 移除虚假统计数据部分 */}

          {/* 特性亮点 */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-10">
              {features.map((feature) => {
                const IconComponent = feature.icon
                return (
                  <div key={feature.title} className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 社区链接 */}
          <div className="mt-16 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/laofahai/linch-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Star className="w-4 h-4 mr-2" />
                在 GitHub 上点赞
              </a>
              <a
                href="/docs/getting-started"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                立即开始
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
