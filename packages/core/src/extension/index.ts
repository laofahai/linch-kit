/**
 * Extension系统模块
 * @module extension
 */

// Extension类型定义
export * from './types'

// 增强的Plugin系统（支持Extension）
export * from './enhanced-plugin'

// Extension管理器（完整管理器功能）
export { ExtensionManager, extensionManager } from './manager'

// 热重载管理器
export { HotReloadManager, createHotReloadManager } from './hot-reload'

// 状态管理器
export { ExtensionStateManager, createStateManager } from './state-manager'

// 权限管理器
export {
  ExtensionPermissionManager,
  createPermissionManager,
  permissionManager,
} from './permission-manager'

// 沙箱环境
export { ExtensionSandbox, createSandbox } from './sandbox'

// 导出类型
export type { HotReloadConfig, HotReloadEvent } from './hot-reload'

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

export type { SandboxConfig, SandboxedFunction, SandboxExecution } from './sandbox'

// 默认实例
export { enhancedPluginRegistry as ExtensionRegistry } from './enhanced-plugin'
