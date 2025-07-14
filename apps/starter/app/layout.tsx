import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { LinchKitProvider } from '@/components/providers/linchkit-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { TRPCProvider } from '@/components/providers/trpc-provider'
import './globals.css'

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LinchKitProvider>
            <TRPCProvider>
              {children}
            </TRPCProvider>
          </LinchKitProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}