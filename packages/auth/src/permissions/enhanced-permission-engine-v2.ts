/**
 * @linch-kit/auth 增强型权限引擎 v2
 * 集成数据库适配器，提供完整的数据库查询支持
 */

import type { LinchKitUser, PermissionAction, PermissionSubject, PermissionContext } from '../types'
import type { IDatabasePermissionAdapter } from '../adapters/database-permission-adapter'

import { CASLPermissionEngine } from './casl-engine'

/**
 * 增强的权限检查结果
 */
export interface EnhancedPermissionResult {
  granted: boolean
  allowedFields?: string[]
  deniedFields?: string[]
  conditions?: Record<string, unknown>
  reason?: string
}

/**
 * 权限缓存条目
 */
interface PermissionCacheEntry {
  key: string
  value: any
  expiresAt: number
}

/**
 * 增强型权限引擎 v2 - 数据库集成版
 *
 * 特性：
 * - 完整的数据库查询支持
 * - 角色继承和权限聚合
 * - 字段级权限控制
 * - 行级权限过滤
 * - 运行时权限计算
 * - 智能缓存优化
 */
export class EnhancedPermissionEngineV2 extends CASLPermissionEngine {
  private cache: Map<string, PermissionCacheEntry> = new Map()
  private readonly defaultCacheTTL = 5 * 60 * 1000 // 5分钟

  constructor(
    private databaseAdapter: IDatabasePermissionAdapter,
    private options: {
      enableCache?: boolean
      cachePrefix?: string
      cacheTTL?: number
      roleHierarchyEnabled?: boolean
    } = {}
  ) {
    super(options)
    
    // 启动缓存清理任务
    if (options.enableCache !== false) {
      this.startCacheCleanup()
    }
  }

