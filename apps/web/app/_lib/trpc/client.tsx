'use client'

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'
import superjson from 'superjson'
import type { AppRouter } from './index'

// 创建 React Hooks
export const trpc = createTRPCReact<AppRouter>()

// 类型辅助
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// 获取基础 URL
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// 正确创建用于 trpc.Provider 的 React Client
export const createTrpcClient = () =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers() {
          if (typeof window === 'undefined') return {}
          const token = localStorage.getItem('sessionToken')
          return token ? { Authorization: `Bearer ${token}` } : {}
        },
      }),
    ],
  })
