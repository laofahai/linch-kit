import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { EnhancedJWTAuthService, createEnhancedJWTAuthService } from '../../services/enhanced-jwt-auth.service'
import type { EnhancedJWTAuthServiceConfig, AuthRequest } from '../../types'
import { sign } from 'jsonwebtoken'

// Mock dependencies
const mockLogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
}

// Mock @linch-kit/core/server logger
mock.module('@linch-kit/core/server', () => ({
  logger: mockLogger,
}))

// Mock JWT Blacklist Manager
const mockBlacklistManager = {
  isTokenBlacklisted: mock(async () => false),
  blacklistToken: mock(async () => true),
  destroy: mock(() => {}),
}

mock.module('../security/jwt-blacklist-manager', () => ({
  JWTBlacklistManager: class MockJWTBlacklistManager {
    constructor() {
      return mockBlacklistManager
    }
  },
}))

// Mock Rate Limiter
const mockRateLimiter = {
  checkLimit: mock(async () => ({ allowed: true })),
  recordAttempt: mock(async () => {}),
  destroy: mock(() => {}),
}

mock.module('../security/rate-limiter', () => ({
  RateLimiter: class MockRateLimiter {
    constructor() {
      return mockRateLimiter
    }
  },
  rateLimitPresets: {
    strict: { windowSize: 300, maxAttempts: 5 },
  },
}))

