/**
 * 权限检查器 - 与 @linch-kit/auth 深度集成
 * 
 * 提供细粒度的权限控制：
 * - 实体级权限检查
 * - 字段级权限控制  
 * - 行级权限过滤
 * - 条件权限解析
 */

import type { Entity, FieldDefinition, SchemaRegistry } from '@linch-kit/schema'
import type { User, PermissionChecker as AuthPermissionChecker } from '@linch-kit/auth'
import type { Logger } from '@linch-kit/core'
import type { IPermissionChecker, PermissionError } from '../types'

/**
 * 权限检查器实现
 */
export class PermissionChecker implements IPermissionChecker {
  constructor(
    private readonly schemaRegistry: SchemaRegistry,
    private readonly authPermissionChecker?: AuthPermissionChecker,
    private readonly logger?: Logger
  ) {}

  /**
   * 检查创建权限
   */
  async checkCreate(entity: Entity, user: User, data: unknown): Promise<void> {
    // 实体级权限检查
    const canCreate = await this.checkEntityPermission(user, entity.name, 'create')
    if (!canCreate) {
      throw new PermissionError(
        `No permission to create ${entity.name}`,
        'create',
        entity.name
      )
    }

    // 字段级权限检查
    await this.checkFieldPermissions(entity, user, data, 'write')

    // 自定义权限检查
    await this.checkCustomPermissions(entity, user, 'create', data)
  }

  /**
   * 检查读取权限
   */
  async checkRead(entity: Entity, user: User, resource?: unknown): Promise<void> {
    const canRead = await this.checkEntityPermission(user, entity.name, 'read')
    if (!canRead) {
      throw new PermissionError(
        `No permission to read ${entity.name}`,
        'read',
        entity.name
      )
    }

    // 行级权限检查
    if (resource) {
      const hasRowAccess = await this.checkRowPermission(entity, user, resource, 'read')
      if (!hasRowAccess) {
        throw new PermissionError(
          `No permission to read this ${entity.name} record`,
          'read',
          entity.name
        )
      }
    }

    // 自定义权限检查
    await this.checkCustomPermissions(entity, user, 'read', resource)
  }

  /**
   * 检查更新权限
   */
  async checkUpdate(
    entity: Entity,
    user: User,
    resource: unknown,
    data: unknown
  ): Promise<void> {
    const canUpdate = await this.checkEntityPermission(user, entity.name, 'update')
    if (!canUpdate) {
      throw new PermissionError(
        `No permission to update ${entity.name}`,
        'update',
        entity.name
      )
    }

    // 行级权限检查
    const hasRowAccess = await this.checkRowPermission(entity, user, resource, 'update')
    if (!hasRowAccess) {
      throw new PermissionError(
        `No permission to update this ${entity.name} record`,
        'update',
        entity.name
      )
    }

    // 字段级权限检查
    await this.checkFieldPermissions(entity, user, data, 'write')

    // 自定义权限检查
    await this.checkCustomPermissions(entity, user, 'update', data, resource)
  }

  /**
   * 检查删除权限
   */
  async checkDelete(entity: Entity, user: User, resource: unknown): Promise<void> {
    const canDelete = await this.checkEntityPermission(user, entity.name, 'delete')
    if (!canDelete) {
      throw new PermissionError(
        `No permission to delete ${entity.name}`,
        'delete',
        entity.name
      )
    }

    // 行级权限检查
    const hasRowAccess = await this.checkRowPermission(entity, user, resource, 'delete')
    if (!hasRowAccess) {
      throw new PermissionError(
        `No permission to delete this ${entity.name} record`,
        'delete',
        entity.name
      )
    }

    // 自定义权限检查
    await this.checkCustomPermissions(entity, user, 'delete', undefined, resource)
  }

  /**
   * 过滤字段权限
   */
  async filterFields<T>(
    entity: Entity,
    user: User,
    data: T[],
    operation: 'read' | 'write'
  ): Promise<Partial<T>[]> {
    return await Promise.all(
      data.map(async (item) => {
        const filteredItem: Partial<T> = {}

        for (const [fieldName, fieldValue] of Object.entries(item as Record<string, unknown>)) {
          const field = entity.fields[fieldName]

          // 检查字段权限
          if (await this.checkFieldPermission(entity, user, fieldName, operation, item)) {
            (filteredItem as Record<string, unknown>)[fieldName] = fieldValue
          } else {
            this.logger?.debug(`Field ${fieldName} filtered out due to permissions`, {
              entityName: entity.name,
              userId: user.id,
              operation
            })
          }
        }

        return filteredItem
      })
    )
  }

