import { router } from '@linch-kit/trpc'
import { tenantRouter } from './tenant.router'
import { userRouter } from './user.router'

/**
 * Console 模块主路由器
 * 包含所有 Console 相关的子路由
 */
export const consoleRouter = router({
  tenant: tenantRouter,
  user: userRouter,
  // TODO: 添加其他路由
  // plugin: pluginRouter,
  // monitoring: monitoringRouter,
})

export type ConsoleRouter = typeof consoleRouter