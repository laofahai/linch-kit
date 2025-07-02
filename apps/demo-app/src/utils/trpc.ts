/**
 * tRPC 客户端配置
 */

import { createTRPCNext } from '@trpc/next'
import { httpBatchLink, loggerLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@linch-kit/trpc'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // 可选: 添加认证头
          headers() {
            const token = typeof window !== 'undefined' ? 
              localStorage.getItem('authToken') : null
            
            return token ? {
              authorization: `Bearer ${token}`,
            } : {}
          },
        }),
      ],
    }
  },
  ssr: false,
})

// 导出类型
export type { AppRouter } from '@linch-kit/trpc'