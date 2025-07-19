import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { ExtensionsInitializer } from '@/components/extensions-initializer'
import { AppPerformanceProvider } from '@/components/providers/performance-provider'
import { TRPCLinchKitProvider } from '@/components/providers/trpc-linchkit-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinchKit Starter - AI-First 开发基座',
  description: '基于 LinchKit 框架的现代化全栈开发基座',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <AppPerformanceProvider enableDevMonitor={process.env.NODE_ENV === 'development'}>
          <TRPCLinchKitProvider>
            <ExtensionsInitializer />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {children as any}
          </TRPCLinchKitProvider>
        </AppPerformanceProvider>
      </body>
    </html>
  )
}
