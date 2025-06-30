/**
 * Auth Router Factory
 * 避免循环依赖的路由工厂函数
 */

import { z } from 'zod'

// 避免循环依赖的通用类型定义
interface TRPCProcedure {
  input: (schema: z.ZodType) => TRPCProcedure
  query: (handler: (opts: { ctx?: Record<string, unknown>; input?: Record<string, unknown> }) => Promise<unknown> | unknown) => unknown
  mutation?: (handler: (opts: { ctx?: Record<string, unknown>; input?: Record<string, unknown> }) => Promise<unknown> | unknown) => unknown
}

interface TRPCRouterBuilder {
  router: (routes: Record<string, unknown>) => unknown
  publicProcedure: TRPCProcedure
  protectedProcedure: TRPCProcedure
}

export function createAuthRouter(trpc: TRPCRouterBuilder) {
  const { router, publicProcedure, protectedProcedure } = trpc

  return router({
    // 获取当前会话
    getSession: publicProcedure
      .query(async ({ ctx }: any) => {
        return ctx.user || null
      }),

    // 获取用户信息
    getUser: protectedProcedure
      .query(async ({ ctx }: any) => {
        return ctx.user
      }),

    // 用户登录状态检查
    isAuthenticated: publicProcedure
      .query(async ({ ctx }: any) => {
        return !!ctx.user
      }),

    // 获取用户权限
    getPermissions: protectedProcedure
      .query(async ({ ctx }: any) => {
        // TODO: 集成权限引擎
        return []
      }),

    // 检查特定权限
    hasPermission: protectedProcedure
      .input(z.object({
        action: z.string(),
        resource: z.string()
      }))
      .query(async ({ input, ctx }: any) => {
        // TODO: 集成权限引擎
        return false
      })
  })
}