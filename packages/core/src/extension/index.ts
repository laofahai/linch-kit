/**
 * Extension系统模块
 * @module extension
 */

// Extension类型定义
export * from './types'

// 统一的Extension管理器
export { UnifiedExtensionManager, unifiedExtensionManager } from './unified-manager'

// 向后兼容的导出
export { unifiedExtensionManager as extensionManager } from './unified-manager'

// 热重载管理器 - 已移至 server.ts (需要 chokidar，仅限服务端)
// export { HotReloadManager, createHotReloadManager } from './hot-reload'

// 状态管理器
export { ExtensionStateManager, createStateManager } from './state-manager'

// 权限管理器
export {
  ExtensionPermissionManager,
  createPermissionManager,
  permissionManager,
} from './permission-manager'

// 性能监控系统
export {
  ExtensionPerformanceMonitor,
} from './performance-optimizations'
export {
  ExtensionPerformanceAnalyzer,
  type PerformanceReport,
  type SystemPerformanceSnapshot,
  type PerformanceMonitoringConfig,
  defaultPerformanceConfig,
} from './performance-analytics'

// 沙箱环境 (暂时禁用以修复构建问题)
// export { ExtensionSandbox, createSandbox } from './sandbox'

// 导出类型 - HotReload 已移至 server.ts
// export type { HotReloadConfig, HotReloadEvent } from './hot-reload'

export type {
  ExtensionState,
  ExtensionMetrics,
  ExtensionHealth,
  HealthCheck,
  StateUpdateEvent,
} from './state-manager'

export type {
  PermissionPolicy,
  PermissionContext,
  PermissionGrant,
  PermissionEvent,
} from './permission-manager'

// export type { SandboxConfig, SandboxedFunction, SandboxExecution } from './sandbox'

// 默认实例
export { unifiedExtensionManager as ExtensionRegistry } from './unified-manager'
