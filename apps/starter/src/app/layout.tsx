import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { Providers } from '@/components/providers/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinchKit Starter',
  description: 'AI-First 全栈开发框架 - 企业级生产应用',
  keywords: ['LinchKit', 'AI-First', 'Full-Stack', 'TypeScript', 'Next.js', 'Enterprise'],
  authors: [{ name: 'LinchKit Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'LinchKit Starter',
    description: 'AI-First 全栈开发框架 - 企业级生产应用',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'LinchKit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinchKit Starter',
    description: 'AI-First 全栈开发框架 - 企业级生产应用',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()
  
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}