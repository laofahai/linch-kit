/**
 * @linch-kit/auth JWT黑名单管理器测试
 */

import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test'
import { JWTBlacklistManager, InMemoryBlacklistStorage } from '../../security/jwt-blacklist-manager'

describe('JWTBlacklistManager', () => {
  let blacklistManager: JWTBlacklistManager
  let storage: InMemoryBlacklistStorage

  beforeEach(() => {
    storage = new InMemoryBlacklistStorage()
    blacklistManager = new JWTBlacklistManager({
      cleanupInterval: 100, // 100ms for testing
      enableAutoCleanup: false, // 禁用自动清理以便测试
      storage
    })
  })

  afterEach(() => {
    blacklistManager.destroy()
  })

  describe('blacklistToken', () => {
    it('应该成功将令牌添加到黑名单', async () => {
      const jti = 'test-token-123'
      const expiresAt = new Date(Date.now() + 60000) // 1分钟后过期

      await blacklistManager.blacklistToken({
        jti,
        expiresAt,
        reason: 'logout',
        userId: 'user-123'
      })

      const isBlacklisted = await blacklistManager.isTokenBlacklisted(jti)
      expect(isBlacklisted).toBe(true)
    })

    it('应该记录正确的令牌信息', async () => {
      const jti = 'test-token-456'
      const expiresAt = new Date(Date.now() + 60000)
      const userId = 'user-456'
      const metadata = { deviceType: 'mobile' }

      await blacklistManager.blacklistToken({
        jti,
        expiresAt,
        reason: 'security',
        userId,
        metadata
      })

      const size = await blacklistManager.getBlacklistSize()
      expect(size).toBe(1)
    })
  })

  describe('isTokenBlacklisted', () => {
    it('应该正确识别黑名单令牌', async () => {
      const jti = 'blacklisted-token'
      const expiresAt = new Date(Date.now() + 60000)

      await blacklistManager.blacklistToken({
        jti,
        expiresAt,
        reason: 'logout'
      })

      const isBlacklisted = await blacklistManager.isTokenBlacklisted(jti)
      expect(isBlacklisted).toBe(true)
    })

    it('应该正确识别非黑名单令牌', async () => {
      const isBlacklisted = await blacklistManager.isTokenBlacklisted('non-existent-token')
      expect(isBlacklisted).toBe(false)
    })
  })

  describe('removeFromBlacklist', () => {
    it('应该成功从黑名单中移除令牌', async () => {
      const jti = 'removable-token'
      const expiresAt = new Date(Date.now() + 60000)

      await blacklistManager.blacklistToken({
        jti,
        expiresAt,
        reason: 'logout'
      })

      expect(await blacklistManager.isTokenBlacklisted(jti)).toBe(true)

      await blacklistManager.removeFromBlacklist(jti)

      expect(await blacklistManager.isTokenBlacklisted(jti)).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('应该清理过期的黑名单条目', async () => {
      const now = new Date()
      const expiredToken = 'expired-token'
      const validToken = 'valid-token'

      // 添加已过期的令牌
      await blacklistManager.blacklistToken({
        jti: expiredToken,
        expiresAt: new Date(now.getTime() - 1000), // 1秒前过期
        reason: 'logout'
      })

      // 添加有效的令牌
      await blacklistManager.blacklistToken({
        jti: validToken,
        expiresAt: new Date(now.getTime() + 60000), // 1分钟后过期
        reason: 'logout'
      })

      expect(await blacklistManager.getBlacklistSize()).toBe(2)

      const cleanedCount = await blacklistManager.cleanup()
      expect(cleanedCount).toBe(1)
      expect(await blacklistManager.getBlacklistSize()).toBe(1)
      expect(await blacklistManager.isTokenBlacklisted(expiredToken)).toBe(false)
      expect(await blacklistManager.isTokenBlacklisted(validToken)).toBe(true)
    })
  })

  describe('自动清理', () => {
    it('应该自动清理过期的令牌', async () => {
      const autoCleanupManager = new JWTBlacklistManager({
        cleanupInterval: 50, // 50ms
        enableAutoCleanup: true,
        storage
      })

      const expiredToken = 'auto-expired-token'
      await autoCleanupManager.blacklistToken({
        jti: expiredToken,
        expiresAt: new Date(Date.now() - 1000), // 已过期
        reason: 'logout'
      })

      expect(await autoCleanupManager.getBlacklistSize()).toBe(1)

      // 等待自动清理执行
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(await autoCleanupManager.getBlacklistSize()).toBe(0)

      autoCleanupManager.destroy()
    })
  })
})

describe('InMemoryBlacklistStorage', () => {
  let storage: InMemoryBlacklistStorage

  beforeEach(() => {
    storage = new InMemoryBlacklistStorage()
  })

  describe('add and isBlacklisted', () => {
    it('应该正确存储和检索黑名单令牌', async () => {
      const token = {
        jti: 'test-jti',
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(),
        reason: 'logout' as const,
        userId: 'user-123'
      }

      await storage.add(token)
      const isBlacklisted = await storage.isBlacklisted(token.jti)
      expect(isBlacklisted).toBe(true)
    })
  })

  describe('remove', () => {
    it('应该成功移除令牌', async () => {
      const token = {
        jti: 'removable-jti',
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(),
        reason: 'logout' as const
      }

      await storage.add(token)
      expect(await storage.isBlacklisted(token.jti)).toBe(true)

      await storage.remove(token.jti)
      expect(await storage.isBlacklisted(token.jti)).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('应该清理过期的令牌', async () => {
      const expiredToken = {
        jti: 'expired-jti',
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: new Date(),
        reason: 'logout' as const
      }

      const validToken = {
        jti: 'valid-jti',
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(),
        reason: 'logout' as const
      }

      await storage.add(expiredToken)
      await storage.add(validToken)

      expect(await storage.size()).toBe(2)

      const cleanedCount = await storage.cleanup()
      expect(cleanedCount).toBe(1)
      expect(await storage.size()).toBe(1)
      expect(await storage.isBlacklisted(expiredToken.jti)).toBe(false)
      expect(await storage.isBlacklisted(validToken.jti)).toBe(true)
    })
  })

  describe('size', () => {
    it('应该返回正确的存储大小', async () => {
      expect(await storage.size()).toBe(0)

      const token1 = {
        jti: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(),
        reason: 'logout' as const
      }

      const token2 = {
        jti: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(),
        reason: 'security' as const
      }

      await storage.add(token1)
      expect(await storage.size()).toBe(1)

      await storage.add(token2)
      expect(await storage.size()).toBe(2)

      await storage.remove(token1.jti)
      expect(await storage.size()).toBe(1)
    })
  })
})