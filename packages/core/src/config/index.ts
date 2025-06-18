/**
 * @linch-kit/config
 * 
 * Unified configuration management for Linch Kit
 */

// 类型定义
export * from './types'

// 配置加载器
export {
  findConfigFile,
  loadLinchConfig,
  FileConfigProvider,
  MemoryConfigProvider,
  ConfigManager
} from './loader'

// 配置模板
export {
  generateConfigTemplate,
  configPresets
} from './templates'

// AI: 数据库配置通过 Prisma 和配置文件处理，不需要专门的数据库配置提供者

// 主要导出
export type { ConfigFileType } from './loader'
