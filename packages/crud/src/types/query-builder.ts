/**
 * 查询构建器相关类型定义
 */

import type {
  FilterOptions,
  SortOptions,
  PaginationOptions,
  SearchOptions,
  PaginatedResponse,
  ListOptions
} from './index'

/**
 * 查询构建器接口
 */
export interface QueryBuilder<T> {
  // 筛选方法
  where(field: keyof T, operator: FilterOperator, value: any): QueryBuilder<T>
  whereIn(field: keyof T, values: any[]): QueryBuilder<T>
  whereNotIn(field: keyof T, values: any[]): QueryBuilder<T>
  whereBetween(field: keyof T, min: any, max: any): QueryBuilder<T>
  whereNull(field: keyof T): QueryBuilder<T>
  whereNotNull(field: keyof T): QueryBuilder<T>
  whereLike(field: keyof T, pattern: string): QueryBuilder<T>
  whereILike(field: keyof T, pattern: string): QueryBuilder<T>
  
  // 逻辑操作
  and(callback: (builder: QueryBuilder<T>) => void): QueryBuilder<T>
  or(callback: (builder: QueryBuilder<T>) => void): QueryBuilder<T>
  not(callback: (builder: QueryBuilder<T>) => void): QueryBuilder<T>
  
  // 排序方法
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>
  orderByAsc(field: keyof T): QueryBuilder<T>
  orderByDesc(field: keyof T): QueryBuilder<T>
  
  // 分页方法
  limit(count: number): QueryBuilder<T>
  offset(count: number): QueryBuilder<T>
  page(page: number, pageSize: number): QueryBuilder<T>
  
  // 字段选择
  select(fields: (keyof T)[]): QueryBuilder<T>
  exclude(fields: (keyof T)[]): QueryBuilder<T>
  
  // 关联查询
  include(relation: string, callback?: (builder: QueryBuilder<any>) => void): QueryBuilder<T>
  with(relations: string[]): QueryBuilder<T>
  
  // 聚合方法
  count(field?: keyof T): QueryBuilder<T>
  sum(field: keyof T): QueryBuilder<T>
  avg(field: keyof T): QueryBuilder<T>
  min(field: keyof T): QueryBuilder<T>
  max(field: keyof T): QueryBuilder<T>
  
  // 分组方法
  groupBy(fields: (keyof T)[]): QueryBuilder<T>
  having(field: keyof T, operator: FilterOperator, value: any): QueryBuilder<T>
  
  // 搜索方法
  search(query: string, fields?: (keyof T)[]): QueryBuilder<T>
  fullTextSearch(query: string): QueryBuilder<T>
  
  // 构建方法
  build(): QueryDefinition<T>
  clone(): QueryBuilder<T>
  reset(): QueryBuilder<T>
  
  // 执行方法
  execute(): Promise<T[]>
  first(): Promise<T | null>
  paginate(page: number, pageSize: number): Promise<PaginatedResponse<T>>
}

/**
 * 查询定义
 */
export interface QueryDefinition<T> {
  filters: FilterOptions
  sort: SortOptions
  pagination?: PaginationOptions
  search?: SearchOptions
  fields?: (keyof T)[]
  include?: string[]
  aggregations?: AggregationDefinition[]
  groupBy?: (keyof T)[]
  having?: FilterOptions
}

/**
 * 聚合定义
 */
export interface AggregationDefinition {
  type: 'count' | 'sum' | 'avg' | 'min' | 'max'
  field?: string
  alias?: string
}

/**
 * 筛选操作符
 */
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
  | 'contains' // 包含
  | 'startsWith' // 以...开始
  | 'endsWith'   // 以...结束

/**
 * 查询优化器接口
 */
export interface QueryOptimizer<T> {
  optimize(query: QueryDefinition<T>): QueryDefinition<T>
  analyze(query: QueryDefinition<T>): QueryAnalysis
}

/**
 * 查询分析结果
 */
export interface QueryAnalysis {
  complexity: number
  estimatedCost: number
  suggestions: string[]
  warnings: string[]
  indexes?: string[]
}

/**
 * 查询缓存接口
 */
export interface QueryCache<T> {
  get(key: string): Promise<T[] | null>
  set(key: string, data: T[], ttl?: number): Promise<void>
  invalidate(pattern?: string): Promise<void>
  generateKey(query: QueryDefinition<T>): string
}

/**
 * 查询执行器接口
 */
export interface QueryExecutor<T> {
  execute(query: QueryDefinition<T>): Promise<T[]>
  executeCount(query: QueryDefinition<T>): Promise<number>
  executeAggregate(query: QueryDefinition<T>): Promise<Record<string, any>>
  explain(query: QueryDefinition<T>): Promise<QueryExplanation>
}

/**
 * 查询解释
 */
export interface QueryExplanation {
  plan: string
  cost: number
  rows: number
  time: number
  indexes: string[]
}

/**
 * 查询构建器工厂
 */
export interface QueryBuilderFactory<T> {
  create(): QueryBuilder<T>
  fromDefinition(definition: QueryDefinition<T>): QueryBuilder<T>
  fromOptions(options: ListOptions): QueryBuilder<T>
}

/**
 * 查询中间件
 */
export interface QueryMiddleware<T> {
  name: string
  
  beforeBuild?(builder: QueryBuilder<T>): QueryBuilder<T> | Promise<QueryBuilder<T>>
  afterBuild?(query: QueryDefinition<T>): QueryDefinition<T> | Promise<QueryDefinition<T>>
  beforeExecute?(query: QueryDefinition<T>): QueryDefinition<T> | Promise<QueryDefinition<T>>
  afterExecute?(result: T[], query: QueryDefinition<T>): T[] | Promise<T[]>
}

/**
 * 查询验证器
 */
export interface QueryValidator<T> {
  validate(query: QueryDefinition<T>): QueryValidationResult
  validateField(field: keyof T): boolean
  validateOperator(operator: FilterOperator, value: any): boolean
}

/**
 * 查询验证结果
 */
export interface QueryValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
}

/**
 * 查询统计
 */
export interface QueryStats {
  totalQueries: number
  avgExecutionTime: number
  slowQueries: Array<{
    query: string
    executionTime: number
    timestamp: Date
  }>
  cacheHitRate: number
  mostUsedFilters: Array<{
    field: string
    operator: FilterOperator
    count: number
  }>
}
