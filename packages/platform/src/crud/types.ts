/**
 * Type definitions for platform CRUD module
 * @module platform/crud/types
 */

import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 基础实体接口
 */
export interface BaseEntity {
  id: string | number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

/**
 * CRUD操作类型
 */
export type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list'

/**
 * 查询选项
 */
export interface QueryOptions<T = unknown> {
  where?: Partial<T> | Record<string, unknown>
  select?: Array<keyof T> | string[]
  include?: string[]
  orderBy?: Array<{ field: keyof T | string; direction: 'asc' | 'desc' }>
  limit?: number
  offset?: number
  cursor?: string | number
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
  totalPages: number
}

/**
 * CRUD操作结果
 */
export interface CrudResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    operation: CrudOperation
    timestamp: Date
    executionTime?: number
    affectedRows?: number
  }
}

/**
 * 批量操作结果
 */
export interface BatchResult<T = unknown> {
  success: boolean
  results: Array<CrudResult<T>>
  totalCount: number
  successCount: number
  failureCount: number
  errors: string[]
}

/**
 * CRUD事件数据
 */
export interface CrudEventData<T = unknown> {
  operation: CrudOperation
  entityName: string
  data?: T | T[]
  result?: T | T[]
  error?: Error | string
  metadata?: Record<string, unknown>
}

/**
 * CRUD中间件函数
 */
export type CrudMiddleware<T = unknown> = (context: {
  operation: CrudOperation
  entityName: string
  data?: T
  options?: QueryOptions<T>
  extensionContext?: ExtensionContext
}) => Promise<void> | void

/**
 * CRUD生命周期钩子
 */
export interface CrudHooks<T = unknown> {
  beforeCreate?: (data: Partial<T>, context?: ExtensionContext) => Promise<Partial<T>> | Partial<T>
  afterCreate?: (result: T, context?: ExtensionContext) => Promise<void> | void
  beforeRead?: (
    options: QueryOptions<T>,
    context?: ExtensionContext
  ) => Promise<QueryOptions<T>> | QueryOptions<T>
  afterRead?: (result: T | T[], context?: ExtensionContext) => Promise<void> | void
  beforeUpdate?: (
    id: string | number,
    data: Partial<T>,
    context?: ExtensionContext
  ) => Promise<Partial<T>> | Partial<T>
  afterUpdate?: (result: T, context?: ExtensionContext) => Promise<void> | void
  beforeDelete?: (id: string | number, context?: ExtensionContext) => Promise<void> | void
  afterDelete?: (success: boolean, context?: ExtensionContext) => Promise<void> | void
}

/**
 * CRUD配置选项
 */
export interface CrudConfig<T = unknown> {
  entityName: string
  tableName?: string
  primaryKey?: string
  timestamps?: boolean
  softDelete?: boolean
  hooks?: CrudHooks<T>
  middleware?: CrudMiddleware<T>[]
  cache?: {
    enabled: boolean
    ttl?: number
    tags?: string[]
  }
  permissions?: {
    create?: string | string[]
    read?: string | string[]
    update?: string | string[]
    delete?: string | string[]
  }
  validation?: {
    enabled: boolean
    strict?: boolean
  }
}

/**
 * 数据库适配器接口
 */
export interface DatabaseAdapter<T = unknown> {
  create(data: Partial<T>): Promise<T>
  findById(id: string | number): Promise<T | null>
  findMany(options: QueryOptions<T>): Promise<T[]>
  findFirst(options: QueryOptions<T>): Promise<T | null>
  update(id: string | number, data: Partial<T>): Promise<T>
  delete(id: string | number): Promise<boolean>
  count(options?: QueryOptions<T>): Promise<number>
  exists(id: string | number): Promise<boolean>
}

/**
 * 事务上下文
 */
export interface TransactionContext {
  id: string
  startTime: Date
  operations: Array<{
    operation: CrudOperation
    entityName: string
    timestamp: Date
  }>
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string
  userId?: string
  operation: CrudOperation
  entityName: string
  entityId: string | number
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  timestamp: Date
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

/**
 * 缓存策略
 */
export type CacheStrategy = 'memory' | 'redis' | 'database' | 'hybrid'

/**
 * 查询性能指标
 */
export interface QueryMetrics {
  executionTime: number
  rowsExamined: number
  rowsReturned: number
  cacheHit: boolean
  queryPlan?: string
}

/**
 * 扩展的CRUD管理器接口
 */
export interface ExtendedCrudManager<T = unknown> {
  // 基础CRUD操作
  create(data: Partial<T>): Promise<CrudResult<T>>
  findById(id: string | number): Promise<CrudResult<T>>
  findMany(options?: QueryOptions<T>): Promise<CrudResult<T[]>>
  update(id: string | number, data: Partial<T>): Promise<CrudResult<T>>
  delete(id: string | number): Promise<CrudResult<boolean>>

  // 批量操作
  createMany(data: Array<Partial<T>>): Promise<BatchResult<T>>
  updateMany(where: Partial<T>, data: Partial<T>): Promise<BatchResult<T>>
  deleteMany(where: Partial<T>): Promise<BatchResult<boolean>>

  // 高级查询
  findFirst(options: QueryOptions<T>): Promise<CrudResult<T>>
  count(options?: QueryOptions<T>): Promise<CrudResult<number>>
  exists(id: string | number): Promise<CrudResult<boolean>>

  // 分页查询
  paginate(
    options: QueryOptions<T> & { page: number; pageSize: number }
  ): Promise<CrudResult<PaginatedResult<T>>>

  // 聚合查询
  aggregate(options: {
    field: keyof T
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  }): Promise<CrudResult<number>>

  // 事务操作
  transaction<R>(callback: (tx: ExtendedCrudManager<T>) => Promise<R>): Promise<R>

  // 生命周期管理
  addHook<K extends keyof CrudHooks<T>>(event: K, hook: CrudHooks<T>[K]): void
  removeHook<K extends keyof CrudHooks<T>>(event: K, hook: CrudHooks<T>[K]): void

  // 缓存管理
  clearCache(pattern?: string): Promise<void>
  getCacheStats(): Promise<Record<string, unknown>>

  // 性能监控
  getMetrics(): Promise<QueryMetrics[]>
  resetMetrics(): Promise<void>
}

/**
 * 实体关系定义
 */
export interface EntityRelation {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'
  entity: string
  foreignKey?: string
  localKey?: string
  through?: string
  pivotTable?: string
}

/**
 * 实体定义
 */
export interface EntityDefinition {
  name: string
  tableName?: string
  primaryKey?: string
  fields: Record<string, FieldDefinition>
  relations?: Record<string, EntityRelation>
  indexes?: Array<{
    name: string
    fields: string[]
    unique?: boolean
  }>
  constraints?: Array<{
    name: string
    type: 'unique' | 'check' | 'foreign'
    fields: string[]
    reference?: { table: string; fields: string[] }
  }>
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'text' | 'email' | 'url'
  required?: boolean
  unique?: boolean
  default?: unknown
  length?: number
  precision?: number
  scale?: number
  enum?: string[]
  validation?: Record<string, unknown>
  index?: boolean
  description?: string
}

/**
 * 模式迁移
 */
export interface SchemaMigration {
  version: string
  name: string
  up: () => Promise<void>
  down: () => Promise<void>
  timestamp: Date
}

/**
 * 数据种子
 */
export interface DataSeed<T = unknown> {
  entityName: string
  data: T[]
  dependencies?: string[]
  order?: number
}
