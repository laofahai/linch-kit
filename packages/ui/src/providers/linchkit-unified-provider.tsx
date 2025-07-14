/**
 * 统一的 LinchKit Provider - 共享版本
 * 可供所有 LinchKit 应用和扩展使用
 * 整合 Core、Theme、tRPC 等所有必要功能
 */

'use client'

import { Logger } from '@linch-kit/core/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React, { useEffect, useState } from 'react'
import superjson from 'superjson'

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // 浏览器端使用相对 URL
  if (process.env['VERCEL_URL']) return `https://${process.env['VERCEL_URL']}` // Vercel
  return `http://localhost:${process.env['PORT'] ?? 3000}` // 开发环境
}

export interface LinchKitProviderConfig {
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
  /**
   * LinchKit Core 配置
   */
  core?: {
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    features?: {
      console?: boolean
      analytics?: boolean
    }
  }
}

export interface LinchKitUnifiedProviderProps {
  children: React.ReactNode
  config?: LinchKitProviderConfig
  /**
   * 自定义 tRPC 路由器类型
   */
  AppRouter?: unknown
}

/**
 * 创建 LinchKit 统一提供者
 * @param AppRouter - tRPC 路由器类型（可选）
 */
export function createLinchKitProvider<TRouter = unknown>(AppRouter?: TRouter) {
  // 创建 tRPC React 客户端
  const api = createTRPCReact<TRouter>()

  function LinchKitUnifiedProvider({
    children,
    config = {},
  }: LinchKitUnifiedProviderProps) {
    const {
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
      core = {
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        features: {
          console: true,
          analytics: false,
        },
      },
    } = config

    // LinchKit Core 初始化
    useEffect(() => {
      const initLinchKit = () => {
        try {
          // 设置日志级别
          Logger.setLevel(core.logLevel)

          Logger.info('LinchKit Unified Provider initializing...')

          // 功能特性初始化
          if (core.features?.console) {
            Logger.info('Console integration enabled')
          }

          if (core.features?.analytics) {
            Logger.info('Analytics integration enabled')
          }
          
          Logger.info('LinchKit Unified Provider initialized successfully')
        } catch (error) {
          Logger.error('Failed to initialize LinchKit', error instanceof Error ? error : new Error(String(error)))
        }
      }

      initLinchKit()

      return () => {
        Logger.info('LinchKit Unified Provider cleanup')
      }
    }, [core.logLevel, core.features])

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
      if (!AppRouter) {
        Logger.warn('[TRPC] No AppRouter provided, tRPC client not initialized')
        return null
      }

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

    // 如果没有提供 AppRouter，则不包装 tRPC Provider
    if (!AppRouter || !trpcClient) {
      return (
        <NextThemesProvider {...theme}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </NextThemesProvider>
      )
    }

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

  return {
    LinchKitUnifiedProvider,
    api: AppRouter ? api : null,
  }
}

// 默认导出无 tRPC 的版本（适用于不需要 tRPC 的场景）
export const { LinchKitUnifiedProvider } = createLinchKitProvider()

// 默认配置
export const defaultLinchKitConfig: LinchKitProviderConfig = {
  theme: {
    attribute: 'class',
    defaultTheme: 'system',
    enableSystem: true,
    disableTransitionOnChange: false,
  },
  queryClient: {
    staleTime: 5 * 60 * 1000, // 5 分钟
    retry: 2,
  },
  core: {
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    features: {
      console: true,
      analytics: false,
    },
  },
}