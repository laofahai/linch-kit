/**
 * 模块注册器 - 业务模块动态加载和管理
 * @module core/module-registry
 */

import { EventEmitter } from 'eventemitter3'
// import type { Router } from '@trpc/server' // TODO: 需要时再启用

/**
 * 模块清单定义 - 描述一个完整的业务模块
 */
export interface IModuleManifest {
  /** 模块唯一标识 */
  name: string
  /** 模块版本 */
  version: string
  /** 模块描述 */
  description?: string
  /** 依赖的其他模块 */
  dependencies: string[]
  /** 模块提供的数据模型定义 */
  models?: ModelDefinition[]
  /** 模块提供的API路由 */
  apiRoutes?: RouteDefinition[]
  /** 模块提供的UI组件 */
  uiComponents?: ComponentDefinition[]
  /** 模块提供的页面路由 */
  pageRoutes?: PageRouteDefinition[]
  /** 模块加载时的初始化钩子 */
  onLoad?(registry: AppRegistry): Promise<void>
  /** 模块卸载时的清理钩子 */
  onUnload?(): Promise<void>
}

/**
 * 模型定义
 */
export interface ModelDefinition {
  name: string
  schema: Record<string, unknown>
  relations?: RelationDefinition[]
  hooks?: ModelHooks
}

/**
 * 关系定义
 */
export interface RelationDefinition {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany'
  target: string
  foreignKey?: string
  throughTable?: string
}

/**
 * 模型钩子
 */
export interface ModelHooks {
  beforeCreate?: (data: unknown) => Promise<unknown>
  afterCreate?: (data: unknown) => Promise<void>
  beforeUpdate?: (data: unknown) => Promise<unknown>
  afterUpdate?: (data: unknown) => Promise<void>
  beforeDelete?: (id: string) => Promise<void>
  afterDelete?: (id: string) => Promise<void>
}

/**
 * 路由定义
 */
export interface RouteDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: (ctx: unknown) => unknown
  middleware?: unknown[]
  auth?: boolean
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
  name: string
  component: React.ComponentType<unknown>
  props?: Record<string, unknown>
  overrides?: string[] // 覆盖的组件名称
  metadata?: {
    extensionName?: string
    originalName?: string
  }
}

/**
 * 页面路由定义
 */
export interface PageRouteDefinition {
  path: string
  component: React.ComponentType<unknown>
  exact?: boolean
  auth?: boolean
  permissions?: string[]
  metadata?: {
    title?: string
    description?: string
    permissions?: string[]
    extensionName?: string
  }
}

/**
 * 模块注册信息
 */
export interface ModuleRegistration {
  manifest: IModuleManifest
  status: ModuleStatus
  registeredAt: number
  loadedAt?: number
  error?: string
}

/**
 * 模块状态
 */
export type ModuleStatus = 'registered' | 'loading' | 'loaded' | 'error' | 'unloading'

/**
 * App注册器接口 - 由AppRegistry实现
 */
export interface AppRegistry {
  registerModel(modelDef: ModelDefinition): void
  registerRoute(routeDef: RouteDefinition): void
  registerComponent(componentDef: ComponentDefinition): void
  registerPageRoute(routeDef: PageRouteDefinition): void
  extendModel(modelName: string, extensions: Record<string, unknown>): void
  overrideComponent(name: string, component: React.ComponentType<unknown>): void
}

/**
 * 模块注册器 - 负责业务模块的注册、加载和生命周期管理
 *
 * 基于Odoo模块系统设计，支持：
 * - 模块依赖管理
 * - 动态加载/卸载
 * - 数据模型扩展
 * - 路由和组件注册
 */
export class ModuleRegistry extends EventEmitter {
  private modules = new Map<string, ModuleRegistration>()
  private loadOrder: string[] = []

  constructor(private appRegistry: AppRegistry) {
    super()
  }

  /**
   * 注册模块
   */
  async register(manifest: IModuleManifest): Promise<void> {
    const { name } = manifest

    if (this.modules.has(name)) {
      throw new Error(`Module ${name} is already registered`)
    }

    // 验证清单
    this.validateManifest(manifest)

    // 检查依赖
    this.checkDependencies(manifest.dependencies)

    const registration: ModuleRegistration = {
      manifest,
      status: 'registered',
      registeredAt: Date.now(),
    }

    this.modules.set(name, registration)
    this.emit('moduleRegistered', { name, manifest })
  }

