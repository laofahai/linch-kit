/**
 * @ai-context Linch Kit Core 包主入口
 * @ai-purpose 统一导出 CLI、配置管理和工具函数
 * @ai-architecture 模块化导出，支持按需导入
 * @ai-usage 既可以作为 CLI 工具，也可以作为库使用
 */

// AI: CLI 系统导出
export { LinchCLI, cli, createCLI } from './cli'
export { CommandRegistry } from './cli/core/command-registry'
export { ConfigManager } from './cli/core/config-manager'
export { PluginLoader } from './cli/core/plugin-loader'

// AI: 配置管理导出
export * from './config'

// AI: 工具函数导出
export * from './utils'

// AI: 类型定义导出 (仅导出不冲突的类型)
export type {
    AITag, AbstractConstructor, AsyncResult, AuthConfig, CLIConfig,
    // CLI 相关类型
    CLIContext,
    CommandMetadata,
    CommandPlugin, Constructor, DatabaseConfig, DatabaseProvider,
    DeepPartial,
    DeepRequired, Environment, ExtractArgs, ExtractPromise, ExtractReturn, KeyValue,
    // 配置相关类型
    LinchConfig,
    // 通用类型
    LogLevel, Mixin, Named, Option, OptionalConfig, PaginatedResult, PaginationParams, Progress, SchemaConfig, Serializable, Timestamped, UnionToArray, Versioned
} from './types'

// AI: 为了向后兼容，导出 CLIPlugin 别名
export type { CommandPlugin as CLIPlugin } from './types'

// AI: 便捷的命名空间导出
export * as CLI from './cli'
export * as Config from './config'
export * as Utils from './utils'

/**
 * @ai-constant 包版本信息
 * @ai-purpose 提供包的版本和元信息
 */
export const VERSION = '0.1.0'
export const PACKAGE_NAME = '@linch-kit/core'

/**
 * @ai-constant AI 元数据
 * @ai-purpose 为 AI 系统提供包的元信息
 */
export const AI_METADATA = {
  purpose: 'Linch Kit 核心包，提供 CLI、配置管理和基础工具',
  architecture: '模块化核心架构',
  keyFeatures: [
    'unified CLI system',
    'configuration management', 
    'plugin system',
    'development tools',
    'AI-first design'
  ],
  extensionPoints: [
    'CLI commands',
    'configuration schemas',
    'plugins',
    'utility functions'
  ]
} as const
