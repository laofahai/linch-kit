/**
 * @linch-kit/trpc - LinchKit tRPC API Layer (Client)
 * 
 * 客户端安全的tRPC功能，服务端功能在单独的server.ts中
 */

// 重新导出 tRPC 客户端功能
export { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
export type { CreateTRPCClientOptions } from '@trpc/client'

/**
 * 客户端安全的类型定义
 */
export type LinchKitContext = {
  user?: {
    id: string
    email?: string
    name?: string
  }
  services: {
    logger: {
      debug: (message: string, meta?: Record<string, unknown>) => void
      info: (message: string, meta?: Record<string, unknown>) => void
      warn: (message: string, meta?: Record<string, unknown>) => void
      error: (message: string, meta?: Record<string, unknown>) => void
    }
    config: {
      get: (key: string) => unknown
    }
  }
}

/**
 * 基础路由器类型定义
 */
export interface TRPCRouterFactory {
  router: (routes: Record<string, unknown>) => unknown
  publicProcedure: unknown
  protectedProcedure: unknown
  adminProcedure: unknown
}

/**
 * 通用应用路由器类型
 */
export interface AppRouter {
  health: {
    ping: unknown
    status: unknown
  }
  system: {
    info: unknown
  }
}

// CLI命令
export { trpcCommands } from './cli/commands'