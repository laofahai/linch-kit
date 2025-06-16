import { appRouter } from './index'
import { createContext } from './context'
import { AuthManager, SessionUser } from '@flex-report/auth'

/**
 * 在服务端组件中直接调用 tRPC 过程
 *
 * @example
 * const reports = await trpcServer.report.list.query({ limit: 10 });
 */
export const trpcServer = appRouter.createCaller(async () => {
  const context = await createContext()
  return context
})

/**
 * 使用特定用户上下文调用 tRPC 过程
 *
 * @example
 * const reports = await trpcServerWithUser(user).report.list.query({ limit: 10 });
 */
export const trpcServerWithUser = (user: SessionUser) => {
  return appRouter.createCaller({
    user,
    authManager: {} as AuthManager, // 占位，实际使用时需替换
  })
}
