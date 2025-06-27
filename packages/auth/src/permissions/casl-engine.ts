/**
 * @linch-kit/auth 权限引擎
 * 基于 CASL 实现复杂权限逻辑
 */

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { LRUCache } from 'lru-cache'

import type { 
  User, 
  PermissionAction, 
  PermissionSubject, 
  PermissionContext, 
  PermissionCheck,
  IPermissionChecker 
} from '../types'

/**
 * CASL权限引擎类型定义
 */
type AppAbility = MongoAbility<[PermissionAction, PermissionSubject | unknown]>

/**
 * 基于CASL的权限引擎
 * 
 * 设计原则：
 * - 使用 CASL 实现复杂权限逻辑，而不是自己实现
 * - 支持字段级和条件权限控制
 * - 与前端权限系统保持一致
 * - 支持 RBAC 和 ABAC 混合模式
 * - 权限缓存优化性能
 */
export class CASLPermissionEngine implements IPermissionChecker {
  private permissionCache: LRUCache<string, boolean>
  private abilityCache: LRUCache<string, AppAbility>

  constructor(options: {
    cacheSize?: number
    cacheTTL?: number
  } = {}) {
    // 权限检查结果缓存
    this.permissionCache = new LRUCache<string, boolean>({
      max: options.cacheSize ?? 10000,
      ttl: options.cacheTTL ?? 1000 * 60 * 5 // 5分钟缓存
    })

    // 用户能力对象缓存
    this.abilityCache = new LRUCache<string, AppAbility>({
      max: Math.floor((options.cacheSize ?? 10000) / 10),
      ttl: (options.cacheTTL ?? 1000 * 60 * 5) * 2 // 10分钟缓存
    })
  }

  /**
   * 主要的权限检查方法
   */
  public async check(
    user: User,
    action: PermissionAction,
    subject: PermissionSubject | unknown,
    context?: PermissionContext
  ): Promise<boolean> {
    const cacheKey = this.generatePermissionCacheKey(user.id, action, subject, context)
    
    // 检查缓存
    const cached = this.permissionCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // 执行权限检查
    const ability = await this.getAbilityForUser(user, context)
    const result = ability.can(action, subject)
    
    // 缓存结果
    this.permissionCache.set(cacheKey, result)
    
    return result
  }

  /**
   * 批量权限检查
   */
  public async checkMultiple(
    user: User,
    checks: PermissionCheck[],
    context?: PermissionContext
  ): Promise<Record<string, boolean>> {
    const ability = await this.getAbilityForUser(user, context)
    const results: Record<string, boolean> = {}
    
    checks.forEach((check, index) => {
      const key = `${check.action}_${typeof check.subject === 'string' ? check.subject : check.subject.constructor.name}_${index}`
      const result = ability.can(check.action as PermissionAction, check.subject)
      
      results[key] = result
      
      // 缓存单个结果
      const cacheKey = this.generatePermissionCacheKey(user.id, check.action as PermissionAction, check.subject, context)
      this.permissionCache.set(cacheKey, result)
    })
    
    return results
  }

  /**
   * 获取用户可访问的资源查询条件
   */
  public async getAccessibleResources(
    user: User,
    action: PermissionAction,
    resourceType: PermissionSubject
  ): Promise<unknown> {
    await this.getAbilityForUser(user)

    // TODO: 实现查询构建功能
    // CASL的query方法在某些版本中可能不可用
    console.log('Getting accessible resources for user', user.id, action, resourceType)
    return {}
  }

  /**
   * 为用户创建能力对象
   */
  private async getAbilityForUser(user: User, context?: PermissionContext): Promise<AppAbility> {
    const cacheKey = this.generateAbilityCacheKey(user.id, context)
    
    // 检查缓存
    const cached = this.abilityCache.get(cacheKey)
    if (cached) return cached
    
    // 创建新的能力对象
    const ability = await this.createAbilityForUser(user, context)
    
    // 缓存结果
    this.abilityCache.set(cacheKey, ability)
    
    return ability
  }

  /**
   * 创建用户权限能力对象
   */
  private async createAbilityForUser(user: User, context?: PermissionContext): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
    
    // 获取用户角色和权限
    const userRoles = await this.getUserRoles(user.id)
    const userPermissions = await this.getUserPermissions(user.id)
    
    // 基于角色的基础权限 (RBAC)
    await this.applyRoleBasedPermissions(user, userRoles, can, cannot)
    
