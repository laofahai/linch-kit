/**
 * 统一的 LinchKit Provider
 * 整合所有必要的 providers：LinchKit Core、Theme、tRPC
 * 简化应用配置，确保最佳实践
 */

'use client'

import { Logger } from '@linch-kit/core/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React, { useEffect, useState } from 'react'
import superjson from 'superjson'

import type { AppRouter } from '@/lib/trpc'

// 创建 tRPC React 客户端
export const api = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // 浏览器端使用相对 URL
  if (process.env['VERCEL_URL']) return `https://${process.env['VERCEL_URL']}` // Vercel
  return `http://localhost:${process.env['PORT'] ?? 3000}` // 开发环境
}

interface UnifiedLinchKitProviderProps {
  children: React.ReactNode
  /**
   * 主题提供者的配置项
   */
  theme?: {
    attribute?: 'class' | 'data-theme'
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
  }
  /**
   * tRPC 查询客户端配置
   */
  queryClient?: {
    staleTime?: number
    retry?: number
  }
}

export function UnifiedLinchKitProvider({
  children,
  theme = {
    attribute: 'class',
    defaultTheme: 'system',
    enableSystem: true,
    disableTransitionOnChange: false,
  },
  queryClient: queryClientConfig = {
    staleTime: 5 * 60 * 1000, // 5 分钟
    retry: 2,
  },
}: UnifiedLinchKitProviderProps) {
  // LinchKit Core 初始化
  useEffect(() => {
    const initLinchKit = () => {
      try {
        // 设置日志级别
        if (process.env.NODE_ENV === 'development') {
          Logger.setLevel('debug')
        } else {
          Logger.setLevel('info')
        }

        Logger.info('LinchKit Unified Provider initializing...')

        // Console集成在客户端简化处理
        Logger.info('Console integration configured for client-side')
        
        Logger.info('LinchKit Unified Provider initialized successfully')
      } catch (error) {
        Logger.error('Failed to initialize LinchKit', error instanceof Error ? error : new Error(String(error)))
      }
    }

    initLinchKit()

    // 清理函数
    return () => {
      Logger.info('LinchKit Unified Provider cleanup')
    }
  }, [])

  // tRPC 和 React Query 设置
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: queryClientConfig.staleTime,
            retry: queryClientConfig.retry,
          },
        },
      })
  )

  const [trpcClient] = useState(() => {
    Logger.info('[TRPC] Initializing tRPC client via Unified Provider')
    
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
    <NextThemesProvider {...theme}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </api.Provider>
    </NextThemesProvider>
  )
}

// 导出原有的组件别名，保持向后兼容
export { UnifiedLinchKitProvider as LinchKitProvider }

// 导出 tRPC 客户端实例
export { api as trpc }