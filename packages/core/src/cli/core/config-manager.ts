/**
 * @ai-context CLI 配置管理器核心系统
 * @ai-purpose 统一管理 CLI 配置，支持动态注册和多源合并
 * @ai-pattern Configuration Provider + Dynamic Registration + Schema Validation
 * @ai-extensible 支持插件动态注册配置字段和验证规则
 * @ai-dependencies @linch-kit/config, zod
 */

import { z } from 'zod'

import type { CLIConfig } from '../../types/cli'

/**
 * @ai-interface 配置提供者接口
 * @ai-purpose 定义配置源的标准接口，支持多种配置来源
 * @ai-extensible 插件可以实现此接口提供自定义配置源
 */
export interface ConfigProvider {
  /** @ai-field 提供者名称，用于标识和调试 */
  name: string
  
  /** @ai-field 提供者优先级，数字越大优先级越高 */
  priority: number
  
  /**
   * @ai-method 加载配置
   * @ai-purpose 从特定源加载配置数据
   * @ai-return Promise<any> - 配置对象
   */
  load(): Promise<any>
  
  /**
   * @ai-method 监听配置变更
   * @ai-purpose 监听配置源的变更，支持热重载
   * @ai-parameter callback: (config: any) => void - 变更回调
   * @ai-optional 可选实现
   */
  watch?(callback: (config: any) => void): void
}

/**
 * @ai-interface 配置 Schema 注册项
 * @ai-purpose 描述动态注册的配置 Schema
 */
export interface ConfigSchemaRegistration {
  /** @ai-field Schema 名称，用于命名空间 */
  name: string
  
  /** @ai-field Zod Schema 定义 */
  schema: z.ZodSchema
  
  /** @ai-field 默认配置值 */
  defaults?: any
  
  /** @ai-field Schema 描述 */
  description?: string
  
  /** @ai-field 注册来源（包名） */
  source?: string
}

/**
 * @ai-class CLI 配置管理器
 * @ai-purpose 统一管理所有 CLI 配置，支持动态注册和验证
 * @ai-singleton 全局唯一实例，确保配置的一致性
 * @ai-caching 缓存配置结果，支持热重载
 * @ai-validation 使用 Zod 进行配置验证
 */
export class ConfigManager {
  private static instance: ConfigManager
  private providers = new Map<string, ConfigProvider>()
  private schemas = new Map<string, ConfigSchemaRegistration>()
  private configCache: any = null
  private watchers: Array<(config: any) => void> = []

  /**
   * @ai-constructor 私有构造函数，实现单例模式
   */
  private constructor() {
    // AI: 注册默认的配置 Schema
    this.registerDefaultSchemas()
  }

  /**
   * @ai-method 获取配置管理器单例实例
   * @ai-pattern Singleton Factory
   * @ai-return ConfigManager - 全局唯一的配置管理器实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * @ai-method 注册配置提供者
   * @ai-purpose 添加新的配置源，支持插件扩展
   * @ai-parameter provider: ConfigProvider - 配置提供者实例
   * @ai-side-effects 修改提供者注册表，清空配置缓存
   * @ai-validation 验证提供者接口完整性
   */
  registerProvider(provider: ConfigProvider): void {
    // AI: 验证提供者接口
    if (!provider.name || typeof provider.load !== 'function') {
      throw new Error('AI: Invalid config provider. Must have name and load method.')
    }

    // AI: 检查重复注册
    if (this.providers.has(provider.name)) {
      console.warn(`AI: Config provider '${provider.name}' already registered, replacing...`)
    }

    // AI: 注册提供者
    this.providers.set(provider.name, provider)

    // AI: 设置变更监听
    if (provider.watch) {
      provider.watch((config) => {
        this.handleConfigChange(provider.name, config)
      })
    }

    // AI: 清空缓存，强制重新加载
    this.configCache = null

    console.log(`AI: Config provider '${provider.name}' registered with priority ${provider.priority}`)
  }

