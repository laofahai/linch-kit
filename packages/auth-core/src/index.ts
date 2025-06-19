/**
 * @linch-kit/auth-core
 *
 * Modular authentication and authorization system for Linch Kit
 */

// Core exports
export * from './core'
export * from './types'
export * from './schemas'
export * from './providers'

// i18n exports
export * from './i18n'

// Generators exports
export * from './generators'

// Config plugin exports (safe for frontend) - 只导出配置插件，不导出 CLI 插件
export { authCoreConfigPlugin, registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// Legacy config exports (for backward compatibility)
// Note: config functionality moved to plugins

// Auto-register config plugin when package is imported (safe for frontend)
import { registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// Register config plugin automatically (CLI plugin moved to separate entry)
registerAuthCoreConfigPlugin()
