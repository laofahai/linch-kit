/**
 * 应用注册器 - 运行时注册和管理应用级资源
 * @module core/app-registry
 */

import { EventEmitter } from 'eventemitter3'
import type { Router } from '@trpc/server'

import type {
  ModelDefinition,
  RouteDefinition,
  ComponentDefinition,
  PageRouteDefinition,
  AppRegistry as IAppRegistry,
} from './module-registry'

/**
 * 模型扩展定义
 */
export interface ModelExtension {
  targetModel: string
  fields?: Record<string, unknown>
  relations?: Record<string, unknown>
  hooks?: Record<string, unknown>
  methods?: Record<string, unknown>
}

/**
 * 路由注册信息
 */
export interface RouteRegistration {
  definition: RouteDefinition
  registeredBy: string
  registeredAt: number
}

/**
 * 组件注册信息
 */
export interface ComponentRegistration {
  definition: ComponentDefinition
  registeredBy: string
  registeredAt: number
  originalComponent?: React.ComponentType<unknown>
}

/**
 * 页面路由注册信息
 */
export interface PageRouteRegistration {
  definition: PageRouteDefinition
  registeredBy: string
  registeredAt: number
}

/**
 * 菜单项定义
 */
export interface MenuItemDefinition {
  /** 菜单项唯一标识 */
  id: string
  /** 菜单标题 */
  title: string
  /** 图标名称或组件 */
  icon?: string | React.ComponentType<unknown>
  /** 菜单路径 */
  path?: string
  /** 父菜单ID */
  parentId?: string
  /** 排序权重 */
  order?: number
  /** 权限要求 */
  permissions?: string[]
  /** 是否可见 */
  visible?: boolean
  /** 菜单类型 */
  type?: 'item' | 'group' | 'divider'
  /** 子菜单 */
  children?: MenuItemDefinition[]
  /** 外部链接 */
  external?: boolean
  /** 角标信息 */
  badge?: {
    text: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
  }
}

/**
 * 菜单注册信息
 */
export interface MenuRegistration {
  definition: MenuItemDefinition
  registeredBy: string
  registeredAt: number
}

/**
 * 应用注册器 - 实现Odoo风格的动态扩展机制
 *
 * 核心功能：
 * - 运行时模型扩展（类似Odoo模型继承）
 * - 组件覆盖和增强
 * - 动态路由注册
 * - 事件驱动的扩展通知
 */
export class AppRegistry extends EventEmitter implements IAppRegistry {
  private models = new Map<string, ModelDefinition>()
  private modelExtensions = new Map<string, ModelExtension[]>()
  private routes = new Map<string, RouteRegistration>()
  private components = new Map<string, ComponentRegistration>()
  private pageRoutes = new Map<string, PageRouteRegistration>()
  private menus = new Map<string, MenuRegistration>()
  private trpcRouter?: Router<unknown>

  /**
   * 注册数据模型
   */
  registerModel(modelDef: ModelDefinition): void {
    if (this.models.has(modelDef.name)) {
      throw new Error(`Model ${modelDef.name} is already registered`)
    }

    // 应用已有的扩展
    const extensions = this.modelExtensions.get(modelDef.name) || []
    const extendedModel = this.applyModelExtensions(modelDef, extensions)

    this.models.set(modelDef.name, extendedModel)
    this.emit('modelRegistered', { name: modelDef.name, model: extendedModel })
  }

  /**
   * 扩展现有模型（类似Odoo模型继承）
   */
  extendModel(modelName: string, extensions: Record<string, unknown>): void {
    const extension: ModelExtension = {
      targetModel: modelName,
      ...extensions,
    }

    // 记录扩展
    const existing = this.modelExtensions.get(modelName) || []
    existing.push(extension)
    this.modelExtensions.set(modelName, existing)

    // 如果模型已注册，立即应用扩展
    const existingModel = this.models.get(modelName)
    if (existingModel) {
      const extendedModel = this.applyModelExtensions(existingModel, [extension])
      this.models.set(modelName, extendedModel)
      this.emit('modelExtended', { name: modelName, extension, model: extendedModel })
    }
  }

  /**
   * 注册API路由
   */
  registerRoute(routeDef: RouteDefinition): void {
    const routeKey = `${routeDef.method}:${routeDef.path}`

    if (this.routes.has(routeKey)) {
      throw new Error(`Route ${routeKey} is already registered`)
    }

    const registration: RouteRegistration = {
      definition: routeDef,
      registeredBy: 'unknown', // TODO: 传入模块名
      registeredAt: Date.now(),
    }

    this.routes.set(routeKey, registration)
    this.emit('routeRegistered', { route: routeDef, registration })

    // TODO: 动态添加到tRPC路由器
    this.updateTrpcRouter()
  }

  /**
   * 注册UI组件
   */
  registerComponent(componentDef: ComponentDefinition): void {
    const existing = this.components.get(componentDef.name)

    const registration: ComponentRegistration = {
      definition: componentDef,
      registeredBy: 'unknown', // TODO: 传入模块名
      registeredAt: Date.now(),
      originalComponent: existing?.definition.component,
    }

    this.components.set(componentDef.name, registration)
    this.emit('componentRegistered', {
      name: componentDef.name,
      component: componentDef,
      registration,
    })
  }

  /**
   * 覆盖现有组件
   */
  overrideComponent(name: string, component: React.ComponentType<unknown>): void {
    const existing = this.components.get(name)

    const componentDef: ComponentDefinition = {
      name,
      component,
      overrides: existing ? [name] : [],
    }

    const registration: ComponentRegistration = {
      definition: componentDef,
      registeredBy: 'override', // TODO: 传入模块名
      registeredAt: Date.now(),
      originalComponent: existing?.definition.component,
    }

    this.components.set(name, registration)
    this.emit('componentOverridden', {
      name,
      newComponent: component,
      originalComponent: existing?.definition.component,
    })
  }

