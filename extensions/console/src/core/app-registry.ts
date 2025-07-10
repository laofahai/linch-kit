/**
 * Console专用应用注册器 - 基于Core.AppRegistry，添加Console特定功能
 * @module core/app-registry
 */

import { EventEmitter } from 'events'

import type { PageRouteDefinition } from './module-registry'

/**
 * 菜单项定义
 */
export interface MenuItemDefinition {
  id: string
  title: string
  path?: string
  icon?: string
  parentId?: string
  order?: number
  permissions?: string[]
  visible?: boolean
  type?: 'item' | 'group' | 'divider'
}

/**
 * 组件注册信息
 */
export interface ComponentRegistration {
  name: string
  component: React.ComponentType<unknown>
  metadata?: Record<string, unknown>
}

/**
 * Console专用应用注册器
 */
export class AppRegistry extends EventEmitter {
  private pageRoutes = new Map<string, PageRouteDefinition>()
  private menus = new Map<string, MenuItemDefinition>()
  private components = new Map<string, React.ComponentType<unknown>>()

  /**
   * 注册页面路由
   */
  registerPageRoute(route: PageRouteDefinition): void {
    this.pageRoutes.set(route.path, route)
    this.emit('pageRouteRegistered', route)
  }

  /**
   * 注册菜单项
   */
  registerMenu(menu: MenuItemDefinition): void {
    this.menus.set(menu.id, menu)
    this.emit('menuRegistered', menu)
  }

  /**
   * 注册组件
   */
  registerComponent(config: ComponentRegistration): void {
    this.components.set(config.name, config.component)
    this.emit('componentRegistered', config)
  }

  /**
   * 获取页面路由
   */
  getPageRoutes(): Map<string, PageRouteDefinition> {
    return this.pageRoutes
  }

  /**
   * 获取菜单项
   */
  getMenus(): Map<string, MenuItemDefinition> {
    return this.menus
  }

  /**
   * 获取组件
   */
  getComponent(name: string): React.ComponentType<unknown> | null {
    return this.components.get(name) || null
  }

  /**
   * 覆盖组件
   */
  overrideComponent(name: string, component: React.ComponentType<unknown>): void {
    this.components.set(name, component)
    this.emit('componentOverridden', { name, component })
  }

  /**
   * 清除所有注册信息
   */
  clear(): void {
    this.pageRoutes.clear()
    this.menus.clear()
    this.components.clear()
    this.emit('cleared')
  }
}

/**
 * 默认应用注册器实例
 */
export const appRegistry = new AppRegistry()
