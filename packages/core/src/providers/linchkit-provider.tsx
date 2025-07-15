/**
 * LinchKit 统一 Provider 组合
 * 框架核心层的 Provider 组合，解决架构层级问题
 * 
 * 架构设计：
 * - @linch-kit/core: 框架核心层，负责 Provider 组合
 * - @linch-kit/ui: 基础 UI 层，不包含业务逻辑  
 * - @linch-kit/platform: 平台特性层，与 UI 层并行
 * - apps/starter: 应用层，使用 core 的 Provider 组合
 */

'use client'

import React, { type ReactNode, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

import { logger } from '../logger-client'

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
   * React Query 客户端配置
   */
  queryClient?: {
    staleTime?: number
    retry?: number
    gcTime?: number
  }
  /**
   * LinchKit Core 配置
   */
  core?: {
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    features?: {
      analytics?: boolean
      metrics?: boolean
    }
  }
}

export interface LinchKitProviderProps {
  children: ReactNode
  config?: LinchKitProviderConfig
}

/**
 * LinchKit 统一 Provider
 * 
 * 核心功能：
 * 1. 主题管理 (next-themes)
 * 2. 查询状态管理 (react-query)  
 * 3. LinchKit Core 初始化
 * 4. 可选的 tRPC 集成 (通过高阶组件)
 */
export function LinchKitProvider({
  children,
  config = {},
}: LinchKitProviderProps) {
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
      gcTime: 10 * 60 * 1000, // 10 分钟
    },
    core = {
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      features: {
        analytics: false,
        metrics: false,
      },
    },
  } = config

  // LinchKit Core 初始化
  useEffect(() => {
    const initLinchKit = () => {
      try {
        // 设置日志级别
        logger.setLevel(core.logLevel ?? 'info')

        logger.info('LinchKit Provider initializing...')

        // 功能特性初始化
        if (core.features?.analytics) {
          logger.info('Analytics integration enabled')
        }

        if (core.features?.metrics) {
          logger.info('Metrics collection enabled')
        }
        
        logger.info('LinchKit Provider initialized successfully')
      } catch (error) {
        logger.error('Failed to initialize LinchKit', error instanceof Error ? error : new Error(String(error)))
      }
    }

    initLinchKit()

    return () => {
      logger.info('LinchKit Provider cleanup')
    }
  }, [core.logLevel, core.features])

  // React Query 客户端初始化
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: queryClientConfig.staleTime,
            retry: queryClientConfig.retry,
            gcTime: queryClientConfig.gcTime,
          },
        },
      })
  )

  return (
    <NextThemesProvider {...theme}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NextThemesProvider>
  )
}

/**
 * 默认配置常量
 */
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
    gcTime: 10 * 60 * 1000, // 10 分钟
  },
  core: {
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    features: {
      analytics: false,
      metrics: false,
    },
  },
}

/**
 * tRPC Provider 组合高阶组件  
 * 用于需要 tRPC 集成的应用
 * 
 * @param trpcApi - tRPC React 客户端 API
 * @param trpcConfig - tRPC 客户端配置
 * @returns 集成了 tRPC 的 LinchKit Provider 组件
 */
export function withTRPCProvider<TRouter = any>(
  trpcApi: {
    Provider: React.ComponentType<any>
    createClient: (config: any) => any
  },
  trpcConfig: any
) {
  return function TRPCLinchKitProvider({
    children,
    config = {},
  }: LinchKitProviderProps) {
    const queryClientConfig = config.queryClient ?? {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      gcTime: 10 * 60 * 1000,
    }

    const [queryClient] = useState(() => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: queryClientConfig.staleTime,
          retry: queryClientConfig.retry,
          gcTime: queryClientConfig.gcTime,
        },
      },
    }))

    const [trpcClient] = useState(() => {
      logger.info('[tRPC] Initializing tRPC client via LinchKit Provider')
      return trpcApi.createClient(trpcConfig)
    })

    // 直接渲染组合的结构，避免嵌套问题
    const {
      theme = {
        attribute: 'class',
        defaultTheme: 'system', 
        enableSystem: true,
        disableTransitionOnChange: false,
      },
      core = {
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        features: {
          analytics: false,
          metrics: false,
        },
      },
    } = config

    // LinchKit Core 初始化
    useEffect(() => {
      const initLinchKit = () => {
        try {
          logger.setLevel(core.logLevel ?? 'info')
          logger.info('LinchKit tRPC Provider initializing...')
          
          if (core.features?.analytics) {
            logger.info('Analytics integration enabled')
          }
          if (core.features?.metrics) {
            logger.info('Metrics collection enabled')
          }
          
          logger.info('LinchKit tRPC Provider initialized successfully')
        } catch (error) {
          logger.error('Failed to initialize LinchKit', error instanceof Error ? error : new Error(String(error)))
        }
      }

      initLinchKit()

      return () => {
        logger.info('LinchKit tRPC Provider cleanup')
      }
    }, [core.logLevel, core.features])

    return (
      <NextThemesProvider {...theme}>
        <trpcApi.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpcApi.Provider>
      </NextThemesProvider>
    )
  }
}