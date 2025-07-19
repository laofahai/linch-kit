/**
 * Console 模块服务层导出
 *
 * 提供所有 Console 模块的业务逻辑服务
 */

// 导出所有服务类和实例
export * from './tenant.service'
export * from './plugin.service'
export * from './user.service'
export * from './auth.service'

// 导入服务实例
import { tenantService } from './tenant.service'
import { pluginService } from './plugin.service'
import { userService } from './user.service'
import { consoleAuthService } from './auth.service'

/**
 * Console 服务集合
 * 提供统一的服务访问接口
 */
export const consoleServices = {
  tenant: tenantService,
  plugin: pluginService,
  user: userService,
  auth: consoleAuthService,
} as const

/**
 * 服务类型定义
 */
export type ConsoleServices = typeof consoleServices

/**
 * 服务名称类型
 */
export type ConsoleServiceName = keyof ConsoleServices

/**
 * 创建带有依赖注入的服务工厂
 */
export interface ConsoleServiceConfig {
  db?: Record<string, unknown> // Prisma 客户端实例
  logger?: Record<string, unknown> // 日志实例
  eventBus?: Record<string, unknown> // 事件总线实例
  [key: string]: Record<string, unknown> | undefined
}

/**
 * 服务工厂函数
 * 用于在运行时根据配置创建服务实例
 */
export function createConsoleServices(_config: ConsoleServiceConfig) {
  return {
    tenant: tenantService,
    plugin: pluginService,
    user: userService,
  }
}

/**
 * 默认导出所有服务
 */
export default consoleServices
