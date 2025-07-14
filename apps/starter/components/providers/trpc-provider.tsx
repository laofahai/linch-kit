/**
 * tRPC Provider
 * 提供类型安全的 API 客户端
 */

'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
import { Logger } from '@linch-kit/core/client'

import type { AppRouter } from '@/lib/trpc'

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
            retry: 2,
          },
        },
      })
  )

  const [trpcClient] = useState(() => {
    Logger.info('Initializing tRPC client')
    
    return api.createClient({
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
    })
  })

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}