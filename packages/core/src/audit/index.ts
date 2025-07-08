/**
 * 审计系统模块导出
 * @module audit
 */

// 类型定义
export * from './types'

// 核心实现
export { DefaultAuditManager } from './audit-manager'
export { DefaultDataMasker } from './data-masker'

// 存储适配器 (通用)
export { DatabaseAuditStore } from './stores/database-store'

// 注意：FileAuditStore 已移至 './server.ts' 用于服务端专用

// 便捷创建函数
export { createAuditManager } from './factory'
