'use client'

import { Button } from '@linch-kit/ui/components'
import { ArrowRight, Brain, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'

export function SimpleHomeHero() {
  return (
    <section className="relative py-20 px-6 text-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl">
            <Brain className="h-10 w-10 text-primary-foreground" />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
          LinchKit
        </h1>
        
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            AI-First 全栈开发框架
          </p>
          <Zap className="h-6 w-6 text-primary animate-pulse" />
        </div>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          基于 Schema 驱动架构，提供端到端类型安全的企业级 AI-First 开发解决方案
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              <Brain className="mr-2 h-5 w-5" />
              体验 AI Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-200 hover:scale-105">
              管理控制台
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-First 架构</h3>
            <p className="text-muted-foreground text-sm">
              原生支持 AI 集成，智能代码生成和自动化开发流程
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">类型安全</h3>
            <p className="text-muted-foreground text-sm">
              端到端 TypeScript 支持，从 Schema 到 UI 的完整类型推导
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">企业级</h3>
            <p className="text-muted-foreground text-sm">
              生产就绪的架构，支持多租户、权限管理和监控
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}