'use client'

import React from 'react'
import Link from 'next/link'

export function QuickStart() {
  const steps = [
    {
      title: '安装 Linch Kit',
      description: '使用 npm 或 yarn 快速安装',
      code: 'npm install @linch-kit/core'
    },
    {
      title: '定义模式',
      description: '创建类型安全的数据模式',
      code: 'const User = defineEntity("User", { name: z.string() })'
    },
    {
      title: '启动应用',
      description: '一键启动完整的应用程序',
      code: 'npm run dev'
    }
  ]
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-9xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            快速开始
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            三步开始使用
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                  <div className="mt-4 rounded-lg bg-gray-900 p-4">
                    <pre className="text-sm text-gray-300">
                      <code>{step.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <div className="rounded-2xl bg-blue-600 px-6 py-16 shadow-xl">
            <h3 className="text-2xl font-bold text-white">
              准备好构建令人惊叹的应用了吗？
            </h3>
            <p className="mt-4 text-lg text-blue-100">
              加入数千名已经在使用 Linch Kit 构建应用的开发者。
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs/getting-started"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50 transition-colors"
              >
                立即开始 →
              </Link>
              <a
                href="https://github.com/laofahai/linch-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-colors"
              >
                查看 GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
