/**
 * tRPC 配置文件
 * 基于 @linch-kit/trpc 创建的应用级tRPC配置
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from './trpc-server'

/**
 * 客户端 tRPC 实例
 */
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      // 可选：添加认证头
      headers() {
        return {
          // 'authorization': getAuthToken(),
        }
      },
    }),
  ],
})

/**
 * 工具函数：获取 URL（用于 SSR）
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // 浏览器端使用相对 URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // Vercel
  return `http://localhost:${process.env.PORT ?? 3000}` // 开发环境
}

/**
 * SSR 专用的 tRPC 客户端
 */
export const trpcSsr = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
})