    // 基于属性的动态权限 (ABAC)
    if (context) {
      await this.applyAttributeBasedPermissions(user, context, can, cannot)
    }
    
    // 直接分配的权限
    await this.applyDirectPermissions(user, userPermissions, can, cannot)
    
    // 字段级权限控制
    await this.applyFieldLevelPermissions(user, can, cannot)
    
    return build()
  }

  /**
   * 应用基于角色的权限 (RBAC)
   */
  private async applyRoleBasedPermissions(
    user: User,
    roles: string[],
    can: unknown,
    cannot: unknown
  ): Promise<void> {
    // 超级管理员权限
    if (roles.includes('super_admin')) {
      can('manage', 'all')
      return
    }
    
    // 管理员权限
    if (roles.includes('admin')) {
      can('manage', ['User', 'Role', 'Permission'])
      can('read', 'all')
      can('create', ['Project', 'Post'])
      can('update', ['Project', 'Post'])
      can('delete', ['Project', 'Post'])
    }
    
    // 项目经理权限
    if (roles.includes('project_manager')) {
      can('manage', 'Project', { managerId: user.id })
      can('read', 'Project', { teamMembers: { $in: [user.id] } })
      can('update', 'User', { projectId: { $in: await this.getUserManagedProjects(user.id) } })
      can('create', ['Post', 'Comment'])
      can('update', ['Post', 'Comment'], { authorId: user.id })
    }
    
    // 团队成员权限
    if (roles.includes('team_member')) {
      can('read', 'Project', { teamMembers: { $in: [user.id] } })
      can('update', 'Project', { teamMembers: { $in: [user.id] } }, ['status', 'progress'])
      can('create', ['Post', 'Comment', 'File'])
      can('update', ['Post', 'Comment', 'File'], { authorId: user.id })
      can('delete', ['Comment', 'File'], { authorId: user.id })
    }
    
    // 普通用户权限
    if (roles.includes('user')) {
      can('read', ['Post', 'Comment'], { published: true })
      can('create', 'Comment')
      can('update', 'Comment', { authorId: user.id })
      can('delete', 'Comment', { authorId: user.id })
      can('update', 'User', { id: user.id }) // 只能编辑自己的信息
    }
    
    // 访客权限
    if (roles.includes('guest')) {
      can('read', 'Post', { published: true, draft: false })
      cannot('read', 'Post', { draft: true })
      cannot('create', 'all')
      cannot('update', 'all')
      cannot('delete', 'all')
    }
  }

  /**
   * 应用基于属性的权限 (ABAC)
   */
  private async applyAttributeBasedPermissions(
    user: User,
    context: PermissionContext,
    can: unknown,
    cannot: unknown
  ): Promise<void> {
    // 基于部门的权限
    const userDepartment = await this.getUserDepartment(user.id)
    if (userDepartment) {
      can('read', 'User', { department: userDepartment })
      
      if (userDepartment === 'hr') {
        can('read', 'User', ['salary', 'performance'])
        can('update', 'User', ['department', 'position'])
      }
      
      if (userDepartment === 'finance') {
        can('read', 'Project', ['budget', 'expenses'])
        can('update', 'Project', { department: 'finance' })
      }
      
      if (userDepartment === 'it') {
        can('manage', 'User', ['permissions', 'roles'])
        can('read', 'all') // IT部门可以读取所有数据
      }
    }
    
    // 基于时间的权限
    const currentHour = new Date().getHours()
    if (currentHour < 9 || currentHour > 18) {
      // 非工作时间限制某些操作
      cannot('delete', ['Project', 'User'])
      cannot('update', 'User', ['roles', 'permissions'])
      cannot('create', 'Project')
    }
    
    // 基于地理位置的权限
    if (context.location) {
      const userAllowedRegions = await this.getUserAllowedRegions(user.id)
      if (userAllowedRegions && !userAllowedRegions.includes(context.location)) {
        cannot('access', 'all')
        return // 地理位置不符，拒绝所有访问
      }
    }
    
    // 基于设备类型的权限
    if (context.deviceType === 'mobile') {
      cannot('manage', ['User', 'Project']) // 移动设备不允许管理操作
      cannot('delete', 'all') // 移动设备不允许删除操作
    }
    
    // 基于租户的权限
    if (context.tenantId) {
      const userTenants = await this.getUserTenants(user.id)
      if (!userTenants.includes(context.tenantId)) {
        cannot('access', 'all')
        return
      }
      
      // 租户级权限隔离
      can('read', 'all', { tenantId: context.tenantId })
      cannot('read', 'all', { tenantId: { $ne: context.tenantId } })
    }
  }

  /**
   * 应用直接分配的权限
   */
  private async applyDirectPermissions(
    user: User,
    permissions: string[],
    can: unknown,
    _cannot: unknown
  ): Promise<void> {
    for (const permission of permissions) {
      const [action, subject, conditions] = this.parsePermission(permission)
      
      if (conditions) {
        can(action, subject, conditions)
      } else {
        can(action, subject)
      }
    }
  }

  /**
   * 应用字段级权限控制
   */
  private async applyFieldLevelPermissions(
    user: User,
    can: unknown,
    cannot: unknown
  ): Promise<void> {
    const roles = await this.getUserRoles(user.id)
    
    // 所有用户都能读取基本字段
    can('read', 'User', ['id', 'name', 'email', 'avatar', 'status'])
    
    // 敏感字段默认禁止
    cannot('read', 'User', ['password', 'salt', 'resetToken', 'apiKeys'])
    
    // 根据角色开放不同字段
    if (roles.includes('hr') || roles.includes('admin')) {
      can('read', 'User', ['salary', 'department', 'hireDate', 'performance'])
    }
    
    if (roles.includes('admin') || roles.includes('super_admin')) {
      can('read', 'User', ['lastLoginAt', 'loginCount', 'permissions', 'roles'])
      can('read', 'Project', ['budget', 'expenses', 'profit'])
    }
    
    // 用户只能看到自己的私人信息
    can('read', 'User', ['phone', 'address', 'personalNotes'], { id: user.id })
    can('update', 'User', ['name', 'avatar', 'phone', 'address'], { id: user.id })
  }

  /**
   * 字段级权限过滤
   */
  public async filterFields<T>(
    user: User,
    resource: T,
    requestedFields: string[],
    context?: PermissionContext
  ): Promise<Partial<T>> {
    const ability = await this.getAbilityForUser(user, context)
    const filteredFields: Partial<T> = {}
    
    requestedFields.forEach(field => {
      // 检查用户是否有权限读取该字段
      if (ability.can('read', resource as unknown, field)) {
        (filteredFields as unknown as Record<string, unknown>)[field] = (resource as unknown as Record<string, unknown>)[field]
      }
    })
    
    return filteredFields
  }

  /**
   * 用户权限变更时清除缓存
   */
  public clearUserCache(userId: string): void {
    // 清除用户相关的所有缓存
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key)
      }
    }
    
    for (const key of this.abilityCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.abilityCache.delete(key)
      }
    }
  }

  /**
   * 清除所有缓存
   */
  public clearAllCache(): void {
    this.permissionCache.clear()
    this.abilityCache.clear()
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private generatePermissionCacheKey(
    userId: string,
    action: PermissionAction,
    subject: PermissionSubject | unknown,
    context?: PermissionContext
  ): string {
    const subjectKey = typeof subject === 'string' ? subject : JSON.stringify(subject)
    const contextKey = context ? JSON.stringify(context) : ''
    return `${userId}:${action}:${subjectKey}:${contextKey}`
  }

  private generateAbilityCacheKey(userId: string, context?: PermissionContext): string {
    const contextKey = context ? JSON.stringify(context) : ''
    return `${userId}:ability:${contextKey}`
  }

  private parsePermission(permission: string): [PermissionAction, PermissionSubject, unknown?] {
    // 解析权限字符串，如 "read:User" 或 "update:Post:authorId=123"
    const parts = permission.split(':')
    const action = parts[0] as PermissionAction
    const subject = parts[1] as PermissionSubject
    const conditions = parts[2] ? JSON.parse(parts[2]) : undefined
    
    return [action, subject, conditions]
  }

  // 模拟数据库查询方法（实际应该从数据库获取）
  private async getUserRoles(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户角色
    return ['user'] // 示例数据
  }

  private async getUserPermissions(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户直接权限
    return [] // 示例数据
  }

  private async getUserDepartment(_userId: string): Promise<string | null> {
    // TODO: 从数据库查询用户部门
    return null
  }

  private async getUserManagedProjects(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户管理的项目
    return []
  }

  private async getUserAllowedRegions(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户允许访问的地区
    return ['CN', 'US'] // 示例数据
  }

  private async getUserTenants(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户所属租户
    return ['tenant-1'] // 示例数据
  }
}