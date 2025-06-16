// lib/trpc/router.ts
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './server/context'
import { z } from 'zod'
import superjson from 'superjson'

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

// 创建带权限的过程
export const createProcedureWithPermission = (permission: string) =>
  createProtectedProcedure.use(
    t.middleware(({ next, ctx }) => {
      if (!ctx.authManager.hasPermission(permission)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return next()
    })
  )
