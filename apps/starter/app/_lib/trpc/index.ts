/**
 * tRPC 应用层配置
 *
 * 这个文件是应用中 tRPC 的主入口点，导出所有需要的工具和实例
 */

// 客户端工具
export { trpc } from '@linch-kit/trpc'
export type { RouterInputs, RouterOutputs } from '@linch-kit/trpc'

// 服务器端工具 (基于我们之前创建的 server.ts)
export { trpcServer, trpcServerWithUser } from './server'

// 路由定义
export { appRouter } from './routers'
export type { AppRouter } from './routers'

// 路由构建工具
export {
  trpcRouter,
  publicProcedure,
  createProtectedProcedure,
  createProcedureWithPermission,
} from './router'
