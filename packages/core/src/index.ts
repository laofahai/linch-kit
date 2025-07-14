/**
 * LinchKit Core - 基础设施包主入口
 * @module @linch-kit/core
 */

// 类型导出
export * from './types'

// Extension系统（统一插件和扩展）
export * from './extension'

// 应用注册器系统
export * from './registry/app-registry'

// 配置管理 (客户端安全)
export {
  createNextjsClientEnvProvider,
  NextjsClientEnvProvider,
  type NextjsClientEnvConfig,
} from './config/nextjs-provider-client'
export {
  createSimpleTenantConfigManager,
  SimpleTenantConfigManager,
  type TenantConfigOptions,
  type TenantConfig as SimpleTenantConfig,
  type TenantConfigEvents,
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

// React 组件 (可选导入)
export * from './react'

// 默认实例导出
export { unifiedExtensionManager as ExtensionManager } from './extension'
// ConfigManager 已移至 server.ts (需要文件系统访问)
export { metrics as Metrics, createMetricCollector } from './metrics'
export { logger as Logger, createLogger, createNamespacedLogger } from './logger'
