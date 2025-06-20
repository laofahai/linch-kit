import React from 'react'

const features = [
  {
    name: 'AI-Powered Development',
    description: 'Intelligent code generation, automated testing, and AI-assisted debugging to accelerate your development workflow.',
    icon: '🤖',
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Schema-Driven Architecture',
    description: 'Define once, generate everywhere. Automatically create APIs, database schemas, forms, and validation from your data models.',
    icon: '📋',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Enterprise-Grade Security',
    description: 'Built-in authentication, authorization, audit logging, and compliance features for enterprise applications.',
    icon: '🛡️',
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'Plugin Ecosystem',
    description: 'Extensible plugin architecture with ready-to-use business modules like WMS, CRM, workflow engines, and more.',
    icon: '🔧',
    color: 'from-orange-500 to-red-500'
  }
]

export function Features() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Core Features
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to build modern applications
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Linch Kit provides a comprehensive set of tools and features designed to accelerate enterprise application development while maintaining code quality and scalability.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${feature.color}`}>
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
