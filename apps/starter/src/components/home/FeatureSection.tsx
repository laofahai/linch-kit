'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/components'

const features = [
  {
    title: '多租户架构',
    description: '支持企业级多租户数据隔离和权限控制',
    icon: '🏢',
  },
  {
    title: '认证授权',
    description: '完整的用户认证和基于角色的权限控制系统',
    icon: '🔐',
  },
  {
    title: '管理控制台',
    description: '功能强大的企业级管理界面和监控面板',
    icon: '📊',
  },
  {
    title: 'Schema 驱动',
    description: '基于 Zod Schema 的端到端类型安全保障',
    icon: '🛡️',
  },
  {
    title: '插件系统',
    description: '灵活的插件架构支持功能扩展和定制',
    icon: '🔌',
  },
  {
    title: 'AI 集成',
    description: '内置 AI 功能集成，支持智能化业务处理',
    icon: '🤖',
  },
]

export function FeatureSection() {
  return (
    <section className="container space-y-6 py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          企业级功能
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          LinchKit 提供了构建现代化企业应用所需的所有核心功能
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="relative overflow-hidden">
            <CardHeader>
              <div className="text-4xl mb-2">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}