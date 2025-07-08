/**
 * 简化多租户配置管理器
 * @description 为LinchKit提供基础的多租户配置隔离
 * @module config/simple-tenant-manager
 * @since 0.1.0
 */

import { LRUCache } from 'lru-cache'
import { EventEmitter } from 'eventemitter3'

import type { ConfigSource, ConfigValue, TenantContext } from '../types'
import { useTranslation } from '../i18n'
import type { TranslationFunction } from '../i18n'

/**
 * 配置值类型（缓存专用，排除undefined和null）
 */
type CacheableConfigValue = Exclude<ConfigValue, undefined | null>

/**
 * 租户配置选项
 */
export interface TenantConfigOptions {
  /** 租户ID */
  tenantId: string
  /** 初始配置数据 */
  initialConfig?: Record<string, ConfigValue>
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
  config: Map<string, ConfigValue>
  /** 配置缓存 */
  cache: LRUCache<string, CacheableConfigValue>
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
 * 简化多租户配置管理器
 * @description 基于Map和LRU-Cache的多租户配置管理器
 */
export class SimpleTenantConfigManager extends EventEmitter {
  private tenants = new Map<string, TenantConfig>()
  private globalConfig = new Map<string, ConfigValue>()
  private globalCache: LRUCache<string, CacheableConfigValue>
  private t: TranslationFunction

  constructor(options?: { cacheOptions?: { max: number; ttl: number }; t?: TranslationFunction }) {
    super()

    this.t = options?.t || useTranslation()

    // 初始化全局缓存
    const cacheOptions = options?.cacheOptions || { max: 1000, ttl: 1000 * 60 * 60 } // 1小时TTL
    this.globalCache = new LRUCache<string, CacheableConfigValue>(cacheOptions)
  }

  /**
   * 创建租户配置
   * @param options 租户配置选项
   */
  async createTenant(options: TenantConfigOptions): Promise<void> {
    const { tenantId, initialConfig = {}, cacheOptions } = options

    if (this.tenants.has(tenantId)) {
      throw new Error(this.t('config.tenant.exists', { tenantId }))
    }

    // 创建租户专用配置Map
    const config = new Map<string, ConfigValue>()

    // 加载初始配置
    for (const [key, value] of Object.entries(initialConfig)) {
      config.set(key, value)
    }

    // 创建租户专用缓存
    const cache = new LRUCache<string, CacheableConfigValue>(
      cacheOptions || { max: 500, ttl: 1000 * 60 * 30 } // 30分钟TTL
    )

    // 存储租户配置
    const tenantConfig: TenantConfig = {
      tenantId,
      config,
      cache,
      lastUpdated: new Date(),
      version: 1,
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
   */
  getTenants(): string[] {
    return Array.from(this.tenants.keys())
  }

  /**
   * 检查租户是否存在
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
  get<T = unknown>(key: string, defaultValue?: T, context?: TenantContext): T {
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
  private getTenantConfig<T = unknown>(tenantId: string, key: string, defaultValue?: T): T {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(this.t('config.tenant.not.found', { tenantId }))
    }

    // 尝试从缓存获取
    const cacheKey = `${tenantId}:${key}`
    const cached = tenant.cache.get(cacheKey)
    if (cached !== undefined) {
      return cached as T
    }

    // 从配置Map获取
    const value = tenant.config.get(key)
    if (value !== undefined) {
      // 缓存结果（只缓存非undefined和非null值）
      if (value !== null) {
        tenant.cache.set(cacheKey, value as CacheableConfigValue)
      }
      return value as T
    }

    return defaultValue as T
  }

  /**
   * 设置租户配置
   * @private
   */
  private setTenantConfig(tenantId: string, key: string, value: ConfigValue): void {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(this.t('config.tenant.not.found', { tenantId }))
    }

    // 更新配置
    tenant.config.set(key, value)

    // 更新缓存（只缓存非undefined和非null值）
    const cacheKey = `${tenantId}:${key}`
    if (value !== undefined && value !== null) {
      tenant.cache.set(cacheKey, value as CacheableConfigValue)
    }

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
    const value = this.globalConfig.get(key)
    if (value !== undefined) {
      // 缓存结果（只缓存非undefined和非null值）
      if (value !== null) {
        this.globalCache.set(key, value as CacheableConfigValue)
      }
      return value as T
    }

    return defaultValue as T
  }

  /**
   * 设置全局配置
   * @private
   */
  private setGlobalConfig(key: string, value: ConfigValue): void {
    // 更新配置
    this.globalConfig.set(key, value)

    // 更新缓存（只缓存非undefined和非null值）
    if (value !== undefined && value !== null) {
      this.globalCache.set(key, value as CacheableConfigValue)
    }
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
        for (const [key, value] of Object.entries(data)) {
          tenant.config.set(key, value)
        }
        tenant.cache.clear() // 清除缓存
        tenant.lastUpdated = new Date()
        tenant.version += 1

        this.emit('tenant:updated', {
          tenantId: context.tenantId,
          version: tenant.version,
        })
      }
    } else {
      // 加载到全局配置
      for (const [key, value] of Object.entries(data)) {
        this.globalConfig.set(key, value)
      }
      this.globalCache.clear() // 清除缓存
    }
  }

  /**
   * 从配置源加载数据
   * @private
   */
  private async loadFromSource(source: ConfigSource): Promise<Record<string, ConfigValue>> {
    // 处理不同类型的配置源
    switch (source.type) {
      case 'object':
        return (source as { data?: Record<string, ConfigValue> }).data || {}
      case 'env':
        return process.env as Record<string, ConfigValue>
      case 'file':
        // 文件类型需要具体实现
        throw new Error(this.t('config.source.file.not.implemented'))
      case 'remote':
        // 远程类型需要具体实现
        throw new Error(this.t('config.source.remote.not.implemented'))
      default:
        throw new Error(this.t('config.source.unsupported', { type: source.type }))
    }
  }

  /**
   * 获取租户配置信息
   * @param tenantId 租户ID
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
   * 检查配置是否存在
   */
  has(key: string, context?: TenantContext): boolean {
    if (context?.tenantId) {
      const tenant = this.tenants.get(context.tenantId)
      return tenant?.config.has(key) || false
    }
    return this.globalConfig.has(key)
  }
}

/**
 * 创建简化多租户配置管理器
 * @param options 配置选项
 * @returns 多租户配置管理器实例
 * @example
 * ```typescript
 * import { createSimpleTenantConfigManager } from '@linch-kit/core'
 *
 * const configManager = createSimpleTenantConfigManager()
 *
 * // 创建租户
 * await configManager.createTenant({
 *   tenantId: 'tenant1',
 *   initialConfig: { port: 3000 }
 * })
 *
 * // 获取租户配置
 * const port = configManager.get('port', 3000, { tenantId: 'tenant1' })
 * ```
 * @since 0.1.0
 */
export function createSimpleTenantConfigManager(options?: {
  cacheOptions?: { max: number; ttl: number }
  t?: TranslationFunction
}): SimpleTenantConfigManager {
  return new SimpleTenantConfigManager(options)
}
