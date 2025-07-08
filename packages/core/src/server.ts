/**
 * LinchKit Core - 服务端专用功能
 * @module @linch-kit/core/server
 *
 * 这个文件包含只能在 Node.js 环境中使用的功能
 * 客户端代码不应该导入这个文件
 */

// 配置管理器 (使用 fs，仅限服务端)
export { ConfigManager } from './config'

// 配置文件监听器 (使用 chokidar，仅限服务端)
export {
  createConfigWatcher,
  createSimpleConfigWatcher,
  ConfigWatcher,
  type ConfigWatchOptions as WatcherOptions,
  type ConfigChangeEvent as FileChangeEvent,
  type ConfigWatcherEvents,
} from './config/watcher'

// CLI 系统 (使用 commander，仅限服务端)
export * from './cli'

// 审计存储 - 文件系统 (使用 Node.js fs/stream，仅限服务端)
export { FileAuditStore, type FileStoreConfig } from './audit/stores/file-store'

// 审计工厂函数 - 服务端专用
export { createSimpleFileAuditManager, createFileAuditManager } from './audit/server-factory'

// 可观测性 - 服务端完整功能 (包括 Pino 日志器)
export * from './observability'

// 网络工具 - 服务端专用 (使用 Node.js http/os 模块)
export * from './utils/network'
