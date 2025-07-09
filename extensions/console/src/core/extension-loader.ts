/**
 * Extension 加载器 - 负责 Extension 的动态加载和生命周期管理
 * @module core/extension-loader
 */

import { EventEmitter } from 'eventemitter3'
import { 
  ExtensionManager, 
  extensionManager,
  type ExtensionInstance,
  type ExtensionLoadResult,
  type ExtensionMetadata,
  type ExtensionRegistration 
} from '@linch-kit/core'

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
  /** 是否启用权限验证 */
  permissionCheck: boolean
  /** 允许的 Extension 列表 */
  allowedExtensions?: string[]
}

/**
 * Extension 加载状态
 */
export interface ExtensionLoadStatus {
  /** Extension 名称 */
  name: string
  /** 加载状态 */
  status: 'loading' | 'loaded' | 'failed' | 'unloaded'
  /** 错误信息 */
  error?: Error
  /** 加载时间 */
  loadedAt?: number
  /** 路由数量 */
  routeCount: number
  /** 组件数量 */
  componentCount: number
}

/**
 * Extension 加载器
 * 
 * 功能：
 * - Extension 的动态加载和卸载
 * - 生命周期管理
 * - 与 AppRegistry 集成
 * - 错误处理和恢复
 */
export class ExtensionLoader extends EventEmitter {
  private loadedExtensions = new Map<string, ExtensionLoadStatus>()
  private extensionInstances = new Map<string, ExtensionInstance>()

  constructor(
    private config: ExtensionLoaderConfig = {
      autoLoad: true,
      extensionPath: '/home/laofahai/workspace/linch-kit/extensions',
      hotReload: true,
      permissionCheck: true
    },
    private extensionManager: ExtensionManager = extensionManager
  ) {
    super()
    this.setupEventHandlers()
  }

  /**
   * 加载 Extension
   */
  async loadExtension(extensionName: string): Promise<ExtensionLoadResult> {
    // 更新加载状态
    this.updateLoadStatus(extensionName, 'loading')
    
    try {
      // 检查是否允许加载
      if (!this.isExtensionAllowed(extensionName)) {
        throw new Error(`Extension ${extensionName} is not allowed to load`)
      }

      // 使用 ExtensionManager 加载
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
      this.updateLoadStatus(extensionName, 'loaded', {
        routeCount: routes.length,
        componentCount: components.size
      })

      // 触发加载完成事件
      this.emit('extensionLoaded', {
        name: extensionName,
        instance,
        routes,
        components: Array.from(components.keys())
      })

      return result
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error(String(error))
      
      // 更新加载状态
      this.updateLoadStatus(extensionName, 'failed', { error: loadError })
      
      // 触发加载失败事件
      this.emit('extensionLoadFailed', {
        name: extensionName,
        error: loadError
      })

      return {
        success: false,
        error: {
          code: 'LOAD_FAILED',
          message: loadError.message,
          stack: loadError.stack
        }
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
        this.updateLoadStatus(extensionName, 'unloaded')
        
        // 触发卸载完成事件
        this.emit('extensionUnloaded', {
          name: extensionName,
          instance
        })
      }

      return result
    } catch (error) {
      const unloadError = error instanceof Error ? error : new Error(String(error))
      
      this.emit('extensionUnloadFailed', {
        name: extensionName,
        error: unloadError
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
   * 获取所有已加载的 Extension
   */
  getLoadedExtensions(): ExtensionLoadStatus[] {
    return Array.from(this.loadedExtensions.values())
  }

  /**
   * 获取 Extension 状态
   */
  getExtensionStatus(extensionName: string): ExtensionLoadStatus | undefined {
    return this.loadedExtensions.get(extensionName)
  }

  /**
   * 检查 Extension 是否已加载
   */
  isExtensionLoaded(extensionName: string): boolean {
    const status = this.loadedExtensions.get(extensionName)
    return status?.status === 'loaded'
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
        component: () => import('react').then(React => 
          React.createElement('div', {}, `Extension ${instance.name} UI`)
        ) as any,
        metadata: {
          title: instance.metadata.displayName || instance.name,
          description: `Main page for ${instance.name}`,
          permissions: instance.metadata.permissions
        },
        requireAuth: true
      })
    }

    return routes
  }

  /**
   * 获取 Extension 的组件
   */
  private async getExtensionComponents(instance: ExtensionInstance): Promise<Map<string, React.ComponentType<any>>> {
    const components = new Map<string, React.ComponentType<any>>()
    
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
   * 更新加载状态
   */
  private updateLoadStatus(
    extensionName: string,
    status: ExtensionLoadStatus['status'],
    additional?: Partial<ExtensionLoadStatus>
  ): void {
    const currentStatus = this.loadedExtensions.get(extensionName) || {
      name: extensionName,
      status: 'loading',
      routeCount: 0,
      componentCount: 0
    }

    const newStatus: ExtensionLoadStatus = {
      ...currentStatus,
      status,
      ...additional
    }

    if (status === 'loaded') {
      newStatus.loadedAt = Date.now()
      newStatus.error = undefined
    }

    this.loadedExtensions.set(extensionName, newStatus)
    
    // 触发状态更新事件
    this.emit('statusUpdated', {
      name: extensionName,
      status: newStatus
    })
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听 ExtensionManager 的事件
    this.extensionManager.on('extensionLoaded', ({ name }) => {
      console.log(`[ExtensionLoader] Extension ${name} loaded by manager`)
    })

    this.extensionManager.on('extensionUnloaded', ({ name }) => {
      console.log(`[ExtensionLoader] Extension ${name} unloaded by manager`)
    })

    this.extensionManager.on('extensionError', ({ name, error }) => {
      console.error(`[ExtensionLoader] Extension ${name} error:`, error)
      this.updateLoadStatus(name, 'failed', { error })
    })
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
export function createExtensionLoader(
  config?: Partial<ExtensionLoaderConfig>
): ExtensionLoader {
  return new ExtensionLoader(config)
}

/**
 * 默认 Extension 加载器实例
 */
export const extensionLoader = createExtensionLoader()