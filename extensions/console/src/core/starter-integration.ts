/**
 * Starter 与 Console 集成管理器
 * @module core/starter-integration
 */

import { EventEmitter } from 'eventemitter3'
import type { ExtensionInstance as _ExtensionInstance } from '@linch-kit/core/client'

import { enhancedAppRegistry } from './enhanced-app-registry'
import { extensionLoader } from './extension-loader'
import { extensionLifecycleManager } from './extension-lifecycle'
import { extensionCommunicationHub } from './extension-communication'
import type { DynamicRouteConfig } from './enhanced-app-registry'

/**
 * 集成配置
 */
export interface StarterIntegrationConfig {
  /** 是否自动初始化 */
  autoInitialize: boolean
  /** 是否启用热重载 */
  enableHotReload: boolean
  /** 是否启用Extension通信 */
  enableCommunication: boolean
  /** 默认加载的Extension列表 */
  defaultExtensions: string[]
  /** 路由前缀 */
  routePrefix: string
  /** 是否启用权限检查 */
  enablePermissionCheck: boolean
}

/**
 * 集成状态
 */
export interface StarterIntegrationState {
  /** 是否已初始化 */
  initialized: boolean
  /** 已加载的Extension数量 */
  loadedExtensions: number
  /** 注册的路由数量 */
  registeredRoutes: number
  /** 注册的组件数量 */
  registeredComponents: number
  /** 初始化时间 */
  initializationTime?: number
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * Extension 状态摘要
 */
export interface ExtensionStateSummary {
  /** Extension 名称 */
  name: string
  /** 加载状态 */
  loadStatus: string
  /** 生命周期阶段 */
  lifecyclePhase: string
  /** 路由数量 */
  routeCount: number
  /** 组件数量 */
  componentCount: number
  /** 错误信息 */
  error?: string
}

/**
 * Starter 集成管理器
 *
 * 功能：
 * - 统一管理 Console 与 Starter 的集成
 * - 协调各个子系统的工作
 * - 提供统一的初始化和配置接口
 * - 监控和状态管理
 */
export class StarterIntegrationManager extends EventEmitter {
  private state: StarterIntegrationState = {
    initialized: false,
    loadedExtensions: 0,
    registeredRoutes: 0,
    registeredComponents: 0,
    lastUpdated: Date.now(),
  }

  constructor(
    private config: StarterIntegrationConfig = {
      autoInitialize: true,
      enableHotReload: true,
      enableCommunication: true,
      defaultExtensions: ['console', 'blog-extension'],
      routePrefix: '/dashboard/ext',
      enablePermissionCheck: true,
    }
  ) {
    super()
    this.setupEventHandlers()
  }

  /**
   * 初始化集成
   */
  async initialize(): Promise<void> {
    if (this.state.initialized) {
      return
    }

    const startTime = Date.now()

    try {
      // 1. 设置基础配置
      this.setupBaseConfiguration()

      // 2. 初始化Extension加载器
      await this.initializeExtensionLoader()

      // 3. 初始化通信系统
      if (this.config.enableCommunication) {
        this.initializeCommunicationSystem()
      }

      // 4. 加载默认Extension
      await this.loadDefaultExtensions()

      // 5. 设置路由监听
      this.setupRouteListeners()

      // 更新状态
      this.state.initialized = true
      this.state.initializationTime = Date.now() - startTime
      this.state.lastUpdated = Date.now()

      // 触发初始化完成事件
      this.emit('initialized', {
        config: this.config,
        state: this.state,
        initializationTime: this.state.initializationTime,
      })

      console.log(`[StarterIntegration] Initialized in ${this.state.initializationTime}ms`)
    } catch (error) {
      this.emit('initializationFailed', {
        error,
        config: this.config,
      })
      throw error
    }
  }

  /**
   * 获取集成状态
   */
  getState(): StarterIntegrationState {
    return { ...this.state }
  }

  /**
   * 获取Extension状态摘要
   */
  getExtensionStateSummary(): ExtensionStateSummary[] {
    const loadedExtensions = extensionLoader.getLoadedExtensions()
    const lifecycleStates = extensionLifecycleManager.getAllLifecycleStates()

    return loadedExtensions.map(ext => {
      const lifecycle = lifecycleStates.find(state => state.name === ext.name)

      return {
        name: ext.name,
        loadStatus: ext.status,
        lifecyclePhase: lifecycle?.currentPhase || 'unknown',
        routeCount: ext.routeCount,
        componentCount: ext.componentCount,
        error: ext.error?.message,
      }
    })
  }

  /**
   * 手动加载Extension
   */
  async loadExtension(extensionName: string): Promise<void> {
    try {
      await extensionLoader.loadExtension(extensionName)
      this.updateState()

      this.emit('extensionLoaded', {
        name: extensionName,
        state: this.state,
      })
    } catch (error) {
      this.emit('extensionLoadFailed', {
        name: extensionName,
        error,
      })
      throw error
    }
  }

  /**
   * 手动卸载Extension
   */
  async unloadExtension(extensionName: string): Promise<void> {
    try {
      await extensionLoader.unloadExtension(extensionName)
      this.updateState()

      this.emit('extensionUnloaded', {
        name: extensionName,
        state: this.state,
      })
    } catch (error) {
      this.emit('extensionUnloadFailed', {
        name: extensionName,
        error,
      })
      throw error
    }
  }

