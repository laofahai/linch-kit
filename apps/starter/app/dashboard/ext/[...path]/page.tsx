/**
 * Extension动态路由页面
 * 捕获所有 /dashboard/ext/* 路径并动态加载对应的Extension组件
 */

import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

import ExtensionRouteClient from './client'

// 生成元数据
export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  const extensionName = resolvedParams.path?.[0] || 'unknown'

  return {
    title: `${extensionName} Extension | LinchKit`,
    description: `${extensionName} extension page`,
  }
}

export default async function ExtensionDynamicPage() {
  const session = await auth()

  // 未登录重定向
  if (!session) {
    redirect('/sign-in?redirect=/dashboard/ext')
  }

  // 渲染Extension路由容器
  return <ExtensionRouteClient />
}
