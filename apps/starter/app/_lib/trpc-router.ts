import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import superjson from 'superjson'
import type { Context } from './trpc-context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

// 示例路由
export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name ?? 'World'}!`,
      }
    }),
  
  me: publicProcedure
    .query(({ ctx }) => {
      return {
        user: ctx.user,
        session: ctx.session,
      }
    }),
})

export type AppRouter = typeof appRouter
