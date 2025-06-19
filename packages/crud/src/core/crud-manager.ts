/**
 * CRUD 管理器核心实现
 */

import { EventEmitter } from 'eventemitter3'


import { CRUDPermissionManager } from '../permissions/permission-manager'
import { CRUDSchemaAdapter } from '../schema/schema-adapter'
import { CRUDStateManager } from '../state/state-manager'
import type {
  CRUDConfig,
  CRUDOperations,
  CRUDPermissions,
  CRUDState,
  CRUDStateActions,
  CRUDEvents,
  DataSource,
  SchemaIntegration,
  ValidationConfig,
  CacheConfig,
  PluginConfig
} from '../types'

import { CRUDOperationsImpl } from './crud-operations'


/**
 * CRUD 管理器主类
 * 协调所有 CRUD 相关功能的核心类
 */
export class CRUDManager<T> {
  private config: CRUDConfig<T>
  private _operations: CRUDOperations<T>
  private _permissionManager: CRUDPermissionManager | null = null
  private _schemaAdapter: CRUDSchemaAdapter | null = null
  private _stateManager: CRUDStateManager<T>
  private _eventEmitter: EventEmitter<CRUDEvents<T>>
  private _plugins: Map<string, any> = new Map()

  constructor(config: CRUDConfig<T>) {
    this.config = { ...config }
    
    // 初始化事件发射器
    this._eventEmitter = config.events?.emitter || new EventEmitter()
    
    // 初始化状态管理器
    this._stateManager = new CRUDStateManager<T>(this._eventEmitter)
    
    // 初始化操作实现
    this._operations = new CRUDOperationsImpl<T>(
      config.dataSource,
      this._eventEmitter,
      this._stateManager
    )
    
    // 初始化权限管理器
    if (config.permissions) {
      this._permissionManager = new CRUDPermissionManager(config.permissions)
    }
    
    // 初始化 Schema 适配器
    if (config.schema) {
      this._schemaAdapter = new CRUDSchemaAdapter(config.schema)
    }
    
    // 加载插件
    if (config.plugins) {
      this.loadPlugins(config.plugins)
    }
    
    // 设置事件监听器
    this.setupEventListeners()
    
    // 触发初始化事件
    this._eventEmitter.emit('manager:initialized', { config })
  }

  /**
   * 链式配置 API - 设置权限
   */
  withPermissions(permissions: CRUDPermissions): this {
    this.config.permissions = permissions
    this._permissionManager = new CRUDPermissionManager(permissions)
    this._eventEmitter.emit('permissions:configured', { permissions })
    return this
  }

  /**
   * 链式配置 API - 设置 Schema
   */
  withSchema(schema: SchemaIntegration): this {
    this.config.schema = schema
    this._schemaAdapter = new CRUDSchemaAdapter(schema)
    this._eventEmitter.emit('schema:configured', { schema })
    return this
  }

  /**
   * 链式配置 API - 设置数据源
   */
  withDataSource(dataSource: DataSource<T>): this {
    this.config.dataSource = dataSource
    this._operations = new CRUDOperationsImpl<T>(
      dataSource,
      this._eventEmitter,
      this._stateManager
    )
    this._eventEmitter.emit('dataSource:configured', { dataSource })
    return this
  }

  /**
   * 链式配置 API - 设置验证
   */
  withValidation(validation: ValidationConfig): this {
    this.config.validation = validation
    this._eventEmitter.emit('validation:configured', { validation })
    return this
  }

  /**
   * 链式配置 API - 设置缓存
   */
  withCache(cache: CacheConfig): this {
    this.config.cache = cache
    this._eventEmitter.emit('cache:configured', { cache })
    return this
  }

  /**
   * 链式配置 API - 添加插件
   */
  withPlugin(plugin: PluginConfig): this {
    if (!this.config.plugins) {
      this.config.plugins = []
    }
    this.config.plugins.push(plugin)
    this.loadPlugin(plugin)
    return this
  }

  /**
   * 获取 CRUD 操作接口
   */
  operations(): CRUDOperations<T> {
    return this._operations
  }

  /**
   * 获取权限管理器
   */
  permissions(): CRUDPermissionManager | null {
    return this._permissionManager
  }

  /**
   * 获取 Schema 适配器
   */
  schema(): CRUDSchemaAdapter | null {
    return this._schemaAdapter
  }

