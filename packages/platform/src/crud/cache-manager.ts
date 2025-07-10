/**
 * Cache Manager for platform package
 * @module platform/crud/cache-manager
 */

import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 缓存项
 */
export interface CacheItem<T = unknown> {
  key: string
  value: T
  expiresAt: number
  tags?: string[]
  metadata?: Record<string, unknown>
}

/**
 * 缓存选项
 */
export interface CacheOptions {
  ttl?: number // 生存时间（秒）
  tags?: string[]
  metadata?: Record<string, unknown>
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  hitRate: number
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private cache = new Map<string, CacheItem>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  }
  private defaultTTL = 300 // 5分钟
  private maxSize = 1000
  private cleanupInterval: Timer | null = null
  private extensionContext?: ExtensionContext

  constructor(
    options: { defaultTTL?: number; maxSize?: number } = {},
    extensionContext?: ExtensionContext
  ) {
    this.defaultTTL = options.defaultTTL || 300
    this.maxSize = options.maxSize || 1000
    this.extensionContext = extensionContext

    // 启动定期清理
    this.startCleanup()
  }

  /**
   * 设置缓存项
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.defaultTTL
    const expiresAt = Date.now() + ttl * 1000

    const item: CacheItem<T> = {
      key,
      value,
      expiresAt,
      tags: options.tags,
      metadata: options.metadata,
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest()
    }

    this.cache.set(key, item)
    this.stats.sets++
    this.stats.size = this.cache.size
    this.updateHitRate()

    this.extensionContext?.logger.info(`Cache set: ${key}`, { ttl, tags: options.tags })
    this.extensionContext?.events.emit('cache:set', { key, value, options })
  }

  /**
   * 获取缓存项
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined

    if (!item) {
      this.stats.misses++
      this.updateHitRate()
      this.extensionContext?.events.emit('cache:miss', { key })
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      this.stats.deletes++
      this.stats.misses++
      this.stats.size = this.cache.size
      this.updateHitRate()
      this.extensionContext?.events.emit('cache:expired', { key })
      return null
    }

    this.stats.hits++
    this.updateHitRate()
    this.extensionContext?.events.emit('cache:hit', { key, value: item.value })
    return item.value
  }

  /**
   * 检查缓存项是否存在
   */
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    if (!item) {
      return false
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      this.stats.deletes++
      this.stats.size = this.cache.size
      return false
    }

    return true
  }

  /**
   * 删除缓存项
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
      this.stats.size = this.cache.size
      this.extensionContext?.logger.info(`Cache deleted: ${key}`)
      this.extensionContext?.events.emit('cache:delete', { key })
    }
    return deleted
  }

  /**
   * 根据标签删除缓存项
   */
  async deleteByTag(tag: string): Promise<number> {
    let deletedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (item.tags && item.tags.includes(tag)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.stats.deletes += deletedCount
      this.stats.size = this.cache.size
      this.extensionContext?.logger.info(`Cache deleted by tag: ${tag}`, { count: deletedCount })
      this.extensionContext?.events.emit('cache:deleteByTag', { tag, count: deletedCount })
    }

    return deletedCount
  }

  /**
   * 根据模式删除缓存项
   */
  async deleteByPattern(pattern: string | RegExp): Promise<number> {
    let deletedCount = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.stats.deletes += deletedCount
      this.stats.size = this.cache.size
      this.extensionContext?.logger.info(`Cache deleted by pattern: ${pattern}`, {
        count: deletedCount,
      })
      this.extensionContext?.events.emit('cache:deleteByPattern', { pattern, count: deletedCount })
    }

    return deletedCount
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    const size = this.cache.size
    this.cache.clear()
    this.stats.deletes += size
    this.stats.size = 0
    this.extensionContext?.logger.info('Cache cleared', { deletedCount: size })
    this.extensionContext?.events.emit('cache:clear', { deletedCount: size })
  }

  /**
   * 获取或设置缓存（如果不存在则创建）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  /**
   * 批量获取缓存项
   */
  async getMany<T>(keys: string[]): Promise<Array<T | null>> {
    return Promise.all(keys.map(key => this.get<T>(key)))
  }

  /**
   * 批量设置缓存项
   */
  async setMany<T>(items: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    await Promise.all(items.map(item => this.set(item.key, item.value, item.options)))
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: this.cache.size,
      hitRate: 0,
    }
  }

  /**
   * 获取所有缓存键
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有缓存项
   */
  getAll(): Array<CacheItem> {
    return Array.from(this.cache.values())
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * 驱逐最老的缓存项
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < oldestTime) {
        oldestTime = item.expiresAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.deletes++
      this.extensionContext?.logger.info(`Cache evicted oldest: ${oldestKey}`)
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // 每分钟清理一次
  }

  /**
   * 清理过期的缓存项
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.stats.deletes += cleanedCount
      this.stats.size = this.cache.size
      this.extensionContext?.logger.info(`Cache cleanup completed`, { cleanedCount })
    }
  }

  /**
   * 停止清理定时器
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanup()
    this.clear()
  }
}

/**
 * 创建缓存管理器的便捷函数
 */
export function createCacheManager(
  options: { defaultTTL?: number; maxSize?: number } = {},
  extensionContext?: ExtensionContext
): CacheManager {
  return new CacheManager(options, extensionContext)
}
