/**
 * Extension系统模块
 * @module extension
 */

// Extension类型定义
export * from './types'

// 增强的Plugin系统（支持Extension）
export * from './enhanced-plugin'

// Extension管理器（如果需要完整管理器功能）
// export * from './manager'

// 默认实例
export { enhancedPluginRegistry as ExtensionRegistry } from './enhanced-plugin'