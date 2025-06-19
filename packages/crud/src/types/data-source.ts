/**
 * 数据源相关类型定义
 */

import type { CRUDContext } from './crud-operations'

import type {
  ListOptions,
  PaginatedResponse,
  CreateInput,
  UpdateInput,
  BulkUpdateInput,
  BulkOperationResult,
  SearchOptions
} from './index'


/**
 * 数据源接口
 */
export interface DataSource<T> {
  // 基础查询操作
  list(options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  get(id: string, context?: CRUDContext): Promise<T | null>
  search(options: SearchOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  count(options?: Omit<ListOptions, 'pagination'>, context?: CRUDContext): Promise<number>
  
  // 基础变更操作
  create(data: CreateInput<T>, context?: CRUDContext): Promise<T>
  update(id: string, data: UpdateInput<T>, context?: CRUDContext): Promise<T>
  delete(id: string, context?: CRUDContext): Promise<void>
  
  // 批量操作
  bulkCreate?(data: CreateInput<T>[], context?: CRUDContext): Promise<T[]>
  bulkUpdate?(updates: BulkUpdateInput<T>[], context?: CRUDContext): Promise<BulkOperationResult>
  bulkDelete?(ids: string[], context?: CRUDContext): Promise<BulkOperationResult>
  
  // 高级操作
  duplicate?(id: string, overrides?: Partial<CreateInput<T>>, context?: CRUDContext): Promise<T>
  restore?(id: string, context?: CRUDContext): Promise<T>
  archive?(id: string, context?: CRUDContext): Promise<void>
  
  // 关联操作
  getRelated?<R>(id: string, relation: string, options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<R>>
  addRelation?(id: string, relation: string, relatedId: string, context?: CRUDContext): Promise<void>
  removeRelation?(id: string, relation: string, relatedId: string, context?: CRUDContext): Promise<void>
  
  // 事务支持
  transaction?<R>(callback: (tx: DataSourceTransaction<T>) => Promise<R>, context?: CRUDContext): Promise<R>
  
  // 连接管理
  connect?(): Promise<void>
  disconnect?(): Promise<void>
  isConnected?(): boolean
  
  // 健康检查
  healthCheck?(): Promise<DataSourceHealth>
}

/**
 * 数据源事务接口
 */
export interface DataSourceTransaction<T> extends Omit<DataSource<T>, 'transaction' | 'connect' | 'disconnect'> {
  commit(): Promise<void>
  rollback(): Promise<void>
}

/**
 * 数据源健康状态
 */
export interface DataSourceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  details?: Record<string, any>
  timestamp: Date
}

/**
 * REST 数据源配置
 */
export interface RESTDataSourceConfig {
  baseURL: string
  endpoints?: {
    list?: string
    get?: string
    create?: string
    update?: string
    delete?: string
    search?: string
    count?: string
  }
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  auth?: {
    type: 'bearer' | 'basic' | 'apikey'
    token?: string
    username?: string
    password?: string
    apiKey?: string
    apiKeyHeader?: string
  }
  transform?: {
    request?: (data: any) => any
    response?: (data: any) => any
  }
}

/**
 * GraphQL 数据源配置
 */
export interface GraphQLDataSourceConfig {
  endpoint: string
  queries?: {
    list?: string
    get?: string
    search?: string
    count?: string
  }
  mutations?: {
    create?: string
    update?: string
    delete?: string
  }
  headers?: Record<string, string>
  variables?: Record<string, any>
  auth?: {
    type: 'bearer' | 'apikey'
    token?: string
    apiKey?: string
  }
}

/**
 * tRPC 数据源配置
 */
export interface TRPCDataSourceConfig {
  client: any // tRPC client
  router: string // router path
  procedures?: {
    list?: string
    get?: string
    create?: string
    update?: string
    delete?: string
    search?: string
    count?: string
  }
}

/**
 * 内存数据源配置
 */
export interface MemoryDataSourceConfig<T> {
  initialData?: T[]
  idField?: keyof T
  generateId?: () => string
  persist?: {
    enabled: boolean
    storage: 'localStorage' | 'sessionStorage' | 'indexedDB'
    key: string
  }
}

/**
 * 数据源适配器接口
 */
export interface DataSourceAdapter<T, TConfig = any> {
  name: string
  create(config: TConfig): DataSource<T>
  validate?(config: TConfig): boolean | string
}

/**
 * 数据源工厂
 */
export interface DataSourceFactory {
  register<T, TConfig>(name: string, adapter: DataSourceAdapter<T, TConfig>): void
  create<T>(type: string, config: any): DataSource<T>
  getAdapters(): string[]
}

/**
 * 数据源中间件
 */
export interface DataSourceMiddleware {
  name: string
  
  // 请求前处理
  beforeRequest?(
    operation: string,
    params: any,
    context?: CRUDContext
  ): Promise<any> | any
  
  // 响应后处理
  afterResponse?<R>(
    operation: string,
    result: R,
    params: any,
    context?: CRUDContext
  ): Promise<R> | R
  
  // 错误处理
  onError?(
    error: Error,
    operation: string,
    params: any,
    context?: CRUDContext
  ): Promise<void> | void
}

/**
 * 数据源代理配置
 */
export interface DataSourceProxyConfig<T> {
  primary: DataSource<T>
  fallback?: DataSource<T>
  cache?: DataSource<T>
  
  // 策略配置
  strategy: {
    read: 'primary' | 'cache-first' | 'cache-only'
    write: 'primary' | 'write-through' | 'write-behind'
    fallback: 'auto' | 'manual' | 'disabled'
  }
  
  // 健康检查配置
  healthCheck?: {
    enabled: boolean
    interval: number
    timeout: number
  }
}

/**
 * 数据源连接池配置
 */
export interface DataSourcePoolConfig {
  min: number
  max: number
  acquireTimeout: number
  idleTimeout: number
  reapInterval: number
}

/**
 * 数据源监控配置
 */
export interface DataSourceMonitorConfig {
  enabled: boolean
  metrics: {
    latency: boolean
    throughput: boolean
    errors: boolean
    connections: boolean
  }
  reporter?: (metrics: DataSourceMetrics) => void
}

/**
 * 数据源指标
 */
export interface DataSourceMetrics {
  operations: {
    total: number
    success: number
    errors: number
    avgLatency: number
    maxLatency: number
  }
  connections: {
    active: number
    idle: number
    total: number
  }
  cache?: {
    hits: number
    misses: number
    hitRate: number
  }
  timestamp: Date
}
