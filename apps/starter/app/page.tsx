/**
 * LinchKit Starter - 开发基座主页
 * 最小化示例页面，展示基本功能
 */

import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            LinchKit Starter
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            AI-First 开发基座 - 基于 LinchKit 框架的现代化全栈开发模板
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <div>
                <Link href="/console">进入 Console </Link>123
              </div>
            </Button>
            <Button>Hello 123123123</Button>

            {/* 测试tailwind-variants */}
            <Button variant="default">TV Default</Button>
            <Button variant="destructive" size="sm">
              TV Destructive
            </Button>
            <Button variant="outline" size="lg">
              TV Outline
            </Button>
            <Button variant="secondary">TV Secondary</Button>
            <Button variant="ghost">TV Ghost</Button>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>几个命令即可启动您的项目开发</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 font-mono text-sm">
              <div className="text-green-400"># 安装依赖</div>
              <div className="text-slate-300">bun install</div>
              <div className="text-green-400 mt-2"># 启动开发服务器</div>
              <div className="text-slate-300">bun dev</div>
              <div className="text-green-400 mt-2"># 构建生产版本</div>
              <div className="text-slate-300">bun run build</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
