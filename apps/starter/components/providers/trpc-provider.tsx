/**
 * tRPC Provider 组件 - 使用LinchKit Core增强
 * 为应用提供 tRPC React Hook 客户端，集成日志和错误处理
 */

'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { Logger } from '@linch-kit/core/client'
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
        // 使用 LinchKit Logger 记录查询错误
        logger: {
          log: (message) => Logger.debug('React Query:', message),
          warn: (message) => Logger.warn('React Query:', message),
          error: (error) => Logger.error('React Query Error:', error),
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
              // Future: Add authentication headers here
              'content-type': 'application/json',
            }
          },
          // 添加请求/响应拦截器以记录日志
          fetch: (url, options) => {
            Logger.debug('tRPC Request:', { url, method: options?.method })
            return fetch(url, options).then(response => {
              if (!response.ok) {
                Logger.error('tRPC Response Error:', {
                  status: response.status,
                  statusText: response.statusText,
                })
              }
              return response
            })
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
