/**
 * CRUD 操作相关类型定义
 */

import type {
  ListOptions,
  PaginatedResponse,
  CreateInput,
  UpdateInput,
  BulkUpdateInput,
  BulkOperationResult,
  OperationResult,
  SearchOptions
} from './index'

// CRUDContext 定义在这里，避免循环导入
export interface CRUDContext {
  user?: any
  tenant?: string
  permissions?: Record<string, boolean>
  metadata?: Record<string, any>
}

/**
 * 基础 CRUD 操作接口
 */
export interface CRUDOperations<T> {
  // 查询操作
  list(options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  get(id: string, context?: CRUDContext): Promise<T | null>
  search(options: SearchOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  count(options?: Omit<ListOptions, 'pagination'>, context?: CRUDContext): Promise<number>
  
  // 变更操作
  create(data: CreateInput<T>, context?: CRUDContext): Promise<OperationResult<T>>
  update(id: string, data: UpdateInput<T>, context?: CRUDContext): Promise<OperationResult<T>>
  delete(id: string, context?: CRUDContext): Promise<OperationResult<void>>
  
  // 批量操作
  bulkCreate(data: CreateInput<T>[], context?: CRUDContext): Promise<OperationResult<T[]>>
  bulkUpdate(updates: BulkUpdateInput<T>[], context?: CRUDContext): Promise<BulkOperationResult>
  bulkDelete(ids: string[], context?: CRUDContext): Promise<BulkOperationResult>
  
  // 高级操作
  duplicate(id: string, overrides?: Partial<CreateInput<T>>, context?: CRUDContext): Promise<OperationResult<T>>
  restore(id: string, context?: CRUDContext): Promise<OperationResult<T>> // 软删除恢复
  archive(id: string, context?: CRUDContext): Promise<OperationResult<void>> // 归档
}

/**
 * 扩展的 CRUD 操作接口
 */
export interface ExtendedCRUDOperations<T> extends CRUDOperations<T> {
  // 关联操作
  getRelated<R>(id: string, relation: string, options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<R>>
  addRelation(id: string, relation: string, relatedId: string, context?: CRUDContext): Promise<OperationResult<void>>
  removeRelation(id: string, relation: string, relatedId: string, context?: CRUDContext): Promise<OperationResult<void>>
  
  // 导入导出
  export(options?: ListOptions, format?: 'csv' | 'xlsx' | 'json', context?: CRUDContext): Promise<OperationResult<string>>
  import(data: any[], options?: ImportOptions, context?: CRUDContext): Promise<BulkOperationResult>
  
  // 版本控制
  getVersions(id: string, context?: CRUDContext): Promise<PaginatedResponse<T>>
  revertToVersion(id: string, version: string, context?: CRUDContext): Promise<OperationResult<T>>
}

/**
 * 导入选项
 */
export interface ImportOptions {
  mode: 'create' | 'update' | 'upsert'
  skipValidation?: boolean
  skipDuplicates?: boolean
  mapping?: Record<string, string> // 字段映射
  transform?: (data: any) => any // 数据转换函数
}

/**
 * 操作类型枚举
 */
export enum CRUDOperation {
  LIST = 'list',
  GET = 'get',
  SEARCH = 'search',
  COUNT = 'count',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_CREATE = 'bulk_create',
  BULK_UPDATE = 'bulk_update',
  BULK_DELETE = 'bulk_delete',
  DUPLICATE = 'duplicate',
  RESTORE = 'restore',
  ARCHIVE = 'archive',
  EXPORT = 'export',
  IMPORT = 'import'
}

/**
 * 操作权限检查函数类型
 */
export type OperationPermissionChecker<T> = (
  operation: CRUDOperation,
  data?: T | CreateInput<T> | UpdateInput<T>,
  context?: CRUDContext
) => Promise<boolean> | boolean

/**
 * 字段权限检查函数类型
 */
export type FieldPermissionChecker<T> = (
  field: keyof T,
  operation: 'read' | 'write',
  data?: T,
  context?: CRUDContext
) => Promise<boolean> | boolean

/**
 * 行级权限检查函数类型
 */
export type RowPermissionChecker<T> = (
  operation: CRUDOperation,
  data: T,
  context?: CRUDContext
) => Promise<boolean> | boolean

/**
 * 数据转换函数类型
 */
export type DataTransformer<T, R = T> = (
  data: T,
  operation: CRUDOperation,
  context?: CRUDContext
) => Promise<R> | R

/**
 * 数据验证函数类型
 */
export type DataValidator<T> = (
  data: CreateInput<T> | UpdateInput<T>,
  operation: 'create' | 'update',
  context?: CRUDContext
) => Promise<ValidationResult> | ValidationResult

/**
 * 操作钩子函数类型
 */
export interface CRUDHooks<T> {
  // 操作前钩子
  beforeList?: (options?: ListOptions, context?: CRUDContext) => Promise<void> | void
  beforeGet?: (id: string, context?: CRUDContext) => Promise<void> | void
  beforeCreate?: (data: CreateInput<T>, context?: CRUDContext) => Promise<CreateInput<T>> | CreateInput<T>
  beforeUpdate?: (id: string, data: UpdateInput<T>, context?: CRUDContext) => Promise<UpdateInput<T>> | UpdateInput<T>
  beforeDelete?: (id: string, context?: CRUDContext) => Promise<void> | void
  
  // 操作后钩子
  afterList?: (result: PaginatedResponse<T>, options?: ListOptions, context?: CRUDContext) => Promise<void> | void
  afterGet?: (result: T | null, id: string, context?: CRUDContext) => Promise<void> | void
  afterCreate?: (result: T, data: CreateInput<T>, context?: CRUDContext) => Promise<void> | void
  afterUpdate?: (result: T, id: string, data: UpdateInput<T>, context?: CRUDContext) => Promise<void> | void
  afterDelete?: (id: string, context?: CRUDContext) => Promise<void> | void
  
  // 错误处理钩子
  onError?: (error: Error, operation: CRUDOperation, context?: CRUDContext) => Promise<void> | void
}

/**
 * 验证结果类型
 */
export interface ValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
}
