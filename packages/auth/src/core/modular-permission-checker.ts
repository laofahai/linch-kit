import type {
  ModularPermissionChecker,
  PermissionRegistry,
  ResourcePermissions,
  PermissionExtensionPoint,
  PermissionExtensionContext
} from '../types/permissions'

import { BasePermissionChecker } from './permissions'
import { getGlobalPermissionRegistry } from './permission-registry'

/**
 * 模块化权限检查器实现
 * 
 * 扩展基础权限检查器，支持模块化权限管理
 */
export class BaseModularPermissionChecker extends BasePermissionChecker implements ModularPermissionChecker {
  private registry: PermissionRegistry
  private extensionPoints = new Map<string, PermissionExtensionPoint[]>()
  private permissionCache = new Map<string, { permissions: ResourcePermissions; timestamp: number }>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  constructor(registry?: PermissionRegistry) {
    super()
    this.registry = registry || getGlobalPermissionRegistry()
  }

  /**
   * 检查用户是否有特定权限（重写基类方法）
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    // 解析模块和资源
    const { moduleName, resourceName } = this.parseResource(resource)
    
    if (moduleName) {
      return this.hasModulePermission(userId, moduleName, resourceName, action, context)
    }
    
    // 回退到基础权限检查
    return super.hasPermission(userId, resource, action, context)
  }

  /**
   * 检查模块权限
   */
  async hasModulePermission(
    userId: string,
    moduleName: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    try {
      // 1. 检查模块是否已注册
      const moduleDefinition = await this.registry.getModulePermissions(moduleName)
      if (!moduleDefinition) {
        console.warn(`Module ${moduleName} is not registered`)
        return false
      }

      // 2. 检查资源是否存在
      const resourceDef = moduleDefinition.resources.find(r => r.name === resource)
      if (!resourceDef) {
        console.warn(`Resource ${resource} not found in module ${moduleName}`)
        return false
      }

      // 3. 检查操作是否支持
      const actionDef = resourceDef.actions.find(a => a.name === action)
      if (!actionDef) {
        console.warn(`Action ${action} not supported for resource ${moduleName}.${resource}`)
        return false
      }

      // 4. 构建扩展上下文
      const extensionContext: PermissionExtensionContext = {
        user: {
          id: userId,
          roles: await this.getUserRoles(userId),
          attributes: await this.getUserAttributes(userId)
        },
        permission: {
          resource,
          action,
          moduleName
        },
        context,
        tenant: context?.tenantId ? {
          id: context.tenantId,
          attributes: await this.getTenantAttributes(context.tenantId)
        } : undefined
      }

      // 5. 执行权限扩展点
      const extensionResult = await this.executeExtensionPoints(
        `${moduleName}.${resource}.${action}`,
        extensionContext
      )
      
      if (extensionResult !== null) {
        return extensionResult
      }

      // 6. 执行基础权限检查
      return this.checkBasicPermission(userId, moduleName, resource, action, context)
      
    } catch (error) {
      console.error(`Error checking module permission:`, error)
      return false
    }
  }

  /**
   * 获取用户在特定模块的权限
   */
  async getUserModulePermissions(
    userId: string,
    moduleName: string,
    tenantId?: string
  ): Promise<ResourcePermissions> {
    const cacheKey = `${userId}:${moduleName}:${tenantId || 'default'}`
    
    // 检查缓存
    const cached = this.permissionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.permissions
    }

