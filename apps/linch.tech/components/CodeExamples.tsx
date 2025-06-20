'use client'

import React from 'react'

export function CodeExamples() {
  return (
    <div className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-900/50">
      <div className="mx-auto max-w-9xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            代码示例
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            简洁而强大
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl bg-gray-900 p-6 shadow-2xl">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// 定义你的模式
const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string(),
  role: z.enum(['admin', 'user'])
})

// 自动生成 API、表单和数据库
export default defineApp({
  entities: [User, Product, Order],
  plugins: ['@linch-kit/plugin-auth']
})`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
