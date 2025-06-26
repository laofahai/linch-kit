/**
 * 缓存管理器
 * 
 * 提供CRUD操作的缓存功能：
 * - 多级缓存策略
 * - TTL管理
 * - 缓存失效策略
 * - 分布式缓存支持
 */

import { LRUCache } from 'lru-cache';
import type { Logger } from '@linch-kit/core';
import type { Entity } from '@linch-kit/schema';
import type { 
  ICacheManager, 
  CacheOptions,
  CacheKey,
  CacheEntry,
  CacheStats
} from '../types';

/**
 * 缓存管理器实现
 */
export class CacheManager implements ICacheManager {
  private readonly logger: Logger;
  private readonly memoryCache: LRUCache<string, CacheEntry>;
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    writes: 0
  };

  constructor(logger: Logger, options?: CacheOptions) {
    this.logger = logger.child({ component: 'CacheManager' });
    
    // 初始化内存缓存
    this.memoryCache = new LRUCache<string, CacheEntry>({
      max: options?.maxSize || 1000,
      ttl: options?.defaultTTL || 1000 * 60 * 5, // 默认5分钟
      updateAgeOnGet: true,
      updateAgeOnHas: false,
      
      // 当项目被驱逐时
      dispose: (value, key) => {
        this.stats.evictions++;
        this.logger.debug('Cache entry evicted', { key });
      }
    });
  }

  /**
   * 从缓存获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.memoryCache.get(key);
      
      if (entry) {
        this.stats.hits++;
        this.logger.debug('Cache hit', { key });
        return entry.data as T;
      }
      
      this.stats.misses++;
      this.logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      this.logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * 批量获取缓存
   */
  async getMany<T>(keys: CacheKey[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(this.buildKey(key), value);
      }
    }
    
    return results;
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const entry: CacheEntry = {
        data: value,
        createdAt: Date.now(),
        entity: '',
        metadata: undefined
      };
      
      this.memoryCache.set(key, entry, {
        ttl
      });
      
      this.stats.writes++;
      this.logger.debug('Cache set', { key });
    } catch (error) {
      this.logger.error('Cache set error', { key, error });
    }
  }

  /**
   * 批量设置缓存
   */
  async setMany<T>(entries: Array<{ key: CacheKey; value: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, { ttl: entry.ttl });
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      const deleted = this.memoryCache.delete(key);
      if (deleted) {
        this.logger.debug('Cache deleted', { key });
      }
    } catch (error) {
      this.logger.error('Cache delete error', { key, error });
    }
  }

  /**
   * 批量删除缓存
   */
  async deleteMany(keys: CacheKey[]): Promise<number> {
    let deletedCount = 0;
    
    for (const key of keys) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * 按模式删除缓存 (invalidate)
   */
  async invalidate(pattern: string): Promise<void> {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        if (this.memoryCache.delete(key)) {
          deletedCount++;
        }
      }
    }
    
    this.logger.debug('Cache invalidated by pattern', { pattern, deletedCount });
  }

  /**
   * 按模式删除缓存
   */
  async deleteByPattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        if (this.memoryCache.delete(key)) {
          deletedCount++;
        }
      }
    }
    
    this.logger.debug('Cache deleted by pattern', { pattern, deletedCount });
    return deletedCount;
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: CacheKey): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    return this.memoryCache.has(cacheKey);
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * 按实体清空缓存
   */
  async clearByEntity(entity: Entity): Promise<void> {
    const pattern = `^${entity.name}:`;
    await this.deleteByPattern(pattern);
    this.logger.info('Cache cleared for entity', { entity: entity.name });
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.memoryCache.size,
      maxSize: this.memoryCache.max
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.writes = 0;
  }

  /**
   * 获取或设置缓存（原子操作）
   */
  async getOrSet<T>(
    key: CacheKey,
    factory: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行工厂函数
    const value = await factory();
    
    // 存储到缓存
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * 刷新缓存
   */
  async refresh<T>(
    key: CacheKey,
    factory: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    // 删除现有缓存
    await this.delete(key);
    
    // 重新获取并缓存
    return this.getOrSet(key, factory, options);
  }

  /**
   * 构建缓存键
   */
  private buildKey(key: CacheKey): string {
    const parts = [key.entity];
    
    if (key.id) {
      parts.push(key.id);
    }
    
    if (key.operation) {
      parts.push(key.operation);
    }
    
    if (key.params) {
      // 将参数序列化为稳定的字符串
      const sortedParams = Object.keys(key.params)
        .sort()
        .reduce((acc, k) => {
          acc[k] = key.params![k];
          return acc;
        }, {} as Record<string, any>);
      
      parts.push(JSON.stringify(sortedParams));
    }
    
    return parts.join(':');
  }

  /**
   * 处理实体级缓存失效
   */
  async invalidateEntity(entity: Entity, id?: string, operation?: string): Promise<void> {
    if (id) {
      // 使具体ID的所有缓存失效
      const pattern = `^${entity.name}:${id}`;
      await this.deleteByPattern(pattern);
    } else if (operation) {
      // 使特定操作的缓存失效
      const pattern = `^${entity.name}:[^:]+:${operation}`;
      await this.deleteByPattern(pattern);
    } else {
      // 使整个实体的缓存失效
      await this.clearByEntity(entity);
    }
  }

  /**
   * 预热缓存
   */
  async warmup<T>(
    keys: CacheKey[],
    factory: (key: CacheKey) => Promise<T>,
    options?: { ttl?: number; batchSize?: number }
  ): Promise<void> {
    const batchSize = options?.batchSize || 10;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(key => 
          this.getOrSet(key, () => factory(key), { ttl: options?.ttl })
        )
      );
    }
    
    this.logger.info('Cache warmup completed', { keysCount: keys.length });
  }

  /**
   * 生成缓存键
   */
  generateKey(entityName: string, operation: string, params: unknown): string {
    const key: CacheKey = {
      entity: entityName,
      operation,
      params: params as Record<string, any>
    };
    return this.buildKey(key);
  }
}

/**
 * 创建缓存管理器实例
 */
export function createCacheManager(logger: Logger, options?: CacheOptions): ICacheManager {
  return new CacheManager(logger, options);
}