    try {
      const moduleDefinition = await this.registry.getModulePermissions(moduleName)
      if (!moduleDefinition) {
        return {}
      }

      const permissions: ResourcePermissions = {}

      // 遍历模块的所有资源和操作
      for (const resource of moduleDefinition.resources) {
        permissions[resource.name] = {}
        
        for (const action of resource.actions) {
          permissions[resource.name][action.name] = await this.hasModulePermission(
            userId,
            moduleName,
            resource.name,
            action.name,
            { tenantId }
          )
        }
      }

      // 缓存结果
      this.permissionCache.set(cacheKey, {
        permissions,
        timestamp: Date.now()
      })

      return permissions
    } catch (error) {
      console.error(`Error getting user module permissions:`, error)
      return {}
    }
  }

  /**
   * 获取用户可访问的模块列表
   */
  async getUserAccessibleModules(userId: string, tenantId?: string): Promise<string[]> {
    try {
      const registeredModules = await this.registry.getRegisteredModules()
      const accessibleModules: string[] = []

      for (const module of registeredModules) {
        // 检查用户是否对该模块有任何权限
        const hasAnyPermission = await this.hasAnyModulePermission(
          userId,
          module.moduleName,
          tenantId
        )
        
        if (hasAnyPermission) {
          accessibleModules.push(module.moduleName)
        }
      }

      return accessibleModules
    } catch (error) {
      console.error(`Error getting user accessible modules:`, error)
      return []
    }
  }

  /**
   * 注册权限扩展点
   */
  registerExtensionPoint(extensionPoint: PermissionExtensionPoint): void {
    if (!this.extensionPoints.has(extensionPoint.name)) {
      this.extensionPoints.set(extensionPoint.name, [])
    }
    this.extensionPoints.get(extensionPoint.name)!.push(extensionPoint)
  }

  /**
   * 清除权限缓存
   */
  clearCache(userId?: string): void {
    if (userId) {
      // 清除特定用户的缓存
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.permissionCache.delete(key)
        }
      }
    } else {
      // 清除所有缓存
      this.permissionCache.clear()
    }
  }

  /**
   * 解析资源字符串
   */
  private parseResource(resource: string): { moduleName?: string; resourceName: string } {
    const parts = resource.split('.')
    if (parts.length === 2) {
      return { moduleName: parts[0], resourceName: parts[1] }
    }
    return { resourceName: resource }
  }

  /**
   * 执行权限扩展点
   */
  private async executeExtensionPoints(
    pointName: string,
    context: PermissionExtensionContext
  ): Promise<boolean | null> {
    const points = this.extensionPoints.get(pointName) || []
    
    for (const point of points) {
      try {
        const result = await point.handler(context)
        if (typeof result === 'boolean') {
          return result
        }
      } catch (error) {
        console.error(`Extension point ${pointName} failed:`, error)
      }
    }
    
    return null
  }

  /**
   * 基础权限检查（需要子类实现）
   */
  protected async checkBasicPermission(
    userId: string,
    moduleName: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    // 默认实现：检查用户角色是否包含所需权限
    const userRoles = await this.getUserRoles(userId, context?.tenantId)
    const moduleDefinition = await this.registry.getModulePermissions(moduleName)
    
    if (!moduleDefinition?.defaultRoles) {
      return false
    }

    for (const roleName of userRoles) {
      const role = moduleDefinition.defaultRoles.find(r => 
        r.name === roleName || r.name === `${moduleName}.${roleName}`
      )
      
      if (role) {
        const hasPermission = role.permissions.some(perm => 
          perm.resource === resource && perm.actions.includes(action)
        )
        
        if (hasPermission) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 检查用户是否对模块有任何权限
   */
  private async hasAnyModulePermission(
    userId: string,
    moduleName: string,
    tenantId?: string
  ): Promise<boolean> {
    const moduleDefinition = await this.registry.getModulePermissions(moduleName)
    if (!moduleDefinition) {
      return false
    }

    // 检查是否有任何资源的任何操作权限
    for (const resource of moduleDefinition.resources) {
      for (const action of resource.actions) {
        if (await this.hasModulePermission(userId, moduleName, resource.name, action.name, { tenantId })) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 获取用户属性（需要子类实现）
   */
  protected async getUserAttributes(_userId: string): Promise<Record<string, any>> {
    return {}
  }

  /**
   * 获取租户属性（需要子类实现）
   */
  protected async getTenantAttributes(_tenantId: string): Promise<Record<string, any>> {
    return {}
  }
}

/**
 * 创建模块化权限检查器
 */
export function createModularPermissionChecker(
  registry?: PermissionRegistry,
  customChecker?: Partial<ModularPermissionChecker>
): ModularPermissionChecker {
  const baseChecker = new BaseModularPermissionChecker(registry)
  
  if (customChecker) {
    return {
      hasPermission: customChecker.hasPermission || baseChecker.hasPermission.bind(baseChecker),
      hasRole: customChecker.hasRole || baseChecker.hasRole.bind(baseChecker),
      getUserPermissions: customChecker.getUserPermissions || baseChecker.getUserPermissions.bind(baseChecker),
      getUserRoles: customChecker.getUserRoles || baseChecker.getUserRoles.bind(baseChecker),
      hasModulePermission: customChecker.hasModulePermission || baseChecker.hasModulePermission.bind(baseChecker),
      getUserModulePermissions: customChecker.getUserModulePermissions || baseChecker.getUserModulePermissions.bind(baseChecker),
      getUserAccessibleModules: customChecker.getUserAccessibleModules || baseChecker.getUserAccessibleModules.bind(baseChecker)
    }
  }
  
  return baseChecker
}
