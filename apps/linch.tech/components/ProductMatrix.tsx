import React from 'react'
import Link from 'next/link'

const products = [
  {
    name: '@linch-kit/core',
    title: 'Core Framework',
    description: 'Plugin system, task scheduling, workflow engine, and infrastructure foundation.',
    icon: '🚀',
    status: 'Stable',
    downloads: '10K+',
    href: '/products/core'
  },
  {
    name: '@linch-kit/schema',
    title: 'Schema System',
    description: 'Type-safe data modeling with Zod, automatic API generation, and validation.',
    icon: '📋',
    status: 'Latest',
    downloads: '5K+',
    href: '/products/schema'
  },
  {
    name: '@linch-kit/ui',
    title: 'UI Components',
    description: 'Enterprise-grade components built on shadcn/ui with theming and customization.',
    icon: '🎨',
    status: 'Beta',
    downloads: '2K+',
    href: '/products/ui'
  },
  {
    name: 'Enterprise Suite',
    title: 'Enterprise Edition',
    description: 'Complete enterprise application solution with advanced features and support.',
    icon: '🏢',
    status: 'Enterprise',
    downloads: 'Custom',
    href: '/enterprise'
  }
]

export function ProductMatrix() {
  return (
    <div className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Product Ecosystem
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Complete toolkit for modern development
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.name}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="p-8">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{product.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.name}</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {product.description}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{product.downloads} downloads</span>
                  <Link
                    href={product.href}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
