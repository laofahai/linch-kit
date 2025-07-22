/**
 * @linch-kit/auth AuthServiceFactory JWT集成测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Registry } from 'prom-client'

import { AuthServiceFactory } from '../../services/auth-service-factory'
import { JWTAuthService } from '../../services/jwt-auth.service'
import type { AuthRequest } from '../../types'

describe('AuthServiceFactory JWT集成', () => {
  let registry: Registry

  beforeEach(() => {
    registry = new Registry()
  })

  afterEach(() => {
    AuthServiceFactory.reset()
    registry.clear()
  })

  describe('JWT服务创建', () => {
    it('应该创建JWT认证服务', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars',
          accessTokenExpiry: '15m',
          refreshTokenExpiry: '7d'
        },
        performanceRegistry: registry
      })

      const service = await factory.getAuthService()

      expect(service).toBeInstanceOf(JWTAuthService)
      expect(service.getServiceType()).toBe('jwt')
    })

    it('应该使用默认配置创建JWT服务', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        performanceRegistry: registry
      })

      const service = await factory.getAuthService()

      expect(service).toBeInstanceOf(JWTAuthService)
      expect(service.getServiceType()).toBe('jwt')
    })

    it('应该进行JWT服务健康检查', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars'
        },
        performanceRegistry: registry
      })

      const health = await factory.getHealthStatus()

      expect(health.isHealthy).toBe(true)
      expect(health.serviceType).toBe('jwt')
      expect(health.lastChecked).toBeInstanceOf(Date)
    })
  })

  describe('JWT服务功能', () => {
    let factory: AuthServiceFactory

    beforeEach(() => {
      factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars',
          accessTokenExpiry: '15m',
          refreshTokenExpiry: '7d'
        },
        performanceRegistry: registry
      })
    })

    it('应该通过工厂进行JWT认证', async () => {
      const service = await factory.getAuthService()

      const request: AuthRequest = {
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const result = await service.authenticate(request)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
    })

    it('应该进行JWT会话验证', async () => {
      const service = await factory.getAuthService()

      // 先认证获取令牌
      const authResult = await service.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      expect(authResult.success).toBe(true)

      // 验证会话
      const session = await service.validateSession(authResult.tokens!.accessToken)

      expect(session).toBeDefined()
      expect(session?.userId).toBe('test-user-id')
    })

    it('应该进行JWT令牌刷新', async () => {
      const service = await factory.getAuthService()

      // 先认证获取令牌
      const authResult = await service.authenticate({
        provider: 'credentials',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      expect(authResult.success).toBe(true)

      // 刷新令牌
      const refreshedSession = await service.refreshToken(authResult.tokens!.refreshToken)

      expect(refreshedSession).toBeDefined()
      expect(refreshedSession?.userId).toBe('test-user-id')
    })
  })

  describe('服务切换', () => {
    it('应该从Mock切换到JWT服务', async () => {
      // 先创建Mock服务
      const factory = AuthServiceFactory.getInstance({
        type: 'mock',
        fallbackToMock: true,
        performanceRegistry: registry
      })

      let service = await factory.getAuthService()
      expect(service.getServiceType()).toBe('mock')

      // 切换到JWT服务
      service = await factory.switchService('jwt')
      expect(service.getServiceType()).toBe('jwt')

      // 验证配置已更新
      const config = factory.getConfig()
      expect(config.type).toBe('jwt')
    })

    it('应该从JWT切换到Mock服务', async () => {
      // 先创建JWT服务
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: true,
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars'
        },
        performanceRegistry: registry
      })

      let service = await factory.getAuthService()
      expect(service.getServiceType()).toBe('jwt')

      // 切换到Mock服务
      service = await factory.switchService('mock')
      expect(service.getServiceType()).toBe('mock')

      // 验证配置已更新
      const config = factory.getConfig()
      expect(config.type).toBe('mock')
    })
  })

  describe('错误处理', () => {
    it('应该处理JWT配置错误', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        config: {
          jwtSecret: 'too-short' // 无效的JWT secret
        },
        performanceRegistry: registry
      })

      await expect(factory.getAuthService()).rejects.toThrow('JWT secret must be at least 32 characters long')
    })

    it('应该在JWT失败时回退到Mock服务', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: true,
        config: {
          jwtSecret: 'too-short' // 无效的JWT secret
        },
        performanceRegistry: registry
      })

      const service = await factory.getAuthService()

      // 应该回退到Mock服务
      expect(service.getServiceType()).toBe('mock')
    })

  })

  describe('配置管理', () => {
    it('应该更新JWT配置', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars',
          accessTokenExpiry: '15m'
        },
        performanceRegistry: registry
      })

      // 更新配置
      await factory.updateConfig({
        config: {
          jwtSecret: 'new-test-jwt-secret-with-at-least-32-chars',
          accessTokenExpiry: '30m'
        }
      })

      const config = factory.getConfig()
      expect(config.config).toEqual({
        jwtSecret: 'new-test-jwt-secret-with-at-least-32-chars',
        accessTokenExpiry: '30m'
      })
    })

    it('应该在配置更新时重新创建服务', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'mock',
        fallbackToMock: false,
        performanceRegistry: registry
      })

      // 获取Mock服务
      const mockService = await factory.getAuthService()
      expect(mockService.getServiceType()).toBe('mock')

      // 更新配置切换到JWT
      await factory.updateConfig({
        type: 'jwt',
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars'
        }
      })

      // 应该自动切换到JWT服务
      const jwtService = await factory.getAuthService()
      expect(jwtService.getServiceType()).toBe('jwt')
    })
  })

  describe('服务缓存', () => {
    it('应该缓存JWT服务实例', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'jwt',
        fallbackToMock: false,
        config: {
          jwtSecret: 'test-jwt-secret-with-at-least-32-chars'
        },
        performanceRegistry: registry
      })

      const service1 = await factory.getAuthService()
      const service2 = await factory.getAuthService()

      // 应该返回相同的实例
      expect(service1).toBe(service2)
    })

    it('应该在服务切换时使用缓存', async () => {
      const factory = AuthServiceFactory.getInstance({
        type: 'mock',
        fallbackToMock: false,
        performanceRegistry: registry
      })

      // 获取Mock服务
      const mockService1 = await factory.getAuthService()

      // 切换到JWT
      await factory.switchService('jwt')

      // 再切换回Mock
      const mockService2 = await factory.switchService('mock')

      // 应该使用缓存的Mock服务实例
      expect(mockService1).toBe(mockService2)
    })
  })
})