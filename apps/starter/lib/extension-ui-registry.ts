/**
 * Extension UI 组件注册器
 * 管理扩展的 UI 组件和渲染逻辑
 */

import type { ClientExtensionRegistration } from '@linch-kit/core/client'
import type { ComponentType } from 'react'

// 扩展UI组件props定义
export interface ExtensionUIComponentProps {
  extensionName: string
  subPath: string
  fullPath: string
  registration: ClientExtensionRegistration
}

// 扩展UI组件定义
export interface ExtensionUIComponent {
  /** 组件名称 */
  name: string
  /** React 组件 */
  component: ComponentType<ExtensionUIComponentProps>
  /** 路由路径 */
  path?: string
  /** 是否为默认路由 */
  isDefault?: boolean
}

// 扩展UI注册项
export interface ExtensionUIRegistration {
  /** 扩展ID */
  extensionId: string
  /** 组件列表 */
  components: ExtensionUIComponent[]
  /** 默认组件 */
  defaultComponent?: string
}

/**
 * Extension UI 组件注册器
 */
class ExtensionUIRegistry {
  private registry = new Map<string, ExtensionUIRegistration>()

  /**
   * 注册扩展的 UI 组件
   */
  registerExtensionUI(extensionId: string, registration: Omit<ExtensionUIRegistration, 'extensionId'>) {
    this.registry.set(extensionId, {
      extensionId,
      ...registration
    })
  }

  /**
   * 获取扩展的 UI 组件
   */
  getExtensionUI(extensionId: string): ExtensionUIRegistration | undefined {
    return this.registry.get(extensionId)
  }

  /**
   * 获取扩展的默认组件
   */
  getDefaultComponent(extensionId: string): ComponentType<ExtensionUIComponentProps> | undefined {
    const registration = this.registry.get(extensionId)
    if (!registration) return undefined

    // 如果指定了默认组件，返回该组件
    if (registration.defaultComponent) {
      const component = registration.components.find(c => c.name === registration.defaultComponent)
      if (component) return component.component
    }

    // 返回第一个标记为默认的组件
    const defaultComponent = registration.components.find(c => c.isDefault)
    if (defaultComponent) return defaultComponent.component

    // 返回第一个组件
    return registration.components[0]?.component
  }

  /**
   * 根据路径获取组件
   */
  getComponentByPath(extensionId: string, path: string): ComponentType<ExtensionUIComponentProps> | undefined {
    const registration = this.registry.get(extensionId)
    if (!registration) return undefined

    const component = registration.components.find(c => c.path === path)
    return component?.component
  }

  /**
   * 获取所有已注册的扩展
   */
  getRegisteredExtensions(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * 移除扩展的 UI 组件
   */
  unregisterExtensionUI(extensionId: string) {
    this.registry.delete(extensionId)
  }

  /**
   * 清空所有注册
   */
  clear() {
    this.registry.clear()
  }
}

// 创建全局实例
export const extensionUIRegistry = new ExtensionUIRegistry()

export default extensionUIRegistry