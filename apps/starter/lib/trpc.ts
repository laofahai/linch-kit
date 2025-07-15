/**
 * tRPC 配置和路由定义
 * 提供类型安全的 API 层
 */

import { logger } from '@linch-kit/core/server'
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
// 使用 LinchKit Core 的正式 Logger
const TrpcLogger = logger

// 创建 tRPC 上下文类型
export type TRPCContext = Record<string, never>

// 创建 tRPC 上下文工厂函数
export const createTRPCContext = (): TRPCContext => {
  return {}
}

// 创建 tRPC 实例
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

// 导出路由和程序构建器
export const router = t.router
export const publicProcedure = t.procedure

// 示例路由 - 健康检查
const healthRouter = router({
  check: publicProcedure
    .query(() => {
      TrpcLogger.info('Health check requested')
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }
    }),
})

// 示例路由 - Hello World
const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      const name = input.name ?? 'World'
      TrpcLogger.debug('Hello endpoint called', { name })
      return `Hello ${name}! 这是来自 LinchKit Starter 的问候。`
    }),
})

// 主应用路由
export const appRouter = router({
  health: healthRouter,
  example: exampleRouter,
})

export type AppRouter = typeof appRouter