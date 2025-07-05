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
    role?: string
    permissions?: string[]
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

// 基础 tRPC 构建器（仅用于测试）
export const router = (routes: Record<string, unknown>) => ({
  ...routes,
  createCaller: (ctx: unknown) => {
    // 创建一个调用器，模拟 tRPC 的 createCaller 行为
    const caller = {} as Record<string, unknown>
    
    Object.keys(routes).forEach(key => {
      const route = routes[key] as Record<string, unknown>
      if (route && typeof route === 'object' && 'handler' in route) {
        const handler = route.handler as (args: { input?: unknown; ctx: unknown }) => unknown
        // 如果路由有 handler，创建调用方法
        caller[key] = async (input?: unknown) => {
          return handler({ input, ctx })
        }
      }
    })
    
    return caller
  }
})
export const procedure = {}
export const middleware = (fn: unknown) => fn

// Mock tRPC procedure 实现
const createMockProcedure = (requireAuth = false, requireAdmin = false) => ({
  input: (schema: unknown) => ({
    query: (handler: (args: { input: unknown; ctx: unknown }) => unknown) => ({ 
      handler: ({ input, ctx }: { input: unknown; ctx: LinchKitContext }) => {
        // 权限检查
        if (requireAuth && !ctx.user) {
          throw new Error('需要登录才能访问此资源')
        }
        if (requireAdmin && (!ctx.user || ctx.user.role !== 'admin')) {
          throw new Error('需要管理员权限才能访问此资源')
        }
        return handler({ input, ctx })
      }, 
      schema 
    }),
    mutation: (handler: (args: { input: unknown; ctx: unknown }) => unknown) => ({ 
      handler: ({ input, ctx }: { input: unknown; ctx: LinchKitContext }) => {
        // 权限检查
        if (requireAuth && !ctx.user) {
          throw new Error('需要登录才能访问此资源')
        }
        if (requireAdmin && (!ctx.user || ctx.user.role !== 'admin')) {
          throw new Error('需要管理员权限才能访问此资源')
        }
        return handler({ input, ctx })
      }, 
      schema 
    })
  }),
  query: (handler: (args: { input: unknown; ctx: unknown }) => unknown) => ({ 
    handler: ({ input, ctx }: { input: unknown; ctx: LinchKitContext }) => {
      // 权限检查
      if (requireAuth && !ctx.user) {
        throw new Error('需要登录才能访问此资源')
      }
      if (requireAdmin && (!ctx.user || ctx.user.role !== 'admin')) {
        throw new Error('需要管理员权限才能访问此资源')
      }
      return handler({ input, ctx })
    }
  }),
  mutation: (handler: (args: { input: unknown; ctx: unknown }) => unknown) => ({ 
    handler: ({ input, ctx }: { input: unknown; ctx: LinchKitContext }) => {
      // 权限检查
      if (requireAuth && !ctx.user) {
        throw new Error('需要登录才能访问此资源')
      }
      if (requireAdmin && (!ctx.user || ctx.user.role !== 'admin')) {
        throw new Error('需要管理员权限才能访问此资源')
      }
      return handler({ input, ctx })
    }
  })
})

export const publicProcedure = createMockProcedure(false, false)
export const protectedProcedure = createMockProcedure(true, false)
export const adminProcedure = createMockProcedure(true, true)