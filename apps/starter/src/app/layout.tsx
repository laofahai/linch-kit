import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinchKit Starter',
  description: 'AI-First 全栈开发框架 - 生产级应用',
  keywords: ['LinchKit', 'AI-First', 'Full-Stack', 'TypeScript', 'Next.js'],
  authors: [{ name: 'LinchKit Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'LinchKit Starter',
    description: 'AI-First 全栈开发框架',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'LinchKit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinchKit Starter',
    description: 'AI-First 全栈开发框架',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}