/**
 * 增强的应用注册器 - 支持Extension动态路由和组件注册
 * @module core/enhanced-app-registry
 */

import type { 
  ExtensionInstance, 
  ExtensionMetadata,
  ExtensionContext 
} from '@linch-kit/core'
import type { NextRouter } from 'next/router'

import { AppRegistry } from './app-registry'
import type { RouteDefinition, PageRouteDefinition } from './module-registry'

/**
 * 动态路由配置
 */
export interface DynamicRouteConfig {
  /** 路由路径 */
  path: string
  /** 路由组件 */
  component: React.ComponentType<any>
  /** 路由元数据 */
  metadata?: {
    title?: string
    description?: string
    permissions?: string[]
  }
  /** 是否需要认证 */
  requireAuth?: boolean
  /** 布局组件 */
  layout?: React.ComponentType<any>
}

/**
 * Extension路由注册结果
 */
export interface ExtensionRouteRegistration {
  /** Extension名称 */
  extensionName: string
  /** 注册的路由 */
  routes: DynamicRouteConfig[]
  /** 注册时间 */
  registeredAt: number
  /** 基础路径 */
  basePath: string
}

/**
 * 路由更新监听器
 */
export type RouteUpdateListener = (routes: DynamicRouteConfig[]) => void

/**
 * 增强的应用注册器
 * 
 * 扩展功能：
 * - Extension动态路由注册
 * - 运行时路由更新
 * - Extension组件命名空间
 * - 路由权限控制
 */
export class EnhancedAppRegistry extends AppRegistry {
  private extensionRoutes = new Map<string, ExtensionRouteRegistration>()
  private routeListeners = new Set<RouteUpdateListener>()
  private nextRouter?: NextRouter
  private routePrefix = '/dashboard/ext'

  /**
   * 注册Extension路由
   */
  async registerExtensionRoutes(
    extension: ExtensionInstance,
    routes: DynamicRouteConfig[]
  ): Promise<void> {
    const { name, metadata } = extension
    const basePath = `${this.routePrefix}/${name}`

    // 验证权限
    if (!this.validateExtensionPermissions(metadata, 'ui:render')) {
      throw new Error(`Extension ${name} does not have UI rendering permission`)
    }

    // 处理路由路径，添加Extension前缀
    const processedRoutes = routes.map(route => ({
      ...route,
      path: this.normalizeRoutePath(basePath, route.path),
      metadata: {
        ...route.metadata,
        extensionName: name,
        permissions: [...(route.metadata?.permissions || []), ...(metadata.permissions || [])]
      }
    }))

    // 注册每个路由
    for (const route of processedRoutes) {
      // 注册为页面路由
      const pageRoute: PageRouteDefinition = {
        path: route.path,
        component: route.component,
        metadata: route.metadata,
        permissions: route.metadata?.permissions
      }
      
      super.registerPageRoute(pageRoute)

      // 注册到菜单（如果有标题）
      if (route.metadata?.title) {
        super.registerMenu({
          id: `${name}-${route.path}`,
          title: route.metadata.title,
          path: route.path,
          parentId: `ext-${name}`,
          permissions: route.metadata.permissions,
          visible: true,
          type: 'item'
        })
      }
    }

    // 保存Extension路由注册信息
    this.extensionRoutes.set(name, {
      extensionName: name,
      routes: processedRoutes,
      registeredAt: Date.now(),
      basePath
    })

    // 通知监听器
    this.notifyRouteUpdate()

    // 触发事件
    this.emit('extensionRoutesRegistered', {
      extension: name,
      routes: processedRoutes,
      count: processedRoutes.length
    })
  }

  /**
   * 注销Extension路由
   */
  async unregisterExtensionRoutes(extensionName: string): Promise<void> {
    const registration = this.extensionRoutes.get(extensionName)
    if (!registration) {
      return
    }

    // 移除页面路由
    for (const route of registration.routes) {
      this.getPageRoutes().delete(route.path)
      
      // 移除菜单项
      const menuId = `${extensionName}-${route.path}`
      this.getMenus().delete(menuId)
    }

    // 移除Extension菜单组
    this.getMenus().delete(`ext-${extensionName}`)

    // 移除注册信息
    this.extensionRoutes.delete(extensionName)

    // 通知监听器
    this.notifyRouteUpdate()

    // 触发事件
    this.emit('extensionRoutesUnregistered', {
      extension: extensionName,
      count: registration.routes.length
    })
  }

  /**
   * 获取所有动态路由
   */
  getAllDynamicRoutes(): DynamicRouteConfig[] {
    const routes: DynamicRouteConfig[] = []
    
    for (const registration of this.extensionRoutes.values()) {
      routes.push(...registration.routes)
    }

    return routes
  }

