/**
 * 基础 CRUD 插件类
 */

import type { Logger } from '../types'

import type { CrudPlugin, CrudPluginHooks, PluginMetadata } from './types'

/**
 * 基础 CRUD 插件
 */
export abstract class BaseCrudPlugin implements CrudPlugin {
  public readonly name: string
  public readonly version: string
  public readonly description?: string
  public readonly dependencies?: string[]

  protected logger?: Logger
  protected config: Record<string, unknown> = {}
  protected initialized = false

  constructor(metadata: Pick<PluginMetadata, 'name' | 'version' | 'description' | 'dependencies'>) {
    this.name = metadata.name
    this.version = metadata.version
    this.description = metadata.description
    this.dependencies = metadata.dependencies ? Object.keys(metadata.dependencies) : undefined
  }

  /**
   * 插件钩子 - 由子类实现
   */
  abstract get hooks(): CrudPluginHooks

  /**
   * 设置日志器
   */
  setLogger(logger: Logger): this {
    this.logger = logger
    return this
  }

  /**
   * 插件初始化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger?.warn(`Plugin ${this.name} is already initialized`)
      return
    }

    try {
      await this.onInitialize()
      this.initialized = true
      this.logger?.info(`Plugin ${this.name} v${this.version} initialized successfully`)
    } catch (error) {
      this.logger?.error(`Failed to initialize plugin ${this.name}`, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 插件销毁
   */
  async destroy(): Promise<void> {
    if (!this.initialized) {
      return
    }

    try {
      await this.onDestroy()
      this.initialized = false
      this.logger?.info(`Plugin ${this.name} destroyed successfully`)
    } catch (error) {
      this.logger?.error(`Failed to destroy plugin ${this.name}`, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 插件配置
   */
  async configure(config: Record<string, unknown>): Promise<void> {
    try {
      this.config = { ...this.config, ...config }
      await this.onConfigure(this.config)
      this.logger?.debug(`Plugin ${this.name} configured`, { config: this.config })
    } catch (error) {
      this.logger?.error(`Failed to configure plugin ${this.name}`, error instanceof Error ? error : new Error(String(error)), { config })
      throw error
    }
  }

  /**
   * 获取插件配置
   */
  getConfig<T = Record<string, unknown>>(): T {
    return this.config as T
  }

  /**
   * 检查插件是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取插件元数据
   */
  getMetadata(): PluginMetadata {
    return {
      id: this.name,
      name: this.name,
      version: this.version,
      description: this.description,
      dependencies: this.dependencies?.reduce((acc, dep) => {
        acc[dep] = '*'
        return acc
      }, {} as Record<string, string>)
    }
  }

  // 生命周期钩子 - 由子类重写

  /**
   * 初始化时调用
   */
  protected async onInitialize(): Promise<void> {
    // 子类可以重写此方法
  }

  /**
   * 销毁时调用
   */
  protected async onDestroy(): Promise<void> {
    // 子类可以重写此方法
  }

  /**
   * 配置时调用
   */
  protected async onConfigure(_config: Record<string, unknown>): Promise<void> {
    // 子类可以重写此方法
  }

  // 辅助方法

  /**
   * 记录日志
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (!this.logger) return

    const logMeta = {
      plugin: this.name,
      version: this.version,
      ...meta
    }

    if (level === 'error') {
      // error level expects (message, error?, data?)
      this.logger.error(message, undefined, logMeta)
    } else {
      // other levels expect (message, data?)
      this.logger[level](message, logMeta)
    }
  }

  /**
   * 验证配置
   */
  protected validateConfig(config: Record<string, unknown>, requiredKeys: string[]): void {
    const missingKeys = requiredKeys.filter(key => !(key in config))
    
    if (missingKeys.length > 0) {
      throw new Error(`Plugin ${this.name} missing required configuration keys: ${missingKeys.join(', ')}`)
    }
  }

  /**
   * 检查依赖
   */
  protected checkDependencies(availablePlugins: string[]): void {
    if (!this.dependencies || this.dependencies.length === 0) {
      return
    }

    const missingDependencies = this.dependencies.filter(dep => !availablePlugins.includes(dep))
    
    if (missingDependencies.length > 0) {
      throw new Error(`Plugin ${this.name} missing required dependencies: ${missingDependencies.join(', ')}`)
    }
  }
}