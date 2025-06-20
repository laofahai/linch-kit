'use client'

import React from 'react'
import Link from 'next/link'

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
      {/* Grid background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      <div className="relative mx-auto max-w-9xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:items-center">
          {/* Left content */}
          <div className="lg:row-start-1 lg:max-w-lg">
            <div className="text-center lg:text-left">

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            <span className="block">构建企业级应用</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
              AI优先全栈框架
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            使用我们的 AI 优先全栈框架，以前所未有的速度构建现代化、可扩展的企业级应用程序。
          </p>

          {/* Feature tags */}
          <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2">
            {['类型安全', 'AI 驱动', '自动生成', '企业级'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
            <Link
              href="/docs/getting-started"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              立即开始
            </Link>
            <a
              href="https://github.com/laofahai/linch-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              查看 GitHub
            </a>
            <Link
              href="/playground"
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              在线演示 <span aria-hidden="true">→</span>
            </Link>
          </div>
            </div>
          </div>

          {/* Right content - Code preview */}
          <div className="lg:row-start-1 lg:row-span-1">
            <div className="relative">
              <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-white/5 dark:ring-white/10">
                <div className="rounded-md bg-gray-900 p-6 shadow-2xl ring-1 ring-gray-900/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-gray-400 ml-2">schema.ts</span>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{`const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string(),
  role: z.enum(['admin', 'user']),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// Auto-generated API routes, forms, and database schema
export default defineApp({
  entities: [User, Product, Order],
  plugins: ['@linch-kit/plugin-auth', '@linch-kit/plugin-wms'],
  ui: { theme: 'modern', components: 'shadcn' }
})`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
