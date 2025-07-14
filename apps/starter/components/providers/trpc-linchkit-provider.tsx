/**
 * Starter 应用的 tRPC 集成 Provider
 * 使用 @linch-kit/core 的 withTRPCProvider 高阶组件
 */

'use client'

import { withTRPCProvider } from '@linch-kit/core'
import { QueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'

import type { AppRouter } from '@/lib/trpc'

// 创建 tRPC React 客户端
export const api = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // 浏览器端使用相对 URL
  if (process.env['VERCEL_URL']) return `https://${process.env['VERCEL_URL']}` // Vercel
  return `http://localhost:${process.env['PORT'] ?? 3000}` // 开发环境
}

// tRPC 配置
const trpcConfig = {
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers() {
        return {
          'content-type': 'application/json',
        }
      },
    }),
  ],
}

// 使用 core 包的 withTRPCProvider 创建集成 Provider
export const TRPCLinchKitProvider = withTRPCProvider(api, trpcConfig)

// 导出 tRPC 客户端实例供组件使用
export { api as trpc }