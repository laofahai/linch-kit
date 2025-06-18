import { createContext, type Context } from './context'
import type { AnyRouter } from '@trpc/server'

// 临时用户类型，等待 auth-core 集成
type AuthUser = {
  id: string
  name?: string | null
  email?: string | null
  [key: string]: any
}

/**
 * 创建服务器端调用的辅助函数
 *
 * @param appRouter 应用定义的 tRPC 路由
 * @returns 服务器端调用工具
 *
 * @example
 * // 在应用中创建
 * import { appRouter } from './routers';
 * import { createTrpcServer } from '@linch-kit/trpc';
 *
 * export const { trpcServer, trpcServerWithUser } = createTrpcServer(appRouter);
 */
export function createTrpcServer<T extends AnyRouter>(appRouter: T) {
  /**
   * 在服务端组件中直接调用 tRPC 过程
   *
   * @example
   * const reports = await trpcServer.report.list.query({ limit: 10 });
   */
  const trpcServer = appRouter.createCaller(async () => {
    return await createContext()
  })

  /**
   * 使用特定用户上下文调用 tRPC 过程
   *
   * @example
   * const reports = await trpcServerWithUser(user).report.list.query({ limit: 10 });
   */
  const trpcServerWithUser = (user: AuthUser) => {
    return appRouter.createCaller({
      user,
      session: null,
      tenant: null
    } as Context)
  }

  return { trpcServer, trpcServerWithUser }
}

export * from './context'
export * from './types'
