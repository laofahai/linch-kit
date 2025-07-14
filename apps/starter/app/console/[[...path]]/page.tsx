/**
 * Console 扩展路由代理 - Server Component
 * 基于规划文档中的路由代理机制
 */

import { ConsolePageClient } from './client'

interface ExtensionPageProps {
  params: Promise<{
    path?: string[]
  }>
}

export default async function ConsolePage({ params }: ExtensionPageProps) {
  // 在 Server Component 中处理 async params
  const resolvedParams = await params
  const extensionPath = resolvedParams.path?.join('/') || ''
  const fullPath = `/console/${extensionPath}`

  // 传递给 Client Component
  return (
    <ConsolePageClient 
      extensionPath={extensionPath}
      fullPath={fullPath}
    />
  )
}