  /**
   * 获取状态管理器
   */
  state(): CRUDStateManager<T> {
    return this._stateManager
  }

  /**
   * 获取当前状态
   */
  getState(): CRUDState<T> {
    return this._stateManager.getState()
  }

  /**
   * 获取状态操作
   */
  actions(): CRUDStateActions<T> {
    return this._stateManager.actions
  }

  /**
   * 事件监听
   */
  on<K extends keyof CRUDEvents<T>>(
    event: K,
    handler: (data: CRUDEvents<T>[K]) => void
  ): void {
    this._eventEmitter.on(event as any, handler as any)
  }

  /**
   * 一次性事件监听
   */
  once<K extends keyof CRUDEvents<T>>(
    event: K,
    handler: (data: CRUDEvents<T>[K]) => void
  ): void {
    this._eventEmitter.once(event as any, handler as any)
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof CRUDEvents<T>>(
    event: K,
    handler?: (data: CRUDEvents<T>[K]) => void
  ): void {
    this._eventEmitter.off(event as any, handler as any)
  }

  /**
   * 发射事件
   */
  emit<K extends keyof CRUDEvents<T>>(event: K, data: CRUDEvents<T>[K]): void {
    this._eventEmitter.emit(event, data)
  }

  /**
   * 获取配置
   */
  getConfig(): CRUDConfig<T> {
    return { ...this.config }
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): any {
    return this._plugins.get(name)
  }

  /**
   * 获取所有插件
   */
  getPlugins(): Map<string, any> {
    return new Map(this._plugins)
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    // 触发销毁前事件
    this._eventEmitter.emit('manager:destroying', {})
    
    // 卸载插件
    for (const [name, plugin] of this._plugins) {
      if (plugin.destroy) {
        await plugin.destroy()
      }
      this._eventEmitter.emit('plugin:unloaded', { name })
    }
    this._plugins.clear()
    
    // 清理状态
    this._stateManager.reset()
    
    // 移除所有事件监听器
    this._eventEmitter.removeAllListeners()
    
    // 触发销毁完成事件
    this._eventEmitter.emit('manager:destroyed', {})
  }

  /**
   * 加载插件
   */
  private loadPlugins(plugins: PluginConfig[]): void {
    for (const pluginConfig of plugins) {
      this.loadPlugin(pluginConfig)
    }
  }

  /**
   * 加载单个插件
   */
  private loadPlugin(pluginConfig: PluginConfig): void {
    try {
      const { name, plugin, options, enabled = true } = pluginConfig
      
      if (!enabled) {
        return
      }
      
      // 初始化插件
      if (plugin.init) {
        plugin.init(this, options)
      }
      
      // 扩展操作
      if (plugin.extendOperations) {
        this._operations = plugin.extendOperations(this._operations)
      }
      
      // 扩展权限
      if (plugin.extendPermissions && this._permissionManager) {
        const extendedPermissions = plugin.extendPermissions(this.config.permissions!)
        this._permissionManager = new CRUDPermissionManager(extendedPermissions)
      }
      
      // 扩展事件
      if (plugin.extendEvents) {
        const extendedEvents = plugin.extendEvents({})
        for (const [event, handler] of Object.entries(extendedEvents)) {
          if (handler) {
            this._eventEmitter.on(event as any, handler as any)
          }
        }
      }
      
      // 存储插件实例
      this._plugins.set(name, plugin)
      
      this._eventEmitter.emit('plugin:loaded', { name, version: plugin.version })
    } catch (error) {
      this._eventEmitter.emit('plugin:error', { 
        name: pluginConfig.name, 
        error: error as Error 
      })
      
      if (this.config.debug) {
        console.error(`Failed to load plugin ${pluginConfig.name}:`, error)
      }
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听配置变更事件
    if (this.config.events?.listeners) {
      for (const [event, handler] of Object.entries(this.config.events.listeners)) {
        if (handler) {
          this._eventEmitter.on(event as any, handler as any)
        }
      }
    }
    
    // 错误处理
    if (this.config.events?.errorHandler) {
      this._eventEmitter.on('error' as any, (error: any) => {
        this.config.events!.errorHandler!(error.error, error.event || 'unknown')
      })
    }
  }
}
