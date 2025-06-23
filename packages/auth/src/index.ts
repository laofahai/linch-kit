/**
 * @linch-kit/auth
 *
 * Modular authentication and authorization system for Linch Kit
 *
 * 临时优化版本：为了解决 DTS 构建超时问题，暂时使用简化的实现
 * TODO: 在 Schema 包 DTS 构建性能优化完成后，恢复完整功能
 */

// Core exports
export * from './core'
export * from './types'

// 导出所有恢复的 schemas
export * from './schemas'

export * from './providers'

// i18n exports
export * from './i18n'

// Generators exports（已简化，移除 Schema 包依赖）
export * from './generators'

// Config plugin exports (safe for frontend) - 只导出配置插件，不导出 CLI 插件
export { authConfigPlugin, registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// Auto-register config plugin when package is imported (safe for frontend)
import { registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// Register config plugin automatically (CLI plugin moved to separate entry)
registerAuthCoreConfigPlugin()
