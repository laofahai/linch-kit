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

// Plugin exports (for core package integration) - 只导出插件实例，不导出类型
export { authCoreCliPlugin, registerAuthCoreCliPlugin } from './plugins/cli-plugin'
export { authCoreConfigPlugin, registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// Legacy config exports (for backward compatibility)
// Note: config functionality moved to plugins

// Auto-register plugins when package is imported
import { registerAuthCoreCliPlugin } from './plugins/cli-plugin'
import { registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// Register plugins automatically
registerAuthCoreCliPlugin()
registerAuthCoreConfigPlugin()