  /**
   * 注册页面路由
   */
  registerPageRoute(routeDef: PageRouteDefinition): void {
    if (this.pageRoutes.has(routeDef.path)) {
      throw new Error(`Page route ${routeDef.path} is already registered`)
    }

    const registration: PageRouteRegistration = {
      definition: routeDef,
      registeredBy: 'unknown', // TODO: 传入模块名
      registeredAt: Date.now(),
    }

    this.pageRoutes.set(routeDef.path, registration)
    this.emit('pageRouteRegistered', { route: routeDef, registration })
  }

  /**
   * 注册菜单项
   */
  registerMenu(menuDef: MenuItemDefinition): void {
    if (this.menus.has(menuDef.id)) {
      throw new Error(`Menu ${menuDef.id} is already registered`)
    }

    const registration: MenuRegistration = {
      definition: menuDef,
      registeredBy: 'unknown',
      registeredAt: Date.now(),
    }

    this.menus.set(menuDef.id, registration)
    this.emit('menuRegistered', { menu: menuDef, registration })
  }

  /**
   * 构建菜单树
   */
  buildMenuTree(): MenuItemDefinition[] {
    const menus = Array.from(this.menus.values())
      .map(reg => reg.definition)
      .filter(menu => menu.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const menuMap = new Map<string, MenuItemDefinition>()
    const roots: MenuItemDefinition[] = []

    // 第一遍：建立映射
    for (const menu of menus) {
      menuMap.set(menu.id, { ...menu, children: [] })
    }

    // 第二遍：构建树形结构
    for (const menu of menus) {
      const menuItem = menuMap.get(menu.id)!
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!
        parent.children = parent.children || []
        parent.children.push(menuItem)
      } else {
        roots.push(menuItem)
      }
    }

    return roots
  }

  /**
   * 获取模型定义
   */
  getModel(name: string): ModelDefinition | undefined {
    return this.models.get(name)
  }

  /**
   * 获取所有模型
   */
  getModels(): Map<string, ModelDefinition> {
    return new Map(this.models)
  }

  /**
   * 获取组件
   */
  getComponent(name: string): React.ComponentType<unknown> | undefined {
    return this.components.get(name)?.definition.component
  }

  /**
   * 获取所有组件
   */
  getComponents(): Map<string, ComponentRegistration> {
    return new Map(this.components)
  }

  /**
   * 获取API路由
   */
  getRoute(method: string, path: string): RouteRegistration | undefined {
    return this.routes.get(`${method}:${path}`)
  }

  /**
   * 获取所有API路由
   */
  getRoutes(): Map<string, RouteRegistration> {
    return new Map(this.routes)
  }

  /**
   * 获取页面路由
   */
  getPageRoute(path: string): PageRouteRegistration | undefined {
    return this.pageRoutes.get(path)
  }

  /**
   * 获取所有页面路由
   */
  getPageRoutes(): Map<string, PageRouteRegistration> {
    return new Map(this.pageRoutes)
  }

  /**
   * 获取菜单项
   */
  getMenu(id: string): MenuItemDefinition | undefined {
    return this.menus.get(id)?.definition
  }

  /**
   * 获取所有菜单
   */
  getMenus(): Map<string, MenuRegistration> {
    return new Map(this.menus)
  }

  /**
   * 设置tRPC路由器实例
   */
  setTrpcRouter(router: Router<unknown>): void {
    this.trpcRouter = router
  }

  /**
   * 获取当前tRPC路由器
   */
  getTrpcRouter(): Router<unknown> | undefined {
    return this.trpcRouter
  }

  /**
   * 清除所有注册信息（用于测试或重置）
   */
  clear(): void {
    this.models.clear()
    this.modelExtensions.clear()
    this.routes.clear()
    this.components.clear()
    this.pageRoutes.clear()
    this.menus.clear()
    this.emit('registryCleared')
  }

  /**
   * 应用模型扩展
   */
  private applyModelExtensions(
    baseModel: ModelDefinition,
    extensions: ModelExtension[]
  ): ModelDefinition {
    let extendedModel = { ...baseModel }

    for (const ext of extensions) {
      // 合并schema字段
      if (ext.fields) {
        extendedModel.schema = {
          ...extendedModel.schema,
          ...ext.fields,
        }
      }

      // 合并关系定义
      if (ext.relations && extendedModel.relations) {
        extendedModel.relations = [...extendedModel.relations, ...(ext.relations as unknown[])]
      }

      // 合并钩子函数
      if (ext.hooks && extendedModel.hooks) {
        extendedModel.hooks = {
          ...extendedModel.hooks,
          ...ext.hooks,
        }
      }

      // 合并自定义方法
      if (ext.methods) {
        extendedModel = {
          ...extendedModel,
          ...ext.methods,
        }
      }
    }

    return extendedModel
  }

  /**
   * 更新tRPC路由器（动态添加路由）
   */
  private updateTrpcRouter(): void {
    if (!this.trpcRouter) {
      return
    }

    // TODO: 实现动态路由添加
    // 这需要对tRPC的深度集成，可能需要重新创建路由器实例
    this.emit('trpcRouterUpdateNeeded', { routes: Array.from(this.routes.values()) })
  }
}

/**
 * 默认应用注册器实例
 */
export const appRegistry = new AppRegistry()
