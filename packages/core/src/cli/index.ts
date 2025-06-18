/**
 * @ai-context CLI 模块导出
 * @ai-purpose 统一导出 CLI 相关的所有功能
 * @ai-usage 可以通过 @linch-kit/core/cli 单独导入 CLI 功能
 */

// AI: 主 CLI 类和函数
export { LinchCLI, createCLI, cli } from '../cli'

// AI: 核心组件
export { CommandRegistry } from './core/command-registry'
export { PluginLoader } from './core/plugin-loader'
export { ConfigManager } from './core/config-manager'

// AI: 内置命令
export { builtinCommands } from './commands'
export * from './commands'

// AI: 类型定义
export * from '../types/cli'
