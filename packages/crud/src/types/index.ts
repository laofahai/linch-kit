/**
 * @linch-kit/crud 类型定义
 *
 * 提供CRUD操作相关的所有类型定义，包括：
 * - 查询类型
 * - 操作选项
 * - 缓存配置
 * - 权限配置
 */

import type { LinchKitUser } from '@linch-kit/auth'
import type { Entity, FieldDefinition } from '@linch-kit/schema'

/**
 * 日志器接口
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, error?: Error, data?: Record<string, unknown>): void
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void
  child(bindings: Record<string, unknown>): Logger
}

/**
 * Schema注册表接口
 * 用于存储和检索实体定义
 */
export interface SchemaRegistry {
  /**
   * 获取实体定义
   */
  getEntity(name: string): Entity | undefined

  /**
   * 注册实体
   */
  registerEntity(entity: Entity): void

  /**
   * 获取所有实体名称
   */
  getEntityNames(): string[]

  /**
   * 检查实体是否存在
   */
  hasEntity(name: string): boolean
}

/**
 * 查询操作符
 */
export type Operator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'like'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'between'

/**
 * WHERE 查询条件
 */
export interface WhereClause {
  field: string
  operator: Operator
  value: unknown
}

/**
 * 排序条件
 */
export interface OrderByClause {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * 查询输入
 */
export interface QueryInput {
  where?: WhereClause[]
  orderBy?: OrderByClause[]
  include?: string[]
  limit?: number
  offset?: number
  distinct?: string[]
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * 分页查询结果
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationInfo
}

/**
 * 基础CRUD选项
 */
export interface CrudOptions {
  /** 跳过权限检查 */
  skipPermissions?: boolean
  /** 跳过数据验证 */
  skipValidation?: boolean
  /** 操作用户 */
  user?: LinchKitUser
  /** 租户ID */
  tenantId?: string
  /** 操作来源 */
  source?: string
  /** 启用缓存 */
  useCache?: boolean
  /** 缓存TTL（秒） */
  cacheTTL?: number
  /** 审计日志标识 */
  auditId?: string
}

/**
 * 查询选项
 */
export interface FindOptions extends CrudOptions {
  /** 启用软删除过滤 */
  includeSoftDeleted?: boolean
  /** 返回总数 */
  includeCount?: boolean
}

/**
 * 批量操作选项
 */
export interface BatchOptions extends CrudOptions {
  /** 跳过重复记录 */
  skipDuplicates?: boolean
  /** 返回创建的记录 */
  returnRecords?: boolean
  /** 批量大小 */
  batchSize?: number
}

/**
 * Upsert 操作选项
 */
export interface UpsertOptions extends CrudOptions {
  /** 包含关联数据 */
  include?: Record<string, boolean>
}

/**
 * 创建输入类型
 */
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

/**
 * 更新输入类型
 */
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>

/**
 * Upsert 输入类型
 */
export type UpsertInput<T extends { id: unknown }> = Partial<T> & Pick<T, 'id'>

/**
 * 聚合操作类型
 */
export type AggregateOperation = 'count' | 'sum' | 'avg' | 'min' | 'max'

/**
 * 聚合查询结果
 */
export interface AggregateResult {
  operation: AggregateOperation
  field?: string
  value: number
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 启用缓存 */
  enabled: boolean
  /** 默认TTL（秒） */
  defaultTTL: number
  /** 最大缓存大小 */
  maxSize: number
  /** Redis连接配置 */
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
    keyPrefix?: string
  }
  /** 本地缓存配置 */
  local?: {
    maxSize: number
    ttl: number
  }
}

/**
 * 验证错误
 */
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

/**
 * 权限错误
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly resource?: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 验证异常
 */
export class ValidationException extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationError[]
  ) {
    super(message)
    this.name = 'ValidationException'
  }
}

/**
 * CRUD操作结果
 */
export interface CrudResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: ValidationError[]
  metadata?: {
    operation: string
    timestamp: Date
    user?: string
    tenantId?: string
  }
}

/**
 * 批量操作结果
 */
export interface BatchResult<T> {
  success: boolean
  data: T[]
  errors: Array<{
    index: number
    error: string
    validationErrors?: ValidationError[]
  }>
  metadata: {
    total: number
    processed: number
    succeeded: number
    failed: number
    operation: string
    timestamp: Date
  }
}

