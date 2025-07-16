/**
 * Extension UI 组件注册器
 * 管理扩展的 UI 组件和渲染逻辑
 */

import { Logger } from '@linch-kit/core/client'
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
  private initialized = false

  /**
   * 注册扩展的 UI 组件
   */
  registerExtensionUI(extensionId: string, registration: Omit<ExtensionUIRegistration, 'extensionId'>) {
    Logger.info(`[ExtensionUIRegistry] Registering UI for extension: ${extensionId}`)
    
    // 强制重新注册，确保页面刷新后可用
    this.registry.set(extensionId, {
      extensionId,
      ...registration
    })
    this.initialized = true
    
    // 添加更详细的调试信息
    Logger.info(`[ExtensionUIRegistry] Successfully registered ${registration.components.length} components for ${extensionId}`)
    Logger.info(`[ExtensionUIRegistry] Default component: ${registration.defaultComponent}`)
    Logger.info(`[ExtensionUIRegistry] Current registered extensions: [${this.getRegisteredExtensions().join(', ')}]`)
    
    // 验证注册是否成功
    const verified = this.getDefaultComponent(extensionId)
    if (verified) {
      Logger.info(`[ExtensionUIRegistry] ✓ Verification passed: Default component found for ${extensionId}`)
    } else {
      Logger.error(`[ExtensionUIRegistry] ✗ Verification failed: Default component NOT found for ${extensionId}`)
    }
  }

  /**
   * 获取扩展的 UI 组件
   */
  getExtensionUI(extensionId: string): ExtensionUIRegistration | undefined {
    return this.registry.get(extensionId)
  }

  /**
   * 获取扩展的默认组件（增强版）
   */
  getDefaultComponent(extensionId: string): ComponentType<ExtensionUIComponentProps> | undefined {
    Logger.info(`[ExtensionUIRegistry] Getting default component for: ${extensionId}`)
    Logger.info(`[ExtensionUIRegistry] Available extensions: [${this.getRegisteredExtensions().join(', ')}]`)
    
    const registration = this.registry.get(extensionId)
    if (!registration) {
      Logger.info(`[ExtensionUIRegistry] No registration found for: ${extensionId}`)
      return undefined
    }

    Logger.info(`[ExtensionUIRegistry] Found registration for ${extensionId} with ${registration.components.length} components`)

    // 如枟指定了默认组件，返回该组件
    if (registration.defaultComponent) {
      const component = registration.components.find(c => c.name === registration.defaultComponent)
      if (component) {
        Logger.info(`[ExtensionUIRegistry] ✓ Found default component: ${registration.defaultComponent}`)
        return component.component
      }
    }

    // 返回第一个标记为默认的组件
    const defaultComponent = registration.components.find(c => c.isDefault)
    if (defaultComponent) {
      Logger.info(`[ExtensionUIRegistry] ✓ Found default-marked component: ${defaultComponent.name}`)
      return defaultComponent.component
    }

    // 返回第一个组件
    const firstComponent = registration.components[0]
    if (firstComponent) {
      Logger.info(`[ExtensionUIRegistry] ✓ Using first component: ${firstComponent.name}`)
      return firstComponent.component
    }
    
    Logger.error(`[ExtensionUIRegistry] ✗ No components found for ${extensionId}`)
    return undefined
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
    this.initialized = false
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 检查扩展是否有有效的UI组件
   */
  hasValidComponents(extensionId: string): boolean {
    const registration = this.registry.get(extensionId)
    return !!(registration && registration.components.length > 0)
  }

  /**
   * 强制重新初始化所有扩展UI组件
   */
  forceReinitialization() {
    Logger.info('[ExtensionUIRegistry] Forcing reinitialization...')
    this.initialized = false
    // 保留注册表，但标记为未初始化状态
  }

  /**
   * 获取调试信息（增强版）
   */
  getDebugInfo() {
    const extensionDetails = Array.from(this.registry.entries()).map(([id, registration]) => ({
      id,
      componentsCount: registration.components.length,
      defaultComponent: registration.defaultComponent,
      hasDefaultComponent: !!this.getDefaultComponent(id)
    }))
    
    return {
      initialized: this.initialized,
      registrySize: this.registry.size,
      extensions: this.getRegisteredExtensions(),
      extensionDetails
    }
  }
}

// 创建全局实例
export const extensionUIRegistry = new ExtensionUIRegistry()

export default extensionUIRegistry