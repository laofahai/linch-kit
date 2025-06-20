import React from 'react'
import Link from 'next/link'

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-300 dark:ring-white/10 dark:hover:ring-white/20">
              🎉 Announcing Linch Kit v1.0{' '}
              <Link href="/docs/getting-started" className="font-semibold text-blue-600 dark:text-blue-400">
                <span className="absolute inset-0" aria-hidden="true" />
                Get started <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            <span className="block">AI-First</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Full-Stack Framework
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Build enterprise applications with unprecedented speed using our Schema-driven development, 
            plugin architecture, auto code generation, and enterprise-grade capabilities.
          </p>

          {/* Feature tags */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['🤖 AI-Powered', '⚡ 10x Faster', '🛡️ Enterprise-Ready', '🔧 Plugin-Based'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/docs/getting-started"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Get started →
            </Link>
            <a
              href="https://github.com/laofahai/linch-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              View on GitHub
            </a>
            <Link
              href="/playground"
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Live Demo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Code preview */}
        <div className="mt-16 flow-root sm:mt-24">
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
  )
}
