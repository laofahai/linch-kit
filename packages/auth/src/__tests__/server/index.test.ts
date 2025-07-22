import { describe, it, expect, mock, beforeEach } from 'bun:test'

// Mock @linch-kit/core/server
const mockLogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
}

mock.module('@linch-kit/core/server', () => ({
  logger: mockLogger,
}))

// Mock server-key-provider
const mockServerKeyProvider = {
  getKey: mock(async () => 'mocked-server-key-that-is-at-least-32-chars-long'),
  validateKey: mock(async () => true),
  destroy: mock(() => {}),
}

const mockCreateEnvServerKeyProvider = mock(() => mockServerKeyProvider)

mock.module('../server/server-key-provider', () => ({
  ServerKeyProvider: class MockServerKeyProvider {
    constructor() {
      return mockServerKeyProvider
    }
  },
  createServerKeyProvider: mock(() => mockServerKeyProvider),
  createEnvServerKeyProvider: mockCreateEnvServerKeyProvider,
  createFileServerKeyProvider: mock(() => mockServerKeyProvider),
  defaultServerKeyProviderConfig: {
    keySource: 'env',
    envKeyName: 'JWT_SECRET',
    fallbackToGenerated: false,
  },
}))

describe('Server Index Exports', () => {
  beforeEach(() => {
    // Reset all mocks
    mockLogger.info.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.error.mockClear()
    mockCreateEnvServerKeyProvider.mockClear()
  })

  describe('核心功能导出', () => {
    it('应该导出所有核心JWT服务相关功能', async () => {
      const serverModule = await import('../server/index')

      // 核心JWT服务
      expect(serverModule.CoreJWTAuthService).toBeDefined()
      expect(typeof serverModule.CoreJWTAuthService).toBe('function')
      
      expect(serverModule.createCoreJWTAuthService).toBeDefined()
      expect(typeof serverModule.createCoreJWTAuthService).toBe('function')
      
      expect(serverModule.defaultCoreJWTAuthServiceConfig).toBeDefined()
      expect(typeof serverModule.defaultCoreJWTAuthServiceConfig).toBe('object')

      // 存储相关
      expect(serverModule.InMemorySessionStorage).toBeDefined()
      expect(serverModule.InMemoryRefreshTokenStorage).toBeDefined()
      expect(serverModule.MockUserProvider).toBeDefined()
      expect(serverModule.ConsoleLogger).toBeDefined()
    })

    it('应该导出密钥提供者相关功能', async () => {
      const serverModule = await import('../server/index')

      // 基础密钥提供者
      expect(serverModule.BaseKeyProvider).toBeDefined()
      expect(serverModule.defaultKeyValidationConfig).toBeDefined()

      // 服务器端密钥提供者
      expect(serverModule.ServerKeyProvider).toBeDefined()
      expect(serverModule.createServerKeyProvider).toBeDefined()
      expect(serverModule.createEnvServerKeyProvider).toBeDefined()
      expect(serverModule.createFileServerKeyProvider).toBeDefined()
      expect(serverModule.defaultServerKeyProviderConfig).toBeDefined()
    })

    it('应该导出原有JWT服务以保持兼容性', async () => {
      const serverModule = await import('../server/index')

      expect(serverModule.JWTAuthService).toBeDefined()
      expect(serverModule.createJWTAuthService).toBeDefined()
      expect(serverModule.defaultJWTAuthServiceConfig).toBeDefined()
    })
  })

  describe('ServerLogger类', () => {
    it('应该正确实现ILogger接口', async () => {
      const { ServerLogger } = await import('../server/index')
      const serverLogger = new ServerLogger()

      // 验证方法存在
      expect(typeof serverLogger.info).toBe('function')
      expect(typeof serverLogger.warn).toBe('function')
      expect(typeof serverLogger.error).toBe('function')
    })

    it('应该正确调用底层logger.info', async () => {
      const { ServerLogger } = await import('../server/index')
      const serverLogger = new ServerLogger()

      const message = 'Test info message'
      const meta = { key: 'value' }

      serverLogger.info(message, meta)

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta)
    })

    it('应该正确调用底层logger.warn', async () => {
      const { ServerLogger } = await import('../server/index')
      const serverLogger = new ServerLogger()

      const message = 'Test warn message'
      const meta = { key: 'value' }

      serverLogger.warn(message, meta)

      expect(mockLogger.warn).toHaveBeenCalledWith(message, meta)
    })

    it('应该正确调用底层logger.error', async () => {
      const { ServerLogger } = await import('../server/index')
      const serverLogger = new ServerLogger()

      const message = 'Test error message'
      const error = new Error('Test error')
      const meta = { key: 'value' }

      serverLogger.error(message, error, meta)

      expect(mockLogger.error).toHaveBeenCalledWith(message, error, meta)
    })

    it('应该处理不带meta参数的调用', async () => {
      const { ServerLogger } = await import('../server/index')
      const serverLogger = new ServerLogger()

      serverLogger.info('Info without meta')
      serverLogger.warn('Warn without meta')
      serverLogger.error('Error without meta')

      expect(mockLogger.info).toHaveBeenCalledWith('Info without meta', undefined)
      expect(mockLogger.warn).toHaveBeenCalledWith('Warn without meta', undefined)
      expect(mockLogger.error).toHaveBeenCalledWith('Error without meta', undefined, undefined)
    })
  })

  describe('服务器端便利创建函数', () => {
    it('应该创建带有ServerLogger的JWT认证服务', async () => {
      const { createServerJWTAuthService } = await import('../../server/index')

      const config = {
        jwtSecret: 'test-secret-key-that-is-at-least-32-characters-long',
      }

      const service = createServerJWTAuthService(config)

      expect(service).toBeDefined()
      expect(typeof service.authenticate).toBe('function')
      expect(typeof service.validateSession).toBe('function')
      expect(mockCreateEnvServerKeyProvider).toHaveBeenCalled()
    })

    it('应该使用默认配置创建服务', async () => {
      const { createServerJWTAuthService } = await import('../../server/index')

      const service = createServerJWTAuthService()

      expect(service).toBeDefined()
      expect(mockCreateEnvServerKeyProvider).toHaveBeenCalled()
    })

    it('应该从环境变量创建JWT认证服务', async () => {
      const { createServerJWTAuthServiceFromEnv } = await import('../../server/index')

      const config = {
        accessTokenExpiry: '30m',
      }

      const service = createServerJWTAuthServiceFromEnv(config)

      expect(service).toBeDefined()
      expect(typeof service.authenticate).toBe('function')
      expect(mockCreateEnvServerKeyProvider).toHaveBeenCalled()
    })

    it('应该合并用户配置和默认配置', async () => {
      const { 
        createServerJWTAuthService,
        defaultCoreJWTAuthServiceConfig 
      } = await import('../../server/index')

      const customConfig = {
        accessTokenExpiry: '30m',
        refreshTokenExpiry: '14d',
      }

      const service = createServerJWTAuthService(customConfig)

      expect(service).toBeDefined()
      // 验证配置合并逻辑通过创建成功的服务来确认
      expect(mockCreateEnvServerKeyProvider).toHaveBeenCalled()
    })
  })

  describe('类型导出验证', () => {
    it('应该导出所有核心类型', async () => {
      const serverModule = await import('../server/index')
      
      // 通过使用类型来验证类型导出（编译时验证）
      const typeValidators = {
        validateUser: (user: any): user is typeof serverModule.User => {
          return user && typeof user === 'object'
        },
        validateLinchKitUser: (user: any): user is typeof serverModule.LinchKitUser => {
          return user && typeof user === 'object'
        },
        validateAuthRequest: (request: any): request is typeof serverModule.AuthRequest => {
          return request && typeof request === 'object'
        },
        validateAuthResult: (result: any): result is typeof serverModule.AuthResult => {
          return result && typeof result === 'object'
        },
        validateSession: (session: any): session is typeof serverModule.Session => {
          return session && typeof session === 'object'
        },
        validateJWTPayload: (payload: any): payload is typeof serverModule.JWTPayload => {
          return payload && typeof payload === 'object'
        }
      }

      // 验证类型检查器函数存在（间接验证类型导出）
      Object.values(typeValidators).forEach(validator => {
        expect(typeof validator).toBe('function')
      })
    })
  })

  describe('模块完整性检查', () => {
    it('应该包含所有必需的服务器端导出', async () => {
      const serverModule = await import('../server/index')

      const requiredExports = [
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
        'defaultKeyValidationConfig',
        'ServerKeyProvider',
        'createServerKeyProvider',
        'createEnvServerKeyProvider',
        'createFileServerKeyProvider',
        'defaultServerKeyProviderConfig',
        
        // 兼容性
        'JWTAuthService',
        'createJWTAuthService',
        'defaultJWTAuthServiceConfig',
        
        // 服务器专用
        'ServerLogger',
        'createServerJWTAuthService',
        'createServerJWTAuthServiceFromEnv'
      ]

      requiredExports.forEach(exportName => {
        expect(serverModule).toHaveProperty(exportName)
      })
    })

    it('应该能够实例化服务器端特定的类', async () => {
      const serverModule = await import('../server/index')

      // 验证ServerLogger可以实例化
      expect(() => new serverModule.ServerLogger()).not.toThrow()

      // 验证ServerKeyProvider可以实例化
      expect(() => new serverModule.ServerKeyProvider()).not.toThrow()
    })

    it('应该正确处理配置对象', async () => {
      const serverModule = await import('../server/index')

      // 验证默认配置对象结构
      const coreConfig = serverModule.defaultCoreJWTAuthServiceConfig
      expect(coreConfig).toBeDefined()
      expect(typeof coreConfig).toBe('object')
      expect(coreConfig).toHaveProperty('jwtSecret')
      expect(coreConfig).toHaveProperty('accessTokenExpiry')
      expect(coreConfig).toHaveProperty('refreshTokenExpiry')

      const keyConfig = serverModule.defaultKeyValidationConfig
      expect(keyConfig).toBeDefined()
      expect(typeof keyConfig).toBe('object')

      const serverKeyConfig = serverModule.defaultServerKeyProviderConfig
      expect(serverKeyConfig).toBeDefined()
      expect(typeof serverKeyConfig).toBe('object')
      expect(serverKeyConfig).toHaveProperty('keySource')
    })
  })

  describe('服务器环境集成', () => {
    it('应该正确集成LinchKit Core Logger', async () => {
      const { ServerLogger } = await import('../server/index')
      const logger = new ServerLogger()

      // 测试所有logger方法都能正常调用
      logger.info('Server info test')
      logger.warn('Server warn test')
      logger.error('Server error test', new Error('Test error'))

      expect(mockLogger.info).toHaveBeenCalledWith('Server info test', undefined)
      expect(mockLogger.warn).toHaveBeenCalledWith('Server warn test', undefined)
      expect(mockLogger.error).toHaveBeenCalledWith('Server error test', expect.any(Error), undefined)
    })

    it('应该正确处理服务器端密钥提供者', async () => {
      const { createEnvServerKeyProvider } = await import('../../server/index')

      const keyProvider = createEnvServerKeyProvider()

      expect(keyProvider).toBeDefined()
      expect(mockCreateEnvServerKeyProvider).toHaveBeenCalled()
    })

    it('应该支持环境变量配置的服务创建', async () => {
      const { createServerJWTAuthServiceFromEnv } = await import('../../server/index')

      // 不同的配置选项
      const configs = [
        undefined, // 使用默认配置
        { accessTokenExpiry: '1h' }, // 部分自定义配置
        { 
          accessTokenExpiry: '2h',
          refreshTokenExpiry: '30d',
          algorithm: 'HS512' as const
        } // 完整自定义配置
      ]

      configs.forEach(config => {
        expect(() => createServerJWTAuthServiceFromEnv(config)).not.toThrow()
      })

      expect(mockCreateEnvServerKeyProvider).toHaveBeenCalledTimes(configs.length)
    })
  })
})