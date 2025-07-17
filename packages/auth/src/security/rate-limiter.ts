/**
 * @linch-kit/auth 速率限制管理器
 * 
 * 实现认证系统的速率限制和暴力破解防护
 * 支持IP地址和用户级别的限制
 * 
 * @author LinchKit Team
 * @since 0.2.0
 */

import { logger } from '@linch-kit/core/server'

/**
 * 速率限制尝试记录
 */
export interface RateLimitAttempt {
  /** 标识符 (IP地址或用户ID) */
  identifier: string
  /** 尝试时间 */
  timestamp: Date
  /** 尝试类型 */
  type: 'login' | 'password_reset' | 'mfa' | 'refresh'
  /** 是否成功 */
  success: boolean
  /** 额外元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 速率限制结果
 */
export interface RateLimitResult {
  /** 是否允许访问 */
  allowed: boolean
  /** 剩余尝试次数 */
  remainingAttempts: number
  /** 重置时间 */
  resetTime: Date
  /** 锁定时间（如果被锁定） */
  lockedUntil?: Date
  /** 当前窗口内的尝试次数 */
  currentAttempts: number
}

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number
  /** 最大尝试次数 */
  maxAttempts: number
  /** 锁定时间（毫秒） */
  lockoutDuration: number
  /** 是否启用渐进式延迟 */
  enableProgressiveDelay: boolean
  /** 成功后是否重置计数 */
  resetOnSuccess: boolean
}

/**
 * 速率限制存储接口
 */
export interface RateLimitStorage {
  /**
   * 记录尝试
   */
  recordAttempt(attempt: RateLimitAttempt): Promise<void>
  
  /**
   * 获取指定标识符的尝试记录
   */
  getAttempts(identifier: string, type: string, windowMs: number): Promise<RateLimitAttempt[]>
  
  /**
   * 清理过期记录
   */
  cleanup(olderThan: Date): Promise<number>
  
  /**
   * 设置锁定状态
   */
  setLockout(identifier: string, type: string, lockedUntil: Date): Promise<void>
  
  /**
   * 获取锁定状态
   */
  getLockout(identifier: string, type: string): Promise<Date | null>
  
  /**
   * 清除锁定状态
   */
  clearLockout(identifier: string, type: string): Promise<void>
}

/**
 * 内存速率限制存储实现
 */
export class InMemoryRateLimitStorage implements RateLimitStorage {
  private readonly attempts = new Map<string, RateLimitAttempt[]>()
  private readonly lockouts = new Map<string, Date>()

  async recordAttempt(attempt: RateLimitAttempt): Promise<void> {
    const key = `${attempt.identifier}:${attempt.type}`
    const attempts = this.attempts.get(key) || []
    attempts.push(attempt)
    this.attempts.set(key, attempts)
  }

  async getAttempts(identifier: string, type: string, windowMs: number): Promise<RateLimitAttempt[]> {
    const key = `${identifier}:${type}`
    const attempts = this.attempts.get(key) || []
    const cutoff = new Date(Date.now() - windowMs)
    
    // 过滤出时间窗口内的尝试
    const recentAttempts = attempts.filter(attempt => attempt.timestamp >= cutoff)
    
    // 更新存储，移除过期的记录
    if (recentAttempts.length !== attempts.length) {
      this.attempts.set(key, recentAttempts)
    }
    
    return recentAttempts
  }

  async cleanup(olderThan: Date): Promise<number> {
    let cleanedCount = 0
    
    for (const [key, attempts] of this.attempts.entries()) {
      const filteredAttempts = attempts.filter(attempt => attempt.timestamp >= olderThan)
      if (filteredAttempts.length !== attempts.length) {
        this.attempts.set(key, filteredAttempts)
        cleanedCount += attempts.length - filteredAttempts.length
      }
    }
    
    return cleanedCount
  }

  async setLockout(identifier: string, type: string, lockedUntil: Date): Promise<void> {
    const key = `${identifier}:${type}`
    this.lockouts.set(key, lockedUntil)
  }

  async getLockout(identifier: string, type: string): Promise<Date | null> {
    const key = `${identifier}:${type}`
    const lockedUntil = this.lockouts.get(key)
    
    if (lockedUntil && lockedUntil > new Date()) {
      return lockedUntil
    }
    
    if (lockedUntil) {
      // 清理过期的锁定状态
      this.lockouts.delete(key)
    }
    
    return null
  }

  async clearLockout(identifier: string, type: string): Promise<void> {
    const key = `${identifier}:${type}`
    this.lockouts.delete(key)
  }
}

/**
 * 速率限制管理器
 * 
 * 提供认证系统的速率限制功能：
 * - 基于IP地址的限制
 * - 基于用户的限制
 * - 渐进式延迟
 * - 自动锁定和解锁
 */
