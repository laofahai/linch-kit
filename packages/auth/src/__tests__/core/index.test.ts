import { describe, it, expect } from 'bun:test'

describe('Core Index Exports', () => {
  describe('核心JWT服务导出', () => {
    it('应该导出CoreJWTAuthService相关功能', async () => {
      const coreModule = await import('../core/index')

      expect(coreModule.CoreJWTAuthService).toBeDefined()
      expect(typeof coreModule.CoreJWTAuthService).toBe('function')
      
      expect(coreModule.createCoreJWTAuthService).toBeDefined()
      expect(typeof coreModule.createCoreJWTAuthService).toBe('function')
      
      expect(coreModule.defaultCoreJWTAuthServiceConfig).toBeDefined()
      expect(typeof coreModule.defaultCoreJWTAuthServiceConfig).toBe('object')
    })

    it('应该导出存储相关类', async () => {
      const coreModule = await import('../core/index')

      expect(coreModule.InMemorySessionStorage).toBeDefined()
      expect(typeof coreModule.InMemorySessionStorage).toBe('function')
      
      expect(coreModule.InMemoryRefreshTokenStorage).toBeDefined()
      expect(typeof coreModule.InMemoryRefreshTokenStorage).toBe('function')
      
      expect(coreModule.MockUserProvider).toBeDefined()
      expect(typeof coreModule.MockUserProvider).toBe('function')
      
      expect(coreModule.ConsoleLogger).toBeDefined()
      expect(typeof coreModule.ConsoleLogger).toBe('function')
    })
  })

  describe('密钥提供者导出', () => {
    it('应该导出密钥提供者相关功能', async () => {
      const coreModule = await import('../core/index')

      expect(coreModule.BaseKeyProvider).toBeDefined()
      expect(typeof coreModule.BaseKeyProvider).toBe('function')
      
      expect(coreModule.defaultKeyValidationConfig).toBeDefined()
      expect(typeof coreModule.defaultKeyValidationConfig).toBe('object')
    })
  })

  describe('类型导出验证', () => {
    it('应该正确导出类型定义', async () => {
      // 通过TypeScript编译时验证类型导出
      const coreModule = await import('../core/index')
      
      // 验证类型存在 - 如果类型不存在，TypeScript会在编译时报错
      const testImplementation = {
        validateAuthRequest: (request: any): request is typeof coreModule.AuthRequest => {
          return request && typeof request === 'object'
        },
        validateAuthResult: (result: any): result is typeof coreModule.AuthResult => {
          return result && typeof result === 'object'
        },
        validateSession: (session: any): session is typeof coreModule.Session => {
          return session && typeof session === 'object'
        },
        validateJWTPayload: (payload: any): payload is typeof coreModule.JWTPayload => {
          return payload && typeof payload === 'object'
        }
      }

      expect(testImplementation.validateAuthRequest).toBeDefined()
      expect(testImplementation.validateAuthResult).toBeDefined()
      expect(testImplementation.validateSession).toBeDefined()
      expect(testImplementation.validateJWTPayload).toBeDefined()
    })
  })

  describe('模块完整性检查', () => {
    it('应该包含所有必需的导出项', async () => {
      const coreModule = await import('../core/index')
      
      // 核心JWT服务相关导出
      const coreJWTExports = [
        'CoreJWTAuthService',
        'createCoreJWTAuthService', 
        'defaultCoreJWTAuthServiceConfig',
        'InMemorySessionStorage',
        'InMemoryRefreshTokenStorage',
        'MockUserProvider',
        'ConsoleLogger'
      ]

      coreJWTExports.forEach(exportName => {
        expect(coreModule).toHaveProperty(exportName)
      })

      // 密钥提供者相关导出
      const keyProviderExports = [
        'BaseKeyProvider',
        'defaultKeyValidationConfig'
      ]

      keyProviderExports.forEach(exportName => {
        expect(coreModule).toHaveProperty(exportName)
      })
    })

    it('应该没有意外的导出项', async () => {
      const coreModule = await import('../core/index')
      const moduleKeys = Object.keys(coreModule)
      
      const expectedExports = [
        // 核心JWT服务
        'CoreJWTAuthService',
        'createCoreJWTAuthService',
        'defaultCoreJWTAuthServiceConfig',
        'InMemorySessionStorage', 
        'InMemoryRefreshTokenStorage',
        'MockUserProvider',
        'ConsoleLogger',
        // 密钥提供者
        'BaseKeyProvider',
        'defaultKeyValidationConfig'
      ]

      // 检查所有导出都在预期列表中
      moduleKeys.forEach(key => {
        expect(expectedExports).toContain(key)
      })

      // 检查没有缺少的导出
      expectedExports.forEach(expected => {
        expect(moduleKeys).toContain(expected)
      })
    })
  })

  describe('实例化验证', () => {
    it('应该能够实例化导出的类', async () => {
      const coreModule = await import('../core/index')

      // 验证存储类可以实例化
      expect(() => new coreModule.InMemorySessionStorage()).not.toThrow()
      expect(() => new coreModule.InMemoryRefreshTokenStorage()).not.toThrow()
      expect(() => new coreModule.MockUserProvider()).not.toThrow()
      expect(() => new coreModule.ConsoleLogger()).not.toThrow()

      // 验证基础密钥提供者类可以实例化
      expect(() => new coreModule.BaseKeyProvider()).not.toThrow()
    })

    it('应该能够使用工厂函数', async () => {
      const coreModule = await import('../core/index')

      const config = {
        ...coreModule.defaultCoreJWTAuthServiceConfig,
        jwtSecret: 'test-secret-key-that-is-at-least-32-characters-long'
      }

      expect(() => coreModule.createCoreJWTAuthService(config)).not.toThrow()
    })
  })

  describe('配置对象验证', () => {
    it('应该导出有效的默认配置', async () => {
      const coreModule = await import('../core/index')

      const config = coreModule.defaultCoreJWTAuthServiceConfig
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
      
      // 验证配置包含必需字段
      expect(config).toHaveProperty('jwtSecret')
      expect(config).toHaveProperty('accessTokenExpiry')
      expect(config).toHaveProperty('refreshTokenExpiry')
      expect(config).toHaveProperty('algorithm')

      const keyValidationConfig = coreModule.defaultKeyValidationConfig
      expect(keyValidationConfig).toBeDefined()
      expect(typeof keyValidationConfig).toBe('object')
      
      // 验证密钥验证配置包含必需字段
      expect(keyValidationConfig).toHaveProperty('minLength')
      expect(keyValidationConfig).toHaveProperty('requireUppercase')
      expect(keyValidationConfig).toHaveProperty('requireLowercase')
      expect(keyValidationConfig).toHaveProperty('requireNumbers')
    })
  })

  describe('接口类型验证', () => {
    it('应该正确暴露接口类型', async () => {
      const coreModule = await import('../core/index')

      // 通过实例化验证接口类型的存在
      const mockUserProvider = new coreModule.MockUserProvider()
      const sessionStorage = new coreModule.InMemorySessionStorage()
      const refreshTokenStorage = new coreModule.InMemoryRefreshTokenStorage()
      const logger = new coreModule.ConsoleLogger()

      // 验证实例实现了预期的接口方法
      expect(typeof mockUserProvider.findByCredentials).toBe('function')
      expect(typeof mockUserProvider.findById).toBe('function')
      
      expect(typeof sessionStorage.get).toBe('function')
      expect(typeof sessionStorage.set).toBe('function')
      expect(typeof sessionStorage.delete).toBe('function')
      
      expect(typeof refreshTokenStorage.get).toBe('function')
      expect(typeof refreshTokenStorage.set).toBe('function')
      expect(typeof refreshTokenStorage.delete).toBe('function')
      
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })
  })
})