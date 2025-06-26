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
export {
  createConfigWatcher,
  createSimpleConfigWatcher,
  ConfigWatcher,
  type ConfigWatchOptions as WatcherOptions,
  type ConfigChangeEvent as FileChangeEvent,
  type ConfigWatcherEvents
} from './config/watcher'

// 可观测性
export * from './observability'

// 审计系统
export * from './audit'

// 国际化
export * from './i18n'

// CLI系统
export * from './cli'

// 工具函数
export * from './utils'

// 默认实例导出
export { PluginSystem } from './plugin'
export { ConfigManager } from './config'
export { metrics as Metrics } from './observability/metrics'
export { logger as Logger } from './observability/logger'