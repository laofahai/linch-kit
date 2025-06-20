import React from 'react'

export function TechStack() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-9xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Technology Stack
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Built with modern technologies
          </p>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { name: 'Next.js 15', icon: '⚡' },
            { name: 'TypeScript', icon: '🔷' },
            { name: 'Prisma ORM', icon: '🔺' },
            { name: 'Tailwind CSS', icon: '🎨' }
          ].map((tech) => (
            <div key={tech.name} className="flex flex-col items-center text-center">
              <div className="text-4xl mb-2">{tech.icon}</div>
              <span className="font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