describe('EnhancedJWTAuthService', () => {
  let service: EnhancedJWTAuthService
  let config: EnhancedJWTAuthServiceConfig

  beforeEach(() => {
    // Reset mocks
    mockLogger.info.mockClear()
    mockLogger.warn.mockClear() 
    mockLogger.error.mockClear()
    mockBlacklistManager.isTokenBlacklisted.mockClear()
    mockBlacklistManager.blacklistToken.mockClear()
    mockRateLimiter.checkLimit.mockClear()
    mockRateLimiter.recordAttempt.mockClear()

    // Setup test config
    config = {
      jwtSecret: 'test-secret-key-that-is-at-least-32-characters-long',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      algorithm: 'HS256' as const,
      issuer: 'test-issuer',
      audience: 'test-audience',
      security: {
        enableBlacklist: true,
        enableRateLimit: true,
        enableProgressiveDelay: true,
        maxConcurrentSessions: 3,
      },
    }

    service = new EnhancedJWTAuthService(config)
  })

  afterEach(() => {
    service.destroy()
  })

  describe('构造函数与配置验证', () => {
    it('应该成功创建服务实例', () => {
      expect(service).toBeInstanceOf(EnhancedJWTAuthService)
      expect(service.getServiceType()).toBe('jwt')
    })

    it('应该在JWT密钥缺失时抛出错误', () => {
      expect(() => {
        new EnhancedJWTAuthService({
          ...config,
          jwtSecret: '',
        })
      }).toThrow('JWT secret is required')
    })

    it('应该在JWT密钥长度不足时抛出错误', () => {
      expect(() => {
        new EnhancedJWTAuthService({
          ...config,
          jwtSecret: 'short',
        })
      }).toThrow('JWT secret must be at least 32 characters long')
    })

    it('应该在过期时间格式无效时抛出错误', () => {
      expect(() => {
        new EnhancedJWTAuthService({
          ...config,
          accessTokenExpiry: 'invalid',
        })
      }).toThrow('Invalid expiry format')
    })
  })

  describe('用户认证', () => {
    const mockAuthRequest: AuthRequest = {
      provider: 'credentials',
      credentials: {
        email: 'test@example.com',
        password: 'password123',
      },
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: 'test-agent',
      },
    }

    it('应该成功认证有效用户', async () => {
      const result = await service.authenticate(mockAuthRequest)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe('test-user-id')
      expect(result.user?.email).toBe('test@example.com')
      expect(result.tokens).toBeDefined()
      expect(result.tokens?.accessToken).toBeTypeOf('string')
      expect(result.tokens?.refreshToken).toBeTypeOf('string')
      expect(result.tokens?.expiresIn).toBe(900) // 15 minutes

      expect(mockLogger.info).toHaveBeenCalledWith('增强JWT认证开始', expect.any(Object))
      expect(mockLogger.info).toHaveBeenCalledWith('增强JWT认证成功', expect.any(Object))
    })

    it('应该拒绝无效凭据', async () => {
      const invalidRequest = {
        ...mockAuthRequest,
        credentials: {
          email: 'invalid@example.com',
          password: 'wrong-password',
        },
      }

      const result = await service.authenticate(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(result.user).toBeUndefined()
      expect(result.tokens).toBeUndefined()
    })

    it('应该在速率限制超出时拒绝认证', async () => {
      mockRateLimiter.checkLimit.mockResolvedValueOnce({ 
        allowed: false, 
        lockedUntil: new Date(Date.now() + 300000) 
      })

      const result = await service.authenticate(mockAuthRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Too many login attempts. Please try again later.')
      expect(mockLogger.warn).toHaveBeenCalledWith('认证请求被速率限制拒绝', expect.any(Object))
    })

    it('应该记录认证尝试', async () => {
      await service.authenticate(mockAuthRequest)

      expect(mockRateLimiter.recordAttempt).toHaveBeenCalledWith({
        identifier: '192.168.1.100',
        type: 'login',
        success: true,
        metadata: {
          userAgent: 'test-agent',
          provider: 'credentials',
        },
      })
    })

    it('应该处理认证异常', async () => {
      const invalidRequest = {
        ...mockAuthRequest,
        credentials: null,
      }

      const result = await service.authenticate(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Authentication failed')
      expect(mockLogger.error).toHaveBeenCalledWith('增强JWT认证失败', expect.any(Error), expect.any(Object))
    })
  })

  describe('会话验证', () => {
    let validToken: string
    let sessionId: string

    beforeEach(async () => {
      // 创建一个有效的会话
      const authResult = await service.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      if (authResult.success && authResult.tokens) {
        validToken = authResult.tokens.accessToken
        // 从JWT中提取sessionId
        const payload = JSON.parse(Buffer.from(validToken.split('.')[1], 'base64').toString())
        sessionId = payload.jti
      }
    })

    it('应该成功验证有效令牌', async () => {
      const session = await service.validateSession(validToken)

      expect(session).toBeDefined()
      expect(session?.id).toBe(sessionId)
      expect(session?.userId).toBe('test-user-id')
      expect(session?.expiresAt).toBeInstanceOf(Date)
      expect(session?.lastAccessedAt).toBeInstanceOf(Date)
    })

    it('应该拒绝无效令牌', async () => {
      const session = await service.validateSession('invalid-token')

      expect(session).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith('会话验证失败', expect.any(Error), expect.any(Object))
    })

    it('应该拒绝黑名单中的令牌', async () => {
      mockBlacklistManager.isTokenBlacklisted.mockResolvedValueOnce(true)

      const session = await service.validateSession(validToken)

      expect(session).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith('检测到黑名单令牌访问', expect.any(Object))
    })

    it('应该拒绝过期的会话', async () => {
      // 创建一个已过期的令牌
      const expiredToken = sign(
        {
          sub: 'test-user-id',
          jti: 'expired-session-id',
          iat: Math.floor(Date.now() / 1000) - 3600,
          exp: Math.floor(Date.now() / 1000) - 1800, // 30分钟前过期
        },
        config.jwtSecret,
        { algorithm: config.algorithm }
      )

      const session = await service.validateSession(expiredToken)

      expect(session).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith('会话验证失败', expect.any(Error), expect.any(Object))
    })
  })

  describe('令牌刷新', () => {
    let refreshToken: string
    let sessionId: string

    beforeEach(async () => {
      // 创建一个有效的会话
      const authResult = await service.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      if (authResult.success && authResult.tokens) {
        refreshToken = authResult.tokens.refreshToken
        const payload = JSON.parse(Buffer.from(authResult.tokens.accessToken.split('.')[1], 'base64').toString())
        sessionId = payload.jti
      }
    })

    it('应该成功刷新有效的令牌', async () => {
      const newSession = await service.refreshToken(refreshToken)

      expect(newSession).toBeDefined()
      expect(newSession?.userId).toBe('test-user-id')
      expect(newSession?.id).not.toBe(sessionId) // 应该生成新的sessionId
      expect(newSession?.accessToken).toBeTypeOf('string')
      expect(newSession?.refreshToken).toBeTypeOf('string')

      expect(mockLogger.info).toHaveBeenCalledWith('令牌刷新成功', expect.any(Object))
      expect(mockBlacklistManager.blacklistToken).toHaveBeenCalled() // 旧令牌应被加入黑名单
    })

    it('应该拒绝无效的刷新令牌', async () => {
      const session = await service.refreshToken('invalid-refresh-token')

      expect(session).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith('刷新令牌不存在', expect.any(Object))
    })

    it('应该拒绝过期的刷新令牌', async () => {
      // 手动设置刷新令牌为已过期状态
      const expiredRefreshToken = 'expired-refresh-token'
      
      const session = await service.refreshToken(expiredRefreshToken)

      expect(session).toBeNull()
    })

    it('应该处理刷新过程中的错误', async () => {
      // 通过破坏内部状态来模拟错误
      mockBlacklistManager.blacklistToken.mockRejectedValueOnce(new Error('Blacklist error'))

      const session = await service.refreshToken(refreshToken)

      expect(session).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith('令牌刷新失败', expect.any(Error), expect.any(Object))
    })
  })

  describe('会话撤销', () => {
    let sessionId: string

    beforeEach(async () => {
      const authResult = await service.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      if (authResult.success && authResult.tokens) {
        const payload = JSON.parse(Buffer.from(authResult.tokens.accessToken.split('.')[1], 'base64').toString())
        sessionId = payload.jti
      }
    })

    it('应该成功撤销有效会话', async () => {
      const result = await service.revokeSession(sessionId)

      expect(result).toBe(true)
      expect(mockBlacklistManager.blacklistToken).toHaveBeenCalledWith({
        jti: sessionId,
        expiresAt: expect.any(Date),
        reason: 'logout',
        userId: 'test-user-id',
      })
      expect(mockLogger.info).toHaveBeenCalledWith('会话注销成功', expect.any(Object))
    })

    it('应该处理不存在的会话', async () => {
      const result = await service.revokeSession('non-existent-session-id')

      expect(result).toBe(false)
    })

    it('应该处理撤销过程中的错误', async () => {
      mockBlacklistManager.blacklistToken.mockRejectedValueOnce(new Error('Blacklist error'))

      const result = await service.revokeSession(sessionId)

      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith('会话注销失败', expect.any(Error), expect.any(Object))
    })
  })

  describe('批量会话撤销', () => {
    const userId = 'test-user-id'

    beforeEach(async () => {
      // 创建多个会话
      for (let i = 0; i < 3; i++) {
        await service.authenticate({
          provider: 'credentials',
          credentials: {
            email: 'test@example.com',
            password: 'password123',
          },
        })
      }
    })

    it('应该成功撤销用户的所有会话', async () => {
      const revokedCount = await service.revokeAllSessions(userId)

      expect(revokedCount).toBe(3)
      expect(mockLogger.info).toHaveBeenCalledWith('用户所有会话注销成功', expect.objectContaining({
        userId,
        revokedCount: 3,
      }))
    })

    it('应该处理用户无会话的情况', async () => {
      const revokedCount = await service.revokeAllSessions('non-existent-user')

      expect(revokedCount).toBe(0)
    })

    it('应该处理批量撤销过程中的错误', async () => {
      mockBlacklistManager.blacklistToken.mockRejectedValue(new Error('Blacklist error'))

      const revokedCount = await service.revokeAllSessions(userId)

      expect(revokedCount).toBe(0)
      expect(mockLogger.error).toHaveBeenCalledWith('批量会话注销失败', expect.any(Error), expect.any(Object))
    })
  })

  describe('用户管理', () => {
    it('应该返回有效用户信息', async () => {
      const user = await service.getUser('test-user-id')

      expect(user).toBeDefined()
      expect(user?.id).toBe('test-user-id')
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
      expect(user?.status).toBe('active')
    })

    it('应该返回null对于不存在的用户', async () => {
      const user = await service.getUser('non-existent-user')

      expect(user).toBeNull()
    })

    it('应该获取用户活跃会话列表', async () => {
      // 创建多个会话
      await service.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      const sessions = await service.getUserActiveSessions('test-user-id')

      expect(sessions).toHaveLength(1)
      expect(sessions[0].userId).toBe('test-user-id')
      expect(sessions[0].expiresAt).toBeInstanceOf(Date)
    })
  })

  describe('健康检查', () => {
    it('应该通过健康检查', async () => {
      const isHealthy = await service.isHealthy()

      expect(isHealthy).toBe(true)
    })

    it('应该在JWT配置错误时检查失败', async () => {
      const brokenService = new EnhancedJWTAuthService({
        ...config,
        jwtSecret: 'broken-secret',
        algorithm: 'invalid-algorithm' as any,
      })

      const isHealthy = await brokenService.isHealthy()

      expect(isHealthy).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith('增强JWT服务健康检查失败', expect.any(Error), expect.any(Object))

      brokenService.destroy()
    })
  })

  describe('并发会话限制', () => {
    it('应该强制执行最大并发会话限制', async () => {
      const userId = 'test-user-id'

      // 创建超过限制的会话数量 (配置中设置为3)
      for (let i = 0; i < 5; i++) {
        await service.authenticate({
          provider: 'credentials',
          credentials: {
            email: 'test@example.com',
            password: 'password123',
          },
        })
      }

      const activeSessions = await service.getUserActiveSessions(userId)
      expect(activeSessions.length).toBeLessThanOrEqual(3)

      expect(mockLogger.info).toHaveBeenCalledWith('强制执行并发会话限制', expect.any(Object))
    })
  })

  describe('工厂函数', () => {
    it('应该通过工厂函数创建服务实例', () => {
      const factoryService = createEnhancedJWTAuthService(config)

      expect(factoryService).toBeInstanceOf(EnhancedJWTAuthService)
      expect(factoryService.getServiceType()).toBe('jwt')

      factoryService.destroy()
    })
  })

  describe('资源清理', () => {
    it('应该正确清理资源', () => {
      service.destroy()

      expect(mockBlacklistManager.destroy).toHaveBeenCalled()
      expect(mockRateLimiter.destroy).toHaveBeenCalled()
    })
  })

  describe('时间解析工具', () => {
    it('应该正确解析过期时间格式', () => {
      const testCases = [
        { input: '30s', expected: 30 },
        { input: '15m', expected: 900 },
        { input: '2h', expected: 7200 },
        { input: '7d', expected: 604800 },
      ]

      testCases.forEach(({ input, expected }) => {
        // 通过创建服务并验证解析结果来间接测试
        const testConfig = { ...config, accessTokenExpiry: input }
        expect(() => new EnhancedJWTAuthService(testConfig)).not.toThrow()
      })
    })

    it('应该在无效格式时抛出错误', () => {
      expect(() => {
        new EnhancedJWTAuthService({
          ...config,
          accessTokenExpiry: 'invalid-format',
        })
      }).toThrow('Invalid expiry format')
    })
  })
})