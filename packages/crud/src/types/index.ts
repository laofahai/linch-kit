/**
 * @linch-kit/crud 核心类型定义
 */

// 重新导出所有类型
export * from './crud-operations'
export * from './crud-permissions'
export * from './crud-config'
export * from './crud-state'
export * from './data-source'
export * from './query-builder'
export * from './events'
export * from './trpc-integration'

// 通用工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 分页相关类型
export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// 排序相关类型
export type SortDirection = 'asc' | 'desc'

export interface SortOption {
  field: string
  direction: SortDirection
}

export type SortOptions = SortOption[]

// 筛选相关类型
export type FilterOperator = 
  | 'eq'      // 等于
  | 'ne'      // 不等于
  | 'gt'      // 大于
  | 'gte'     // 大于等于
  | 'lt'      // 小于
  | 'lte'     // 小于等于
  | 'in'      // 包含在数组中
  | 'nin'     // 不包含在数组中
  | 'like'    // 模糊匹配
  | 'ilike'   // 不区分大小写模糊匹配
  | 'regex'   // 正则表达式
  | 'exists'  // 字段存在
  | 'null'    // 字段为空
  | 'between' // 在范围内

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
  values?: any[] // 用于 in, nin, between 等操作
}

export type FilterOptions = FilterCondition[]

// 搜索相关类型
export interface SearchOptions {
  query: string
  fields?: string[] // 搜索的字段，如果不指定则搜索所有可搜索字段
  fuzzy?: boolean   // 是否模糊搜索
  highlight?: boolean // 是否高亮搜索结果
}

// 列表查询选项
export interface ListOptions {
  pagination?: PaginationOptions
  sort?: SortOptions
  filters?: FilterOptions
  search?: SearchOptions
  fields?: string[] // 要返回的字段
  include?: string[] // 要包含的关联数据
}

// 创建和更新输入类型
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInput<T> = DeepPartial<Omit<T, 'id' | 'createdAt'>>

// 批量操作类型
export interface BulkUpdateInput<T> {
  id: string
  data: UpdateInput<T>
}

export interface BulkOperationResult {
  success: boolean
  processed: number
  failed: number
  errors?: Array<{
    id: string
    error: string
  }>
}

// API 响应格式
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  meta?: Record<string, any>
}

export interface APIError {
  code: string
  message: string
  details?: any
  field?: string
}

// 验证相关类型
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// CRUDContext 从 crud-operations 导出，避免重复定义

// 操作结果类型
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: APIError
  warnings?: string[]
  metadata?: Record<string, any>
}
