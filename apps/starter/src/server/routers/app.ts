import { createTRPCRouter } from '@linch-kit/trpc'
import { authRouter } from '@linch-kit/auth'
import { crudRouter } from '@linch-kit/crud'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  crud: crudRouter,
})

export type AppRouter = typeof appRouter