// lib/trpc/router.ts
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from '@linch-kit/trpc'
import superjson from 'superjson'
import { hasPermission } from '@linch-kit/auth'

// 初始化 tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

// 重命名保留方法名
export const trpcRouter = t.router
export const publicProcedure = t.procedure
export const createProtectedProcedure = t.procedure.use(
  t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    })
  })
)

// 创建带权限的过程 - 支持单个权限、权限数组或 glob 模式
export const createProcedureWithPermission = (permission: string | string[]) =>
  createProtectedProcedure.use(
    t.middleware(({ next, ctx }) => {
      // 使用增强版的 hasPermission 函数检查权限
      if (!hasPermission(ctx.user, permission)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return next()
    })
  )
