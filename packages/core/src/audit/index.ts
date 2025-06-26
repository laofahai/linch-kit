/**
 * 审计系统模块导出
 * @module audit
 */

// 类型定义
export * from './types'

// 核心实现
export { DefaultAuditManager } from './audit-manager'
export { DefaultDataMasker } from './data-masker'

// 存储适配器
export { DatabaseAuditStore } from './stores/database-store'
export { FileAuditStore, type FileStoreConfig } from './stores/file-store'

// 便捷创建函数
export { createAuditManager } from './factory'