  /**
   * @ai-method 注册配置 Schema
   * @ai-purpose 动态注册配置验证 Schema，支持插件扩展配置
   * @ai-parameter registration: ConfigSchemaRegistration - Schema 注册信息
   * @ai-extensible 插件可以注册自己的配置 Schema
   * @ai-validation 验证 Schema 的有效性
   */
  registerSchema(registration: ConfigSchemaRegistration): void {
    // AI: 验证注册信息
    if (!registration.name || !registration.schema) {
      throw new Error('AI: Invalid schema registration. Must have name and schema.')
    }

    // AI: 检查重复注册
    if (this.schemas.has(registration.name)) {
      console.warn(`AI: Config schema '${registration.name}' already registered, replacing...`)
    }

    // AI: 注册 Schema
    this.schemas.set(registration.name, registration)

    // AI: 清空缓存，强制重新验证
    this.configCache = null

    console.log(`AI: Config schema '${registration.name}' registered from ${registration.source || 'unknown'}`)
  }

  /**
   * @ai-method 批量注册配置 Schema
   * @ai-purpose 一次性注册多个 Schema，常用于插件初始化
   * @ai-parameter registrations: ConfigSchemaRegistration[] - Schema 注册列表
   * @ai-error-handling 单个 Schema 注册失败不影响其他 Schema
   */
  registerSchemas(registrations: ConfigSchemaRegistration[]): void {
    const errors: string[] = []

    registrations.forEach(registration => {
      try {
        this.registerSchema(registration)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`AI: Failed to register schema '${registration.name}': ${message}`)
      }
    })

