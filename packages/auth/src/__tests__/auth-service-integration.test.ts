/**
 * @linch-kit/auth 认证服务集成测试
 * 
 * 针对IAuthService接口的集成测试
 * 提升测试覆盖率至60%+
 * 
 * @author LinchKit Team
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { 
  MockAuthService, 
  AuthServiceFactory, 
  createAuthServiceFactory,
  getAuthService,
  defaultAuthServiceConfig 
} from '../services'
import type { IAuthService, AuthRequest, LinchKitUser } from '../types'

describe('AuthService Integration Tests', () => {
  let authService: IAuthService
  let factory: AuthServiceFactory

  beforeEach(async () => {
    // 重置工厂状态
    AuthServiceFactory.reset()
    
    // 创建工厂实例
    factory = createAuthServiceFactory({
      type: 'mock',
      fallbackToMock: true
    })
    
    authService = await factory.getAuthService()
  })

  afterEach(() => {
    AuthServiceFactory.reset()
  })

  describe('MockAuthService', () => {
    it('should authenticate with valid credentials', async () => {
      const request: AuthRequest = {
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      }

      const result = await authService.authenticate(request)
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('test@linchkit.com')
      expect(result.tokens).toBeDefined()
      expect(result.tokens?.accessToken).toBeDefined()
      expect(result.tokens?.refreshToken).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const request: AuthRequest = {
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'wrong-password'
        }
      }

      const result = await authService.authenticate(request)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.user).toBeUndefined()
    })

    it('should validate session with valid token', async () => {
      // 先进行认证获取token
      const authResult = await authService.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      })

      expect(authResult.success).toBe(true)
      const token = authResult.tokens?.accessToken!

      // 验证会话
      const session = await authService.validateSession(token)
      
      expect(session).toBeDefined()
      expect(session?.userId).toBe('test-user-123')
      expect(session?.accessToken).toBe(token)
    })

    it('should reject invalid session token', async () => {
      const session = await authService.validateSession('invalid-token')
      
      expect(session).toBeNull()
    })

    it('should refresh token successfully', async () => {
      // 先进行认证
      const authResult = await authService.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      })

      const refreshToken = authResult.tokens?.refreshToken!

      // 刷新token
      const newSession = await authService.refreshToken(refreshToken)
      
      expect(newSession).toBeDefined()
      expect(newSession?.accessToken).toBeDefined()
      expect(newSession?.refreshToken).toBeDefined()
      expect(newSession?.accessToken).not.toBe(authResult.tokens?.accessToken)
    })

    it('should revoke session successfully', async () => {
      // 先进行认证
      const authResult = await authService.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      })

      const token = authResult.tokens?.accessToken!
      const session = await authService.validateSession(token)
      
      // 注销会话
      const revoked = await authService.revokeSession(session!.id)
      
      expect(revoked).toBe(true)

      // 验证会话已失效
      const invalidSession = await authService.validateSession(token)
      expect(invalidSession).toBeNull()
    })

    it('should revoke all user sessions', async () => {
      const mockService = authService as MockAuthService
      
      // 创建多个会话
      const authResult1 = await authService.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      })

      const authResult2 = await authService.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      })

      // 验证两个会话都有效
      expect(await authService.validateSession(authResult1.tokens?.accessToken!)).toBeDefined()
      expect(await authService.validateSession(authResult2.tokens?.accessToken!)).toBeDefined()

      // 注销所有会话
      const revokedCount = await authService.revokeAllSessions('test-user-123')
      
      expect(revokedCount).toBe(2)

      // 验证所有会话都已失效
      expect(await authService.validateSession(authResult1.tokens?.accessToken!)).toBeNull()
      expect(await authService.validateSession(authResult2.tokens?.accessToken!)).toBeNull()
    })

    it('should get user by ID', async () => {
      const user = await authService.getUser('test-user-123')
      
      expect(user).toBeDefined()
      expect(user?.id).toBe('test-user-123')
      expect(user?.email).toBe('test@linchkit.com')
    })

    it('should validate credentials directly', async () => {
      const user = await authService.validateCredentials({
        email: 'test@linchkit.com',
        password: 'password123'
      })
      
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@linchkit.com')
    })

    it('should be healthy', async () => {
      const isHealthy = await authService.isHealthy()
      
      expect(isHealthy).toBe(true)
    })

    it('should return correct service type', () => {
      expect(authService.getServiceType()).toBe('mock')
    })
  })

  describe('AuthServiceFactory', () => {
    it('should create singleton instance', () => {
      const factory1 = createAuthServiceFactory()
      const factory2 = createAuthServiceFactory()
      
      expect(factory1).toBe(factory2)
    })

    it('should get auth service instance', async () => {
      const service = await factory.getAuthService()
      
      expect(service).toBeDefined()
      expect(service.getServiceType()).toBe('mock')
    })

    it('should get health status', async () => {
      const health = await factory.getHealthStatus()
      
      expect(health.isHealthy).toBe(true)
      expect(health.serviceType).toBe('mock')
      expect(health.lastChecked).toBeInstanceOf(Date)
    })

    it('should update config', async () => {
      const originalConfig = factory.getConfig()
      
      await factory.updateConfig({
        fallbackToMock: false
      })
      
      const newConfig = factory.getConfig()
      expect(newConfig.fallbackToMock).toBe(false)
      expect(newConfig.type).toBe(originalConfig.type)
    })

    it('should handle unsupported service type with fallback', async () => {
      const factory = createAuthServiceFactory({
        type: 'jwt', // 尚未实现
        fallbackToMock: true
      })
      
      const service = await factory.getAuthService()
      
      // 应该回退到mock服务
      expect(service.getServiceType()).toBe('mock')
    })
  })

  describe('Convenience Functions', () => {
    it('should get auth service via convenience function', async () => {
      const service = await getAuthService()
      
      expect(service).toBeDefined()
      expect(service.getServiceType()).toBe('mock')
    })

    it('should use default config', async () => {
      const service = await getAuthService(defaultAuthServiceConfig)
      
      expect(service).toBeDefined()
      expect(service.getServiceType()).toBe('mock')
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const result = await authService.authenticate({
        provider: 'unsupported',
        credentials: {}
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle expired sessions', async () => {
      // 创建会话
      const authResult = await authService.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@linchkit.com',
          password: 'password123'
        }
      })

      const token = authResult.tokens?.accessToken!
      
      // 模拟会话过期（通过操作内部状态）
      const mockService = authService as MockAuthService
      const sessions = mockService.getAllMockSessions()
      const session = sessions.find(s => s.accessToken === token)
      if (session) {
        session.expiresAt = new Date(Date.now() - 1000) // 设置为过去时间
      }

      // 验证过期会话
      const expiredSession = await authService.validateSession(token)
      expect(expiredSession).toBeNull()
    })
  })
})