  /**
   * 增强的权限检查，返回详细的权限信息
   */
  async checkEnhanced(
    user: LinchKitUser,
    action: string,
    subject: any,
    context?: PermissionContext
  ): Promise<EnhancedPermissionResult> {
    const cacheKey = this.buildCacheKey('checkEnhanced', user.id, action, subject, context)
    
    // 尝试从缓存获取
    if (this.options.enableCache !== false) {
      const cached = this.getFromCache<EnhancedPermissionResult>(cacheKey)
      if (cached) return cached
    }

    try {
      // 基础权限检查
      const granted = await this.check(user, action, subject, context)

      if (!granted) {
        const result: EnhancedPermissionResult = {
          granted: false,
          reason: 'Permission denied by basic check',
        }
        
        this.setCache(cacheKey, result)
        return result
      }

      // 获取字段级权限
      const fieldPermissions = await this.getFieldPermissions(user, subject, context)

      // 获取条件权限
      const conditions = await this.getPermissionConditions(user, action, subject, context)

      const result: EnhancedPermissionResult = {
        granted: true,
        allowedFields: fieldPermissions.allowed,
        deniedFields: fieldPermissions.denied,
        conditions,
      }

      this.setCache(cacheKey, result)
      return result

    } catch (error) {
      return {
        granted: false,
        reason: `Permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * 获取用户的所有有效角色（包括继承的角色）
   */
  async getEffectiveRoles(userId: string): Promise<string[]> {
    const cacheKey = this.buildCacheKey('effectiveRoles', userId)
    
    if (this.options.enableCache !== false) {
      const cached = this.getFromCache<string[]>(cacheKey)
      if (cached) return cached
    }

    try {
      // 获取直接分配的角色
      const directRoles = await this.databaseAdapter.getUserDirectRoles(userId)

      // 获取继承的角色
      const inheritedRoles = this.options.roleHierarchyEnabled !== false
        ? await this.databaseAdapter.getInheritedRoles(directRoles)
        : []

      // 合并并去重
      const effectiveRoles = [...new Set([...directRoles, ...inheritedRoles])]
      
      this.setCache(cacheKey, effectiveRoles)
      return effectiveRoles

    } catch (error) {
      console.error('Failed to get effective roles:', error)
      return []
    }
  }

  /**
   * 获取角色的所有权限（包括继承的权限）
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    const cacheKey = this.buildCacheKey('rolePermissions', roleId)
    
    if (this.options.enableCache !== false) {
      const cached = this.getFromCache<string[]>(cacheKey)
      if (cached) return cached
    }

    try {
      // 获取直接权限
      const directPermissions = await this.databaseAdapter.getRoleDirectPermissions(roleId)

      // 获取父角色权限（递归）
      const parentRoles = this.options.roleHierarchyEnabled !== false
        ? await this.databaseAdapter.getParentRoles(roleId)
        : []

      const inheritedPermissions: string[] = []
      for (const parentRole of parentRoles) {
        const parentPermissions = await this.getRolePermissions(parentRole)
        inheritedPermissions.push(...parentPermissions)
      }

      // 合并并去重
      const allPermissions = [...new Set([...directPermissions, ...inheritedPermissions])]
      
      this.setCache(cacheKey, allPermissions)
      return allPermissions

    } catch (error) {
      console.error('Failed to get role permissions:', error)
      return []
    }
  }

  /**
   * 获取字段级权限
   */
  async getFieldPermissions(
    user: LinchKitUser,
    resource: any,
    context?: PermissionContext
  ): Promise<{ allowed: string[]; denied: string[] }> {
    const resourceType = this.getResourceType(resource)
    const cacheKey = this.buildCacheKey('fieldPermissions', user.id, resourceType, context)
    
    if (this.options.enableCache !== false) {
      const cached = this.getFromCache<{ allowed: string[]; denied: string[] }>(cacheKey)
      if (cached) return cached
    }

    try {
      const roles = await this.getEffectiveRoles(user.id)

      // 收集所有角色的字段权限
      const allAllowed = new Set<string>()
      const allDenied = new Set<string>()

      for (const role of roles) {
        const fieldRules = await this.databaseAdapter.getRoleFieldPermissions(role, resourceType)

        fieldRules.allowed.forEach(field => allAllowed.add(field))
        fieldRules.denied.forEach(field => allDenied.add(field))
      }

      // 应用上下文相关的字段权限
      if (context) {
        const contextFieldRules = await this.databaseAdapter.getContextFieldPermissions(
          user,
          resourceType,
          context
        )

        contextFieldRules.allowed.forEach(field => allAllowed.add(field))
        contextFieldRules.denied.forEach(field => allDenied.add(field))
      }

      // 处理冲突：拒绝优先原则
      const allowed = Array.from(allAllowed).filter(field => !allDenied.has(field))
      const denied = Array.from(allDenied)

      const result = { allowed, denied }
      this.setCache(cacheKey, result)
      return result

    } catch (error) {
      console.error('Failed to get field permissions:', error)
      return { allowed: [], denied: [] }
    }
  }

  /**
   * 过滤对象字段
   */
  async filterObjectFields<T extends Record<string, unknown>>(
    user: LinchKitUser,
    resource: T,
    context?: PermissionContext
  ): Promise<Partial<T>> {
    const fieldPermissions = await this.getFieldPermissions(user, resource, context)
    const filtered: Partial<T> = {}

    // 如果没有明确的字段权限，返回所有字段
    if (fieldPermissions.allowed.length === 0 && fieldPermissions.denied.length === 0) {
      return resource
    }

    // 如果有允许列表，只包含允许的字段
    if (fieldPermissions.allowed.length > 0) {
      for (const field of fieldPermissions.allowed) {
        if (field in resource && !fieldPermissions.denied.includes(field)) {
          filtered[field as keyof T] = resource[field as keyof T]
        }
      }
    } else {
      // 如果没有允许列表，包含所有字段但排除拒绝的字段
      for (const field in resource) {
        if (!fieldPermissions.denied.includes(field)) {
          filtered[field as keyof T] = resource[field as keyof T]
        }
      }
    }

    return filtered
  }

  /**
   * 获取行级权限条件
   */
  async getPermissionConditions(
    user: LinchKitUser,
    action: string,
    subject: string | any,
    context?: PermissionContext
  ): Promise<Record<string, unknown>> {
    const cacheKey = this.buildCacheKey('permissionConditions', user.id, action, subject, context)
    
    if (this.options.enableCache !== false) {
      const cached = this.getFromCache<Record<string, unknown>>(cacheKey)
      if (cached) return cached
    }

    try {
      const roles = await this.getEffectiveRoles(user.id)
      const conditions: Record<string, unknown> = {}

      // 基础用户条件
      conditions.userId = user.id

      // 租户隔离
      if (context?.tenantId) {
        conditions.tenantId = context.tenantId
      }

      // 角色特定条件
      for (const role of roles) {
        const roleConditions = await this.databaseAdapter.getRoleConditions(role, action, subject)
        Object.assign(conditions, roleConditions)
      }

      // 资源特定条件
      if (typeof subject === 'object' && subject !== null) {
        const resourceConditions = await this.databaseAdapter.getResourceConditions(user, action, subject)
        Object.assign(conditions, resourceConditions)
      }

      this.setCache(cacheKey, conditions)
      return conditions

    } catch (error) {
      console.error('Failed to get permission conditions:', error)
      return { userId: user.id }
    }
  }

  /**
   * 批量过滤资源列表
   */
  async filterResources<T>(
    user: LinchKitUser,
    resources: T[],
    action: string,
    context?: PermissionContext
  ): Promise<T[]> {
    const filtered: T[] = []

    // 并行检查权限以提高性能
    const permissionChecks = resources.map(resource => 
      this.check(user, action, resource, context)
    )

    const results = await Promise.all(permissionChecks)

    for (let i = 0; i < resources.length; i++) {
      if (results[i]) {
        filtered.push(resources[i])
      }
    }

    return filtered
  }

  /**
   * 获取用户可访问的资源查询条件
   */
  async getAccessibleResourceQuery(
    user: LinchKitUser,
    action: PermissionAction,
    resourceType: PermissionSubject,
    context?: PermissionContext
  ): Promise<Record<string, unknown>> {
    const cacheKey = this.buildCacheKey('accessibleResourceQuery', user.id, action, resourceType, context)
    
    if (this.options.enableCache !== false) {
      const cached = this.getFromCache<Record<string, unknown>>(cacheKey)
      if (cached) return cached
    }

    try {
      const conditions = await this.getPermissionConditions(user, action, resourceType, context)

      // 转换为数据库查询条件
      const query: Record<string, unknown> = {}

      // 用户所有者条件
      if (conditions.userId) {
        query.OR = query.OR || []
        ;(query.OR as unknown[]).push({ userId: conditions.userId })
        ;(query.OR as unknown[]).push({ createdBy: conditions.userId })
      }

      // 租户条件
      if (conditions.tenantId) {
        query.tenantId = conditions.tenantId
      }

      // 角色特定查询条件
      const roles = await this.getEffectiveRoles(user.id)
      for (const role of roles) {
        const roleQuery = await this.databaseAdapter.getRoleResourceQuery(
          role,
          action,
          resourceType
        )
        Object.assign(query, roleQuery)
      }

      this.setCache(cacheKey, query)
      return query

    } catch (error) {
      console.error('Failed to get accessible resource query:', error)
      return { userId: user.id }
    }
  }

  /**
   * 清除用户权限缓存
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key] of this.cache) {
      if (key.includes(userId)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 清除角色权限缓存
   */
  async invalidateRoleCache(roleId: string): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key] of this.cache) {
      if (key.includes(`role:${roleId}`) || key.includes(`rolePermissions:${roleId}`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private buildCacheKey(...parts: (string | any)[]): string {
    const prefix = this.options.cachePrefix || 'perm'
    const serializedParts = parts.map(part => 
      typeof part === 'object' ? JSON.stringify(part) : String(part)
    )
    return `${prefix}:${serializedParts.join(':')}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  private setCache(key: string, value: any): void {
    const ttl = this.options.cacheTTL || this.defaultCacheTTL
    const entry: PermissionCacheEntry = {
      key,
      value,
      expiresAt: Date.now() + ttl,
    }
    
    this.cache.set(key, entry)
  }

  private startCacheCleanup(): void {
    // 每分钟清理过期缓存
    setInterval(() => {
      const now = Date.now()
      const keysToDelete: string[] = []

      for (const [key, entry] of this.cache) {
        if (now > entry.expiresAt) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key))
    }, 60 * 1000)
  }

  private getResourceType(resource: any): string {
    if (typeof resource === 'string') {
      return resource
    }

    if (resource && typeof resource === 'object') {
      // 尝试从对象获取类型
      if (resource.constructor && resource.constructor.name) {
        return resource.constructor.name
      }

      if (resource._type) {
        return resource._type
      }

      if (resource.type) {
        return resource.type
      }

      if (resource.__typename) {
        return resource.__typename
      }
    }

    return 'unknown'
  }
}

/**
 * 创建增强权限引擎 v2 的工厂函数
 */
export function createEnhancedPermissionEngineV2(
  databaseAdapter: IDatabasePermissionAdapter,
  options?: {
    enableCache?: boolean
    cachePrefix?: string
    cacheTTL?: number
    roleHierarchyEnabled?: boolean
  }
): EnhancedPermissionEngineV2 {
  return new EnhancedPermissionEngineV2(databaseAdapter, options)
}