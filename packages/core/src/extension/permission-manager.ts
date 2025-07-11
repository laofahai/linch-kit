/**
 * Extension权限管理系统
 * @module extension/permission-manager
 */

import { EventEmitter } from 'eventemitter3'

import type { ExtensionPermission, ExtensionMetadata } from './types'

export interface PermissionPolicy {
  /** 权限名称 */
  name: ExtensionPermission
  /** 权限描述 */
  description: string
  /** 权限级别 */
  level: 'low' | 'medium' | 'high' | 'critical'
  /** 是否需要用户确认 */
  requiresUserConfirmation: boolean
  /** 依赖的其他权限 */
  dependencies?: ExtensionPermission[]
  /** 权限验证器 */
  validator?: (context: PermissionContext) => Promise<boolean>
}

export interface PermissionContext {
  /** Extension名称 */
  extensionName: string
  /** 请求的权限 */
  permission: ExtensionPermission
  /** 操作上下文 */
  operation: string
  /** 相关数据 */
  data?: Record<string, unknown>
  /** 用户信息 */
  user?: {
    id: string
    roles: string[]
    permissions: string[]
  }
}

export interface PermissionGrant {
  /** Extension名称 */
  extensionName: string
  /** 授权的权限 */
  permission: ExtensionPermission
  /** 授权时间 */
  grantedAt: number
  /** 授权的用户 */
  grantedBy?: string
  /** 是否永久授权 */
  permanent: boolean
  /** 过期时间 */
  expiresAt?: number
  /** 使用次数限制 */
  usageLimit?: number
  /** 已使用次数 */
  usageCount: number
}

export interface PermissionEvent {
  type: 'granted' | 'denied' | 'revoked' | 'expired' | 'usage_exceeded'
  extensionName: string
  permission: ExtensionPermission
  context: PermissionContext
  timestamp: number
  reason?: string
}

/**
 * Extension权限管理器
 * 提供细粒度的权限控制和验证
 */
