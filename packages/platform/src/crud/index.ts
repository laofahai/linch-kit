/**
 * CRUD operations module - complete implementation
 * @module platform/crud
 */

// 重新导出CRUD核心功能 (完整实现，不依赖旧包)
export * from './crud-manager'
export * from './query-builder'
export * from './permission-checker'
export * from './validation-manager'
export * from './cache-manager'

// CRUD工厂函数（主要导出）
export * from './factory'

// CRUD特有类型（排除与schema重复的类型）
export type {
  BaseEntity,
  CrudOperation,
  QueryOptions,
  CrudPermission,
  CrudContext,
  CrudResult,
  CrudEvent,
  CacheOptions,
  CacheEntry,
  QueryBuilderOptions
} from './types'