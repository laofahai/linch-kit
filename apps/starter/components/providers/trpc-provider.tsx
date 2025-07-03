/**
 * tRPC Provider 组件
 * 为应用提供 tRPC 客户端
 */

'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@/lib/trpc-server'

// 创建全局查询客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
})

// 创建 tRPC 客户端
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
})

interface TRPCProviderProps {
  children: React.ReactNode
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}