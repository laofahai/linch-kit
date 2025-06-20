import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { TRPCProvider } from '@/lib/trpc-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Linch Starter - AI-First Development',
  description: 'A starter application built with Linch Kit framework',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      🚀 Linch Starter
                    </h1>
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      AI-First
                    </span>
                  </div>
                  <nav className="flex space-x-4">
                    <a href="/" className="text-gray-600 hover:text-gray-900">
                      Home
                    </a>
                    <a href="/users" className="text-gray-600 hover:text-gray-900">
                      Users
                    </a>
                    <a href="/products" className="text-gray-600 hover:text-gray-900">
                      Products
                    </a>
                    <a href="/auth/login" className="text-blue-600 hover:text-blue-900 font-medium">
                      Sign In
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </TRPCProvider>
      </body>
    </html>
  )
}
