import type { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google"
import './globals.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: 'LinchKit - AI-First Full-Stack Development Framework',
  description: 'Enterprise-ready development framework with Schema-driven architecture and end-to-end type safety, designed for AI era.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}