  /**
   * 加载模块
   */
  async load(moduleName: string): Promise<void> {
    const registration = this.modules.get(moduleName)
    if (!registration) {
      throw new Error(`Module ${moduleName} not found`)
    }

    if (registration.status === 'loaded') {
      return // 已加载
    }

    if (registration.status === 'loading') {
      throw new Error(`Module ${moduleName} is already loading`)
    }

    try {
      registration.status = 'loading'

      // 先加载依赖
      await this.loadDependencies(registration.manifest.dependencies)

      // 注册模块提供的各种定义
      await this.registerModuleDefinitions(registration.manifest)

      // 执行模块初始化钩子
      if (registration.manifest.onLoad) {
        await registration.manifest.onLoad(this.appRegistry)
      }

      registration.status = 'loaded'
      registration.loadedAt = Date.now()
      this.loadOrder.push(moduleName)

      this.emit('moduleLoaded', { name: moduleName, manifest: registration.manifest })
    } catch (error) {
      registration.status = 'error'
      registration.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * 卸载模块
   */
  async unload(moduleName: string): Promise<void> {
    const registration = this.modules.get(moduleName)
    if (!registration) {
      throw new Error(`Module ${moduleName} not found`)
    }

    if (registration.status !== 'loaded') {
      return // 未加载
    }

    try {
      registration.status = 'unloading'

      // 检查是否有其他模块依赖此模块
      const dependents = this.getDependents(moduleName)
      if (dependents.length > 0) {
        throw new Error(`Cannot unload ${moduleName}: required by ${dependents.join(', ')}`)
      }

      // 执行模块清理钩子
      if (registration.manifest.onUnload) {
        await registration.manifest.onUnload()
      }

      registration.status = 'registered'
      registration.loadedAt = undefined
      this.loadOrder = this.loadOrder.filter(name => name !== moduleName)

      this.emit('moduleUnloaded', { name: moduleName })
    } catch (error) {
      registration.status = 'error'
      registration.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * 获取模块
   */
  getModule(name: string): ModuleRegistration | undefined {
    return this.modules.get(name)
  }

  /**
   * 获取所有模块
   */
  getModules(): ModuleRegistration[] {
    return Array.from(this.modules.values())
  }

  /**
   * 获取已加载的模块
   */
  getLoadedModules(): ModuleRegistration[] {
    return Array.from(this.modules.values()).filter(reg => reg.status === 'loaded')
  }

  /**
   * 检查模块是否存在
   */
  hasModule(name: string): boolean {
    return this.modules.has(name)
  }

  /**
   * 获取模块状态
   */
  getModuleStatus(name: string): ModuleStatus | undefined {
    return this.modules.get(name)?.status
  }

  /**
   * 验证模块清单
   */
  private validateManifest(manifest: IModuleManifest): void {
    if (!manifest.name) {
      throw new Error('Module name is required')
    }
    if (!manifest.version) {
      throw new Error('Module version is required')
    }
    if (!Array.isArray(manifest.dependencies)) {
      throw new Error('Dependencies must be an array')
    }
  }

  /**
   * 检查依赖是否满足
   */
  private checkDependencies(dependencies: string[]): void {
    for (const dep of dependencies) {
      if (!this.modules.has(dep)) {
        throw new Error(`Dependency ${dep} not found`)
      }
    }
  }

  /**
   * 加载依赖模块
   */
  private async loadDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      const depRegistration = this.modules.get(dep)
      if (!depRegistration) {
        throw new Error(`Dependency ${dep} not found`)
      }

      if (depRegistration.status !== 'loaded') {
        await this.load(dep)
      }
    }
  }

  /**
   * 注册模块提供的各种定义
   */
  private async registerModuleDefinitions(manifest: IModuleManifest): Promise<void> {
    // 注册数据模型
    if (manifest.models) {
      for (const model of manifest.models) {
        this.appRegistry.registerModel(model)
      }
    }

    // 注册API路由
    if (manifest.apiRoutes) {
      for (const route of manifest.apiRoutes) {
        this.appRegistry.registerRoute(route)
      }
    }

    // 注册UI组件
    if (manifest.uiComponents) {
      for (const component of manifest.uiComponents) {
        this.appRegistry.registerComponent(component)
      }
    }

    // 注册页面路由
    if (manifest.pageRoutes) {
      for (const route of manifest.pageRoutes) {
        this.appRegistry.registerPageRoute(route)
      }
    }
  }

  /**
   * 获取依赖于指定模块的模块列表
   */
  private getDependents(moduleName: string): string[] {
    const dependents: string[] = []

    for (const [name, registration] of this.modules) {
      if (registration.manifest.dependencies.includes(moduleName)) {
        dependents.push(name)
      }
    }

    return dependents
  }
}
