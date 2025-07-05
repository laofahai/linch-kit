import React from 'react'
import { useRouter } from 'next/router'

// Logo 组件
const LinchKitLogo = () => (
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">L</span>
    </div>
    <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      LinchKit
    </span>
  </div>
)

// 页脚组件
const FooterContent = () => (
  <div className="w-full">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
      <div className="md:col-span-2">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">L</span>
          </div>
          <span className="font-bold text-lg">LinchKit</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          企业级 AI-First 全栈开发框架，让构建现代应用变得简单、快速、可靠。
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          © 2025 LinchKit. All rights reserved.
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3 text-sm">产品</h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li><a href="/#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">特性</a></li>
          <li><a href="/docs" className="hover:text-gray-900 dark:hover:text-white transition-colors">文档</a></li>
          <li><a href="/docs/guides" className="hover:text-gray-900 dark:hover:text-white transition-colors">指南</a></li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3 text-sm">资源</h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li><a href="/docs/api" className="hover:text-gray-900 dark:hover:text-white transition-colors">API 文档</a></li>
          <li><a href="https://github.com/laofahai/linch-kit" className="hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a></li>
          <li><a href="/docs/contributing" className="hover:text-gray-900 dark:hover:text-white transition-colors">贡献</a></li>
        </ul>
      </div>
    </div>
  </div>
)

// 增强的 Head 组件
const HeadContent = () => {
  const { asPath } = useRouter()
  
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Enterprise-ready AI-First full-stack development framework with Schema-driven architecture and end-to-end type safety." />
      <meta name="keywords" content="LinchKit, AI-First, Full-Stack, Next.js, Framework, TypeScript, Schema-driven, Enterprise" />
      <meta name="author" content="LinchKit Team" />
      
      {/* Open Graph */}
      <meta property="og:title" content="LinchKit - AI-First Full-Stack Development Framework" />
      <meta property="og:description" content="Enterprise-ready development framework with Schema-driven architecture and end-to-end type safety, designed for AI era." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://linchkit.dev${asPath}`} />
      <meta property="og:image" content="/og-image.jpg" />
      <meta property="og:siteName" content="LinchKit" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="LinchKit - AI-First Full-Stack Development Framework" />
      <meta name="twitter:description" content="Enterprise-ready development framework designed for AI era." />
      <meta name="twitter:image" content="/og-image.jpg" />
      
      {/* 网站图标 */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* 主题颜色 */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
    </>
  )
}

const config = {
  logo: <LinchKitLogo />,
  project: {
    link: 'https://github.com/laofahai/linch-kit',
  },
  docsRepositoryBase: 'https://github.com/laofahai/linch-kit/tree/main/apps/website',
  footer: {
    component: <FooterContent />
  },
  head: <HeadContent />,
  primaryHue: 250,
  primarySaturation: 84,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
    titleComponent: ({ title, type }: { title: string; type: string }) => (
      <span className={type === 'separator' ? 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide' : ''}>{title}</span>
    )
  },
  toc: {
    backToTop: true,
    extraContent: () => (
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="font-medium mb-2">找到了问题？</div>
          <a 
            href="https://github.com/laofahai/linch-kit/issues"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            在 GitHub 上报告 →
          </a>
        </div>
      </div>
    )
  },
  editLink: {
    text: {
      en: 'Edit this page on GitHub →',
      zh: '在 GitHub 上编辑此页 →'
    }
  },
  feedback: {
    content: {
      en: 'Question? Give us feedback →',
      zh: '有问题？给我们反馈 →'
    },
    labels: 'feedback'
  },
  search: {
    placeholder: {
      en: 'Search documentation...',
      zh: '搜索文档...'
    }
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system'
  },
  i18n: [
    { locale: 'en', text: 'English' },
    { locale: 'zh', text: '中文' }
  ],
  gitTimestamp: {
    en: 'Last updated on',
    zh: '最后更新于'
  },
  navigation: {
    prev: true,
    next: true
  },
  themeSwitch: {
    useOptions() {
      return {
        light: '浅色',
        dark: '深色',
        system: '系统'
      }
    }
  },
  banner: {
    dismissible: true,
    key: 'linchkit-v1-release',
    text: (
      <div className="flex items-center justify-center space-x-2">
        <span>🎉</span>
        <span>LinchKit v1.0 已发布！</span>
        <a
          href="/docs/getting-started"
          className="font-medium underline decoration-blue-400 decoration-2 underline-offset-2 hover:decoration-blue-500"
        >
          立即开始使用 →
        </a>
      </div>
    )
  },
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s | LinchKit'
      }
    }
    return {
      title: 'LinchKit - AI-First Full-Stack Development Framework'
    }
  }
}

export default config