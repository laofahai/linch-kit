/**
 * Extension 加载器 - 负责 Extension 的动态加载和生命周期管理
 * @module core/extension-loader
 */

import { EventEmitter } from 'eventemitter3'
import React from 'react'
import {
  ExtensionManager,
  extensionManager as _extensionManager,
  type ExtensionInstance,
  type ExtensionLoadResult,
  type ExtensionState,
  type ExtensionMetrics,
  type ExtensionHealth,
} from '@linch-kit/core/client'

import { enhancedAppRegistry } from './enhanced-app-registry'
import type { DynamicRouteConfig } from './enhanced-app-registry'

/**
 * Extension 加载配置
 */
export interface ExtensionLoaderConfig {
  /** 是否启用自动加载 */
  autoLoad: boolean
  /** Extension 目录路径 */
  extensionPath: string
  /** 是否启用热重载 */
  hotReload: boolean
  /** 允许的 Extension 列表 */
  allowedExtensions?: string[]
  /** 是否启用权限检查 */
  permissionCheck?: boolean
}

/**
 * Extension 加载状态
 */
export type ExtensionLoadStatus = 'unloaded' | 'loading' | 'loaded' | 'failed' | 'unloading'

/**
 * Console Extension 状态 - 扩展Core的ExtensionState，添加UI特定信息
 */
export interface ConsoleExtensionState extends ExtensionState {
  /** 路由数量 */
  routeCount: number
  /** 组件数量 */
  componentCount: number
  /** 加载状态 */
  loadStatus: ExtensionLoadStatus
  /** Extension名称 */
  name: string
  /** 当前状态 */
  status:
    | 'registered'
    | 'loading'
    | 'loaded'
    | 'starting'
    | 'running'
    | 'stopping'
    | 'stopped'
    | 'error'
  /** 错误信息 */
  error?: Error
}

/**
 * Extension 加载器 - Console 专用
 *
 * 功能：
 * - 基于 Core.ExtensionManager 的 Console 集成
 * - 路由注册和UI组件集成
 * - Extension 在 Console 中的状态管理
 * - Console 特定的错误处理
 */
export class ExtensionLoader extends EventEmitter {
  private extensionStates = new Map<string, ConsoleExtensionState>()
  private extensionInstances = new Map<string, ExtensionInstance>()

  constructor(
    private config: ExtensionLoaderConfig = {
      autoLoad: true,
      extensionPath: process.env.EXTENSION_ROOT || process.cwd() + '/extensions',
      hotReload: true,
    },
    private extensionManager: ExtensionManager = _extensionManager
  ) {
    super()
    this.setupEventHandlers()
  }

  /**
   * 加载 Extension
   */
  async loadExtension(extensionName: string): Promise<ExtensionLoadResult> {
    // 更新加载状态
    this.updateExtensionState(extensionName, 'loading')

    try {
      // 检查是否允许加载（仅基础检查，权限验证由Core负责）
      if (!this.isExtensionAllowed(extensionName)) {
        throw new Error(`Extension ${extensionName} is not allowed to load`)
      }

      // 使用 ExtensionManager 加载（权限验证已在Core中处理）
      const result = await this.extensionManager.loadExtension(extensionName)

      if (!result.success || !result.instance) {
        throw new Error(result.error?.message || 'Failed to load extension')
      }

      const instance = result.instance
      this.extensionInstances.set(extensionName, instance)

      // 注册 Extension 菜单组
      enhancedAppRegistry.registerExtensionMenuGroup(instance)

      // 获取 Extension 的路由配置
      const routes = await this.getExtensionRoutes(instance)

      // 注册路由到 AppRegistry
      if (routes.length > 0) {
        await enhancedAppRegistry.registerExtensionRoutes(instance, routes)
      }

      // 获取 Extension 的组件
      const components = await this.getExtensionComponents(instance)

      // 注册组件到 AppRegistry
      for (const [componentName, component] of components) {
        enhancedAppRegistry.registerExtensionComponent(instance, componentName, component)
      }

      // 更新加载状态
      this.updateExtensionState(extensionName, 'running', {
        routeCount: routes.length,
        componentCount: components.size,
      })

      // 触发加载完成事件
      this.emit('extensionLoaded', {
        name: extensionName,
        instance,
        routes,
        components: Array.from(components.keys()),
      })

      return result
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error(String(error))

      // 更新加载状态
      this.updateExtensionState(extensionName, 'error', { error: loadError })

      // 触发加载失败事件
      this.emit('extensionLoadFailed', {
        name: extensionName,
        error: loadError,
      })

      return {
        success: false,
        error: {
          code: 'LOAD_FAILED',
          message: loadError.message,
          stack: loadError.stack,
        },
      }
    }
  }

  /**
   * 卸载 Extension
   */
  async unloadExtension(extensionName: string): Promise<boolean> {
    try {
      const instance = this.extensionInstances.get(extensionName)
      if (!instance) {
        return false
      }

      // 从 AppRegistry 注销路由
      await enhancedAppRegistry.unregisterExtensionRoutes(extensionName)

      // 使用 ExtensionManager 卸载
      const result = await this.extensionManager.unloadExtension(extensionName)

      if (result) {
        // 清理本地状态
        this.extensionInstances.delete(extensionName)
        this.updateExtensionState(extensionName, 'stopped')

        // 触发卸载完成事件
        this.emit('extensionUnloaded', {
          name: extensionName,
          instance,
        })
      }

      return result
    } catch (error) {
      const unloadError = error instanceof Error ? error : new Error(String(error))

      this.emit('extensionUnloadFailed', {
        name: extensionName,
        error: unloadError,
      })

      return false
    }
  }

