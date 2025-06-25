/**
 * 多租户配置管理器
 * @description 为LinchKit提供多租户配置隔离和管理
 * @module config/tenant-manager
 * @since 0.1.0
 */

import { LRUCache } from 'lru-cache'
import convict from 'convict'
import { EventEmitter } from 'eventemitter3'

// LRUCache value type for ConfigValue
type CacheValue = NonNullable<ConfigValue> | {}

import type { 
  ConfigManager as IConfigManager,
  ConfigSource,
  ConfigValue,
  TenantContext
} from '../types'
import { useTranslation } from '../i18n'
import type { TranslationFunction } from '../i18n'

/**
 * 租户配置选项
 */
export interface TenantConfigOptions {
  /** 租户ID */
  tenantId: string
  /** 配置Schema */
  schema?: convict.Config<unknown>
  /** 配置源列表 */
  sources?: ConfigSource[]
  /** 缓存选项 */
  cacheOptions?: {
    max: number
    ttl: number
  }
}

/**
 * 租户配置实例
 */
export interface TenantConfig {
  /** 租户ID */
  tenantId: string
  /** 配置数据 */
  config: convict.Config<unknown>
  /** 配置缓存 */
  cache: LRUCache<string, CacheValue>
  /** 最后更新时间 */
  lastUpdated: Date
  /** 配置版本 */
  version: number
}

/**
 * 多租户配置事件
 */
export interface TenantConfigEvents {
  'tenant:created': { tenantId: string }
  'tenant:updated': { tenantId: string; version: number }
  'tenant:deleted': { tenantId: string }
  'config:tenant:changed': { tenantId: string; key: string; value: ConfigValue }
  'config:tenant:error': { tenantId: string; error: string }
}

/**
 * 多租户配置管理器
 * @description 基于convict和lru-cache的多租户配置管理，支持配置隔离和验证
 */
export class TenantConfigManager extends EventEmitter implements IConfigManager {
  private tenants = new Map<string, TenantConfig>()
  private globalConfig: convict.Config<unknown>
  private globalCache: LRUCache<string, CacheValue>
  private t: TranslationFunction

  constructor(options?: {
    globalSchema?: convict.Config<unknown>
    cacheOptions?: { max: number; ttl: number }
    t?: TranslationFunction
  }) {
    super()
    
    this.t = options?.t || useTranslation()
    
    // 初始化全局配置
    this.globalConfig = options?.globalSchema || convict({})
    
    // 初始化全局缓存
    const cacheOptions = options?.cacheOptions || { max: 1000, ttl: 1000 * 60 * 60 } // 1小时TTL
    this.globalCache = new LRUCache<string, CacheValue>(cacheOptions)
  }

