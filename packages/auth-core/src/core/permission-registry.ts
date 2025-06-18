import type {
  PermissionRegistry,
  ModulePermissionDefinition,
  ModuleResourceDefinition,
  ModuleRoleDefinition
} from '../types/permissions'

/**
 * 权限注册表实现
 * 
 * 管理所有模块的权限定义，支持动态注册和注销
 */
export class BasePermissionRegistry implements PermissionRegistry {
  private modules = new Map<string, ModulePermissionDefinition>()
  private extensionPoints = new Map<string, Function[]>()

  /**
   * 注册模块权限
   */
  async registerModule(definition: ModulePermissionDefinition): Promise<void> {
    // 验证模块定义
    this.validateModuleDefinition(definition)
    
    // 检查模块是否已注册
    if (this.modules.has(definition.moduleName)) {
      throw new Error(`Module ${definition.moduleName} is already registered`)
    }
    
    // 验证依赖关系
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(`Dependency module ${dep} is not registered`)
        }
      }
    }
    
    // 注册模块
    this.modules.set(definition.moduleName, definition)
    
    // 触发注册事件
    await this.triggerExtensionPoint('module.registered', { definition })
  }

  /**
   * 注销模块权限
   */
  async unregisterModule(moduleName: string): Promise<void> {
    if (!this.modules.has(moduleName)) {
      throw new Error(`Module ${moduleName} is not registered`)
    }
    
    // 检查是否有其他模块依赖此模块
    const dependentModules = Array.from(this.modules.values())
      .filter(module => module.dependencies?.includes(moduleName))
      .map(module => module.moduleName)
    
    if (dependentModules.length > 0) {
      throw new Error(
        `Cannot unregister module ${moduleName}. ` +
        `It is required by: ${dependentModules.join(', ')}`
      )
    }
    
    // 获取模块定义
    const definition = this.modules.get(moduleName)!
    
    // 注销模块
    this.modules.delete(moduleName)
    
    // 触发注销事件
    await this.triggerExtensionPoint('module.unregistered', { definition })
  }

  /**
   * 获取所有已注册的模块权限
   */
  async getRegisteredModules(): Promise<ModulePermissionDefinition[]> {
    return Array.from(this.modules.values())
  }

  /**
   * 获取特定模块的权限定义
   */
  async getModulePermissions(moduleName: string): Promise<ModulePermissionDefinition | null> {
    return this.modules.get(moduleName) || null
  }

  /**
   * 合并所有模块的权限
   */
  async mergePermissions(): Promise<{
    resources: ModuleResourceDefinition[]
    roles: ModuleRoleDefinition[]
  }> {
    const allResources: ModuleResourceDefinition[] = []
    const allRoles: ModuleRoleDefinition[] = []
    
    // 按依赖关系排序模块
    const sortedModules = this.topologicalSort()
    
    for (const moduleName of sortedModules) {
      const module = this.modules.get(moduleName)!
      
      // 合并资源
      for (const resource of module.resources) {
        // 添加模块前缀避免冲突
        const prefixedResource: ModuleResourceDefinition = {
          ...resource,
          name: `${moduleName}.${resource.name}`
        }
        allResources.push(prefixedResource)
      }
      
      // 合并角色
      if (module.defaultRoles) {
        for (const role of module.defaultRoles) {
          // 添加模块前缀避免冲突
          const prefixedRole: ModuleRoleDefinition = {
            ...role,
            name: `${moduleName}.${role.name}`,
            permissions: role.permissions.map(perm => ({
              ...perm,
              resource: `${moduleName}.${perm.resource}`
            }))
          }
          allRoles.push(prefixedRole)
        }
      }
    }
    
    return { resources: allResources, roles: allRoles }
  }

  /**
   * 验证权限依赖关系
   */
  async validateDependencies(): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      // 尝试拓扑排序，如果有循环依赖会抛出错误
      this.topologicalSort()
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown dependency error')
    }
    
    // 检查依赖模块是否存在
    for (const [moduleName, module] of this.modules) {
      if (module.dependencies) {
        for (const dep of module.dependencies) {
          if (!this.modules.has(dep)) {
            errors.push(`Module ${moduleName} depends on non-existent module ${dep}`)
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 注册扩展点
   */
  registerExtensionPoint(name: string, handler: Function): void {
    if (!this.extensionPoints.has(name)) {
      this.extensionPoints.set(name, [])
    }
    this.extensionPoints.get(name)!.push(handler)
  }

  /**
   * 触发扩展点
   */
  private async triggerExtensionPoint(name: string, context: any): Promise<void> {
    const handlers = this.extensionPoints.get(name) || []
    for (const handler of handlers) {
      try {
        await handler(context)
      } catch (error) {
        console.error(`Extension point ${name} handler failed:`, error)
      }
    }
  }

  /**
   * 验证模块定义
   */
  private validateModuleDefinition(definition: ModulePermissionDefinition): void {
    if (!definition.moduleName) {
      throw new Error('Module name is required')
    }
    
    if (!definition.resources || definition.resources.length === 0) {
      throw new Error('Module must define at least one resource')
    }
    
    // 验证资源定义
    for (const resource of definition.resources) {
      if (!resource.name) {
        throw new Error('Resource name is required')
      }
      
      if (!resource.actions || resource.actions.length === 0) {
        throw new Error(`Resource ${resource.name} must define at least one action`)
      }
      
      // 验证操作定义
      for (const action of resource.actions) {
        if (!action.name) {
          throw new Error(`Action name is required for resource ${resource.name}`)
        }
      }
    }
    
    // 验证角色定义
    if (definition.defaultRoles) {
      for (const role of definition.defaultRoles) {
        if (!role.name) {
          throw new Error('Role name is required')
        }
        
        if (!role.permissions || role.permissions.length === 0) {
          throw new Error(`Role ${role.name} must define at least one permission`)
        }
      }
    }
  }

  /**
   * 拓扑排序（检测循环依赖）
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []
    
    const visit = (moduleName: string) => {
      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected involving module ${moduleName}`)
      }
      
      if (visited.has(moduleName)) {
        return
      }
      
      visiting.add(moduleName)
      
      const module = this.modules.get(moduleName)
      if (module?.dependencies) {
        for (const dep of module.dependencies) {
          visit(dep)
        }
      }
      
      visiting.delete(moduleName)
      visited.add(moduleName)
      result.push(moduleName)
    }
    
    for (const moduleName of this.modules.keys()) {
      visit(moduleName)
    }
    
    return result
  }
}

/**
 * 创建权限注册表
 */
export function createPermissionRegistry(): PermissionRegistry {
  return new BasePermissionRegistry()
}

/**
 * 全局权限注册表实例
 */
let globalRegistry: PermissionRegistry | null = null

/**
 * 获取全局权限注册表
 */
export function getGlobalPermissionRegistry(): PermissionRegistry {
  if (!globalRegistry) {
    globalRegistry = createPermissionRegistry()
  }
  return globalRegistry
}

/**
 * 设置全局权限注册表
 */
export function setGlobalPermissionRegistry(registry: PermissionRegistry): void {
  globalRegistry = registry
}
