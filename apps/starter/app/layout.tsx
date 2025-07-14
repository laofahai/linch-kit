import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { createLinchKitProvider, defaultLinchKitConfig } from '@linch-kit/ui'

import type { AppRouter } from '@/lib/trpc'
import './globals.css'

// 创建带有 tRPC 支持的 LinchKit Provider
const { LinchKitUnifiedProvider } = createLinchKitProvider<AppRouter>()

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinchKit Starter - AI-First 开发基座',
  description: '基于 LinchKit 框架的现代化全栈开发基座',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <LinchKitUnifiedProvider
          config={defaultLinchKitConfig}
          AppRouter={undefined} // 类型已在创建时指定
        >
          {children}
        </LinchKitUnifiedProvider>
      </body>
    </html>
  )
}