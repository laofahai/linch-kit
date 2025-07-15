/**
 * 完全动态的扩展路由系统
 * 支持任意扩展名称，无需硬编码
 */

import { DynamicExtensionClient } from './client'

interface ExtensionPageProps {
  params: Promise<{
    extension: string
    path?: string[]
  }>
}

export default async function ExtensionPage({ params }: ExtensionPageProps) {
  const { extension, path = [] } = await params
  const subPath = path.join('/')
  const fullPath = `/${extension}${subPath ? `/${subPath}` : ''}`

  return (
    <DynamicExtensionClient
      extensionName={extension}
      subPath={subPath}
      fullPath={fullPath}
    />
  )
}

export async function generateMetadata({ params }: ExtensionPageProps) {
  const { extension } = await params
  
  // 格式化扩展名为标题
  const title = extension
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  return {
    title: `${title} - LinchKit`,
    description: `LinchKit ${title} Extension`
  }
}