import Link from 'next/link'

import { HomeHero } from '@/components/home/HomeHero'
import { FeatureSection } from '@/components/home/FeatureSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">LinchKit</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6">
              <Link href="/docs" className="text-sm font-medium">
                文档
              </Link>
              <Link href="/examples" className="text-sm font-medium">
                示例
              </Link>
              <Link href="/admin" className="text-sm font-medium">
                管理后台
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Link 
                href="/auth/sign-in"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                登录
              </Link>
              <Link 
                href="/auth/sign-up"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main>
        <HomeHero />
        <FeatureSection />
      </main>

      {/* 页脚 */}
      <footer className="border-t py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with{' '}
              <Link
                href="https://github.com/laofahai/linch-kit"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                LinchKit
              </Link>
              . AI-First 全栈开发框架.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}