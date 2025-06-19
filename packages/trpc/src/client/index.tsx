'use client'

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink, createTRPCProxyClient } from '@trpc/client'
import superjson from 'superjson'
import type { AnyRouter } from '@trpc/server'

import type { AppRouter, RouterInputs, RouterOutputs } from '../server/types'

// 创建 React Hooks (使用泛型支持任意路由)
export function createTRPCClient<T extends AnyRouter = AppRouter>() {
  return createTRPCReact<T>()
}

// 默认的 tRPC React 实例
export const trpc = createTRPCReact<AppRouter>()

// 类型辅助导出
export type { RouterInputs, RouterOutputs }

// 获取基础 URL
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// tRPC 客户端配置选项
export interface TRPCClientOptions {
  url?: string
  transformer?: any
  headers?: () => Record<string, string> | Promise<Record<string, string>>
  fetch?: typeof fetch
}

// 创建 tRPC 客户端配置
export function createTRPCClientConfig(options: TRPCClientOptions = {}) {
  return {
    links: [
      httpBatchLink({
        url: options.url || `${getBaseUrl()}/api/trpc`,
        transformer: options.transformer || superjson,
        fetch: options.fetch,
        headers: options.headers || (() => {
          if (typeof window === 'undefined') return {}
          const token = localStorage.getItem('sessionToken')
          return token ? { Authorization: `Bearer ${token}` } : {}
        }),
      }),
    ],
  }
}

// 创建用于 trpc.Provider 的 React Client
export const createTrpcClient = (options?: TRPCClientOptions) => {
  return createTRPCProxyClient<AppRouter>(createTRPCClientConfig(options))
}
