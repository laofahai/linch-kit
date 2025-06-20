import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { TRPCProvider } from '@/lib/trpc-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Navigation } from '@/components/layout/navigation'

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
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            </div>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