  /**
   * 构建行级权限过滤条件
   */
  async buildRowFilter(
    entity: Entity,
    user: User,
    operation: 'read' | 'write' | 'delete'
  ): Promise<Record<string, unknown>> {
    const filters: Record<string, unknown> = {}

    // 获取实体的权限配置
    const permissions = entity.options?.permissions?.[operation]
    if (!permissions || permissions.length === 0) {
      return filters
    }

    for (const permission of permissions) {
      if (permission.condition) {
        try {
          // 解析权限条件，转换为 Prisma 查询条件
          const condition = await this.parsePermissionCondition(permission.condition, user)
          Object.assign(filters, condition)
        } catch (error) {
          this.logger?.warn(`Failed to parse permission condition: ${permission.condition}`, {
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    // 多租户过滤
    if (entity.options?.multiTenant && user.tenantId) {
      filters.tenantId = user.tenantId
    }

    // 用户相关过滤
    if (entity.options?.userOwned) {
      filters.createdBy = user.id
    }

    return filters
  }

  // 私有辅助方法

  /**
   * 检查实体级权限
   */
  private async checkEntityPermission(
    user: User,
    entityName: string,
    operation: string
  ): Promise<boolean> {
    // 使用 @linch-kit/auth 的权限检查器
    if (this.authPermissionChecker) {
      return await this.authPermissionChecker.check(user, `${entityName}:${operation}`)
    }

    // 默认权限检查逻辑
    return this.hasDefaultPermission(user, entityName, operation)
  }

  /**
   * 检查字段级权限
   */
  private async checkFieldPermissions(
    entity: Entity,
    user: User,
    data: unknown,
    operation: 'read' | 'write'
  ): Promise<void> {
    if (!data || typeof data !== 'object') {
      return
    }

    const dataRecord = data as Record<string, unknown>

    for (const [fieldName, fieldValue] of Object.entries(dataRecord)) {
      const hasPermission = await this.checkFieldPermission(
        entity,
        user,
        fieldName,
        operation,
        data
      )

      if (!hasPermission) {
        throw new PermissionError(
          `No permission to ${operation} field ${fieldName}`,
          operation,
          entity.name,
          fieldName
        )
      }
    }
  }

  /**
   * 检查单个字段权限
   */
  private async checkFieldPermission(
    entity: Entity,
    user: User,
    fieldName: string,
    operation: 'read' | 'write',
    resource?: unknown
  ): Promise<boolean> {
    const field = entity.fields[fieldName]
    if (!field) {
      // 字段不存在于Schema中，允许访问（可能是系统字段）
      return true
    }

    // 检查字段级权限配置
    const fieldPermissions = field.permissions?.[operation]
    if (!fieldPermissions) {
      // 没有权限配置的字段默认允许
      return true
    }

    // 使用 @linch-kit/auth 检查字段权限
    if (this.authPermissionChecker) {
      const hasPermission = await this.authPermissionChecker.check(
        user,
        `${entity.name}:${operation}:${fieldName}`,
        { resource }
      )
      return hasPermission
    }

    // 默认字段权限检查
    return this.hasDefaultFieldPermission(user, entity.name, fieldName, operation)
  }

  /**
   * 检查行级权限
   */
  private async checkRowPermission(
    entity: Entity,
    user: User,
    resource: unknown,
    operation: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    if (!resource || typeof resource !== 'object') {
      return true
    }

    const record = resource as Record<string, unknown>

    // 多租户检查
    if (entity.options?.multiTenant && user.tenantId) {
      if (record.tenantId !== user.tenantId) {
        return false
      }
    }

    // 用户所有权检查
    if (entity.options?.userOwned) {
      if (record.createdBy !== user.id) {
        return false
      }
    }

    // 自定义行级权限检查
    const permissions = entity.options?.permissions?.[operation]
    if (permissions && permissions.length > 0) {
      for (const permission of permissions) {
        if (permission.condition) {
          const allowed = await this.evaluatePermissionCondition(
            permission.condition,
            user,
            record
          )
          if (!allowed) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * 检查自定义权限
   */
  private async checkCustomPermissions(
    entity: Entity,
    user: User,
    operation: string,
    data?: unknown,
    resource?: unknown
  ): Promise<void> {
    // 这里可以扩展自定义权限检查逻辑
    // 例如：业务规则、时间限制、地理位置限制等

    const customPermissions = entity.options?.customPermissions
    if (customPermissions && customPermissions[operation]) {
      const permissionFunc = customPermissions[operation]
      if (typeof permissionFunc === 'function') {
        const allowed = await permissionFunc(user, data, resource)
        if (!allowed) {
          throw new PermissionError(
            `Custom permission check failed for ${operation} on ${entity.name}`,
            operation,
            entity.name
          )
        }
      }
    }
  }

  /**
   * 解析权限条件
   */
  private async parsePermissionCondition(
    condition: string,
    user: User
  ): Promise<Record<string, unknown>> {
    const context = {
      user: {
        id: user.id,
        roles: user.roles?.map(r => r.name) || [],
        department: user.department,
        tenantId: user.tenantId
      },
      now: new Date()
    }

    try {
      // 使用安全的表达式引擎解析条件
      // 这里简化实现，实际应该使用 JSON Logic 或类似的安全引擎
      const logic = JSON.parse(condition)
      return this.evaluateLogicCondition(logic, context)
    } catch (error) {
      this.logger?.warn(`Invalid permission condition: ${condition}`, { error })
      return {}
    }
  }

  /**
   * 评估权限条件
   */
  private async evaluatePermissionCondition(
    condition: string,
    user: User,
    resource: Record<string, unknown>
  ): Promise<boolean> {
    const context = {
      user: {
        id: user.id,
        roles: user.roles?.map(r => r.name) || [],
        department: user.department,
        tenantId: user.tenantId
      },
      resource,
      now: new Date()
    }

    try {
      const logic = JSON.parse(condition)
      const result = this.evaluateLogicCondition(logic, context)
      return Boolean(result)
    } catch (error) {
      this.logger?.warn(`Failed to evaluate permission condition: ${condition}`, { error })
      return false
    }
  }

  /**
   * 评估逻辑条件
   */
  private evaluateLogicCondition(
    logic: Record<string, unknown>,
    context: Record<string, unknown>
  ): unknown {
    // 简化的逻辑条件评估器
    // 实际应该使用更完善的表达式引擎

    if (logic.and && Array.isArray(logic.and)) {
      return logic.and.every(condition => 
        this.evaluateLogicCondition(condition as Record<string, unknown>, context)
      )
    }

    if (logic.or && Array.isArray(logic.or)) {
      return logic.or.some(condition => 
        this.evaluateLogicCondition(condition as Record<string, unknown>, context)
      )
    }

    if (logic.eq && Array.isArray(logic.eq) && logic.eq.length === 2) {
      const [left, right] = logic.eq
      return this.resolveValue(left, context) === this.resolveValue(right, context)
    }

    if (logic.neq && Array.isArray(logic.neq) && logic.neq.length === 2) {
      const [left, right] = logic.neq
      return this.resolveValue(left, context) !== this.resolveValue(right, context)
    }

    if (logic.in && Array.isArray(logic.in) && logic.in.length === 2) {
      const [value, array] = logic.in
      const resolvedArray = this.resolveValue(array, context)
      if (Array.isArray(resolvedArray)) {
        return resolvedArray.includes(this.resolveValue(value, context))
      }
    }

    return false
  }

  /**
   * 解析值
   */
  private resolveValue(value: unknown, context: Record<string, unknown>): unknown {
    if (typeof value === 'string' && value.startsWith('$')) {
      // 解析上下文变量
      const path = value.slice(1).split('.')
      let result = context
      for (const key of path) {
        if (result && typeof result === 'object' && key in result) {
          result = (result as Record<string, unknown>)[key]
        } else {
          return undefined
        }
      }
      return result
    }

    return value
  }

  /**
   * 默认权限检查
   */
  private hasDefaultPermission(user: User, entityName: string, operation: string): boolean {
    // 超级管理员有所有权限
    if (user.roles?.some(role => role.name === 'superadmin' || role.name === 'admin')) {
      return true
    }

    // 基于角色的默认权限
    const userRoles = user.roles?.map(r => r.name) || []
    
    switch (operation) {
      case 'read':
        return userRoles.length > 0 // 有角色的用户可以读取
      case 'create':
      case 'update':
        return userRoles.some(role => ['editor', 'manager', 'admin'].includes(role))
      case 'delete':
        return userRoles.some(role => ['manager', 'admin'].includes(role))
      default:
        return false
    }
  }

  /**
   * 默认字段权限检查
   */
  private hasDefaultFieldPermission(
    user: User,
    entityName: string,
    fieldName: string,
    operation: 'read' | 'write'
  ): boolean {
    // 敏感字段特殊处理
    const sensitiveFields = ['password', 'secret', 'token', 'key']
    if (sensitiveFields.some(field => fieldName.toLowerCase().includes(field))) {
      return user.roles?.some(role => role.name === 'admin') || false
    }

    return this.hasDefaultPermission(user, entityName, operation)
  }
}