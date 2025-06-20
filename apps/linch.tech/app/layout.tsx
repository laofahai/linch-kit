import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: 'Linch Kit - AI-First Full-Stack Framework',
  description: 'Build enterprise applications with unprecedented speed using our AI-first full-stack framework with TypeScript, Schema-driven development, and plugin architecture.',
  keywords: 'AI framework, TypeScript, full-stack, enterprise, schema-driven, plugin architecture',
  authors: [{ name: 'Linch Tech' }],
  openGraph: {
    title: 'Linch Kit - AI-First Full-Stack Framework',
    description: 'Build enterprise applications with unprecedented speed using our AI-first full-stack framework.',
    url: 'https://linch.tech',
    siteName: 'Linch Kit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Linch Kit - AI-First Full-Stack Framework',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linch Kit - AI-First Full-Stack Framework',
    description: 'Build enterprise applications with unprecedented speed using our AI-first full-stack framework.',
    images: ['/twitter-image.png'],
  },
}

const banner = (
  <Banner storageKey="linch-kit-v1">
    🎉 <span>Linch Kit v1.0 is now available!</span>{' '}
    <a href="/docs/getting-started" className="underline">
      Get started →
    </a>
  </Banner>
)

const navbar = (
  <Navbar
    logo={
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <span className="font-bold text-lg tracking-tight">Linch Kit</span>
      </div>
    }
    project={{
      link: 'https://github.com/laofahai/linch-kit',
    }}
    chat={{
      link: 'https://discord.gg/linch-kit',
    }}
  />
)

const footer = (
  <Footer>
    <div className="flex w-full flex-col items-center sm:items-start">
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Linch Tech. All rights reserved.
        </p>
      </div>
      <div className="flex gap-4 text-xs">
        <a href="https://github.com/laofahai/linch-kit" className="text-gray-500 hover:text-gray-700">
          GitHub
        </a>
        <a href="/docs" className="text-gray-500 hover:text-gray-700">
          Documentation
        </a>
        <a href="/community" className="text-gray-500 hover:text-gray-700">
          Community
        </a>
      </div>
    </div>
  </Footer>
)

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
    >
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/laofahai/linch-kit/tree/main/apps/linch.tech"
          footer={footer}
          primaryHue={220}
          primarySaturation={100}
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
          }}
          toc={{
            backToTop: true,
          }}
          editLink={{
            text: 'Edit this page on GitHub →',
          }}
          feedback={{
            content: 'Question? Give us feedback →',
            labels: 'feedback',
          }}
          search={{
            placeholder: 'Search documentation...',
          }}
          darkMode
          nextThemes={{
            defaultTheme: 'system',
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
