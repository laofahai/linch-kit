import React from 'react'

export function SocialProof() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Trusted by developers worldwide
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Join thousands of developers
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {[
            { name: 'GitHub Stars', value: '2.5K+', icon: '⭐' },
            { name: 'NPM Downloads', value: '50K+', icon: '📦' },
            { name: 'Contributors', value: '25+', icon: '👥' },
            { name: 'Companies', value: '100+', icon: '🏢' }
          ].map((stat) => (
            <div key={stat.name} className="flex flex-col items-center">
              <dt className="text-base leading-7 text-gray-600 dark:text-gray-300">
                <div className="mb-2 flex justify-center">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                {stat.name}
              </dt>
              <dd className="order-first text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