  /**
   * 创建租户配置
   * @description 为指定租户创建独立的配置实例
   * @param options 租户配置选项
   */
  async createTenant(options: TenantConfigOptions): Promise<void> {
    const { tenantId, schema, sources = [], cacheOptions } = options

    if (this.tenants.has(tenantId)) {
      throw new Error(
        this.t('config.tenant.exists', { tenantId })
      )
    }

    // 创建租户专用配置实例
    const config = schema || convict({})
    
    // 创建租户专用缓存
    const cache = new LRUCache<string, CacheValue>(
      cacheOptions || { max: 500, ttl: 1000 * 60 * 30 } // 30分钟TTL
    )

    // 加载配置源
    for (const source of sources) {
      try {
        const data = await this.loadFromSource(source)
        config.load(data)
      } catch (error) {
        this.emit('config:tenant:error', {
          tenantId,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // 验证配置
    try {
      config.validate({ allowed: 'strict' })
    } catch (error) {
      throw new Error(
        this.t('config.tenant.validate.error', { 
          tenantId, 
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }

    // 存储租户配置
    const tenantConfig: TenantConfig = {
      tenantId,
      config,
      cache,
      lastUpdated: new Date(),
      version: 1
    }

    this.tenants.set(tenantId, tenantConfig)
    this.emit('tenant:created', { tenantId })
  }

  /**
   * 删除租户配置
   * @param tenantId 租户ID
   */
  deleteTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      return false
    }

    // 清理缓存
    tenant.cache.clear()
    
    // 删除租户
    this.tenants.delete(tenantId)
    this.emit('tenant:deleted', { tenantId })
    
    return true
  }

  /**
   * 获取租户列表
   * @returns 租户ID列表
   */
  getTenants(): string[] {
    return Array.from(this.tenants.keys())
  }

  /**
   * 检查租户是否存在
   * @param tenantId 租户ID
   */
  hasTenant(tenantId: string): boolean {
    return this.tenants.has(tenantId)
  }

  /**
   * 获取配置值 (多租户版本)
   * @param key 配置键
   * @param defaultValue 默认值
   * @param context 租户上下文
   */
  get<T = unknown>(
    key: string, 
    defaultValue?: T,
    context?: TenantContext
  ): T {
    const tenantId = context?.tenantId

    if (tenantId) {
      return this.getTenantConfig(tenantId, key, defaultValue)
    }

    // 使用全局配置
    return this.getGlobalConfig(key, defaultValue)
  }

  /**
   * 设置配置值 (多租户版本)
   * @param key 配置键
   * @param value 配置值
   * @param context 租户上下文
   */
  set(key: string, value: ConfigValue, context?: TenantContext): void {
    const tenantId = context?.tenantId

    if (tenantId) {
      this.setTenantConfig(tenantId, key, value)
    } else {
      this.setGlobalConfig(key, value)
    }
  }

  /**
   * 获取租户配置
   * @private
   */
  private getTenantConfig<T = unknown>(
    tenantId: string, 
    key: string, 
    defaultValue?: T
  ): T {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(
        this.t('config.tenant.not.found', { tenantId })
      )
    }

    // 尝试从缓存获取
    const cacheKey = `${tenantId}:${key}`
    const cached = tenant.cache.get(cacheKey)
    if (cached !== undefined) {
      return cached as T
    }

    // 从配置实例获取
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (tenant.config as any).get(key) as ConfigValue | null
      
      // 缓存结果
      tenant.cache.set(cacheKey, (value ?? {}) as CacheValue)
      
      return (value ?? defaultValue) as T
    } catch {
      return defaultValue as T
    }
  }

  /**
   * 设置租户配置
   * @private
   */
  private setTenantConfig(tenantId: string, key: string, value: ConfigValue): void {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(
        this.t('config.tenant.not.found', { tenantId })
      )
    }

    // 更新配置
    tenant.config.set(key, value)
    
    // 更新缓存
    const cacheKey = `${tenantId}:${key}`
    tenant.cache.set(cacheKey, (value ?? {}) as CacheValue)
    
    // 更新元数据
    tenant.lastUpdated = new Date()
    tenant.version += 1

    this.emit('config:tenant:changed', { tenantId, key, value })
    this.emit('tenant:updated', { tenantId, version: tenant.version })
  }

  /**
   * 获取全局配置
   * @private
   */
  private getGlobalConfig<T = unknown>(key: string, defaultValue?: T): T {
    // 尝试从缓存获取
    const cached = this.globalCache.get(key)
    if (cached !== undefined) {
      return cached as T
    }

    // 从全局配置获取
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (this.globalConfig as any).get(key) as ConfigValue | null
      
      // 缓存结果
      this.globalCache.set(key, (value ?? {}) as CacheValue)
      
      return (value ?? defaultValue) as T
    } catch {
      return defaultValue as T
    }
  }

  /**
   * 设置全局配置
   * @private
   */
  private setGlobalConfig(key: string, value: ConfigValue): void {
    // 更新配置
    this.globalConfig.set(key, value)
    
    // 更新缓存
    this.globalCache.set(key, (value ?? {}) as CacheValue)
  }

  /**
   * 加载配置源 (支持多租户)
   * @param source 配置源
   * @param context 租户上下文
   */
  async loadConfig(source: ConfigSource, context?: TenantContext): Promise<void> {
    const data = await this.loadFromSource(source)
    
    if (context?.tenantId) {
      // 加载到租户配置
      const tenant = this.tenants.get(context.tenantId)
      if (tenant) {
        tenant.config.load(data)
        tenant.cache.clear() // 清除缓存
        tenant.lastUpdated = new Date()
        tenant.version += 1
        
        this.emit('tenant:updated', { 
          tenantId: context.tenantId, 
          version: tenant.version 
        })
      }
    } else {
      // 加载到全局配置
      this.globalConfig.load(data)
      this.globalCache.clear() // 清除缓存
    }
  }

  /**
   * 从配置源加载数据
   * @private
   */
  private async loadFromSource(source: ConfigSource): Promise<Record<string, ConfigValue>> {
    if ('load' in source && typeof source.load === 'function') {
      return await source.load()
    }

    // 处理不同类型的配置源
    switch (source.type) {
      case 'object':
        return (source as { data?: Record<string, ConfigValue> }).data || {}
      case 'env':
        return process.env as Record<string, ConfigValue>
      default:
        throw new Error(
          this.t('config.source.unsupported', { type: source.type })
        )
    }
  }

  /**
   * 获取租户配置信息
   * @param tenantId 租户ID
   * @returns 租户配置信息
   */
  getTenantInfo(tenantId: string): TenantConfig | undefined {
    return this.tenants.get(tenantId)
  }

  /**
   * 清除租户缓存
   * @param tenantId 租户ID，不指定则清除所有
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      const tenant = this.tenants.get(tenantId)
      tenant?.cache.clear()
    } else {
      // 清除所有缓存
      this.globalCache.clear()
      for (const tenant of this.tenants.values()) {
        tenant.cache.clear()
      }
    }
  }

  /**
   * 验证租户配置
   * @param tenantId 租户ID
   * @returns 验证结果
   */
  validateTenant(tenantId: string): { valid: boolean; errors: string[] } {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      return {
        valid: false,
        errors: [this.t('config.tenant.not.found', { tenantId })]
      }
    }

    try {
      tenant.config.validate({ allowed: 'strict' })
      return { valid: true, errors: [] }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  // 为了兼容现有接口，实现这些方法但建议使用带context的版本
  
  /**
   * @deprecated 使用 get(key, defaultValue, context) 替代
   */
  has(key: string): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (this.globalConfig as any).get(key)
      return value !== null && value !== undefined
    } catch {
      return false
    }
  }

