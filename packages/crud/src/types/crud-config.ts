/**
 * CRUD 配置相关类型定义
 */

import type { EventEmitter } from 'eventemitter3'

import type { CRUDOperations } from './crud-operations'
import type { CRUDPermissions } from './crud-permissions'
import type { DataSource } from './data-source'
import type { CRUDEvents } from './events'

/**
 * CRUD 管理器配置
 */
export interface CRUDConfig<T> {
  // 基础配置
  name: string
  resource: string
  
  // 数据源
  dataSource: DataSource<T>
  
  // 权限配置
  permissions?: CRUDPermissions
  
  // Schema 集成
  schema?: SchemaIntegration

  // 验证配置
  validation?: ValidationConfig
  
  // 缓存配置
  cache?: CacheConfig
  
  // 事件配置
  events?: EventConfig
  
  // 插件配置
  plugins?: PluginConfig[]
  
  // 调试配置
  debug?: boolean
}

/**
 * Schema 集成配置
 */
export interface SchemaIntegration {
  // Schema 定义 (来自 @linch-kit/schema)
  entity?: any // EntityDefinition<T> - T 用于类型推导
  
  // 字段配置
  fields?: FieldConfig[]

  // 关联配置
  relations?: RelationConfig[]
  
  // UI 配置
  ui?: UIConfig
  
  // 自动推导配置
  autoInfer?: {
    fields?: boolean
    relations?: boolean
    permissions?: boolean
    validation?: boolean
  }
}

/**
 * 字段配置
 */
export interface FieldConfig<T = any> {
  name: keyof T | string
  type: FieldType
  label?: string
  description?: string
  required?: boolean
  readonly?: boolean
  hidden?: boolean
  
  // 显示配置
  display?: {
    list?: boolean
    detail?: boolean
    form?: boolean
    filter?: boolean
    sort?: boolean
  }
  
  // 验证配置
  validation?: FieldValidationConfig
  
  // 格式化配置
  format?: FieldFormatConfig
  
  // 权限配置
  permissions?: {
    read?: string | boolean
    write?: string | boolean
  }
}

/**
 * 字段类型
 */
export type FieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'phone'
  | 'json'
  | 'array'
  | 'object'
  | 'enum'
  | 'relation'

/**
 * 字段验证配置
 */
export interface FieldValidationConfig {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: any[]
  custom?: (value: any) => boolean | string
}

/**
 * 字段格式化配置
 */
export interface FieldFormatConfig {
  // 显示格式化
  display?: (value: any) => string
  
  // 输入格式化
  input?: (value: any) => any
  
  // 输出格式化
  output?: (value: any) => any
  
  // 日期格式
  dateFormat?: string
  
  // 数字格式
  numberFormat?: {
    decimals?: number
    currency?: string
    percentage?: boolean
  }
}

/**
 * 关联配置
 */
export interface RelationConfig {
  name: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  target: string
  foreignKey?: string
  localKey?: string
  
  // 加载配置
  eager?: boolean
  cascade?: boolean
  
  // 显示配置
  display?: {
    list?: boolean
    detail?: boolean
    form?: boolean
  }
}

/**
 * UI 配置
 */
export interface UIConfig {
  // 列表视图配置
  list?: ListViewConfig
  
  // 详情视图配置
  detail?: DetailViewConfig
  
  // 表单视图配置
  form?: FormViewConfig
  
  // 搜索配置
  search?: SearchConfig
}

/**
 * 列表视图配置
 */
export interface ListViewConfig {
  columns?: string[]
  defaultSort?: { field: string; direction: 'asc' | 'desc' }
  pageSize?: number
  actions?: ActionConfig[]
  bulkActions?: ActionConfig[]
  filters?: FilterConfig[]
  layout?: 'table' | 'grid' | 'list'
}

/**
 * 详情视图配置
 */
export interface DetailViewConfig {
  fields?: string[]
  layout?: 'vertical' | 'horizontal' | 'tabs'
  sections?: SectionConfig[]
  actions?: ActionConfig[]
}

/**
 * 表单视图配置
 */
export interface FormViewConfig {
  fields?: string[]
  layout?: 'vertical' | 'horizontal' | 'grid'
  sections?: SectionConfig[]
  validation?: 'realtime' | 'onSubmit' | 'onBlur'
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  enabled?: boolean
  fields?: string[]
  placeholder?: string
  fuzzy?: boolean
  highlight?: boolean
}

/**
 * 操作配置
 */
export interface ActionConfig {
  name: string
  label: string
  icon?: string
  type: 'button' | 'link' | 'dropdown'
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  permission?: string
  handler: (data?: any) => void | Promise<void>
}

/**
 * 筛选配置
 */
export interface FilterConfig {
  field: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: Array<{ label: string; value: any }>
  multiple?: boolean
}

/**
 * 分组配置
 */
export interface SectionConfig {
  name: string
  label: string
  fields: string[]
  collapsible?: boolean
  collapsed?: boolean
}

/**
 * 验证配置
 */
export interface ValidationConfig {
  // 验证模式
  mode: 'strict' | 'permissive'
  
  // 自定义验证器
  validators?: Array<{
    name: string
    validator: (data: any) => boolean | string | Promise<boolean | string>
    message?: string
  }>
  
  // 异步验证
  async?: boolean
  
  // 验证时机
  timing: 'realtime' | 'onSubmit' | 'onBlur'
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  enabled: boolean
  
  // 缓存策略
  strategy: 'memory' | 'redis' | 'custom'
  
  // 缓存时间 (秒)
  ttl?: number
  
  // 缓存键生成器
  keyGenerator?: (operation: string, params: any) => string
  
  // 自定义缓存实现
  customCache?: CacheImplementation
}

/**
 * 缓存实现接口
 */
export interface CacheImplementation {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

/**
 * 事件配置
 */
export interface EventConfig {
  // 事件发射器
  emitter?: EventEmitter<CRUDEvents>
  
  // 事件监听器
  listeners?: Partial<CRUDEvents>
  
  // 异步事件处理
  async?: boolean
  
  // 错误处理
  errorHandler?: (error: Error, event: string) => void
}

/**
 * 插件配置
 */
export interface PluginConfig {
  name: string
  plugin: CRUDPlugin
  options?: Record<string, any>
  enabled?: boolean
}

/**
 * CRUD 插件接口
 */
export interface CRUDPlugin {
  name: string
  version?: string
  
  // 插件初始化
  init?(manager: any, options?: Record<string, any>): void | Promise<void>
  
  // 插件销毁
  destroy?(): void | Promise<void>
  
  // 扩展操作
  extendOperations?(operations: CRUDOperations<any>): CRUDOperations<any>
  
  // 扩展权限
  extendPermissions?(permissions: CRUDPermissions): CRUDPermissions
  
  // 扩展事件
  extendEvents?(events: Partial<CRUDEvents>): Partial<CRUDEvents>
}