export class ExtensionPermissionManager extends EventEmitter {
  private policies = new Map<ExtensionPermission, PermissionPolicy>()
  private grants = new Map<string, PermissionGrant>() // key: ${extensionName}:${permission}
  private cache = new Map<string, { result: boolean; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  constructor() {
    super()
    this.initializeDefaultPolicies()
  }

  /**
   * 初始化默认权限策略
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: PermissionPolicy[] = [
      {
        name: 'database:read',
        description: '读取数据库数据',
        level: 'medium',
        requiresUserConfirmation: false,
      },
      {
        name: 'database:write',
        description: '写入数据库数据',
        level: 'high',
        requiresUserConfirmation: true,
        dependencies: ['database:read'],
      },
      {
        name: 'api:read',
        description: '调用只读API',
        level: 'low',
        requiresUserConfirmation: false,
      },
      {
        name: 'api:write',
        description: '调用写入API',
        level: 'high',
        requiresUserConfirmation: true,
        dependencies: ['api:read'],
      },
      {
        name: 'ui:render',
        description: '渲染用户界面',
        level: 'medium',
        requiresUserConfirmation: false,
      },
      {
        name: 'system:hooks',
        description: '监听系统钩子',
        level: 'critical',
        requiresUserConfirmation: true,
        validator: async context => {
          // 检查是否为官方Extension
          return context.extensionName.startsWith('@linch-kit/')
        },
      },
    ]

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.name, policy)
    })
  }

  /**
   * 注册权限策略
   */
  registerPolicy(policy: PermissionPolicy): void {
    this.policies.set(policy.name, policy)
  }

  /**
   * 检查权限
   */
  async checkPermission(
    extensionName: string,
    permission: ExtensionPermission,
    context: Partial<PermissionContext> = {}
  ): Promise<boolean> {
    const fullContext: PermissionContext = {
      extensionName,
      permission,
      operation: 'check',
      ...context,
    }

    // 检查缓存
    const cacheKey = `${extensionName}:${permission}:${JSON.stringify(context)}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result
    }

    try {
      const result = await this.performPermissionCheck(fullContext)

      // 缓存结果
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      })

      // 记录权限事件
      this.emit('permissionCheck', {
        type: result ? 'granted' : 'denied',
        extensionName,
        permission,
        context: fullContext,
        timestamp: Date.now(),
      } as PermissionEvent)

      return result
    } catch (error) {
      console.error(`Permission check failed for ${extensionName}:${permission}:`, error)
      return false
    }
  }

  /**
   * 执行权限检查
   */
  private async performPermissionCheck(context: PermissionContext): Promise<boolean> {
    const policy = this.policies.get(context.permission)
    if (!policy) {
      console.warn(`Unknown permission: ${context.permission}`)
      return false
    }

    // 检查是否有权限授权
    const grantKey = `${context.extensionName}:${context.permission}`
    const grant = this.grants.get(grantKey)

    if (!grant) {
      return false
    }

    // 检查授权是否过期
    if (grant.expiresAt && Date.now() > grant.expiresAt) {
      this.revokePermission(context.extensionName, context.permission)
      this.emit('permissionCheck', {
        type: 'expired',
        extensionName: context.extensionName,
        permission: context.permission,
        context,
        timestamp: Date.now(),
        reason: 'Permission expired',
      } as PermissionEvent)
      return false
    }

    // 检查使用次数限制
    if (grant.usageLimit && grant.usageCount >= grant.usageLimit) {
      this.emit('permissionCheck', {
        type: 'usage_exceeded',
        extensionName: context.extensionName,
        permission: context.permission,
        context,
        timestamp: Date.now(),
        reason: 'Usage limit exceeded',
      } as PermissionEvent)
      return false
    }

    // 检查依赖权限
    if (policy.dependencies) {
      for (const dep of policy.dependencies) {
        const hasDepPermission = await this.checkPermission(context.extensionName, dep, {
          ...context,
          permission: dep,
        })
        if (!hasDepPermission) {
          return false
        }
      }
    }

    // 执行自定义验证器
    if (policy.validator) {
      const validationResult = await policy.validator(context)
      if (!validationResult) {
        return false
      }
    }

    // 更新使用次数
    grant.usageCount++
    this.grants.set(grantKey, grant)

    return true
  }

  /**
   * 授权权限
   */
  async grantPermission(
    extensionName: string,
    permission: ExtensionPermission,
    options: {
      grantedBy?: string
      permanent?: boolean
      expiresAt?: number
      usageLimit?: number
    } = {}
  ): Promise<void> {
    const policy = this.policies.get(permission)
    if (!policy) {
      throw new Error(`Unknown permission: ${permission}`)
    }

    const grantKey = `${extensionName}:${permission}`
    const grant: PermissionGrant = {
      extensionName,
      permission,
      grantedAt: Date.now(),
      grantedBy: options.grantedBy,
      permanent: options.permanent ?? false,
      expiresAt: options.expiresAt,
      usageLimit: options.usageLimit,
      usageCount: 0,
    }

    this.grants.set(grantKey, grant)

    // 清除相关缓存
    this.clearCache(extensionName, permission)

    this.emit('permissionGranted', {
      type: 'granted',
      extensionName,
      permission,
      context: {
        extensionName,
        permission,
        operation: 'grant',
      },
      timestamp: Date.now(),
    } as PermissionEvent)
  }

  /**
   * 撤销权限
   */
  revokePermission(extensionName: string, permission: ExtensionPermission): void {
    const grantKey = `${extensionName}:${permission}`
    const grant = this.grants.get(grantKey)

    if (grant) {
      this.grants.delete(grantKey)
      this.clearCache(extensionName, permission)

      this.emit('permissionRevoked', {
        type: 'revoked',
        extensionName,
        permission,
        context: {
          extensionName,
          permission,
          operation: 'revoke',
        },
        timestamp: Date.now(),
      } as PermissionEvent)
    }
  }

  /**
   * 获取Extension的所有权限
   */
  getExtensionPermissions(extensionName: string): PermissionGrant[] {
    return Array.from(this.grants.values()).filter(grant => grant.extensionName === extensionName)
  }

  /**
   * 批量授权Extension权限
   */
  async grantExtensionPermissions(
    extensionName: string,
    metadata: ExtensionMetadata,
    options: {
      grantedBy?: string
      autoGrant?: boolean
      requireConfirmation?: boolean
    } = {}
  ): Promise<{
    granted: ExtensionPermission[]
    denied: ExtensionPermission[]
    requiresConfirmation: ExtensionPermission[]
  }> {
    const result = {
      granted: [] as ExtensionPermission[],
      denied: [] as ExtensionPermission[],
      requiresConfirmation: [] as ExtensionPermission[],
    }

    for (const permission of metadata.permissions) {
      const policy = this.policies.get(permission)
      if (!policy) {
        result.denied.push(permission)
        continue
      }

      // 检查是否需要用户确认
      if (policy.requiresUserConfirmation && !options.autoGrant) {
        result.requiresConfirmation.push(permission)
        continue
      }

      try {
        await this.grantPermission(extensionName, permission, {
          grantedBy: options.grantedBy,
          permanent: true,
        })
        result.granted.push(permission)
      } catch (error) {
        console.error(`Failed to grant permission ${permission}:`, error)
        result.denied.push(permission)
      }
    }

    return result
  }

  /**
   * 简单权限检查（兼容旧接口）
   */
  hasPermission(permission: ExtensionPermission): boolean {
    // 简化的权限检查，适用于静态权限验证
    return this.policies.has(permission)
  }

  /**
   * 检查依赖是否可用（兼容旧接口）
   */
  isDependencyAvailable(_dependency: string): boolean {
    // 简化实现，总是返回true
    return true
  }

  /**
   * 创建权限沙箱
   */
  createPermissionSandbox(extensionName: string): {
    hasPermission: (permission: ExtensionPermission) => Promise<boolean>
    requirePermission: (permission: ExtensionPermission) => Promise<void>
  } {
    return {
      hasPermission: async (permission: ExtensionPermission) => {
        return this.checkPermission(extensionName, permission)
      },
      requirePermission: async (permission: ExtensionPermission) => {
        const hasPermission = await this.checkPermission(extensionName, permission)
        if (!hasPermission) {
          throw new Error(`Extension ${extensionName} does not have permission: ${permission}`)
        }
      },
    }
  }

  /**
   * 清除权限缓存
   */
  private clearCache(extensionName: string, permission?: ExtensionPermission): void {
    const prefix = permission ? `${extensionName}:${permission}:` : `${extensionName}:`

    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(prefix))

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 获取权限统计
   */
  getPermissionStats(): {
    totalPolicies: number
    totalGrants: number
    extensionCount: number
    permissionsByLevel: Record<string, number>
  } {
    const extensionNames = new Set(
      Array.from(this.grants.values()).map(grant => grant.extensionName)
    )

    const permissionsByLevel = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    this.policies.forEach(policy => {
      permissionsByLevel[policy.level]++
    })

    return {
      totalPolicies: this.policies.size,
      totalGrants: this.grants.size,
      extensionCount: extensionNames.size,
      permissionsByLevel,
    }
  }

  /**
   * 清理过期权限
   */
  cleanupExpiredPermissions(): void {
    const now = Date.now()
    const expiredGrants: string[] = []

    this.grants.forEach((grant, key) => {
      if (grant.expiresAt && now > grant.expiresAt) {
        expiredGrants.push(key)
      }
    })

    expiredGrants.forEach(key => {
      const grant = this.grants.get(key)
      if (grant) {
        this.grants.delete(key)
        this.clearCache(grant.extensionName, grant.permission)
      }
    })

    if (expiredGrants.length > 0) {
      console.info(`Cleaned up ${expiredGrants.length} expired permissions`)
    }
  }

  /**
   * 导出权限配置
   */
  exportPermissions(): {
    policies: PermissionPolicy[]
    grants: PermissionGrant[]
  } {
    return {
      policies: Array.from(this.policies.values()),
      grants: Array.from(this.grants.values()),
    }
  }

  /**
   * 导入权限配置
   */
  importPermissions(data: { policies?: PermissionPolicy[]; grants?: PermissionGrant[] }): void {
    if (data.policies) {
      data.policies.forEach(policy => {
        this.policies.set(policy.name, policy)
      })
    }

    if (data.grants) {
      data.grants.forEach(grant => {
        const key = `${grant.extensionName}:${grant.permission}`
        this.grants.set(key, grant)
      })
    }

    // 清除所有缓存
    this.cache.clear()
  }
}

/**
 * 创建权限管理器实例
 */
export function createPermissionManager(): ExtensionPermissionManager {
  return new ExtensionPermissionManager()
}

/**
 * 默认权限管理器实例
 */
export const permissionManager = createPermissionManager()
