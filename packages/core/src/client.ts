/**
 * LinchKit Core - 客户端安全入口
 * 仅包含可以在浏览器环境中安全使用的模块
 * @module @linch-kit/core/client
 */

// 客户端安全的Logger
export { logger as Logger, createLogger } from './logger-client'

// Extension系统 - 客户端安全版本
export {
  ClientUnifiedExtensionManager as ExtensionRegistry,
  clientExtensionManager,
} from './extension/unified-manager-client'

export type { ClientExtensionRegistration } from './extension/unified-manager-client'

// 通用类型
export type { OperationResult, ErrorInfo } from './types/common'

// Extension和Plugin类型
export type {
  Extension,
  ExtensionCapabilities,
  ExtensionPermission,
  ExtensionMetadata,
  ExtensionConfig,
} from './extension/types'

export type {
  Plugin,
  PluginMetadata,
  PluginConfig,
} from './types/plugin'

// 国际化系统 (纯JS，客户端安全)
export {
  createPackageI18n,
  useTranslation,
  coreI18n,
  type TranslationFunction,
  type PackageI18n,
  type PackageI18nOptions,
} from './i18n'

// React 组件移至 /react 入口

// Note: Provider 组合系统已移至独立导出
// 使用: import { LinchKitProvider, withTRPCProvider } from '@linch-kit/core/providers'

// 默认实例
export { clientExtensionManager as ExtensionSystem } from './extension/unified-manager-client'

// 客户端ExtensionManager（简化版，适合客户端使用）
export { clientExtensionManager as extensionManager } from './extension/unified-manager-client'

// 客户端 AppRegistry（简化版，适合客户端使用）
export class AppRegistry {
  // 简化存根实现，适合客户端使用
  registerPageRoute() {}
  registerMenu() {}
  registerComponent() {}
  getPageRoutes() { return [] }
  getMenus() { return [] }
  getComponent() { return null }
  overrideComponent() {}
  clear() {}
}

// 客户端状态类型（简化版）
export interface ExtensionState {
  /** Extension名称 */
  name: string
  /** 当前状态 */
  status: 'registered' | 'loading' | 'loaded' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
  /** 状态更新时间 */
  lastUpdated: number
  /** 启动时间 */
  startedAt?: number
  /** 停止时间 */
  stoppedAt?: number
  /** 错误信息 */
  error?: Error
  /** 性能指标 */
  metrics: ExtensionMetrics
  /** 健康状态 */
  health: ExtensionHealth
}

export interface ExtensionMetrics {
  /** 初始化耗时(ms) */
  initializationTime: number
  /** 启动耗时(ms) */
  startupTime: number
  /** 内存使用量(bytes) */
  memoryUsage: number
  /** CPU使用率(%) */
  cpuUsage: number
  /** 活跃连接数 */
  activeConnections: number
  /** 处理的请求数 */
  requestCount: number
  /** 错误次数 */
  errorCount: number
  /** 最后活跃时间 */
  lastActivity: number
}

export interface ExtensionHealth {
  /** 健康评分 (0-100) */
  score: number
  /** 健康状态 */
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  /** 检查项结果 */
  checks: HealthCheck[]
  /** 最后检查时间 */
  lastCheckTime: number
}

export interface HealthCheck {
  /** 检查名称 */
  name: string
  /** 检查状态 */
  status: 'pass' | 'fail' | 'warn'
  /** 检查消息 */
  message: string
  /** 检查时间 */
  timestamp: number
  /** 检查耗时(ms) */
  duration: number
}