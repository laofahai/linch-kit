/**
 * CRUD 事件相关类型定义
 */

import type {
  ListOptions,
  PaginatedResponse,
  CreateInput,
  UpdateInput,
  BulkUpdateInput,
  BulkOperationResult,
  OperationResult,
  CRUDContext,
  SearchOptions
} from './index'

/**
 * CRUD 事件映射
 */
export interface CRUDEvents<T = any> {
  // 列表操作事件
  'before:list': {
    options?: ListOptions
    context?: CRUDContext
  }
  'after:list': {
    result: PaginatedResponse<T>
    options?: ListOptions
    context?: CRUDContext
  }
  'list:error': {
    error: Error
    options?: ListOptions
    context?: CRUDContext
  }
  
  // 获取单项事件
  'before:get': {
    id: string
    context?: CRUDContext
  }
  'after:get': {
    result: T | null
    id: string
    context?: CRUDContext
  }
  'get:error': {
    error: Error
    id: string
    context?: CRUDContext
  }
  
  // 搜索事件
  'before:search': {
    options: SearchOptions
    context?: CRUDContext
  }
  'after:search': {
    result: PaginatedResponse<T>
    options: SearchOptions
    context?: CRUDContext
  }
  'search:error': {
    error: Error
    options: SearchOptions
    context?: CRUDContext
  }
  
  // 创建事件
  'before:create': {
    data: CreateInput<T>
    context?: CRUDContext
  }
  'after:create': {
    result: OperationResult<T>
    data: CreateInput<T>
    context?: CRUDContext
  }
  'create:error': {
    error: Error
    data: CreateInput<T>
    context?: CRUDContext
  }
  
  // 更新事件
  'before:update': {
    id: string
    data: UpdateInput<T>
    context?: CRUDContext
  }
  'after:update': {
    result: OperationResult<T>
    id: string
    data: UpdateInput<T>
    context?: CRUDContext
  }
  'update:error': {
    error: Error
    id: string
    data: UpdateInput<T>
    context?: CRUDContext
  }
  
  // 删除事件
  'before:delete': {
    id: string
    context?: CRUDContext
  }
  'after:delete': {
    result: OperationResult<void>
    id: string
    context?: CRUDContext
  }
  'delete:error': {
    error: Error
    id: string
    context?: CRUDContext
  }
  
  // 批量创建事件
  'before:bulk-create': {
    data: CreateInput<T>[]
    context?: CRUDContext
  }
  'after:bulk-create': {
    result: OperationResult<T[]>
    data: CreateInput<T>[]
    context?: CRUDContext
  }
  'bulk-create:error': {
    error: Error
    data: CreateInput<T>[]
    context?: CRUDContext
  }
  
  // 批量更新事件
  'before:bulk-update': {
    updates: BulkUpdateInput<T>[]
    context?: CRUDContext
  }
  'after:bulk-update': {
    result: BulkOperationResult
    updates: BulkUpdateInput<T>[]
    context?: CRUDContext
  }
  'bulk-update:error': {
    error: Error
    updates: BulkUpdateInput<T>[]
    context?: CRUDContext
  }
  
  // 批量删除事件
  'before:bulk-delete': {
    ids: string[]
    context?: CRUDContext
  }
  'after:bulk-delete': {
    result: BulkOperationResult
    ids: string[]
    context?: CRUDContext
  }
  'bulk-delete:error': {
    error: Error
    ids: string[]
    context?: CRUDContext
  }
  
  // 状态变更事件
  'state:changed': {
    newState: any
    prevState: any
    changes: string[]
  }
  'loading:changed': {
    operation: string
    loading: boolean
  }
  'error:changed': {
    operation: string
    error: Error | null
  }
  
  // 权限事件
  'permission:checked': {
    operation: string
    allowed: boolean
    context?: CRUDContext
  }
  'permission:denied': {
    operation: string
    reason: string
    context?: CRUDContext
  }
  
  // 验证事件
  'validation:started': {
    data: any
    operation: string
  }
  'validation:completed': {
    result: ValidationResult
    data: any
    operation: string
  }
  'validation:failed': {
    errors: ValidationError[]
    data: any
    operation: string
  }
  
  // 缓存事件
  'cache:hit': {
    key: string
    operation: string
  }
  'cache:miss': {
    key: string
    operation: string
  }
  'cache:invalidated': {
    keys: string[]
    reason: string
  }
  
