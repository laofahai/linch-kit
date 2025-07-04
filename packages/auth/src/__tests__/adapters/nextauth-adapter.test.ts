/**
 * @linch-kit/auth NextAuth 适配器测试
 * 
 * @description 测试 NextAuth.js 适配器的核心功能
 * @author LinchKit Team
 * @since 0.1.0
 */

import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'

import {
  createLinchKitAuthConfig,
  createDefaultLinchKitAuthConfig
} from '../../adapters/nextauth-adapter'

// Mock NextAuth.js dependencies
mock.module('next-auth', () => ({
  default: mock(),
  NextAuth: mock()
}))

describe('NextAuth Adapter', () => {
  beforeEach(() => {
    // Bun test handles mock management automatically
    // Reset environment variables
    delete process.env.NEXTAUTH_SECRET
    delete process.env.NEXTAUTH_URL
  })

  afterEach(() => {
    // Bun test handles mock restoration automatically
  })

  describe('createLinchKitAuthConfig', () => {
    /**
     * @description 测试基本配置创建功能
     * @test 应该能够创建基本的 NextAuth 配置
     * @expect 返回有效的 NextAuthConfig 对象
     */
    it('should create basic NextAuth config', () => {
      const config = createLinchKitAuthConfig({
        providers: {
          credentials: {
            authorize: async () => null
          }
        }
      })

      expect(config).toBeDefined()
      expect(config.providers).toBeDefined()
      expect(config.session).toBeDefined()
      expect(config.callbacks).toBeDefined()
    })

    /**
     * @description 测试自定义提供者配置
     * @test 应该能够配置自定义认证提供者
     * @expect 配置中包含指定的提供者
     */
    it('should configure custom providers', () => {
      const mockAuthorize = mock().mockResolvedValue({ id: '1', email: 'test@example.com' })
      
      const config = createLinchKitAuthConfig({
        providers: {
          credentials: {
            authorize: mockAuthorize
          }
        }
      })

      expect(config.providers).toBeDefined()
      expect(Array.isArray(config.providers)).toBe(true)
    })

    /**
     * @description 测试会话配置
     * @test 应该能够配置会话策略和过期时间
     * @expect 会话配置正确设置
     */
    it('should configure session settings', () => {
      const config = createLinchKitAuthConfig({
        providers: {},
        session: {
          strategy: 'jwt',
          maxAge: 24 * 60 * 60 // 24 hours
        }
      })

      expect(config.session).toBeDefined()
      expect(config.session?.strategy).toBe('jwt')
      expect(config.session?.maxAge).toBe(24 * 60 * 60)
    })

    /**
     * @description 测试回调函数配置
     * @test 应该能够配置自定义回调函数
     * @expect 回调函数正确设置
     */
    it('should configure custom callbacks', () => {
      const mockSignIn = mock().mockResolvedValue(true)
      const mockJwt = mock().mockResolvedValue({})
      const mockSession = mock().mockResolvedValue({})

      const config = createLinchKitAuthConfig({
        providers: {},
        callbacks: {
          signIn: mockSignIn,
          jwt: mockJwt,
          session: mockSession
        }
      })

      expect(config.callbacks).toBeDefined()
      expect(typeof config.callbacks?.signIn).toBe('function')
      expect(typeof config.callbacks?.jwt).toBe('function')
      expect(typeof config.callbacks?.session).toBe('function')
    })

    /**
     * @description 测试调试模式配置
     * @test 应该根据环境变量设置调试模式
     * @expect 调试模式正确配置
     */
    it('should configure debug mode based on environment', () => {
      // Test development mode
      process.env.NODE_ENV = 'development'
      const devConfig = createLinchKitAuthConfig({
        providers: {},
        debug: true
      })
      expect(devConfig.debug).toBe(true)

      // Test production mode
      process.env.NODE_ENV = 'production'
      const prodConfig = createLinchKitAuthConfig({
        providers: {},
        debug: false
      })
      expect(prodConfig.debug).toBe(false)
    })
  })

  describe('createDefaultLinchKitAuthConfig', () => {
    /**
     * @description 测试默认配置创建
     * @test 应该能够创建开箱即用的默认配置
     * @expect 返回包含默认设置的配置对象
     */
    it('should create default configuration', () => {
      const config = createDefaultLinchKitAuthConfig()

      expect(config).toBeDefined()
      expect(config.providers).toBeDefined()
      expect(config.session).toBeDefined()
      expect(config.session?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
    })

    /**
     * @description 测试默认凭据提供者
     * @test 默认配置应该包含凭据提供者
     * @expect 凭据提供者正确配置
     */
    it('should include default credentials provider', () => {
      const config = createDefaultLinchKitAuthConfig()

      expect(config.providers).toBeDefined()
      expect(Array.isArray(config.providers)).toBe(true)
      expect(config.providers.length).toBeGreaterThan(0)
    })

    /**
     * @description 测试开发环境调试设置
     * @test 在开发环境下应该启用调试模式
     * @expect 调试模式在开发环境下为 true
     */
    it('should enable debug in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const config = createDefaultLinchKitAuthConfig()
      expect(config.debug).toBe(true)

      process.env.NODE_ENV = originalEnv
    })

    /**
     * @description 测试生产环境调试设置
     * @test 在生产环境下应该禁用调试模式
     * @expect 调试模式在生产环境下为 false
     */
    it('should disable debug in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const config = createDefaultLinchKitAuthConfig()
      expect(config.debug).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error Handling', () => {
    /**
     * @description 测试无效配置处理
     * @test 应该能够处理无效的配置输入
     * @expect 抛出适当的错误或返回默认值
     */
    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        createLinchKitAuthConfig({
          providers: {}
        })
      }).not.toThrow()
    })

    /**
     * @description 测试缺失环境变量处理
     * @test 应该能够在缺失环境变量时正常工作
     * @expect 使用默认值或提供警告
     */
    it('should handle missing environment variables', () => {
      delete process.env.NEXTAUTH_SECRET
      delete process.env.NEXTAUTH_URL

      expect(() => {
        createDefaultLinchKitAuthConfig()
      }).not.toThrow()
    })
  })
})
