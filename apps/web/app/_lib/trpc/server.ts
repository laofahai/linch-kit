/**
 * 服务器端调用 tRPC 过程的工具
 *
 * 用于在服务器组件中直接调用 tRPC 路由
 */

import { createTrpcServer } from '@flex-report/trpc'
import { appRouter } from './routers'

/**
 * 服务端 tRPC 调用实例
 *
 * @example
 * // 在服务器组件中
 * import { trpcServer } from '@/_lib/trpc/server'
 *
 * const data = await trpcServer.user.getCurrentUser()
 */
export const { trpcServer, trpcServerWithUser } = createTrpcServer(appRouter)
