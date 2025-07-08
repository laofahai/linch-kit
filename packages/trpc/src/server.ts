/**
 * @linch-kit/trpc - LinchKit tRPC API Layer (Server)
 *
 * 服务端专用的tRPC功能
 */

// 服务端功能导出
export { initTRPC } from '@trpc/server'

// 基础 tRPC 实例
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import superjson from 'superjson'

/**
 * 创建基础 tRPC 实例
 */
const t = initTRPC
  .context<{
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
  }>()
  .create({
    transformer: superjson,
  })

/**
 * 基础路由器和过程构建器
 */
export const router = t.router
export const middleware = t.middleware
export const procedure = t.procedure

/**
 * 公共过程 - 无需认证
 */
export const publicProcedure = t.procedure

/**
 * 受保护过程 - 需要认证
 */
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error('需要登录才能访问此资源')
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    })
  })
)

/**
 * 管理员过程 - 需要管理员权限
 */
export const adminProcedure = protectedProcedure.use(
  t.middleware(({ ctx, next }) => {
    // 简化的管理员检查 - 实际应用中应该集成权限系统
    return next({
      ctx,
    })
  })
)

/**
 * 基础健康检查路由器
 */
export const healthRouter = router({
  ping: publicProcedure
    .output(
      z.object({
        message: z.string(),
        timestamp: z.string(),
        uptime: z.number(),
      })
    )
    .query(() => {
      return {
        message: 'pong',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    }),

  status: publicProcedure
    .output(
      z.object({
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        timestamp: z.string(),
      })
    )
    .query(() => {
      return {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
      }
    }),
})

/**
 * 基础系统路由器
 */
export const systemRouter = router({
  info: publicProcedure
    .output(
      z.object({
        name: z.string(),
        version: z.string(),
        environment: z.string(),
        nodeVersion: z.string(),
        uptime: z.number(),
        timestamp: z.string(),
      })
    )
    .query(() => {
      return {
        name: '@linch-kit/trpc',
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
    }),
})

/**
 * 基础应用路由器 - 仅包含必要的核心路由
 */
export const appRouter = router({
  health: healthRouter,
  system: systemRouter,
})

/**
 * 创建上下文的辅助函数
 */
export function createLinchKitContext(options: {
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
}) {
  return async (_opts: { req: unknown; res?: unknown }) => {
    // 简化的上下文创建 - 实际应用中可以扩展
    return {
      user: undefined, // 在具体应用中实现认证逻辑
      services: options.services,
    }
  }
}

/**
 * 默认的上下文创建函数
 * 供 starter 应用使用
 */
export const createTRPCContext = createLinchKitContext({
  services: {
    logger: {
      debug: (message: string, meta?: Record<string, unknown>) => console.debug(message, meta),
      info: (message: string, meta?: Record<string, unknown>) => console.info(message, meta),
      warn: (message: string, meta?: Record<string, unknown>) => console.warn(message, meta),
      error: (message: string, meta?: Record<string, unknown>) => console.error(message, meta),
    },
    config: {
      get: (key: string) => process.env[key],
    },
  },
})

// 导出类型
export type AppRouter = typeof appRouter

/**
 * tRPC 路由器工厂参数类型
 */
export type TRPCRouterFactory = {
  router: typeof router
  publicProcedure: typeof publicProcedure
  protectedProcedure: typeof protectedProcedure
  adminProcedure: typeof adminProcedure
}
