import React from 'react'

export function CodeExamples() {
  return (
    <div className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Code Examples
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            See how simple it is
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-2xl bg-gray-900 p-6 shadow-2xl">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// Define your schema
const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string(),
  role: z.enum(['admin', 'user'])
})

// Auto-generated API, forms, and database
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
