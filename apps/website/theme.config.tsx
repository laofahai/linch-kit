import React from 'react'
import { useRouter } from 'next/router'

const config = {
  logo: <span className="font-bold">LinchKit</span>,
  project: {
    link: 'https://github.com/laofahai/linch-kit',
  },
  docsRepositoryBase: 'https://github.com/laofahai/linch-kit/tree/main/apps/website',
  footer: {
    text: 'LinchKit © 2025',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="LinchKit" />
      <meta property="og:description" content="AI-First Full-Stack Development Framework" />
    </>
  ),
  primaryHue: 250,
  primarySaturation: 84,
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  toc: {
    backToTop: true,
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
  }
}

export default config