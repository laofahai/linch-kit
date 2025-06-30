import { router, publicProcedure, protectedProcedure } from '@linch-kit/trpc'
import { createAuthRouter } from '@linch-kit/auth'
import { createCrudRouter } from '@linch-kit/crud'
import { createConsoleRouter } from '@linch-kit/console'

// 初始化 Console 服务（必须在使用 consoleRouter 之前）
import '@/lib/console-setup'

// 创建各子路由
const authRouter = createAuthRouter({ router, publicProcedure, protectedProcedure } as never)
const crudRouter = createCrudRouter({ router, protectedProcedure } as never)
const consoleRouter = createConsoleRouter({ router, protectedProcedure } as never)

export const appRouter = router({
  auth: authRouter as never,
  crud: crudRouter as never,
  console: consoleRouter as never,
})

export type AppRouter = typeof appRouter