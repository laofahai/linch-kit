/**
 * @linch-kit/auth 权限引擎
 * 基于 CASL 实现复杂权限逻辑
 * 缓存功能已移至 @linch-kit/core 包
 */

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'

import type {
  LinchKitUser,
  PermissionAction,
  PermissionSubject,
  PermissionContext,
  PermissionCheck,
  IPermissionChecker,
} from '../types'

/**
 * CASL权限引擎类型定义
 */
type AppAbility = MongoAbility<[string, any]>

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
  // 注意：缓存功能已移至 @linch-kit/core 包，由上层应用负责缓存管理

  constructor(
    _options: {
      // 保留配置接口以便未来扩展
    } = {}
  ) {
    // 权限引擎初始化
  }

  /**
   * 主要的权限检查方法
   */
  public async check(
    user: LinchKitUser,
    action: string,
    subject: any,
    context?: PermissionContext
  ): Promise<boolean> {
    // 检查用户是否有效
    if (!user || !user.id) {
      return false
    }

    // 执行权限检查（缓存由上层应用负责）
    const ability = await this.getAbilityForLinchKitUser(user, context)
    return ability.can(action, subject)
  }

  /**
   * 批量权限检查
   */
  public async checkMultiple(
    user: LinchKitUser,
    checks: PermissionCheck[],
    context?: PermissionContext
  ): Promise<Record<string, boolean>> {
    const ability = await this.getAbilityForLinchKitUser(user, context)
    const results: Record<string, boolean> = {}

    checks.forEach((check, index) => {
      const key = `${check.action}_${typeof check.subject === 'string' ? check.subject : check.subject.constructor.name}_${index}`
      const result = ability.can(check.action, check.subject)
      results[key] = result
    })

    return results
  }

  /**
   * 获取用户可访问的资源查询条件
   */
  public async getAccessibleResources(
    user: LinchKitUser,
    action: PermissionAction,
    resourceType: PermissionSubject
  ): Promise<unknown> {
    await this.getAbilityForLinchKitUser(user)

    // TODO: 实现查询构建功能
    // CASL的query方法在某些版本中可能不可用
    console.log('Getting accessible resources for user', user.id, action, resourceType)
    return {}
  }

  /**
   * 为用户创建能力对象
   */
  private async getAbilityForLinchKitUser(
    user: LinchKitUser,
    context?: PermissionContext
  ): Promise<AppAbility> {
    // 创建能力对象（缓存由上层应用负责）
    return await this.createAbilityForLinchKitUser(user, context)
  }

  /**
   * 创建用户权限能力对象
   */
  private async createAbilityForLinchKitUser(
    user: LinchKitUser,
    context?: PermissionContext
  ): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

    // 检查用户是否有效
    if (!user || !user.id) {
      return build()
    }

    // 获取用户角色和权限
    const userRoles = await this.getLinchKitUserRoles(user.id)
    const userPermissions = await this.getLinchKitUserPermissions(user.id)

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
    user: LinchKitUser,
    roles: string[],
    can: any,
    cannot: any
  ): Promise<void> {
    // 超级管理员权限
    if (roles.includes('super_admin')) {
      can('manage', 'all')
      return
    }

    // 管理员权限
    if (roles.includes('admin')) {
      can('manage', ['LinchKitUser', 'Role', 'Permission'])
      can('read', 'all')
      can('create', ['Category', 'Tag', 'Config'])
      can('update', ['Category', 'Tag', 'Config'])
      can('delete', ['Category', 'Tag'])
      can('read', 'AuditLog')
    }

    // 项目经理权限
    if (roles.includes('project_manager')) {
      can('manage', 'Category', { createdBy: user.id })
      can('read', 'Category')
      can('create', ['Category', 'Tag'])
      can('update', ['Category', 'Tag'], { createdBy: user.id })
      can('read', 'Config', { tenantId: user.tenantId })
    }

    // 团队成员权限
    if (roles.includes('team_member')) {
      can('read', ['Category', 'Tag'])
      can('create', 'Tag')
      can('update', 'Tag', { createdBy: user.id })
      can('read', 'Config', { tenantId: user.tenantId })
    }

    // 普通用户权限
    if (roles.includes('user')) {
      can('read', ['Category', 'Tag'])
      can('read', 'Config', { tenantId: user.tenantId, public: true })
      can('update', 'LinchKitUser', { id: user.id }) // 只能编辑自己的信息
    }

    // 访客权限
    if (roles.includes('guest')) {
      can('read', 'Category')
      can('read', 'Tag')
      cannot('create', 'all')
      cannot('update', 'all')
      cannot('delete', 'all')
    }
  }

  /**
   * 应用基于属性的权限 (ABAC)
   */
  private async applyAttributeBasedPermissions(
    user: LinchKitUser,
    context: PermissionContext,
    can: any,
    cannot: any
  ): Promise<void> {
    // 基于部门的权限
    const userDepartment = await this.getLinchKitUserDepartment(user.id)
    if (userDepartment) {
      can('read', 'LinchKitUser', { department: userDepartment })

      if (userDepartment === 'hr') {
        can('read', 'LinchKitUser', ['salary', 'performance'])
        can('update', 'LinchKitUser', ['department', 'position'])
        can('read', 'AuditLog', { category: 'SECURITY' })
      }

      if (userDepartment === 'finance') {
        can('read', 'Config', { category: 'finance' })
        can('update', 'Config', { category: 'finance' })
      }

      if (userDepartment === 'it') {
        can('manage', 'LinchKitUser', ['permissions', 'roles'])
        can('read', 'all') // IT部门可以读取所有数据
      }
    }

    // 基于时间的权限
    const currentHour = new Date().getHours()
    if (currentHour < 9 || currentHour > 18) {
      // 非工作时间限制某些操作
      cannot('delete', ['Project', 'LinchKitUser'])
      cannot('update', 'LinchKitUser', ['roles', 'permissions'])
      cannot('create', 'Project')
    }

    // 基于地理位置的权限
    if (context.location) {
      const userAllowedRegions = await this.getLinchKitUserAllowedRegions(user.id)
      if (userAllowedRegions && !userAllowedRegions.includes(context.location)) {
        cannot('access', 'all')
        return // 地理位置不符，拒绝所有访问
      }
    }

    // 基于设备类型的权限
    if (context.deviceType === 'mobile') {
      cannot('manage', ['LinchKitUser', 'Project']) // 移动设备不允许管理操作
      cannot('delete', 'all') // 移动设备不允许删除操作
    }

    // 基于租户的权限
    if (context.tenantId) {
      const userTenants = await this.getLinchKitUserTenants(user.id)
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
    user: LinchKitUser,
    permissions: string[],
    can: any,
    _cannot: any
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
    user: LinchKitUser,
    can: any,
    cannot: any
  ): Promise<void> {
    const roles = await this.getLinchKitUserRoles(user.id)

    // 所有用户都能读取基本字段
    can('read', 'LinchKitUser', ['id', 'name', 'email', 'avatar', 'status'])

    // 敏感字段默认禁止
    cannot('read', 'LinchKitUser', ['password', 'salt', 'resetToken', 'apiKeys'])

    // 根据角色开放不同字段
    if (roles.includes('hr') || roles.includes('admin')) {
      can('read', 'LinchKitUser', ['salary', 'department', 'hireDate', 'performance'])
    }

    if (roles.includes('admin') || roles.includes('super_admin')) {
      can('read', 'LinchKitUser', ['lastLoginAt', 'loginCount', 'permissions', 'roles'])
      can('read', 'Project', ['budget', 'expenses', 'profit'])
    }

    // 用户只能看到自己的私人信息
    can('read', 'LinchKitUser', ['phone', 'address', 'personalNotes'], { id: user.id })
    can('update', 'LinchKitUser', ['name', 'avatar', 'phone', 'address'], { id: user.id })
  }

  /**
   * 字段级权限过滤
   */
  public async filterFields<T>(
    user: LinchKitUser,
    resource: T,
    requestedFields: string[],
    context?: PermissionContext
  ): Promise<Partial<T>> {
    const ability = await this.getAbilityForLinchKitUser(user, context)
    const filteredFields: Partial<T> = {}

    requestedFields.forEach(field => {
      // 检查用户是否有权限读取该字段
      if (ability.can('read', resource as unknown, field)) {
        ;(filteredFields as unknown as Record<string, unknown>)[field] = (
          resource as unknown as Record<string, unknown>
        )[field]
      }
    })

    return filteredFields
  }

  // 注意：缓存管理已移至 @linch-kit/core 包

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private parsePermission(permission: string): [string, string, any?] {
    // 解析权限字符串，如 "read:LinchKitUser" 或 "update:Post:authorId=123"
    const parts = permission.split(':')
    const action = parts[0]
    const subject = parts[1]
    const conditions = parts[2] ? JSON.parse(parts[2]) : undefined

    return [action, subject, conditions]
  }

  // 模拟数据库查询方法（实际应该从数据库获取）
  private async getLinchKitUserRoles(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户角色
    return ['user'] // 示例数据
  }

  private async getLinchKitUserPermissions(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户直接权限
    return [] // 示例数据
  }

  private async getLinchKitUserDepartment(_userId: string): Promise<string | null> {
    // TODO: 从数据库查询用户部门
    return null
  }

  private async getLinchKitUserManagedProjects(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户管理的项目
    return []
  }

  private async getLinchKitUserAllowedRegions(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户允许访问的地区
    return ['CN', 'US'] // 示例数据
  }

  private async getLinchKitUserTenants(_userId: string): Promise<string[]> {
    // TODO: 从数据库查询用户所属租户
    return ['tenant-1'] // 示例数据
  }
}
