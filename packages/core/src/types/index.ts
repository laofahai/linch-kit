/**
 * @ai-context Linch Kit Core 类型定义
 * @ai-purpose 为整个核心包提供类型安全和 AI 理解支持
 * @ai-design-principle 所有接口都包含 AI 标注，便于自动化处理
 */

// AI: 导出所有类型模块
export * from './cli'
export * from './config'
export * from './common'

// AI: 重新导出常用类型，便于使用
export type {
  // CLI 相关类型
  CommandMetadata,
  CommandPlugin,
  CLIContext,
  CommandHandler
} from './cli'

export type {
  // 配置相关类型
  ConfigProvider,
  ConfigSchema,
  SchemaConfig,
  DatabaseConfig,
  LinchConfig
} from './config'

export type {
  // 通用类型
  LogLevel,
  AITag
} from './common'
