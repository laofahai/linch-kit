import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { WebVitals } from '../components/performance/WebVitals'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'LinchKit - AI-First Full-Stack Development Framework',
  description:
    'Enterprise-ready development framework with Schema-driven architecture and end-to-end type safety, designed for AI era.',
  keywords: ['LinchKit', 'AI-First', 'Full-Stack', 'TypeScript', 'Framework', 'Enterprise'],
  authors: [{ name: 'LinchKit Team' }],
  creator: 'LinchKit Team',
  publisher: 'LinchKit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://linchkit.dev'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      zh: '/zh',
    },
  },
  openGraph: {
    title: 'LinchKit - AI-First Full-Stack Development Framework',
    description:
      'Enterprise-ready development framework with Schema-driven architecture and end-to-end type safety, designed for AI era.',
    url: 'https://linchkit.dev',
    siteName: 'LinchKit',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LinchKit - AI-First Full-Stack Development Framework',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinchKit - AI-First Full-Stack Development Framework',
    description: 'Enterprise-ready development framework designed for AI era.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebVitals debug={process.env.NODE_ENV === 'development'} />
        {children}
      </body>
    </html>
  )
}