  /**
   * @deprecated 使用支持租户上下文的方法
   */
  watch(): () => void {
    console.warn('TenantConfigManager.watch() is deprecated, use tenant-specific watching')
    return () => {}
  }

  /**
   * @deprecated 使用支持租户上下文的方法
   */
  unwatch(): void {
    console.warn('TenantConfigManager.unwatch() is deprecated, use tenant-specific watching')
  }

  /**
   * 删除配置 (全局配置)
   */
  delete(key: string): boolean {
    try {
      // 从全局配置中删除
      this.globalConfig.set(key, undefined)
      this.globalCache.delete(key)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取所有配置 (全局配置)
   */
  getAll(): Record<string, ConfigValue> {
    try {
      // 获取全局配置的所有值
      const config = this.globalConfig.getProperties()
      return config as Record<string, ConfigValue>
    } catch {
      return {}
    }
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<void> {
    // 重新加载全局配置
    this.globalCache.clear()
    
    // 重新加载所有租户配置
    for (const tenant of this.tenants.values()) {
      tenant.cache.clear()
      tenant.version += 1
      tenant.lastUpdated = new Date()
    }
  }

  /**
   * 清除所有配置
   */
  clear(): void {
    // 清除全局配置
    this.globalCache.clear()
    
    // 清除所有租户配置
    for (const tenant of this.tenants.values()) {
      tenant.cache.clear()
    }
    
    // 清除租户映射
    this.tenants.clear()
  }
}

/**
 * 创建多租户配置管理器
 * @description 创建支持多租户隔离的配置管理器
 * @param options 配置选项
 * @returns 多租户配置管理器实例
 * @example
 * ```typescript
 * import { createTenantConfigManager } from '@linch-kit/core'
 * 
 * const configManager = createTenantConfigManager()
 * 
 * // 创建租户
 * await configManager.createTenant({
 *   tenantId: 'tenant1',
 *   schema: convict({
 *     port: { format: 'port', default: 3000 }
 *   })
 * })
 * 
 * // 获取租户配置
 * const port = configManager.get('port', 3000, { tenantId: 'tenant1' })
 * ```
 * @since 0.1.0
 */
export function createTenantConfigManager(options?: {
  globalSchema?: convict.Config<unknown>
  cacheOptions?: { max: number; ttl: number }
  t?: TranslationFunction
}): TenantConfigManager {
  return new TenantConfigManager(options)
}