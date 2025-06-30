'use client'

import Link from 'next/link'
import { Button } from '@linch-kit/ui'

export function HomeHero() {
  return (
    <section className="container space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
          LinchKit Starter
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          基于 LinchKit 构建的生产级应用模板。包含企业级管理控制台、多租户架构、完整的认证授权系统。
        </p>
        <div className="space-x-4">
          <Button size="lg" asChild>
            <Link href="/dashboard">AI Dashboard</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/admin">管理后台</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/docs">查看文档</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}