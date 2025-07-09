/**
 * Extension动态路由页面
 * 捕获所有 /dashboard/ext/* 路径并动态加载对应的Extension组件
 */

'use client'

import { ExtensionRouteContainer } from '@linch-kit/console'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function ExtensionDynamicPage() {
  const { data: session, status } = useSession()

  // 等待认证状态确定
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 未登录重定向
  if (!session) {
    redirect('/sign-in?redirect=/dashboard/ext')
  }

  // 渲染Extension路由容器
  return <ExtensionRouteContainer />
}

// 生成元数据
export async function generateMetadata({
  params,
}: {
  params: { path: string[] }
}) {
  const extensionName = params.path?.[0] || 'unknown'
  
  return {
    title: `${extensionName} Extension | LinchKit`,
    description: `${extensionName} extension page`,
  }
}