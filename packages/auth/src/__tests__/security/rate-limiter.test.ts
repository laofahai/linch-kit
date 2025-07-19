/**
 * @linch-kit/auth 速率限制器测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { RateLimiter, InMemoryRateLimitStorage, rateLimitPresets } from '../../security/rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  let storage: InMemoryRateLimitStorage

  beforeEach(() => {
    storage = new InMemoryRateLimitStorage()
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1分钟
      maxAttempts: 3,
      lockoutDuration: 300000, // 5分钟
      enableProgressiveDelay: true,
      resetOnSuccess: true
    }, storage)
  })

  afterEach(() => {
    rateLimiter.destroy()
  })

  describe('checkLimit', () => {
    it('应该允许在限制内的访问', async () => {
      const result = await rateLimiter.checkLimit('192.168.1.1', 'login')
      
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(3)
      expect(result.currentAttempts).toBe(0)
      expect(result.lockedUntil).toBeUndefined()
    })

    it('应该正确跟踪尝试次数', async () => {
      const identifier = '192.168.1.2'
      
      // 第一次失败尝试
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      let result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(2)
      expect(result.currentAttempts).toBe(1)
      
      // 第二次失败尝试
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(1)
      expect(result.currentAttempts).toBe(2)
      
      // 第三次失败尝试
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
      expect(result.currentAttempts).toBe(3)
      expect(result.lockedUntil).toBeDefined()
    })

    it('应该在锁定期间拒绝访问', async () => {
      const identifier = '192.168.1.3'
      
      // 达到最大尝试次数
      for (let i = 0; i < 3; i++) {
        await rateLimiter.recordAttempt({
          identifier,
          type: 'login',
          success: false
        })
      }
      
      const result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(false)
      expect(result.lockedUntil).toBeDefined()
      expect(result.lockedUntil!.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('recordAttempt', () => {
    it('应该正确记录成功的尝试', async () => {
      const identifier = '192.168.1.4'
      
      const result = await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: true,
        metadata: { userAgent: 'test-agent' }
      })
      
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(3)
    })

    it('应该正确记录失败的尝试', async () => {
      const identifier = '192.168.1.5'
      
      const result = await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(2)
      expect(result.currentAttempts).toBe(1)
    })

    it('应该在达到限制时触发锁定', async () => {
      const identifier = '192.168.1.6'
      
      // 前两次失败
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      // 第三次失败应该触发锁定
      const result = await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      expect(result.allowed).toBe(false)
      expect(result.lockedUntil).toBeDefined()
    })

    it('应该在成功后重置计数', async () => {
      const identifier = '192.168.1.7'
      
      // 两次失败尝试
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      // 成功尝试应该重置计数
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: true
      })
      
      // 检查限制应该显示重置状态
      const result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(3)
      expect(result.currentAttempts).toBe(0)
    })
  })

  describe('getProgressiveDelay', () => {
    it('应该返回正确的渐进式延迟', () => {
      expect(rateLimiter.getProgressiveDelay(1)).toBe(1000)  // 1秒
      expect(rateLimiter.getProgressiveDelay(2)).toBe(2000)  // 2秒
      expect(rateLimiter.getProgressiveDelay(3)).toBe(4000)  // 4秒
      expect(rateLimiter.getProgressiveDelay(4)).toBe(8000)  // 8秒
      expect(rateLimiter.getProgressiveDelay(5)).toBe(16000) // 16秒
      expect(rateLimiter.getProgressiveDelay(6)).toBe(30000) // 最大30秒
    })

    it('应该在禁用时返回0', () => {
      const noDelayLimiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 3,
        lockoutDuration: 300000,
        enableProgressiveDelay: false,
        resetOnSuccess: true
      }, storage)

      expect(noDelayLimiter.getProgressiveDelay(1)).toBe(0)
      expect(noDelayLimiter.getProgressiveDelay(5)).toBe(0)

      noDelayLimiter.destroy()
    })
  })

  describe('clearLimit', () => {
    it('应该清除指定标识符的限制', async () => {
      const identifier = '192.168.1.8'
      
      // 达到最大尝试次数
      for (let i = 0; i < 3; i++) {
        await rateLimiter.recordAttempt({
          identifier,
          type: 'login',
          success: false
        })
      }
      
      // 验证已被锁定
      let result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(false)
      
      // 清除限制
      await rateLimiter.clearLimit(identifier, 'login')
      
      // 验证限制已被清除
      result = await rateLimiter.checkLimit(identifier, 'login')
      expect(result.allowed).toBe(true)
    })
  })

  describe('不同类型的限制', () => {
    it('应该独立跟踪不同类型的尝试', async () => {
      const identifier = '192.168.1.9'
      
      // 对login类型进行尝试
      await rateLimiter.recordAttempt({
        identifier,
        type: 'login',
        success: false
      })
      
      // 对password_reset类型进行尝试
      await rateLimiter.recordAttempt({
        identifier,
        type: 'password_reset',
        success: false
      })
      
      // 检查两种类型的限制
      const loginResult = await rateLimiter.checkLimit(identifier, 'login')
      const passwordResetResult = await rateLimiter.checkLimit(identifier, 'password_reset')
      
      expect(loginResult.currentAttempts).toBe(1)
      expect(passwordResetResult.currentAttempts).toBe(1)
      expect(loginResult.remainingAttempts).toBe(2)
      expect(passwordResetResult.remainingAttempts).toBe(2)
    })
  })
})

describe('InMemoryRateLimitStorage', () => {
  let storage: InMemoryRateLimitStorage

  beforeEach(() => {
    storage = new InMemoryRateLimitStorage()
  })

  describe('recordAttempt and getAttempts', () => {
    it('应该正确存储和检索尝试记录', async () => {
      const attempt = {
        identifier: '192.168.1.10',
        timestamp: new Date(),
        type: 'login' as const,
        success: false,
        metadata: { userAgent: 'test' }
      }

      await storage.recordAttempt(attempt)
      
      const attempts = await storage.getAttempts(attempt.identifier, attempt.type, 60000)
      expect(attempts).toHaveLength(1)
      expect(attempts[0]).toEqual(attempt)
    })

    it('应该只返回时间窗口内的尝试', async () => {
      const identifier = '192.168.1.11'
      const type = 'login'
      
      // 旧的尝试
      const oldAttempt = {
        identifier,
        timestamp: new Date(Date.now() - 120000), // 2分钟前
        type,
        success: false
      }
      
      // 新的尝试
      const newAttempt = {
        identifier,
        timestamp: new Date(),
        type,
        success: false
      }
      
      await storage.recordAttempt(oldAttempt)
      await storage.recordAttempt(newAttempt)
      
      // 1分钟窗口应该只返回新的尝试
      const attempts = await storage.getAttempts(identifier, type, 60000)
      expect(attempts).toHaveLength(1)
      expect(attempts[0]).toEqual(newAttempt)
    })
  })

  describe('setLockout and getLockout', () => {
    it('应该正确设置和获取锁定状态', async () => {
      const identifier = '192.168.1.12'
      const type = 'login'
      const lockedUntil = new Date(Date.now() + 60000)

      await storage.setLockout(identifier, type, lockedUntil)
      
      const retrievedLockout = await storage.getLockout(identifier, type)
      expect(retrievedLockout).toEqual(lockedUntil)
    })

    it('应该在锁定过期时返回null', async () => {
      const identifier = '192.168.1.13'
      const type = 'login'
      const expiredLockout = new Date(Date.now() - 1000) // 1秒前过期

      await storage.setLockout(identifier, type, expiredLockout)
      
      const retrievedLockout = await storage.getLockout(identifier, type)
      expect(retrievedLockout).toBeNull()
    })
  })

  describe('clearLockout', () => {
    it('应该清除锁定状态', async () => {
      const identifier = '192.168.1.14'
      const type = 'login'
      const lockedUntil = new Date(Date.now() + 60000)

      await storage.setLockout(identifier, type, lockedUntil)
      expect(await storage.getLockout(identifier, type)).toEqual(lockedUntil)

      await storage.clearLockout(identifier, type)
      expect(await storage.getLockout(identifier, type)).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('应该清理过期的尝试记录', async () => {
      const identifier = '192.168.1.15'
      const type = 'login'
      
      // 过期的尝试
      const expiredAttempt = {
        identifier,
        timestamp: new Date(Date.now() - 120000), // 2分钟前
        type,
        success: false
      }
      
      // 有效的尝试
      const validAttempt = {
        identifier,
        timestamp: new Date(),
        type,
        success: false
      }
      
      await storage.recordAttempt(expiredAttempt)
      await storage.recordAttempt(validAttempt)
      
      const olderThan = new Date(Date.now() - 60000) // 1分钟前
      const cleanedCount = await storage.cleanup(olderThan)
      
      expect(cleanedCount).toBe(1)
      
      const remainingAttempts = await storage.getAttempts(identifier, type, 180000)
      expect(remainingAttempts).toHaveLength(1)
      expect(remainingAttempts[0]).toEqual(validAttempt)
    })
  })
})

describe('rateLimitPresets', () => {
  it('应该包含预设的配置', () => {
    expect(rateLimitPresets.strict).toBeDefined()
    expect(rateLimitPresets.lenient).toBeDefined()
    expect(rateLimitPresets.passwordReset).toBeDefined()
    
    // 验证严格模式配置
    expect(rateLimitPresets.strict.maxAttempts).toBe(3)
    expect(rateLimitPresets.strict.lockoutDuration).toBe(60 * 60 * 1000) // 1小时
    
    // 验证宽松模式配置
    expect(rateLimitPresets.lenient.maxAttempts).toBe(10)
    expect(rateLimitPresets.lenient.enableProgressiveDelay).toBe(false)
    
    // 验证密码重置配置
    expect(rateLimitPresets.passwordReset.maxAttempts).toBe(3)
    expect(rateLimitPresets.passwordReset.resetOnSuccess).toBe(false)
  })
})