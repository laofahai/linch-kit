/**
 * LinchKit Core - 基础设施包主入口
 * @module @linch-kit/core
 */

// 类型导出
export * from './types'

// 插件系统
export * from './plugin'

// 配置管理 (客户端安全)
export {
  createNextjsClientEnvProvider,
  NextjsClientEnvProvider,
  type NextjsClientEnvConfig
} from './config/nextjs-provider-client'
export {
  createSimpleTenantConfigManager,
  SimpleTenantConfigManager,
  type TenantConfigOptions,
  type TenantConfig as SimpleTenantConfig,
  type TenantConfigEvents
} from './config/simple-tenant-manager'
// Note: ConfigManager 和 ConfigWatcher 已移至 './server.ts' (需要文件系统访问)

// 可观测性 - 移至 server.ts 以避免客户端加载
// export * from './observability'

// 审计系统
export * from './audit'

// 国际化
export * from './i18n'

// Note: CLI system has been moved to './server.ts' for server-side only usage

// 工具函数 - 客户端安全
export * from './utils/index-client'

// 初始化系统
export * from './init'

// 默认实例导出
export { PluginSystem } from './plugin'
// ConfigManager 已移至 server.ts (需要文件系统访问)
// export { metrics as Metrics } from './observability/metrics-client-safe'
export { logger as Logger, createLogger } from './logger-client'