  /**
   * 获取Extension的路由
   */
  getExtensionRoutes(extensionName: string): DynamicRouteConfig[] {
    const registration = this.extensionRoutes.get(extensionName)
    return registration?.routes || []
  }

  /**
   * 注册Extension组件（带命名空间）
   */
  registerExtensionComponent(
    extension: ExtensionInstance,
    componentName: string,
    component: React.ComponentType<any>
  ): void {
    const namespacedName = `${extension.name}/${componentName}`
    
    super.registerComponent({
      name: namespacedName,
      component,
      metadata: {
        extensionName: extension.name,
        originalName: componentName
      }
    })

    this.emit('extensionComponentRegistered', {
      extension: extension.name,
      component: namespacedName
    })
  }

  /**
   * 覆盖核心组件（Extension专用）
   */
  overrideComponentByExtension(
    extension: ExtensionInstance,
    targetComponent: string,
    newComponent: React.ComponentType<any>
  ): void {
    // 验证权限
    if (!this.validateExtensionPermissions(extension.metadata, 'ui:render')) {
      throw new Error(`Extension ${extension.name} does not have component override permission`)
    }

    // 记录原始组件
    const original = this.getComponent(targetComponent)
    if (original) {
      const backupName = `__original__/${targetComponent}`
      super.registerComponent({
        name: backupName,
        component: original
      })
    }

    // 覆盖组件
    super.overrideComponent(targetComponent, newComponent)

    this.emit('componentOverriddenByExtension', {
      extension: extension.name,
      target: targetComponent,
      hasOriginal: !!original
    })
  }

  /**
   * 添加路由更新监听器
   */
  onRouteUpdate(listener: RouteUpdateListener): () => void {
    this.routeListeners.add(listener)
    
    // 立即通知当前路由
    listener(this.getAllDynamicRoutes())

    // 返回取消监听函数
    return () => {
      this.routeListeners.delete(listener)
    }
  }

  /**
   * 设置Next.js路由器实例
   */
  setNextRouter(router: NextRouter): void {
    this.nextRouter = router
  }

  /**
   * 动态导航到Extension路由
   */
  async navigateToExtension(
    extensionName: string, 
    routePath?: string
  ): Promise<boolean> {
    if (!this.nextRouter) {
      console.error('Next.js router not set')
      return false
    }

    const registration = this.extensionRoutes.get(extensionName)
    if (!registration) {
      console.error(`Extension ${extensionName} not found`)
      return false
    }

    const targetPath = routePath 
      ? this.normalizeRoutePath(registration.basePath, routePath)
      : registration.basePath

    await this.nextRouter.push(targetPath)
    return true
  }

  /**
   * 创建Extension菜单组
   */
  registerExtensionMenuGroup(extension: ExtensionInstance): void {
    const { name, metadata } = extension

    super.registerMenu({
      id: `ext-${name}`,
      title: metadata.displayName || name,
      icon: 'puzzle',
      type: 'group',
      order: 900, // Extensions在菜单底部
      permissions: metadata.permissions,
      visible: true
    })
  }

  /**
   * 获取Extension基础路径
   */
  getExtensionBasePath(extensionName: string): string | undefined {
    return this.extensionRoutes.get(extensionName)?.basePath
  }

  /**
   * 验证Extension权限
   */
  private validateExtensionPermissions(
    metadata: ExtensionMetadata,
    requiredPermission: string
  ): boolean {
    return metadata.permissions.includes(requiredPermission) ||
           metadata.permissions.includes('*')
  }

  /**
   * 规范化路由路径
   */
  private normalizeRoutePath(basePath: string, routePath: string): string {
    // 移除开头的斜杠
    const cleanPath = routePath.startsWith('/') ? routePath.slice(1) : routePath
    
    // 如果是空路径，返回基础路径
    if (!cleanPath) {
      return basePath
    }

    // 组合路径
    return `${basePath}/${cleanPath}`
  }

  /**
   * 通知路由更新
   */
  private notifyRouteUpdate(): void {
    const allRoutes = this.getAllDynamicRoutes()
    
    for (const listener of this.routeListeners) {
      try {
        listener(allRoutes)
      } catch (error) {
        console.error('Route update listener error:', error)
      }
    }
  }

  /**
   * 清除所有Extension注册信息
   */
  clearExtensions(): void {
    // 清除所有Extension路由
    for (const extensionName of this.extensionRoutes.keys()) {
      this.unregisterExtensionRoutes(extensionName)
    }

    // 清除基类数据
    super.clear()
  }
}

/**
 * 创建增强的应用注册器实例
 */
export function createEnhancedAppRegistry(): EnhancedAppRegistry {
  return new EnhancedAppRegistry()
}

/**
 * 默认增强应用注册器实例
 */
export const enhancedAppRegistry = createEnhancedAppRegistry()