/**
 * CRUD 插件系统类型定义
 */

import type { CreateInput, UpdateInput, CrudOptions, FindOptions } from '../types'

/**
 * 钩子上下文 - 提供操作的详细上下文信息
 */
export interface HookContext {
  entityName: string
  operation: 'create' | 'read' | 'update' | 'delete' | 'query'
  user?: unknown
  timestamp: Date
  requestId?: string
  metadata?: Record<string, unknown>
}

/**
 * 字段变更信息
 */
export interface FieldChange {
  fieldName: string
  oldValue?: unknown
  newValue?: unknown
  action: 'added' | 'modified' | 'removed'
}

/**
 * 全局钩子接口 - 所有实体通用
 */
export interface GlobalCrudHooks {
  // 全局操作钩子
  beforeCreate?<T>(
    entityName: string,
    data: CreateInput<T>,
    context: HookContext
  ): Promise<CreateInput<T>>

  afterCreate?<T>(
    entityName: string,
    result: T,
    context: HookContext
  ): Promise<void>

  beforeUpdate?<T>(
    entityName: string,
    id: string,
    data: UpdateInput<T>,
    existing: unknown,
    context: HookContext
  ): Promise<UpdateInput<T>>

  afterUpdate?<T>(
    entityName: string,
    result: T,
    existing: unknown,
    changes: FieldChange[],
    context: HookContext
  ): Promise<void>

  beforeDelete?(
    entityName: string,
    id: string,
    existing: unknown,
    context: HookContext
  ): Promise<void>

  afterDelete?(
    entityName: string,
    existing: unknown,
    context: HookContext
  ): Promise<void>

  beforeQuery?(
    entityName: string,
    query: Record<string, unknown>,
    context: HookContext
  ): Promise<Record<string, unknown>>

  afterQuery?<T>(
    entityName: string,
    results: T[],
    query: Record<string, unknown>,
    context: HookContext
  ): Promise<T[]>