  /**
   * 重载 Extension
   */
  async reloadExtension(extensionName: string): Promise<ExtensionLoadResult> {
    // 先卸载
    await this.unloadExtension(extensionName)

    // 再加载
    return this.loadExtension(extensionName)
  }

  /**
   * 获取 Extension 实例
   */
  getExtensionInstance(extensionName: string): ExtensionInstance | undefined {
    return this.extensionInstances.get(extensionName)
  }

  /**
   * 获取所有Extension状态
   */
  getAllExtensionStates(): ConsoleExtensionState[] {
    return Array.from(this.extensionStates.values())
  }

  /**
   * 获取 Extension 状态
   */
  getExtensionState(extensionName: string): ConsoleExtensionState | undefined {
    return this.extensionStates.get(extensionName)
  }

  /**
   * 检查 Extension 是否已加载
   */
  isExtensionLoaded(extensionName: string): boolean {
    const state = this.extensionStates.get(extensionName)
    return state?.status === 'running'
  }

  /**
   * @deprecated 使用 getAllExtensionStates() 代替
   */
  getLoadedExtensions(): ConsoleExtensionState[] {
    return this.getAllExtensionStates()
  }

  /**
   * @deprecated 使用 getExtensionState() 代替
   */
  getExtensionStatus(extensionName: string): ConsoleExtensionState | undefined {
    return this.getExtensionState(extensionName)
  }

  /**
   * 自动加载所有允许的 Extension
   */
  async autoLoadExtensions(): Promise<void> {
    if (!this.config.autoLoad) {
      return
    }

    const allowedExtensions = this.config.allowedExtensions || ['console', 'blog-extension']

    for (const extensionName of allowedExtensions) {
      try {
        await this.loadExtension(extensionName)
      } catch (error) {
        console.error(`Failed to auto-load extension ${extensionName}:`, error)
      }
    }
  }

  /**
   * 获取 Extension 的路由配置
   */
  private async getExtensionRoutes(instance: ExtensionInstance): Promise<DynamicRouteConfig[]> {
    const routes: DynamicRouteConfig[] = []

    // 这里需要根据 Extension 的实际结构来获取路由
    // 暂时返回一个基础路由
    if (instance.metadata.capabilities.hasUI) {
      routes.push({
        path: '',
        component: () => React.createElement('div', {}, `Extension ${instance.name} UI`),
        metadata: {
          title: instance.metadata.displayName || instance.name,
          description: `Main page for ${instance.name}`,
          permissions: instance.metadata.permissions,
        },
        requireAuth: true,
      })
    }

    return routes
  }

  /**
   * 获取 Extension 的组件
   */
  private async getExtensionComponents(
    _instance: ExtensionInstance
  ): Promise<Map<string, React.ComponentType<unknown>>> {
    const components = new Map<string, React.ComponentType<unknown>>()

    // 这里需要根据 Extension 的实际结构来获取组件
    // 暂时返回空的 Map

    return components
  }

  /**
   * 检查 Extension 是否允许加载
   */
  private isExtensionAllowed(extensionName: string): boolean {
    if (!this.config.allowedExtensions) {
      return true
    }

    return this.config.allowedExtensions.includes(extensionName)
  }

  /**
   * 更新Extension状态
   */
  private updateExtensionState(
    extensionName: string,
    status: ExtensionState['status'],
    additional?: Partial<ConsoleExtensionState>
  ): void {
    const currentState = this.extensionStates.get(extensionName) || {
      name: extensionName,
      status: 'loading',
      lastUpdated: Date.now(),
      metrics: {
        initializationTime: 0,
        startupTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        requestCount: 0,
        errorCount: 0,
        lastActivity: Date.now(),
      } as ExtensionMetrics,
      health: {
        score: 100,
        status: 'healthy',
        checks: [],
        lastCheckTime: Date.now(),
      } as ExtensionHealth,
      routeCount: 0,
      componentCount: 0,
    }

    const newState: ConsoleExtensionState = {
      ...currentState,
      status,
      lastUpdated: Date.now(),
      ...additional,
    }

    if (status === 'running') {
      newState.startedAt = Date.now()
      newState.error = undefined
    } else if (status === 'stopped') {
      newState.stoppedAt = Date.now()
    }

    this.extensionStates.set(extensionName, newState)

    // 触发状态更新事件
    this.emit('statusUpdated', {
      name: extensionName,
      state: newState,
    })
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // EnhancedPluginRegistry 不具备 EventEmitter 功能
    // 移除事件监听器设置，如需要事件处理功能，应该在调用方处理
    // 或者在 ExtensionManager 接口中明确定义事件处理方法
  }

  /**
   * 获取加载器配置
   */
  getConfig(): ExtensionLoaderConfig {
    return { ...this.config }
  }

  /**
   * 更新加载器配置
   */
  updateConfig(newConfig: Partial<ExtensionLoaderConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }
}

/**
 * 创建 Extension 加载器实例
 */
export function createExtensionLoader(config?: Partial<ExtensionLoaderConfig>): ExtensionLoader {
  const defaultConfig: ExtensionLoaderConfig = {
    autoLoad: true,
    extensionPath: process.env.EXTENSION_ROOT || process.cwd() + '/extensions',
    hotReload: process.env.NODE_ENV === 'development',
    allowedExtensions: [],
  }
  return new ExtensionLoader({ ...defaultConfig, ...config })
}

/**
 * 默认 Extension 加载器实例
 */
export const extensionLoader = createExtensionLoader()
