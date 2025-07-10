/**
 * Permission Checker for platform package
 * @module platform/crud/permission-checker
 */

import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 权限检查结果
 */
export interface PermissionResult {
  allowed: boolean
  reason?: string
  filters?: Record<string, unknown>
}

/**
 * 权限检查选项
 */
export interface PermissionCheckOptions {
  user?: { id: string; role?: string; permissions?: string[] }
  action: 'create' | 'read' | 'update' | 'delete'
  resource: string
  resourceId?: string | number
  data?: Record<string, unknown>
}

/**
 * 权限检查器
 */
export class PermissionChecker {
  private extensionContext?: ExtensionContext
  private defaultRules: Map<string, string[]> = new Map()

  constructor(extensionContext?: ExtensionContext) {
    this.extensionContext = extensionContext
    this.initializeDefaultRules()
  }

  /**
   * 初始化默认权限规则
   */
  private initializeDefaultRules(): void {
    // 默认权限规则
    this.defaultRules.set('admin', ['*'])
    this.defaultRules.set('user', ['read', 'update:own'])
    this.defaultRules.set('guest', ['read:public'])
  }

  /**
   * 检查权限
   */
  async check(options: PermissionCheckOptions): Promise<PermissionResult> {
    const { user, action, resource, resourceId } = options

    this.extensionContext?.logger.info('Checking permission', {
      userId: user?.id,
      action,
      resource,
      resourceId,
    })

    // 触发Extension事件
    this.extensionContext?.events.emit('permission:before:check', options)

    // 如果没有用户信息，只允许公开资源的读取
    if (!user) {
      const result = {
        allowed: action === 'read' && this.isPublicResource(resource),
        reason: !user ? 'No user provided' : 'Access denied',
      }

      this.extensionContext?.events.emit('permission:after:check', { options, result })
      return result
    }

    // 检查用户角色权限
    const rolePermissions = this.getRolePermissions(user.role || 'user')
    const hasPermission = this.evaluatePermission(
      rolePermissions,
      action,
      resource,
      user,
      resourceId
    )

    // 应用数据过滤器
    const filters = await this.getPermissionFilters(user, action, resource)

    const result: PermissionResult = {
      allowed: hasPermission,
      reason: hasPermission ? undefined : `Insufficient permissions for ${action} on ${resource}`,
      filters: hasPermission ? filters : undefined,
    }

    this.extensionContext?.events.emit('permission:after:check', { options, result })
    return result
  }

  /**
   * 批量检查权限
   */
  async checkBatch(checks: PermissionCheckOptions[]): Promise<PermissionResult[]> {
    const results = await Promise.all(checks.map(check => this.check(check)))
    return results
  }

  /**
   * 获取角色权限
   */
  private getRolePermissions(role: string): string[] {
    return this.defaultRules.get(role) || this.defaultRules.get('guest') || []
  }

  /**
   * 评估权限
   */
  private evaluatePermission(
    permissions: string[],
    action: string,
    resource: string,
    user: PermissionCheckOptions['user'],
    resourceId?: string | number
  ): boolean {
    // 检查全局权限
    if (permissions.includes('*')) {
      return true
    }

    // 检查具体行为权限
    if (permissions.includes(action)) {
      return true
    }

    // 检查资源特定权限
    const resourceAction = `${action}:${resource}`
    if (permissions.includes(resourceAction)) {
      return true
    }

    // 检查自有资源权限
    const ownAction = `${action}:own`
    if (permissions.includes(ownAction) && this.isOwnResource(user, resourceId)) {
      return true
    }

    return false
  }

  /**
   * 检查是否为公开资源
   */
  private isPublicResource(resource: string): boolean {
    const publicResources = ['public_post', 'public_page', 'public_content']
    return publicResources.includes(resource)
  }

  /**
   * 检查是否为用户自有资源
   */
  private isOwnResource(
    user: PermissionCheckOptions['user'],
    resourceId?: string | number
  ): boolean {
    if (!user || !resourceId) {
      return false
    }

    // 简化实现：假设资源ID与用户ID匹配时为自有资源
    return user.id === String(resourceId)
  }

  /**
   * 获取权限过滤器
   */
  private async getPermissionFilters(
    user: PermissionCheckOptions['user'],
    action: string,
    resource: string
  ): Promise<Record<string, unknown>> {
    const filters: Record<string, unknown> = {}

    // 基于用户角色添加过滤器
    if (user?.role === 'user') {
      // 普通用户只能访问自己的数据
      filters.userId = user.id
    }

    // 基于行为添加过滤器
    if (action === 'read' && resource === 'user') {
      // 读取用户信息时，过滤敏感字段
      filters.excludeFields = ['password', 'secret']
    }

    return filters
  }

  /**
   * 添加权限规则
   */
  addRule(role: string, permissions: string[]): void {
    this.defaultRules.set(role, permissions)
    this.extensionContext?.logger.info(`Added permission rule for role: ${role}`, permissions)
  }

  /**
   * 移除权限规则
   */
  removeRule(role: string): boolean {
    const removed = this.defaultRules.delete(role)
    if (removed) {
      this.extensionContext?.logger.info(`Removed permission rule for role: ${role}`)
    }
    return removed
  }

  /**
   * 获取所有权限规则
   */
  getAllRules(): Record<string, string[]> {
    const rules: Record<string, string[]> = {}
    for (const [role, permissions] of this.defaultRules.entries()) {
      rules[role] = [...permissions]
    }
    return rules
  }
}

/**
 * 创建权限检查器的便捷函数
 */
export function createPermissionChecker(extensionContext?: ExtensionContext): PermissionChecker {
  return new PermissionChecker(extensionContext)
}
