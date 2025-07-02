/**
 * Console Router Factory
 * 避免循环依赖的控制台路由工厂函数
 */

import { z } from 'zod'

// 避免循环依赖的通用类型定义
interface TRPCProcedure {
  input: (schema: z.ZodType) => TRPCProcedure
  query: (handler: (opts: unknown) => Promise<unknown>) => unknown
  mutation: (handler: (opts: unknown) => Promise<unknown>) => unknown
}

interface TRPCRouterBuilder {
  router: (routes: Record<string, unknown>) => unknown
  protectedProcedure: TRPCProcedure
}

type RouterInput = {
  page: number
  pageSize: number
  search?: string
}

type CreateInput = {
  name: string
  domain?: string
  description?: string
}

type UpdateInput = {
  id: string
  name?: string
  domain?: string
  description?: string
}

type DeleteInput = {
  id: string
}

export function createConsoleRouter(trpc: TRPCRouterBuilder) {
  const { router, protectedProcedure } = trpc

  return router({
    tenant: router({
      list: protectedProcedure
        .input(z.object({
          page: z.number().default(1),
          pageSize: z.number().default(10),
          search: z.string().optional()
        }))
        .query(async (opts: unknown) => {
          const { input } = opts as { input: RouterInput }
          // TODO: 实现租户列表查询
          return {
            data: [],
            total: 0,
            page: input.page,
            pageSize: input.pageSize
          }
        }),

      create: protectedProcedure
        .input(z.object({
          name: z.string(),
          domain: z.string().optional(),
          description: z.string().optional()
        }))
        .mutation(async (opts: unknown) => {
          const { input } = opts as { input: CreateInput }
          // TODO: 实现租户创建
          return { id: '1', ...input }
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.string(),
          name: z.string().optional(),
          domain: z.string().optional(),
          description: z.string().optional()
        }))
        .mutation(async (opts: unknown) => {
          const { input } = opts as { input: UpdateInput }
          // TODO: 实现租户更新
          return { id: input.id }
        }),

      delete: protectedProcedure
        .input(z.object({
          id: z.string()
        }))
        .mutation(async (opts: unknown) => {
          const { input: _input } = opts as { input: DeleteInput }
          // TODO: 实现租户删除
          return { success: true }
        })
    })
  })
}