  /**
   * 重载Extension
   */
  async reloadExtension(extensionName: string): Promise<void> {
    try {
      await extensionLoader.reloadExtension(extensionName)
      this.updateState()

      this.emit('extensionReloaded', {
        name: extensionName,
        state: this.state,
      })
    } catch (error) {
      this.emit('extensionReloadFailed', {
        name: extensionName,
        error,
      })
      throw error
    }
  }

  /**
   * 获取所有动态路由
   */
  getAllRoutes(): DynamicRouteConfig[] {
    return enhancedAppRegistry.getAllDynamicRoutes()
  }

  /**
   * 获取菜单树
   */
  getMenuTree(): unknown[] {
    return enhancedAppRegistry.buildMenuTree()
  }

  /**
   * 获取通信统计
   */
  getCommunicationStats(): unknown {
    return extensionCommunicationHub.getMessageStats()
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<StarterIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', {
      config: this.config,
      state: this.state,
    })
  }

  /**
   * 设置基础配置
   */
  private setupBaseConfiguration(): void {
    // 设置路由前缀
    if (this.config.routePrefix) {
      // 这里可以设置路由前缀配置
      console.log(`[StarterIntegration] Route prefix set to: ${this.config.routePrefix}`)
    }
  }

  /**
   * 初始化Extension加载器
   */
  private async initializeExtensionLoader(): Promise<void> {
    // 配置Extension加载器
    extensionLoader.updateConfig({
      autoLoad: this.config.autoInitialize,
      hotReload: this.config.enableHotReload,
      permissionCheck: this.config.enablePermissionCheck,
      allowedExtensions: this.config.defaultExtensions,
    })

    console.log('[StarterIntegration] Extension loader initialized')
  }

  /**
   * 初始化通信系统
   */
  private initializeCommunicationSystem(): void {
    // 通信系统默认已经初始化
    console.log('[StarterIntegration] Communication system initialized')
  }

  /**
   * 加载默认Extension
   */
  private async loadDefaultExtensions(): Promise<void> {
    if (!this.config.autoInitialize) {
      return
    }

    const promises = this.config.defaultExtensions.map(async extensionName => {
      try {
        await extensionLoader.loadExtension(extensionName)
        console.log(`[StarterIntegration] Loaded extension: ${extensionName}`)
      } catch (error) {
        console.error(`[StarterIntegration] Failed to load extension ${extensionName}:`, error)
      }
    })

    await Promise.all(promises)
  }

  /**
   * 设置路由监听
   */
  private setupRouteListeners(): void {
    // 监听路由更新
    enhancedAppRegistry.onRouteUpdate(routes => {
      this.state.registeredRoutes = routes.length
      this.state.lastUpdated = Date.now()

      this.emit('routesUpdated', {
        routes,
        count: routes.length,
        state: this.state,
      })
    })
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听Extension加载器事件
    extensionLoader.on('extensionLoaded', () => {
      this.updateState()
    })

    extensionLoader.on('extensionUnloaded', () => {
      this.updateState()
    })

    extensionLoader.on('statusUpdated', () => {
      this.updateState()
    })

    // 监听生命周期事件
    extensionLifecycleManager.on('lifecycleEvent', event => {
      this.emit('extensionLifecycleEvent', event)
    })

    // 监听通信事件
    extensionCommunicationHub.on('messageSent', message => {
      this.emit('extensionMessage', message)
    })
  }

  /**
   * 更新状态
   */
  private updateState(): void {
    const loadedExtensions = extensionLoader.getLoadedExtensions()
    const allRoutes = enhancedAppRegistry.getAllDynamicRoutes()
    const allComponents = enhancedAppRegistry.getComponents()

    this.state.loadedExtensions = loadedExtensions.length
    this.state.registeredRoutes = allRoutes.length
    this.state.registeredComponents = allComponents.size
    this.state.lastUpdated = Date.now()

    this.emit('stateUpdated', {
      state: this.state,
      extensionCount: loadedExtensions.length,
      routeCount: allRoutes.length,
      componentCount: allComponents.size,
    })
  }

  /**
   * 获取完整的集成状态报告
   */
  getStatusReport(): {
    integration: StarterIntegrationState
    extensions: ExtensionStateSummary[]
    routes: DynamicRouteConfig[]
    communication: unknown
    menu: unknown[]
  } {
    return {
      integration: this.getState(),
      extensions: this.getExtensionStateSummary(),
      routes: this.getAllRoutes(),
      communication: this.getCommunicationStats(),
      menu: this.getMenuTree(),
    }
  }

  /**
   * 销毁集成管理器
   */
  destroy(): void {
    this.state.initialized = false
    this.removeAllListeners()

    console.log('[StarterIntegration] Integration manager destroyed')
  }
}

/**
 * 创建集成管理器实例
 */
export function createStarterIntegrationManager(
  config?: Partial<StarterIntegrationConfig>
): StarterIntegrationManager {
  const defaultConfig: StarterIntegrationConfig = {
    autoInitialize: true,
    routePrefix: '/dashboard/ext',
    enableHotReload: false,
    enableCommunication: true,
    defaultExtensions: [],
    enablePermissionCheck: true,
  }
  return new StarterIntegrationManager({ ...defaultConfig, ...config })
}

/**
 * 默认集成管理器实例
 */
export const starterIntegrationManager = createStarterIntegrationManager()

// 自动初始化
if (typeof window !== 'undefined') {
  // 在浏览器环境中延迟初始化
  setTimeout(() => {
    starterIntegrationManager.initialize().catch(console.error)
  }, 100)
} else {
  // 在服务器环境中可以直接初始化
  starterIntegrationManager.initialize().catch(console.error)
}
