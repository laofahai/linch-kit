/**
 * tRPC 服务端入口文件
 */

import type { AnyRouter } from '@trpc/server'

import { createContext, type Context } from './context'
import type { AuthUser } from './types'

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

// 核心导出
export * from './context'
export * from './types'

// 路由器导出 (避免与中间件冲突)
export {
  t,
  router,
  procedure,
  middleware,
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  tenantProcedure,
  createPermissionProcedure
} from './router'

// 中间件导出 (使用命名空间避免冲突)
export * as middlewares from '../middleware'

// Auth Core 集成导出
export * from '../integrations/auth-core'
