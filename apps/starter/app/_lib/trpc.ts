'use client'

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink, createTRPCProxyClient } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from './trpc-router'

// 创建 tRPC React 客户端
export const trpc = createTRPCReact<AppRouter>()

// 获取基础 URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// 创建 tRPC 客户端
export const createTrpcClient = () => {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: () => {
          if (typeof window === 'undefined') return {}
          // 这里可以添加认证头
          return {}
        },
      }),
    ],
  })
}
