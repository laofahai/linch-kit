/**
 * 权限检查器 - 与 @linch-kit/auth 深度集成
 * 
 * 提供细粒度的权限控制：
 * - 实体级权限检查
 * - 字段级权限控制  
 * - 行级权限过滤
 * - 条件权限解析
 */

import type { Entity, FieldDefinition } from '@linch-kit/schema'
import type { LinchKitUser, IPermissionChecker as AuthPermissionChecker, PermissionAction, PermissionSubject } from '@linch-kit/auth'
import type { PluginManager } from '@linch-kit/core'

import type { SchemaRegistry, Logger, IPermissionChecker } from '../types'
import { PermissionError } from '../types'

/**
 * 权限检查器实现
 */
export class PermissionChecker implements IPermissionChecker {
  constructor(
    private readonly schemaRegistry: SchemaRegistry,
    private readonly logger: Logger,
    private readonly authPermissionChecker?: AuthPermissionChecker,
    private readonly pluginManager?: PluginManager
  ) {}

  /**
   * 检查创建权限
   */
  async checkCreate(entity: Entity, user: LinchKitUser, data: unknown): Promise<void> {
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

    // 通过插件系统扩展权限检查
    await this.runPluginHooks('permission:checkCreate', { entity, user, data })
  }

  /**
   * 检查读取权限
   */
  async checkRead(entity: Entity, user: LinchKitUser, resource?: unknown): Promise<void> {
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

    // 通过插件系统扩展权限检查
    await this.runPluginHooks('permission:checkRead', { entity, user, resource })
  }

  /**
   * 检查更新权限
   */
  async checkUpdate(
    entity: Entity,
    user: LinchKitUser,
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

    // 通过插件系统扩展权限检查
    await this.runPluginHooks('permission:checkUpdate', { entity, user, resource, data })
  }

  /**
   * 检查删除权限
   */
  async checkDelete(entity: Entity, user: LinchKitUser, resource: unknown): Promise<void> {
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

    // 通过插件系统扩展权限检查
    await this.runPluginHooks('permission:checkDelete', { entity, user, resource })
  }

  /**
   * 过滤字段权限
   */
  async filterFields<T>(
    entity: Entity,
    user: LinchKitUser,
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
            this.logger.debug(`Field ${fieldName} filtered out due to permissions`, {
              entityName: entity.name,
              userId: user.id || 'unknown',
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
    user: LinchKitUser,
    operation: 'read' | 'write' | 'delete'
  ): Promise<Record<string, unknown>> {
    const filters: Record<string, unknown> = {}

    // 基础的多租户过滤
    if (entity.options?.softDelete && operation === 'read') {
      filters.deletedAt = null
    }

    // 使用 auth 包的权限检查器获取可访问资源
    if (this.authPermissionChecker) {
      try {
        const action = operation === 'write' ? 'update' : operation
        const accessibleResources = await this.authPermissionChecker.getAccessibleResources(
          user,
          action as PermissionAction,
          entity.name as PermissionSubject
        )
        
        if (accessibleResources && Array.isArray(accessibleResources)) {
          filters.id = { in: accessibleResources.map((r: any) => r.id) }
        }
      } catch (error) {
        this.logger.warn('Failed to get accessible resources from auth', 
          { 
            error: error instanceof Error ? error.message : 'Unknown error',
            entityName: entity.name, 
            userId: user.id || 'unknown' 
          }
        )
      }
    }

    // 通过插件系统扩展过滤条件
    const pluginFilters = await this.runPluginHooks('permission:buildRowFilter', {
      entity,
      user,
      operation,
      filters
    })

    return { ...filters, ...pluginFilters }
  }

  /**
   * 检查实体权限
   */
  private async checkEntityPermission(
    user: LinchKitUser,
    entityName: string,
    operation: 'create' | 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    // 使用 auth 包的权限检查器
    if (this.authPermissionChecker) {
      try {
        return await this.authPermissionChecker.check(
          user,
          operation as PermissionAction,
          entityName as PermissionSubject
        )
      } catch (error) {
        this.logger.error(
          'Failed to check entity permission', 
          error instanceof Error ? error : new Error('Unknown error'),
          { userId: user.id || 'unknown', entityName, operation }
        )
        return false
      }
    }

    // 如果没有配置权限检查器，默认允许
    this.logger.warn('No auth permission checker configured, allowing access', {
      userId: user.id || 'unknown',
      entityName,
      operation
    })
    return true
  }

  /**
   * 检查行级权限
   */
  private async checkRowPermission(
    entity: Entity,
    user: LinchKitUser,
    resource: unknown,
    operation: 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    // 使用 auth 包的权限检查器
    if (this.authPermissionChecker) {
      try {
        return await this.authPermissionChecker.check(
          user,
          operation as PermissionAction,
          resource
        )
      } catch (error) {
        this.logger.error(
          'Failed to check row permission',
          error instanceof Error ? error : new Error('Unknown error'),
          { userId: user.id || 'unknown', entityName: entity.name, operation }
        )
        return false
      }
    }

    return true
  }

  /**
   * 检查字段权限
   */
  private async checkFieldPermission(
    entity: Entity,
    user: LinchKitUser,
    fieldName: string,
    operation: 'read' | 'write',
    resource?: unknown
  ): Promise<boolean> {
    const field = entity.fields[fieldName]
    if (!field) {
      return false
    }

    // 检查字段的 required 和其他验证规则
    if (operation === 'write' && field.required) {
      const value = resource ? (resource as Record<string, unknown>)[fieldName] : undefined
      if (value === undefined || value === null) {
        return false
      }
    }

    // 通过插件系统扩展字段权限检查
    const pluginResult = await this.runPluginHooks('permission:checkField', {
      entity,
      user,
      fieldName,
      field,
      operation,
      resource
    })

    return pluginResult !== false
  }

  /**
   * 批量检查字段权限
   */
  private async checkFieldPermissions(
    entity: Entity,
    user: LinchKitUser,
    data: unknown,
    operation: 'read' | 'write'
  ): Promise<void> {
    if (!data || typeof data !== 'object') {
      return
    }

    const dataRecord = data as Record<string, unknown>

    for (const fieldName of Object.keys(dataRecord)) {
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
   * 运行插件钩子
   */
  private async runPluginHooks(
    hookName: string,
    context: Record<string, unknown>
  ): Promise<any> {
    if (!this.pluginManager) {
      return
    }

    const plugins = this.pluginManager.getAll()
    let result = undefined

    for (const registration of plugins) {
      const plugin = registration.plugin
      
      // 检查插件是否有对应的钩子
      const hook = (plugin as any)[hookName]
      if (typeof hook === 'function') {
        try {
          const hookResult = await hook.call(plugin, context)
          if (hookResult !== undefined) {
            result = hookResult
          }
        } catch (error) {
          this.logger.error(
            `Plugin ${plugin.metadata.id} hook ${hookName} failed`,
            error instanceof Error ? error : new Error('Unknown error'),
            { pluginId: plugin.metadata.id, hookName }
          )
        }
      }
    }

    return result
  }
}