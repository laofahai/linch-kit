/**
 * tRPC Provider 组件
 * 为应用提供 tRPC React Hook 客户端
 */

'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
import type { AppRouter } from '@/lib/trpc-server'

// 创建 tRPC React 客户端
export const api = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // 浏览器端使用相对 URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // Vercel
  return `http://localhost:${process.env.PORT ?? 3000}` // 开发环境
}

interface TRPCProviderProps {
  children: React.ReactNode
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 分钟
            retry: 2, // 重试次数
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
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
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}