  // 连接事件
  'connection:established': {
    dataSource: string
  }
  'connection:lost': {
    dataSource: string
    error: Error
  }
  'connection:restored': {
    dataSource: string
  }
  
  // 插件事件
  'plugin:loaded': {
    name: string
    version?: string
  }
  'plugin:unloaded': {
    name: string
  }
  'plugin:error': {
    name: string
    error: Error
  }

  // 管理器生命周期事件
  'manager:initialized': {
    config: any
  }
  'manager:destroying': {}
  'manager:destroyed': {}

  // 配置事件
  'permissions:configured': {
    permissions: any
  }
  'schema:configured': {
    schema: any
  }
  'dataSource:configured': {
    dataSource: any
  }
  'validation:configured': {
    validation: any
  }
  'cache:configured': {
    cache: any
  }

  // 通用错误事件
  'error': {
    error: Error
    event?: string
  }
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>

/**
 * 事件发射器接口
 */
export interface CRUDEventEmitter<T = any> {
  // 事件监听
  on<K extends keyof CRUDEvents<T>>(event: K, handler: EventHandler<CRUDEvents<T>[K]>): void
  once<K extends keyof CRUDEvents<T>>(event: K, handler: EventHandler<CRUDEvents<T>[K]>): void
  off<K extends keyof CRUDEvents<T>>(event: K, handler?: EventHandler<CRUDEvents<T>[K]>): void
  
  // 事件发射
  emit<K extends keyof CRUDEvents<T>>(event: K, data: CRUDEvents<T>[K]): void
  
  // 事件管理
  removeAllListeners(event?: keyof CRUDEvents<T>): void
  listenerCount(event: keyof CRUDEvents<T>): number
  listeners(event: keyof CRUDEvents<T>): EventHandler[]
}

/**
 * 事件中间件
 */
export interface EventMiddleware<T = any> {
  name: string
  
  // 事件拦截
  beforeEmit?<K extends keyof CRUDEvents<T>>(
    event: K,
    data: CRUDEvents<T>[K]
  ): CRUDEvents<T>[K] | Promise<CRUDEvents<T>[K]>
  
  afterEmit?<K extends keyof CRUDEvents<T>>(
    event: K,
    data: CRUDEvents<T>[K]
  ): void | Promise<void>
  
  // 错误处理
  onError?(error: Error, event: string, data: any): void | Promise<void>
}

/**
 * 事件过滤器
 */
export interface EventFilter<T = any> {
  name: string
  condition: <K extends keyof CRUDEvents<T>>(
    event: K,
    data: CRUDEvents<T>[K]
  ) => boolean | Promise<boolean>
}

/**
 * 事件转换器
 */
export interface EventTransformer<T = any> {
  name: string
  transform: <K extends keyof CRUDEvents<T>>(
    event: K,
    data: CRUDEvents<T>[K]
  ) => CRUDEvents<T>[K] | Promise<CRUDEvents<T>[K]>
}

/**
 * 事件路由器
 */
export interface EventRouter<T = any> {
  route<K extends keyof CRUDEvents<T>>(
    event: K,
    data: CRUDEvents<T>[K]
  ): string[] // 返回目标处理器名称
}

/**
 * 事件存储接口
 */
export interface EventStore<T = any> {
  store<K extends keyof CRUDEvents<T>>(
    event: K,
    data: CRUDEvents<T>[K],
    metadata?: EventMetadata
  ): Promise<void>
  
  retrieve(
    filters?: EventFilters,
    options?: EventRetrieveOptions
  ): Promise<StoredEvent<T>[]>
  
  clear(filters?: EventFilters): Promise<void>
}

/**
 * 事件元数据
 */
export interface EventMetadata {
  timestamp: Date
  source: string
  correlationId?: string
  userId?: string
  sessionId?: string
  traceId?: string
}

/**
 * 存储的事件
 */
export interface StoredEvent<T = any> {
  id: string
  event: keyof CRUDEvents<T>
  data: any
  metadata: EventMetadata
}

/**
 * 事件过滤条件
 */
export interface EventFilters {
  events?: (keyof CRUDEvents)[]
  dateRange?: {
    start: Date
    end: Date
  }
  source?: string
  userId?: string
  correlationId?: string
}

/**
 * 事件检索选项
 */
export interface EventRetrieveOptions {
  limit?: number
  offset?: number
  orderBy?: 'timestamp' | 'event'
  order?: 'asc' | 'desc'
}

/**
 * 验证错误类型
 */
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

/**
 * 验证结果类型
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}