  // 全局验证钩子
  beforeValidation?(
    entityName: string,
    data: unknown,
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<unknown>

  afterValidation?(
    entityName: string,
    data: unknown,
    errors: unknown[],
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<void>

  // 全局权限钩子
  beforePermissionCheck?(
    entityName: string,
    user: unknown,
    operation: string,
    resource?: unknown,
    context?: HookContext
  ): Promise<void>

  afterPermissionCheck?(
    entityName: string,
    user: unknown,
    operation: string,
    allowed: boolean,
    resource?: unknown,
    context?: HookContext
  ): Promise<void>

  // 全局缓存钩子
  beforeCacheGet?(
    key: string,
    entityName: string,
    context?: HookContext
  ): Promise<string>

  afterCacheGet?<T>(
    key: string,
    entityName: string,
    value: T | null,
    context?: HookContext
  ): Promise<T | null>

  beforeCacheSet?<T>(
    key: string,
    entityName: string,
    value: T,
    ttl?: number,
    context?: HookContext
  ): Promise<{ key: string; value: T; ttl?: number }>

  afterCacheSet?<T>(
    key: string,
    entityName: string,
    value: T,
    ttl?: number,
    context?: HookContext
  ): Promise<void>
}

/**
 * 实体级钩子接口 - 针对特定实体
 */
export interface EntityCrudHooks {
  // 实体特定操作钩子
  beforeEntityCreate?<T>(
    data: CreateInput<T>,
    context: HookContext
  ): Promise<CreateInput<T>>

  afterEntityCreate?<T>(
    result: T,
    context: HookContext
  ): Promise<void>

  beforeEntityUpdate?<T>(
    id: string,
    data: UpdateInput<T>,
    existing: unknown,
    context: HookContext
  ): Promise<UpdateInput<T>>

  afterEntityUpdate?<T>(
    result: T,
    existing: unknown,
    changes: FieldChange[],
    context: HookContext
  ): Promise<void>

  beforeEntityDelete?(
    id: string,
    existing: unknown,
    context: HookContext
  ): Promise<void>

  afterEntityDelete?(
    existing: unknown,
    context: HookContext
  ): Promise<void>

  beforeEntityQuery?(
    query: Record<string, unknown>,
    context: HookContext
  ): Promise<Record<string, unknown>>

  afterEntityQuery?<T>(
    results: T[],
    query: Record<string, unknown>,
    context: HookContext
  ): Promise<T[]>
}

/**
 * 字段级钩子接口 - 针对特定字段
 */
export interface FieldCrudHooks {
  // 字段值变更钩子
  beforeFieldSet?(
    entityName: string,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<unknown>

  afterFieldSet?(
    entityName: string,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<void>

  // 字段访问钩子
  beforeFieldRead?(
    entityName: string,
    fieldName: string,
    value: unknown,
    context: HookContext
  ): Promise<unknown>

  afterFieldRead?(
    entityName: string,
    fieldName: string,
    value: unknown,
    context: HookContext
  ): Promise<void>

  // 字段验证钩子
  beforeFieldValidation?(
    entityName: string,
    fieldName: string,
    value: unknown,
    context: HookContext
  ): Promise<unknown>

  afterFieldValidation?(
    entityName: string,
    fieldName: string,
    value: unknown,
    errors: unknown[],
    context: HookContext
  ): Promise<void>

  // 敏感字段处理钩子
  beforeSensitiveFieldAccess?(
    entityName: string,
    fieldName: string,
    value: unknown,
    user: unknown,
    context: HookContext
  ): Promise<unknown>

  afterSensitiveFieldAccess?(
    entityName: string,
    fieldName: string,
    value: unknown,
    user: unknown,
    context: HookContext
  ): Promise<void>
}

/**
 * 条件钩子接口 - 基于条件触发
 */
export interface ConditionalCrudHooks {
  // 状态变更钩子
  onStatusChange?<T>(
    entityName: string,
    id: string,
    oldStatus: string,
    newStatus: string,
    entity: T,
    context: HookContext
  ): Promise<void>

  // 关联变更钩子
  onRelationChange?<T>(
    entityName: string,
    id: string,
    relationName: string,
    changeType: 'connect' | 'disconnect' | 'set',
    relatedIds: string[],
    entity: T,
    context: HookContext
  ): Promise<void>

  // 批量操作钩子
  onBatchOperation?<T>(
    entityName: string,
    operation: 'createMany' | 'updateMany' | 'deleteMany',
    affectedCount: number,
    results: T[],
    context: HookContext
  ): Promise<void>

  // 软删除恢复钩子
  onSoftDeleteRestore?<T>(
    entityName: string,
    id: string,
    entity: T,
    context: HookContext
  ): Promise<void>
}

/**
 * 组合钩子接口 - 包含所有类型的钩子
 */
export interface CrudPluginHooks extends 
  GlobalCrudHooks, 
  EntityCrudHooks, 
  FieldCrudHooks, 
  ConditionalCrudHooks {
  
  // 钩子选择器 - 决定钩子是否应该执行
  shouldExecuteHook?(
    hookName: string,
    entityName: string,
    context: HookContext
  ): Promise<boolean>

  // 钩子优先级 - 数字越小优先级越高
  getHookPriority?(
    hookName: string,
    entityName: string
  ): number
}

/**
 * CRUD 插件接口
 */
export interface CrudPlugin {
  /** 插件名称 */
  name: string
  
  /** 插件版本 */
  version: string
  
  /** 插件描述 */
  description?: string
  
  /** 插件依赖 */
  dependencies?: string[]
  
  /** 插件钩子 */
  hooks?: CrudPluginHooks
  
  /** 插件初始化 */
  initialize?(): Promise<void>
  
  /** 插件销毁 */
  destroy?(): Promise<void>
  
  /** 插件配置 */
  configure?(config: Record<string, unknown>): Promise<void>
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  keywords?: string[]
  license?: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

/**
 * 插件注册选项
 */
export interface PluginRegistrationOptions {
  /** 是否自动初始化 */
  autoInitialize?: boolean
  
  /** 插件配置 */
  config?: Record<string, unknown>
  
  /** 是否覆盖已存在的插件 */
  override?: boolean
}