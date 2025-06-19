/**
 * @linch-kit/crud - Type-safe CRUD operations and state management
 * 
 * 这是一个框架无关的 CRUD 核心包，提供：
 * - 类型安全的 CRUD 操作
 * - 权限集成
 * - Schema 集成
 * - 状态管理
 * - 事件系统
 * - 查询构建器
 * - 数据源抽象
 */

// 导出所有类型
export * from './types'

// 导出核心实现
export { CRUDManager } from './core/crud-manager'
export { CRUDOperationsImpl } from './core/crud-operations'
export { CRUDPermissionManager } from './permissions/permission-manager'
export { CRUDSchemaAdapter } from './schema/schema-adapter'
export { CRUDStateManager } from './state/state-manager'
export * from './trpc'
export * from './factory'

// 版本信息
export const CRUD_VERSION = '0.1.0'
