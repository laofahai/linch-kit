/**
 * LinchKit Core - 基础设施包主入口
 * @module @linch-kit/core
 */

// 类型导出
export * from './types'

// 插件系统
export * from './plugin'

// 配置管理
export * from './config'
export {
  createNextjsEnvProvider,
  NextjsEnvProvider,
  type NextjsEnvConfig
} from './config/nextjs-provider'
export {
  createSimpleTenantConfigManager,
  SimpleTenantConfigManager,
  type TenantConfigOptions,
  type TenantConfig as SimpleTenantConfig,
  type TenantConfigEvents
} from './config/simple-tenant-manager'
// Note: ConfigWatcher has been moved to './server.ts' for server-side only usage

// 可观测性 - 移至 server.ts 以避免客户端加载
// export * from './observability'

// 审计系统
export * from './audit'

// 国际化
export * from './i18n'

// Note: CLI system has been moved to './server.ts' for server-side only usage

// 工具函数
export * from './utils'

// 默认实例导出
export { PluginSystem } from './plugin'
export { ConfigManager } from './config'
// export { metrics as Metrics } from './observability/metrics-client-safe'
export { logger as Logger } from './logger-client'