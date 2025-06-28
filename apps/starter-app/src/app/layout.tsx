import type { Metadata } from 'next'

import { Layout } from '@/components/layout/Layout'
import './globals.css'

export const metadata: Metadata = {
  title: 'LinchKit Starter App',
  description: 'Schema驱动的全栈开发演示应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  )
}