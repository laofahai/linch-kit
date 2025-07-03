/**
 * @linch-kit/auth 增强型权限引擎
 * 基于现有 CASL 引擎扩展，支持更复杂的企业级权限管理
 */

import { CASLPermissionEngine } from './casl-engine'
import type { 
  LinchKitUser,
  PermissionAction,
  PermissionSubject,
  PermissionContext,
  IPermissionChecker
} from '../types'

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
 * 角色继承信息
 */
interface RoleHierarchy {
  roleId: string
  parentRoleId?: string
  inheritedPermissions: string[]
}

/**
 * 字段级权限规则
 */
interface FieldPermissionRule {
  resource: string
  fields: {
    allowed: string[]
    denied: string[]
  }
  conditions?: Record<string, unknown>
}

/**
 * 增强型权限引擎
 * 
 * 特性：
 * - 角色继承和权限聚合
 * - 字段级权限控制
 * - 行级权限过滤
 * - 运行时权限计算
 * - 性能优化缓存
 */
export class EnhancedPermissionEngine extends CASLPermissionEngine {
  constructor(options: {
    enableCache?: boolean
    cachePrefix?: string
    cacheTTL?: number
    roleHierarchyEnabled?: boolean
  } = {}) {
    super(options)
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
    // 基础权限检查
    const granted = await this.check(user, action, subject, context)
    
    if (!granted) {
      return {
        granted: false,
        reason: 'Permission denied by basic check'
      }
    }

    // 获取字段级权限
    const fieldPermissions = await this.getFieldPermissions(user, subject, context)
    
    // 获取条件权限
    const conditions = await this.getPermissionConditions(user, action, subject, context)
    
    return {
      granted: true,
      allowedFields: fieldPermissions.allowed,
      deniedFields: fieldPermissions.denied,
      conditions
    }
  }

  /**
   * 获取用户的所有有效角色（包括继承的角色）
   */
  async getEffectiveRoles(userId: string): Promise<string[]> {
    // 获取直接分配的角色
    const directRoles = await this.getUserDirectRoles(userId)
    
    // 获取继承的角色
    const inheritedRoles = await this.getInheritedRoles(directRoles)
    
    // 合并并去重
    return [...new Set([...directRoles, ...inheritedRoles])]
  }

  /**
   * 获取角色的所有权限（包括继承的权限）
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    // 获取直接权限
    const directPermissions = await this.getRoleDirectPermissions(roleId)
    
    // 获取父角色
    const parentRoles = await this.getParentRoles(roleId)
    
    // 递归获取父角色权限
    const inheritedPermissions: string[] = []
    for (const parentRole of parentRoles) {
      const parentPermissions = await this.getRolePermissions(parentRole)
      inheritedPermissions.push(...parentPermissions)
    }
    
    // 合并并去重
    return [...new Set([...directPermissions, ...inheritedPermissions])]
  }

  /**
   * 获取字段级权限
   */
  async getFieldPermissions(
    user: LinchKitUser,
    resource: any,
    context?: PermissionContext
  ): Promise<{ allowed: string[]; denied: string[] }> {
    const roles = await this.getEffectiveRoles(user.id)
    const resourceType = this.getResourceType(resource)
    
    // 收集所有角色的字段权限
    const allAllowed = new Set<string>()
    const allDenied = new Set<string>()
    
    for (const role of roles) {
      const fieldRules = await this.getRoleFieldPermissions(role, resourceType)
      
      fieldRules.allowed.forEach(field => allAllowed.add(field))
      fieldRules.denied.forEach(field => allDenied.add(field))
    }
    
    // 应用上下文相关的字段权限
    if (context) {
      const contextFieldRules = await this.getContextFieldPermissions(user, resourceType, context)
      
      contextFieldRules.allowed.forEach(field => allAllowed.add(field))
      contextFieldRules.denied.forEach(field => allDenied.add(field))
    }
    
    // 处理冲突：拒绝优先原则
    const allowed = Array.from(allAllowed).filter(field => !allDenied.has(field))
    const denied = Array.from(allDenied)
    
    return { allowed, denied }
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
    
    // 只包含允许的字段
    for (const field of fieldPermissions.allowed) {
      if (field in resource) {
        filtered[field as keyof T] = resource[field as keyof T]
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
      const roleConditions = await this.getRoleConditions(role, action, subject)
      Object.assign(conditions, roleConditions)
    }
    
    // 资源特定条件
    if (typeof subject === 'object' && subject !== null) {
      const resourceConditions = await this.getResourceConditions(user, action, subject)
      Object.assign(conditions, resourceConditions)
    }
    
    return conditions
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
    
    for (const resource of resources) {
      const hasPermission = await this.check(user, action, resource, context)
      if (hasPermission) {
        filtered.push(resource)
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
      const roleQuery = await this.getRoleResourceQuery(role, action, resourceType)
      Object.assign(query, roleQuery)
    }
    
    return query
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private async getUserDirectRoles(userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户直接分配的角色
    // 这里应该查询 UserRoleAssignment 表
    return []
  }

  private async getInheritedRoles(roleIds: string[]): Promise<string[]> {
    // TODO: 从数据库查询角色继承关系
    // 这里应该查询 Role 表的 parentRoleId
    return []
  }

  private async getRoleDirectPermissions(roleId: string): Promise<string[]> {
    // TODO: 从数据库查询角色的直接权限
    // 这里应该查询 RolePermission 表
    return []
  }

  private async getParentRoles(roleId: string): Promise<string[]> {
    // TODO: 从数据库查询父角色
    // 这里应该查询 Role 表的继承关系
    return []
  }

  private async getRoleFieldPermissions(
    roleId: string, 
    resourceType: string
  ): Promise<{ allowed: string[]; denied: string[] }> {
    // TODO: 从数据库查询角色的字段权限
    return { allowed: [], denied: [] }
  }

  private async getContextFieldPermissions(
    user: LinchKitUser,
    resourceType: string,
    context: PermissionContext
  ): Promise<{ allowed: string[]; denied: string[] }> {
    // TODO: 根据上下文获取字段权限
    return { allowed: [], denied: [] }
  }

  private async getRoleConditions(
    roleId: string,
    action: string,
    subject: string | any
  ): Promise<Record<string, unknown>> {
    // TODO: 从数据库查询角色的权限条件
    return {}
  }

  private async getResourceConditions(
    user: LinchKitUser,
    action: string,
    resource: any
  ): Promise<Record<string, unknown>> {
    // TODO: 从 ResourcePermission 表查询资源级权限
    return {}
  }

  private async getRoleResourceQuery(
    roleId: string,
    action: string,
    resourceType: string
  ): Promise<Record<string, unknown>> {
    // TODO: 获取角色的资源查询条件
    return {}
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
    }
    
    return 'unknown'
  }
}

/**
 * 创建增强权限引擎的工厂函数
 */
export function createEnhancedPermissionEngine(options?: {
  enableCache?: boolean
  cachePrefix?: string
  cacheTTL?: number
  roleHierarchyEnabled?: boolean
}): EnhancedPermissionEngine {
  return new EnhancedPermissionEngine(options)
}