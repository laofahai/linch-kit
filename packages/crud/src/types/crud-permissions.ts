/**
 * CRUD 权限相关类型定义
 */

import type { CRUDOperation, CRUDContext, RowPermissionChecker } from './crud-operations'

/**
 * 基础权限配置
 */
export interface CRUDPermissions {
  // 操作级权限
  operations: OperationPermissions
  
  // 字段级权限
  fields?: Record<string, FieldPermission>
  
  // 行级权限检查器
  rowLevel?: RowPermissionChecker<any>
  
  // 权限检查缓存配置
  cache?: PermissionCacheConfig
}

/**
 * 操作权限配置
 */
export interface OperationPermissions {
  // 基础操作权限
  list?: string | boolean | PermissionChecker
  get?: string | boolean | PermissionChecker
  search?: string | boolean | PermissionChecker
  count?: string | boolean | PermissionChecker
  create?: string | boolean | PermissionChecker
  update?: string | boolean | PermissionChecker
  delete?: string | boolean | PermissionChecker
  
  // 批量操作权限
  bulkCreate?: string | boolean | PermissionChecker
  bulkUpdate?: string | boolean | PermissionChecker
  bulkDelete?: string | boolean | PermissionChecker
  
  // 高级操作权限
  duplicate?: string | boolean | PermissionChecker
  restore?: string | boolean | PermissionChecker
  archive?: string | boolean | PermissionChecker
  export?: string | boolean | PermissionChecker
  import?: string | boolean | PermissionChecker
}

/**
 * 字段权限配置
 */
export interface FieldPermission {
  read?: string | boolean | PermissionChecker
  write?: string | boolean | PermissionChecker
  filter?: string | boolean | PermissionChecker
  sort?: string | boolean | PermissionChecker
}

/**
 * 权限检查器函数类型
 */
export type PermissionChecker = (context?: CRUDContext) => Promise<boolean> | boolean

// RowPermissionChecker 从 crud-operations 导入，避免重复定义

/**
 * 权限缓存配置
 */
export interface PermissionCacheConfig {
  enabled: boolean
  ttl?: number // 缓存时间 (秒)
  keyGenerator?: (context?: CRUDContext) => string
}

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: string[]
}

/**
 * 权限上下文
 */
export interface PermissionContext extends CRUDContext {
  operation: CRUDOperation
  resource?: string
  data?: any
}

/**
 * 权限管理器接口
 */
export interface CRUDPermissionManager {
  /**
   * 检查操作权限
   */
  checkOperation(
    operation: CRUDOperation,
    context?: CRUDContext
  ): Promise<PermissionCheckResult>
  
  /**
   * 检查字段权限
   */
  checkField(
    field: string,
    operation: 'read' | 'write' | 'filter' | 'sort',
    context?: CRUDContext
  ): Promise<PermissionCheckResult>
  
  /**
   * 检查行级权限
   */
  checkRow(
    operation: CRUDOperation,
    data: any,
    context?: CRUDContext
  ): Promise<PermissionCheckResult>
  
  /**
   * 获取用户可访问的字段
   */
  getAccessibleFields(
    operation: 'read' | 'write' | 'filter' | 'sort',
    context?: CRUDContext
  ): Promise<string[]>
  
  /**
   * 获取用户可执行的操作
   */
  getAccessibleOperations(context?: CRUDContext): Promise<CRUDOperation[]>
  
  /**
   * 过滤数据中用户无权限访问的字段
   */
  filterFields<T extends Record<string, any>>(
    data: T | T[],
    operation: 'read' | 'write',
    context?: CRUDContext
  ): Promise<Partial<T> | Partial<T>[]>
}

/**
 * 权限装饰器配置
 */
export interface PermissionDecoratorConfig {
  operation?: CRUDOperation
  resource?: string
  field?: string
  required?: boolean // 是否必需权限，false 表示可选
  fallback?: any // 无权限时的回退值
}

/**
 * 权限策略类型
 */
export type PermissionStrategy = 'strict' | 'permissive' | 'custom'

/**
 * 权限策略配置
 */
export interface PermissionStrategyConfig {
  strategy: PermissionStrategy
  
  // 严格模式：默认拒绝，需要明确授权
  // 宽松模式：默认允许，需要明确拒绝
  // 自定义模式：使用自定义检查器
  
  defaultPermissions?: OperationPermissions
  customChecker?: (
    operation: CRUDOperation,
    context?: CRUDContext
  ) => Promise<boolean> | boolean
}

/**
 * 权限继承配置
 */
export interface PermissionInheritanceConfig {
  enabled: boolean
  parentResource?: string
  inheritanceRules?: Array<{
    from: CRUDOperation
    to: CRUDOperation[]
    condition?: PermissionChecker
  }>
}

/**
 * 动态权限配置
 */
export interface DynamicPermissionConfig {
  enabled: boolean
  
  // 基于数据内容的权限
  dataBasedRules?: Array<{
    condition: (data: any) => boolean
    permissions: Partial<OperationPermissions>
  }>
  
  // 基于时间的权限
  timeBasedRules?: Array<{
    schedule: string // cron 表达式
    permissions: Partial<OperationPermissions>
  }>
  
  // 基于用户属性的权限
  userBasedRules?: Array<{
    userCondition: (user: any) => boolean
    permissions: Partial<OperationPermissions>
  }>
}

/**
 * 权限审计配置
 */
export interface PermissionAuditConfig {
  enabled: boolean
  logLevel: 'none' | 'denied' | 'all'
  auditLogger?: (event: PermissionAuditEvent) => void
}

/**
 * 权限审计事件
 */
export interface PermissionAuditEvent {
  timestamp: Date
  operation: CRUDOperation
  resource?: string
  user?: any
  allowed: boolean
  reason?: string
  context?: CRUDContext
}
