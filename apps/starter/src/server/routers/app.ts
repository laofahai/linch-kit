import { router } from '@linch-kit/trpc'
import { authRouter } from '@linch-kit/auth'
import { crudRouter } from '@linch-kit/crud'
import { consoleRouter } from '@linch-kit/console'

// 初始化 Console 服务（必须在使用 consoleRouter 之前）
import '@/lib/console-setup'

export const appRouter = router({
  auth: authRouter,
  crud: crudRouter,
  console: consoleRouter,
})

export type AppRouter = typeof appRouter