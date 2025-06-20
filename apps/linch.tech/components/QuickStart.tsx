import React from 'react'
import Link from 'next/link'

export function QuickStart() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Quick Start
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Get started in minutes
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Install Framework',
                command: 'npx create-linch-app my-app'
              },
              {
                step: '02',
                title: 'Define Data Models',
                command: 'const User = defineEntity("User", { ... })'
              },
              {
                step: '03',
                title: 'Start Development',
                command: 'npm run dev'
              }
            ].map((step) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <div className="mt-4 rounded-lg bg-gray-900 p-4">
                    <pre className="text-sm text-gray-300">
                      <code>{step.command}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <div className="rounded-2xl bg-blue-600 px-6 py-16 shadow-xl">
            <h3 className="text-2xl font-bold text-white">
              Ready to build something amazing?
            </h3>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of developers who are already building with Linch Kit.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs/getting-started"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Get Started Now →
              </Link>
              <a
                href="https://github.com/laofahai/linch-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
