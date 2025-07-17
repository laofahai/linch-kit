/**
 * @linch-kit/auth JWT黑名单管理器
 * 
 * 实现JWT令牌黑名单机制，防止已撤销的令牌被重复使用
 * 支持内存存储和Redis存储两种模式
 * 
 * @author LinchKit Team
 * @since 0.2.0
 */

import { logger } from '@linch-kit/core/server'

/**
 * JWT令牌黑名单条目
 */
export interface BlacklistedToken {
  /** JWT ID (jti) */
  jti: string
  /** 令牌过期时间 */
  expiresAt: Date
  /** 撤销时间 */
  revokedAt: Date
  /** 撤销原因 */
  reason: 'logout' | 'security' | 'admin' | 'expired'
  /** 用户ID */
  userId?: string
  /** 额外元数据 */
  metadata?: Record<string, unknown>
}

/**
 * JWT黑名单管理器配置
 */
export interface JWTBlacklistManagerConfig {
  /** 清理间隔（毫秒） */
  cleanupInterval: number
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean
  /** 黑名单存储适配器 */
  storage?: BlacklistStorage
}

/**
 * 黑名单存储适配器接口
 */
export interface BlacklistStorage {
  /**
   * 添加令牌到黑名单
   */
  add(token: BlacklistedToken): Promise<void>
  
  /**
   * 检查令牌是否在黑名单中
   */
  isBlacklisted(jti: string): Promise<boolean>
  
  /**
   * 从黑名单中移除令牌
   */
  remove(jti: string): Promise<void>
  
  /**
   * 清理过期的黑名单条目
   */
  cleanup(): Promise<number>
  
  /**
   * 获取黑名单大小
   */
  size(): Promise<number>
}

/**
 * 内存黑名单存储实现
 */
export class InMemoryBlacklistStorage implements BlacklistStorage {
  private readonly tokens = new Map<string, BlacklistedToken>()

  async add(token: BlacklistedToken): Promise<void> {
    this.tokens.set(token.jti, token)
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return this.tokens.has(jti)
  }

  async remove(jti: string): Promise<void> {
    this.tokens.delete(jti)
  }

  async cleanup(): Promise<number> {
    const now = new Date()
    let cleanedCount = 0
    
    for (const [jti, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(jti)
        cleanedCount++
      }
    }
    
    return cleanedCount
  }

  async size(): Promise<number> {
    return this.tokens.size
  }
}

/**
 * JWT黑名单管理器
 * 
 * 提供JWT令牌黑名单功能：
 * - 添加令牌到黑名单
 * - 检查令牌是否被撤销
 * - 自动清理过期的黑名单条目
 * - 支持多种存储后端
 */
export class JWTBlacklistManager {
  private readonly config: JWTBlacklistManagerConfig
  private readonly storage: BlacklistStorage
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<JWTBlacklistManagerConfig> = {}) {
    this.config = {
      cleanupInterval: 60000, // 1分钟
      enableAutoCleanup: true,
      ...config
    }
    
    this.storage = this.config.storage || new InMemoryBlacklistStorage()
    
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 将令牌添加到黑名单
   */
  async blacklistToken(options: {
    jti: string
    expiresAt: Date
    reason: BlacklistedToken['reason']
    userId?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const token: BlacklistedToken = {
      jti: options.jti,
      expiresAt: options.expiresAt,
      revokedAt: new Date(),
      reason: options.reason,
      userId: options.userId,
      metadata: options.metadata
    }

    await this.storage.add(token)
    
    logger.info('JWT令牌已添加到黑名单', {
      service: 'jwt-blacklist-manager',
      jti: options.jti,
      reason: options.reason,
      userId: options.userId
    })
  }

  /**
   * 检查令牌是否在黑名单中
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.storage.isBlacklisted(jti)
    
    if (result) {
      logger.warn('检测到黑名单令牌访问', {
        service: 'jwt-blacklist-manager',
        jti
      })
    }
    
    return result
  }

  /**
   * 从黑名单中移除令牌
   */
  async removeFromBlacklist(jti: string): Promise<void> {
    await this.storage.remove(jti)
    
    logger.info('JWT令牌已从黑名单移除', {
      service: 'jwt-blacklist-manager',
      jti
    })
  }

  /**
   * 清理过期的黑名单条目
   */
  async cleanup(): Promise<number> {
    const cleanedCount = await this.storage.cleanup()
    
    if (cleanedCount > 0) {
      logger.info('黑名单清理完成', {
        service: 'jwt-blacklist-manager',
        cleanedCount
      })
    }
    
    return cleanedCount
  }

  /**
   * 获取黑名单大小
   */
  async getBlacklistSize(): Promise<number> {
    return await this.storage.size()
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup()
      } catch (error) {
        logger.error('自动清理黑名单失败', error instanceof Error ? error : undefined, {
          service: 'jwt-blacklist-manager'
        })
      }
    }, this.config.cleanupInterval)
  }

  /**
   * 停止自动清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopAutoCleanup()
  }
}

/**
 * 创建JWT黑名单管理器实例
 */
export function createJWTBlacklistManager(
  config?: Partial<JWTBlacklistManagerConfig>
): JWTBlacklistManager {
  return new JWTBlacklistManager(config)
}

/**
 * 默认JWT黑名单管理器配置
 */
export const defaultJWTBlacklistManagerConfig: JWTBlacklistManagerConfig = {
  cleanupInterval: 60000, // 1分钟
  enableAutoCleanup: true
}