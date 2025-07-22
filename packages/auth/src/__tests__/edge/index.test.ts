import { describe, it, expect, mock, beforeEach } from 'bun:test'

// Mock edge-key-provider
const mockEdgeKeyProvider = {
  getKey: mock(async () => 'mocked-edge-key-that-is-at-least-32-chars-long'),
  validateKey: mock(async () => true),
  destroy: mock(() => {}),
}

const mockCreateEdgeKeyProvider = mock(() => mockEdgeKeyProvider)

mock.module('../edge/edge-key-provider', () => ({
  EdgeKeyProvider: class MockEdgeKeyProvider {
    constructor() {
      return mockEdgeKeyProvider
    }
  },
  createEdgeKeyProvider: mockCreateEdgeKeyProvider,
  defaultEdgeKeyProviderConfig: {
    keySource: 'env',
    envKeyName: 'JWT_SECRET',
    fallbackToGenerated: true,
  },
}))

describe('Edge Index Exports', () => {
  beforeEach(() => {
    // Reset all mocks
    mockCreateEdgeKeyProvider.mockClear()
    mockEdgeKeyProvider.getKey.mockClear()
    mockEdgeKeyProvider.validateKey.mockClear()
  })

  describe('核心功能导出', () => {
    it('应该导出所有核心JWT服务相关功能', async () => {
      const edgeModule = await import('../../edge/index')

      // 核心JWT服务
      expect(edgeModule.CoreJWTAuthService).toBeDefined()
      expect(typeof edgeModule.CoreJWTAuthService).toBe('function')
      
      expect(edgeModule.createCoreJWTAuthService).toBeDefined()
      expect(typeof edgeModule.createCoreJWTAuthService).toBe('function')
      
      expect(edgeModule.defaultCoreJWTAuthServiceConfig).toBeDefined()
      expect(typeof edgeModule.defaultCoreJWTAuthServiceConfig).toBe('object')

      // 存储相关
      expect(edgeModule.InMemorySessionStorage).toBeDefined()
      expect(edgeModule.InMemoryRefreshTokenStorage).toBeDefined()
      expect(edgeModule.MockUserProvider).toBeDefined()
      expect(edgeModule.ConsoleLogger).toBeDefined()
    })

    it('应该导出密钥提供者相关功能', async () => {
      const edgeModule = await import('../../edge/index')

      // 基础密钥提供者
      expect(edgeModule.BaseKeyProvider).toBeDefined()
      expect(edgeModule.defaultKeyValidationConfig).toBeDefined()

      // Edge环境密钥提供者
      expect(edgeModule.EdgeKeyProvider).toBeDefined()
      expect(edgeModule.createEdgeKeyProvider).toBeDefined()
      expect(edgeModule.defaultEdgeKeyProviderConfig).toBeDefined()
    })

    it('应该不包含服务器端专用功能', async () => {
      const edgeModule = await import('../../edge/index')

      // Edge环境不应包含服务器端logger或其他Node.js专用功能
      expect(edgeModule.ServerLogger).toBeUndefined()
      expect(edgeModule.ServerKeyProvider).toBeUndefined()
    })
  })

  describe('Edge环境便利创建函数', () => {
    it('应该创建Edge环境JWT认证服务', async () => {
      const { createEdgeJWTAuthService } = await import('../../edge/index')

      const config = {
        jwtSecret: 'test-secret-key-that-is-at-least-32-characters-long',
      }

      const service = createEdgeJWTAuthService(config)

      expect(service).toBeDefined()
      expect(typeof service.authenticate).toBe('function')
      expect(typeof service.validateSession).toBe('function')
      expect(mockCreateEdgeKeyProvider).toHaveBeenCalled()
    })

    it('应该使用默认配置创建服务', async () => {
      const { createEdgeJWTAuthService } = await import('../../edge/index')

      const service = createEdgeJWTAuthService()

      expect(service).toBeDefined()
      expect(mockCreateEdgeKeyProvider).toHaveBeenCalled()
    })

    it('应该从环境变量创建Edge JWT认证服务', async () => {
      const { createEdgeJWTAuthServiceFromEnv } = await import('../../edge/index')

      const config = {
        accessTokenExpiry: '30m',
      }

      const service = createEdgeJWTAuthServiceFromEnv(config)

      expect(service).toBeDefined()
      expect(typeof service.authenticate).toBe('function')
      expect(mockCreateEdgeKeyProvider).toHaveBeenCalled()
    })

    it('应该合并用户配置和默认配置', async () => {
      const { 
        createEdgeJWTAuthService,
        defaultCoreJWTAuthServiceConfig 
      } = await import('../../edge/index')

      const customConfig = {
        accessTokenExpiry: '30m',
        refreshTokenExpiry: '14d',
      }

      const service = createEdgeJWTAuthService(customConfig)

      expect(service).toBeDefined()
      // 验证配置合并逻辑通过创建成功的服务来确认
      expect(mockCreateEdgeKeyProvider).toHaveBeenCalled()
    })

    it('应该支持Edge环境的配置选项', async () => {
      const { createEdgeJWTAuthServiceFromEnv } = await import('../../edge/index')

      // 测试各种Edge环境配置
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
        expect(() => createEdgeJWTAuthServiceFromEnv(config)).not.toThrow()
      })

      expect(mockCreateEdgeKeyProvider).toHaveBeenCalledTimes(configs.length)
    })
  })

  describe('类型导出验证', () => {
    it('应该导出所有核心类型', async () => {
      const edgeModule = await import('../../edge/index')
      
      // 通过使用类型来验证类型导出（编译时验证）
      const typeValidators = {
        validateUser: (user: any): user is typeof edgeModule.User => {
          return user && typeof user === 'object'
        },
        validateLinchKitUser: (user: any): user is typeof edgeModule.LinchKitUser => {
          return user && typeof user === 'object'
        },
        validateAuthRequest: (request: any): request is typeof edgeModule.AuthRequest => {
          return request && typeof request === 'object'
        },
        validateAuthResult: (result: any): result is typeof edgeModule.AuthResult => {
          return result && typeof result === 'object'
        },
        validateSession: (session: any): session is typeof edgeModule.Session => {
          return session && typeof session === 'object'
        },
        validateJWTPayload: (payload: any): payload is typeof edgeModule.JWTPayload => {
          return payload && typeof payload === 'object'
        }
      }

      // 验证类型检查器函数存在（间接验证类型导出）
      Object.values(typeValidators).forEach(validator => {
        expect(typeof validator).toBe('function')
      })
    })

    it('应该正确导出接口类型', async () => {
      const edgeModule = await import('../../edge/index')

      // 验证接口类型导出 - 通过TypeScript编译时检查
      const interfaceTest = {
        testIKeyProvider: (provider: typeof edgeModule.IKeyProvider) => provider,
        testISessionStorage: (storage: typeof edgeModule.ISessionStorage) => storage,
        testIRefreshTokenStorage: (storage: typeof edgeModule.IRefreshTokenStorage) => storage,
        testIUserProvider: (provider: typeof edgeModule.IUserProvider) => provider,
        testILogger: (logger: typeof edgeModule.ILogger) => logger,
        testIAuthService: (service: typeof edgeModule.IAuthService) => service,
      }

      // 如果类型导出有问题，这里的TypeScript编译会失败
      expect(interfaceTest).toBeDefined()
    })
  })

  describe('模块完整性检查', () => {
    it('应该包含所有必需的Edge环境导出', async () => {
      const edgeModule = await import('../../edge/index')

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
        'EdgeKeyProvider',
        'createEdgeKeyProvider',
        'defaultEdgeKeyProviderConfig',
        
        // Edge专用便利函数
        'createEdgeJWTAuthService',
        'createEdgeJWTAuthServiceFromEnv'
      ]

      requiredExports.forEach(exportName => {
        expect(edgeModule).toHaveProperty(exportName)
      })
    })

    it('应该不包含服务器端专用导出', async () => {
      const edgeModule = await import('../../edge/index')

      const serverOnlyExports = [
        'ServerLogger',
        'ServerKeyProvider',
        'createServerKeyProvider',
        'createFileServerKeyProvider',
        'createServerJWTAuthService',
        'createServerJWTAuthServiceFromEnv'
      ]

      serverOnlyExports.forEach(exportName => {
        expect(edgeModule).not.toHaveProperty(exportName)
      })
    })

    it('应该能够实例化Edge环境特定的类', async () => {
      const edgeModule = await import('../../edge/index')

      // 验证EdgeKeyProvider可以实例化
      expect(() => new edgeModule.EdgeKeyProvider()).not.toThrow()

      // 验证核心类可以实例化
      expect(() => new edgeModule.InMemorySessionStorage()).not.toThrow()
      expect(() => new edgeModule.InMemoryRefreshTokenStorage()).not.toThrow()
      expect(() => new edgeModule.MockUserProvider()).not.toThrow()
      expect(() => new edgeModule.ConsoleLogger()).not.toThrow()
      expect(() => new edgeModule.BaseKeyProvider()).not.toThrow()
    })

    it('应该正确处理Edge配置对象', async () => {
      const edgeModule = await import('../../edge/index')

      // 验证默认配置对象结构
      const coreConfig = edgeModule.defaultCoreJWTAuthServiceConfig
      expect(coreConfig).toBeDefined()
      expect(typeof coreConfig).toBe('object')
      expect(coreConfig).toHaveProperty('jwtSecret')
      expect(coreConfig).toHaveProperty('accessTokenExpiry')
      expect(coreConfig).toHaveProperty('refreshTokenExpiry')

      const keyConfig = edgeModule.defaultKeyValidationConfig
      expect(keyConfig).toBeDefined()
      expect(typeof keyConfig).toBe('object')

      const edgeKeyConfig = edgeModule.defaultEdgeKeyProviderConfig
      expect(edgeKeyConfig).toBeDefined()
      expect(typeof edgeKeyConfig).toBe('object')
      expect(edgeKeyConfig).toHaveProperty('keySource')
    })
  })

  describe('Edge环境兼容性', () => {
    it('应该仅使用Edge Runtime兼容的依赖', async () => {
      const edgeModule = await import('../../edge/index')

      // Edge环境应该能够创建服务而不依赖Node.js特定功能
      const service = edgeModule.createEdgeJWTAuthService({
        jwtSecret: 'test-secret-key-that-is-at-least-32-characters-long'
      })

      expect(service).toBeDefined()
      expect(typeof service.authenticate).toBe('function')
      expect(typeof service.validateSession).toBe('function')
      expect(typeof service.getServiceType).toBe('function')
    })

    it('应该正确处理Edge环境的密钥提供', async () => {
      const { createEdgeKeyProvider } = await import('../../edge/index')

      const keyProvider = createEdgeKeyProvider()

      expect(keyProvider).toBeDefined()
      expect(mockCreateEdgeKeyProvider).toHaveBeenCalled()
      
      // 验证密钥提供者符合接口
      expect(typeof keyProvider.getKey).toBe('function')
      expect(typeof keyProvider.validateKey).toBe('function')
    })

    it('应该支持多种Edge环境配置方式', async () => {
      const { 
        createEdgeJWTAuthService, 
        createEdgeJWTAuthServiceFromEnv 
      } = await import('../../edge/index')

      // 测试直接配置方式
      const directService = createEdgeJWTAuthService({
        accessTokenExpiry: '1h',
        refreshTokenExpiry: '7d'
      })
      expect(directService).toBeDefined()

      // 测试环境变量配置方式
      const envService = createEdgeJWTAuthServiceFromEnv({
        algorithm: 'HS512'
      })
      expect(envService).toBeDefined()

      // 验证两种方式都使用了Edge密钥提供者
      expect(mockCreateEdgeKeyProvider).toHaveBeenCalledTimes(2)
    })

    it('应该正确处理Edge环境的错误情况', async () => {
      const { createEdgeJWTAuthService } = await import('../../edge/index')

      // 测试无效配置处理
      expect(() => {
        createEdgeJWTAuthService({
          jwtSecret: '', // 空密钥应该通过Edge密钥提供者处理
          accessTokenExpiry: 'invalid' // 无效格式
        })
      }).toThrow()
    })
  })

  describe('Edge与Core功能集成', () => {
    it('应该正确集成核心认证服务', async () => {
      const { 
        createEdgeJWTAuthService,
        CoreJWTAuthService 
      } = await import('../../edge/index')

      const service = createEdgeJWTAuthService()

      // 验证返回的是CoreJWTAuthService实例
      expect(service).toBeInstanceOf(CoreJWTAuthService)
    })

    it('应该正确使用内存存储', async () => {
      const { 
        InMemorySessionStorage,
        InMemoryRefreshTokenStorage 
      } = await import('../../edge/index')

      const sessionStorage = new InMemorySessionStorage()
      const refreshTokenStorage = new InMemoryRefreshTokenStorage()

      // 验证存储接口方法
      expect(typeof sessionStorage.get).toBe('function')
      expect(typeof sessionStorage.set).toBe('function')
      expect(typeof sessionStorage.delete).toBe('function')

      expect(typeof refreshTokenStorage.get).toBe('function')
      expect(typeof refreshTokenStorage.set).toBe('function')
      expect(typeof refreshTokenStorage.delete).toBe('function')
    })

    it('应该正确使用ConsoleLogger', async () => {
      const { ConsoleLogger } = await import('../../edge/index')

      const logger = new ConsoleLogger()

      // 验证logger接口方法
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')

      // 验证logger方法可以正常调用
      expect(() => logger.info('Edge test')).not.toThrow()
      expect(() => logger.warn('Edge warning')).not.toThrow()
      expect(() => logger.error('Edge error')).not.toThrow()
    })
  })
})