export class RateLimiter {
  private readonly config: RateLimitConfig
  private readonly storage: RateLimitStorage
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<RateLimitConfig> = {}, storage?: RateLimitStorage) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15分钟
      maxAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30分钟
      enableProgressiveDelay: true,
      resetOnSuccess: true,
      ...config
    }
    
    this.storage = storage || new InMemoryRateLimitStorage()
    
    // 启动清理定时器
    this.startCleanupTimer()
  }

  /**
   * 检查是否允许访问
   */
  async checkLimit(identifier: string, type: RateLimitAttempt['type']): Promise<RateLimitResult> {
    // 检查是否被锁定
    const lockedUntil = await this.storage.getLockout(identifier, type)
    if (lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: new Date(Date.now() + this.config.windowMs),
        lockedUntil,
        currentAttempts: this.config.maxAttempts
      }
    }

    // 获取时间窗口内的尝试记录
    const attempts = await this.storage.getAttempts(identifier, type, this.config.windowMs)
    const failedAttempts = attempts.filter(attempt => !attempt.success)
    
    const currentAttempts = failedAttempts.length
    const remainingAttempts = Math.max(0, this.config.maxAttempts - currentAttempts)
    const resetTime = new Date(Date.now() + this.config.windowMs)

    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      resetTime,
      currentAttempts
    }
  }

  /**
   * 记录尝试
   */
  async recordAttempt(options: {
    identifier: string
    type: RateLimitAttempt['type']
    success: boolean
    metadata?: Record<string, unknown>
  }): Promise<RateLimitResult> {
    const attempt: RateLimitAttempt = {
      identifier: options.identifier,
      timestamp: new Date(),
      type: options.type,
      success: options.success,
      metadata: options.metadata
    }

    await this.storage.recordAttempt(attempt)

    // 如果成功且配置为重置，清除锁定状态和失败尝试记录
    if (options.success && this.config.resetOnSuccess) {
      await this.storage.clearLockout(options.identifier, options.type)
      // 清除失败尝试记录
      await this.clearFailedAttempts(options.identifier, options.type)
    }

    // 检查是否需要锁定
    const result = await this.checkLimit(options.identifier, options.type)
    
    if (!options.success && result.remainingAttempts === 0 && !result.lockedUntil) {
      // 设置锁定状态
      const lockedUntil = new Date(Date.now() + this.config.lockoutDuration)
      await this.storage.setLockout(options.identifier, options.type, lockedUntil)
      
      logger.warn('用户因频繁失败尝试被锁定', {
        service: 'rate-limiter',
        identifier: options.identifier,
        type: options.type,
        lockedUntil
      })
      
      result.lockedUntil = lockedUntil
    }

    // 记录日志
    if (options.success) {
      logger.info('认证尝试成功', {
        service: 'rate-limiter',
        identifier: options.identifier,
        type: options.type
      })
    } else {
      logger.warn('认证尝试失败', {
        service: 'rate-limiter',
        identifier: options.identifier,
        type: options.type,
        remainingAttempts: result.remainingAttempts
      })
    }

    return result
  }

  /**
   * 计算渐进式延迟
   */
  getProgressiveDelay(attemptCount: number): number {
    if (!this.config.enableProgressiveDelay) {
      return 0
    }
    
    // 指数增长延迟：1s, 2s, 4s, 8s, 16s...
    const baseDelay = 1000
    const maxDelay = 30000 // 最大30秒
    
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount - 1), maxDelay)
    return delay
  }

  /**
   * 清除指定标识符的限制
   */
  async clearLimit(identifier: string, type: RateLimitAttempt['type']): Promise<void> {
    await this.storage.clearLockout(identifier, type)
    await this.clearFailedAttempts(identifier, type)
    
    logger.info('速率限制已清除', {
      service: 'rate-limiter',
      identifier,
      type
    })
  }

  /**
   * 清除失败尝试记录
   */
  private async clearFailedAttempts(identifier: string, type: RateLimitAttempt['type']): Promise<void> {
    // 获取所有尝试记录
    const attempts = await this.storage.getAttempts(identifier, type, this.config.windowMs)
    
    // 如果使用的是内存存储，直接清除失败记录
    if (this.storage instanceof InMemoryRateLimitStorage) {
      const key = `${identifier}:${type}`
      const successAttempts = attempts.filter(attempt => attempt.success)
      // 重置为只保留成功的尝试
      ;(this.storage as any).attempts.set(key, successAttempts)
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const olderThan = new Date(Date.now() - this.config.windowMs * 2)
        const cleanedCount = await this.storage.cleanup(olderThan)
        
        if (cleanedCount > 0) {
          logger.info('速率限制记录清理完成', {
            service: 'rate-limiter',
            cleanedCount
          })
        }
      } catch (error) {
        logger.error('速率限制清理失败', error instanceof Error ? error : undefined, {
          service: 'rate-limiter'
        })
      }
    }, this.config.windowMs)
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 销毁速率限制器
   */
  destroy(): void {
    this.stopCleanupTimer()
  }
}

/**
 * 创建速率限制器实例
 */
export function createRateLimiter(
  config?: Partial<RateLimitConfig>,
  storage?: RateLimitStorage
): RateLimiter {
  return new RateLimiter(config, storage)
}

/**
 * 默认速率限制配置
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15分钟
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30分钟
  enableProgressiveDelay: true,
  resetOnSuccess: true
}

/**
 * 不同类型的预设配置
 */
export const rateLimitPresets = {
  /** 严格模式 - 用于生产环境 */
  strict: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxAttempts: 3,
    lockoutDuration: 60 * 60 * 1000, // 1小时
    enableProgressiveDelay: true,
    resetOnSuccess: true
  },
  
  /** 宽松模式 - 用于开发环境 */
  lenient: {
    windowMs: 5 * 60 * 1000, // 5分钟
    maxAttempts: 10,
    lockoutDuration: 10 * 60 * 1000, // 10分钟
    enableProgressiveDelay: false,
    resetOnSuccess: true
  },
  
  /** 密码重置专用 */
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1小时
    maxAttempts: 3,
    lockoutDuration: 2 * 60 * 60 * 1000, // 2小时
    enableProgressiveDelay: true,
    resetOnSuccess: false
  }
} as const