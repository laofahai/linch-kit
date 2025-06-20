import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'

import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: 'Linch Kit - AI 优先全栈框架',
  description: '使用我们的 AI 优先全栈框架，结合 TypeScript、模式驱动开发和插件架构，以前所未有的速度构建企业级应用程序。',
  keywords: 'AI 框架, TypeScript, 全栈, 企业级, 模式驱动, 插件架构',
  authors: [{ name: 'Linch Tech' }],
  openGraph: {
    title: 'Linch Kit - AI 优先全栈框架',
    description: '使用我们的 AI 优先全栈框架，以前所未有的速度构建企业级应用程序。',
    url: 'https://linch.tech',
    siteName: 'Linch Kit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Linch Kit - AI 优先全栈框架',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linch Kit - AI 优先全栈框架',
    description: '使用我们的 AI 优先全栈框架，以前所未有的速度构建企业级应用程序。',
    images: ['/twitter-image.png'],
  },
}

// Banner removed as requested

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
  />
)

const footer = (
  <Footer>
    <div className="mx-auto max-w-9xl px-6 py-12 lg:px-8">
      <div className="xl:grid xl:grid-cols-3 xl:gap-8">
        {/* Logo and description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Linch Kit</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            AI 优先的全栈框架，以前所未有的速度和效率构建企业级应用程序。
          </p>
          <div className="flex space-x-4">
            <a href="https://github.com/laofahai/linch-kit" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://twitter.com/linchkit" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>

          </div>
        </div>

        {/* Navigation links */}
        <div className="mt-12 grid grid-cols-1 gap-8 xl:col-span-2 xl:mt-0 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">产品</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="/docs" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">文档</a></li>
              <li><a href="/docs/getting-started" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">快速开始</a></li>
              <li><a href="/docs/api" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">API 参考</a></li>
              <li><a href="/docs/examples" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">示例</a></li>
            </ul>
          </div>
          <div className="mt-12 md:mt-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">社区</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="https://github.com/laofahai/linch-kit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">GitHub</a></li>
              <li><a href="/docs/core-concepts" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">核心概念</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Linch Kit. 保留所有权利。
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <a href="https://github.com/laofahai/linch-kit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">GitHub</a>
          </div>
        </div>
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
      lang="zh-CN"
      dir="ltr"
      suppressHydrationWarning
    >
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/laofahai/linch-kit/tree/main/apps/linch.tech"
          footer={footer}
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
          }}
          toc={{
            backToTop: true,
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