/**
 * 事务上下文
 */
export interface TransactionContext {
  id: string
  user?: LinchKitUser
  tenantId?: string
  operations: Array<{
    type: 'create' | 'update' | 'delete'
    entity: string
    data: unknown
    timestamp: Date
  }>
  startTime: Date
  metadata?: Record<string, unknown>
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string
  operation: 'create' | 'read' | 'update' | 'delete'
  entityName: string
  entityId?: string
  userId?: string
  tenantId?: string
  changes?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
  timestamp: Date
  source?: string
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  operation: string
  entityName: string
  duration: number
  cacheHit?: boolean
  recordsAffected?: number
  queryComplexity?: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * CRUD管理器接口
 */
export interface ICrudManager {
  create<T>(entityName: string, data: CreateInput<T>, options?: CrudOptions): Promise<T>
  findById<T>(entityName: string, id: string, options?: FindOptions): Promise<T | null>
  findMany<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T[]>
  findOne<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T | null>
  update<T>(entityName: string, id: string, data: UpdateInput<T>, options?: CrudOptions): Promise<T>
  delete(entityName: string, id: string, options?: CrudOptions): Promise<boolean>
  count(entityName: string, query?: QueryInput, options?: FindOptions): Promise<number>
  exists(entityName: string, query?: QueryInput, options?: FindOptions): Promise<boolean>
  paginate<T>(
    entityName: string,
    query?: QueryInput,
    page?: number,
    pageSize?: number,
    options?: FindOptions
  ): Promise<PaginatedResult<T>>
}

/**
 * 查询构建器接口
 */
export interface IQueryBuilder<T = unknown> {
  where(field: keyof T, operator: Operator, value: unknown): this
  whereIn(field: keyof T, values: unknown[]): this
  whereNull(field: keyof T): this
  whereNotNull(field: keyof T): this
  whereBetween(field: keyof T, min: unknown, max: unknown): this
  include(relation: string): this
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  paginate(page: number, pageSize: number): this
  execute(): Promise<T[]>
  first(): Promise<T | null>
  count(): Promise<number>
  exists(): Promise<boolean>
  sum(field: keyof T): Promise<number>
  avg(field: keyof T): Promise<number>
  min(field: keyof T): Promise<number>
  max(field: keyof T): Promise<number>
}

/**
 * 批量操作接口
 */
export interface IBatchOperations {
  createMany<T>(entityName: string, data: CreateInput<T>[], options?: BatchOptions): Promise<T[]>
  updateMany<T>(
    entityName: string,
    query: QueryInput,
    data: UpdateInput<T>,
    options?: BatchOptions
  ): Promise<number>
  deleteMany(entityName: string, query: QueryInput, options?: BatchOptions): Promise<number>
  upsertMany<T extends { id: unknown }>(
    entityName: string,
    data: UpsertInput<T>[],
    options?: UpsertOptions
  ): Promise<T[]>
}

/**
 * 缓存管理器接口
 */
export interface ICacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  invalidate(pattern: string): Promise<void>
  clear(): Promise<void>
  generateKey(entityName: string, operation: string, params: unknown): string
}

/**
 * 权限检查器接口
 */
export interface IPermissionChecker {
  checkCreate(entity: Entity, user: LinchKitUser, data: unknown): Promise<void>
  checkRead(entity: Entity, user: LinchKitUser, resource?: unknown): Promise<void>
  checkUpdate(entity: Entity, user: LinchKitUser, resource: unknown, data: unknown): Promise<void>
  checkDelete(entity: Entity, user: LinchKitUser, resource: unknown): Promise<void>
  filterFields<T>(
    entity: Entity,
    user: LinchKitUser,
    data: T[],
    operation: 'read' | 'write'
  ): Promise<Partial<T>[]>
  buildRowFilter(
    entity: Entity,
    user: LinchKitUser,
    operation: 'read' | 'write' | 'delete'
  ): Promise<Record<string, unknown>>
}

/**
 * 验证管理器接口
 */
export interface IValidationManager {
  validateCreate(entity: Entity, data: unknown): Promise<ValidationError[]>
  validateUpdate(entity: Entity, id: string, data: unknown): Promise<ValidationError[]>
  validateQuery(entity: Entity, query: QueryInput): Promise<ValidationError[]>
  validateField(field: FieldDefinition, value: unknown): Promise<ValidationError[]>
}