    if (errors.length > 0) {
      console.warn('AI: Some schemas failed to register:', errors)
    }
  }

  /**
   * @ai-method 加载和合并所有配置
   * @ai-purpose 从所有注册的提供者加载配置并合并
   * @ai-return Promise<any> - 合并后的配置对象
   * @ai-caching 缓存结果，避免重复加载
   * @ai-algorithm 按优先级排序 + 深度合并 + Schema 验证
   */
  async loadConfig(): Promise<any> {
    // AI: 检查缓存
    if (this.configCache) {
      return this.configCache
    }

    // AI: 按优先级排序提供者
    const sortedProviders = Array.from(this.providers.values())
      .sort((a, b) => a.priority - b.priority)

    // AI: 加载所有配置
    const configs: any[] = []
    for (const provider of sortedProviders) {
      try {
        const config = await provider.load()
        if (config) {
          configs.push(config)
        }
      } catch (error) {
        console.warn(`AI: Failed to load config from provider '${provider.name}':`, error)
      }
    }

    // AI: 合并配置
    const mergedConfig = this.mergeConfigs(configs)

    // AI: 应用默认值
    const configWithDefaults = this.applyDefaults(mergedConfig)

    // AI: 验证配置
    const validatedConfig = await this.validateConfig(configWithDefaults)

    // AI: 缓存结果
    this.configCache = validatedConfig

    return validatedConfig
  }

  /**
   * @ai-method 获取特定命名空间的配置
   * @ai-purpose 获取特定插件或模块的配置
   * @ai-parameter namespace: string - 配置命名空间
   * @ai-return Promise<any> - 命名空间配置
   * @ai-type-safety 返回类型安全的配置对象
   */
  async getConfig<T = any>(namespace?: string): Promise<T> {
    const fullConfig = await this.loadConfig()
    
    if (!namespace) {
      return fullConfig as T
    }

    return fullConfig[namespace] as T
  }

  /**
   * @ai-method 监听配置变更
   * @ai-purpose 注册配置变更回调，支持热重载
   * @ai-parameter callback: (config: any) => void - 变更回调函数
   * @ai-lifecycle 在配置变更时自动调用
   */
  onConfigChange(callback: (config: any) => void): void {
    this.watchers.push(callback)
  }

  /**
   * @ai-method 处理配置变更
   * @ai-purpose 响应配置源的变更事件
   * @ai-parameter providerName: string - 变更的提供者名称
   * @ai-parameter newConfig: any - 新的配置数据
   * @ai-side-effects 清空缓存，通知所有监听者
   */
  private async handleConfigChange(providerName: string, newConfig: any): Promise<void> {
    console.log(`AI: Config changed in provider '${providerName}'`)

    // AI: 清空缓存
    this.configCache = null

    try {
      // AI: 重新加载配置
      const updatedConfig = await this.loadConfig()

      // AI: 通知所有监听者
      this.watchers.forEach(callback => {
        try {
          callback(updatedConfig)
        } catch (error) {
          console.error('AI: Error in config change callback:', error)
        }
      })
    } catch (error) {
      console.error('AI: Failed to reload config after change:', error)
    }
  }

  /**
   * @ai-method 合并多个配置对象
   * @ai-purpose 深度合并配置，后面的配置覆盖前面的
   * @ai-parameter configs: any[] - 配置对象数组
   * @ai-return any - 合并后的配置对象
   * @ai-algorithm 递归深度合并，数组替换而非合并
   */
  private mergeConfigs(configs: any[]): any {
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config)
    }, {})
  }

  /**
   * @ai-method 深度合并两个对象
   * @ai-purpose 递归合并对象属性
   * @ai-parameter target: any - 目标对象
   * @ai-parameter source: any - 源对象
   * @ai-return any - 合并后的对象
   * @ai-algorithm 递归遍历，对象合并，数组替换
   */
  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') {
      return source
    }

    if (!target || typeof target !== 'object') {
      return source
    }

    const result = { ...target }

    Object.keys(source).forEach(key => {
      if (Array.isArray(source[key])) {
        // AI: 数组直接替换，不合并
        result[key] = [...source[key]]
      } else if (source[key] && typeof source[key] === 'object') {
        // AI: 递归合并对象
        result[key] = this.deepMerge(target[key], source[key])
      } else {
        // AI: 直接赋值
        result[key] = source[key]
      }
    })

    return result
  }

  /**
   * @ai-method 应用默认配置值
   * @ai-purpose 为缺失的配置项应用默认值
   * @ai-parameter config: any - 当前配置
   * @ai-return any - 应用默认值后的配置
   */
  private applyDefaults(config: any): any {
    const result = { ...config }

    this.schemas.forEach((registration, name) => {
      if (registration.defaults && !result[name]) {
        result[name] = { ...registration.defaults }
      }
    })

    return result
  }

  /**
   * @ai-method 验证配置
   * @ai-purpose 使用注册的 Schema 验证配置
   * @ai-parameter config: any - 待验证的配置
   * @ai-return Promise<any> - 验证后的配置
   * @ai-validation 使用 Zod Schema 进行严格验证
   * @ai-error-handling 验证失败提供详细错误信息
   */
  private async validateConfig(config: any): Promise<any> {
    const validatedConfig = { ...config }

    // AI: 逐个验证每个命名空间的配置
    for (const [name, registration] of this.schemas) {
      if (validatedConfig[name]) {
        try {
          validatedConfig[name] = registration.schema.parse(validatedConfig[name])
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error(`AI: Config validation failed for '${name}':`)
            error.errors.forEach(err => {
              console.error(`  - ${err.path.join('.')}: ${err.message}`)
            })
          }
          throw new Error(`AI: Invalid configuration for '${name}'`)
        }
      }
    }

    return validatedConfig
  }

  /**
   * @ai-method 注册默认配置 Schema
   * @ai-purpose 注册 CLI 系统的基础配置 Schema
   * @ai-lifecycle 在构造函数中调用
   */
  private registerDefaultSchemas(): void {
    // AI: CLI 基础配置 Schema
    this.registerSchema({
      name: 'cli',
      schema: z.object({
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
        verbose: z.boolean().default(false),
        silent: z.boolean().default(false),
        pluginDirs: z.array(z.string()).default([]),
        enabledPlugins: z.array(z.string()).default([]),
        disabledPlugins: z.array(z.string()).default([])
      }),
      defaults: {
        logLevel: 'info',
        verbose: false,
        silent: false,
        pluginDirs: [],
        enabledPlugins: [],
        disabledPlugins: []
      },
      description: 'CLI system configuration',
      source: '@linch-kit/cli'
    })
  }

  /**
   * @ai-method 获取已注册的 Schema 列表
   * @ai-purpose 提供调试和管理功能
   * @ai-return ConfigSchemaRegistration[] - 已注册的 Schema 列表
   */
  getRegisteredSchemas(): ConfigSchemaRegistration[] {
    return Array.from(this.schemas.values())
  }

  /**
   * @ai-method 获取已注册的提供者列表
   * @ai-purpose 提供调试和管理功能
   * @ai-return ConfigProvider[] - 已注册的提供者列表
   */
  getRegisteredProviders(): ConfigProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * @ai-method 清空缓存
   * @ai-purpose 强制重新加载配置，用于开发和调试
   * @ai-side-effects 清空配置缓存
   */
  clearCache(): void {
    this.configCache = null
  }
}
