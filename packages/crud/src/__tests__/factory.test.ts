/**
 * @linch-kit/crud 工厂函数测试
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'

import { createMinimalCrudManager, createCrudManager, createDefaultCrudManager } from '../factory'
import { CrudManager } from '../core/crud-manager'

describe('Factory Functions', () => {
  let mockPrisma: any
  let mockSchemaRegistry: any
  let mockLogger: any
  let mockPluginManager: any

  beforeEach(() => {
    mockPrisma = {
      $transaction: mock(),
      $queryRaw: mock(),
      user: {
        findMany: mock(),
        findUnique: mock(),
        create: mock(),
        update: mock(),
        delete: mock(),
      },
    }

    mockSchemaRegistry = {
      getEntity: mock().mockReturnValue({
        name: 'User',
        fields: {
          id: { type: 'string', required: true },
          email: { type: 'string', required: true },
          name: { type: 'string', required: false },
        },
      }),
    }

    mockLogger = {
      debug: mock(),
      info: mock(),
      warn: mock(),
      error: mock(),
      child: mock().mockReturnValue({
        debug: mock(),
        info: mock(),
        warn: mock(),
        error: mock(),
      }),
    }

    mockPluginManager = {
      getAll: mock().mockReturnValue([]),
    }
  })

  describe('createMinimalCrudManager', () => {
    it('should create a CrudManager instance with minimal options', () => {
      const crudManager = createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)

      expect(crudManager).toBeInstanceOf(CrudManager)

      // 验证最小化配置
      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.options.enablePermissions).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableValidation).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableCache).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableAudit).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableMetrics).toBe(false)
    })

    it('should use provided logger', () => {
      const crudManager = createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      expect(crudManager.logger).toBe(mockLogger)
    })

    it('should use provided prisma client', () => {
      const crudManager = createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      expect(crudManager.prisma).toBe(mockPrisma)
    })

    it('should use provided schema registry', () => {
      const crudManager = createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      expect(crudManager.schemaRegistry).toBe(mockSchemaRegistry)
    })
  })

  describe('createCrudManager', () => {
    it('should create a CrudManager instance with custom options', () => {
      const customOptions = {
        enablePermissions: true,
        enableValidation: true,
        enableCache: false,
        enableAudit: false,
        enableMetrics: true,
      }

      const crudManager = createCrudManager(
        mockPrisma,
        mockSchemaRegistry,
        mockLogger,
        customOptions
      )

      expect(crudManager).toBeInstanceOf(CrudManager)

      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.options.enablePermissions).toBe(true)
      // @ts-ignore
      expect(crudManager.options.enableValidation).toBe(true)
      // @ts-ignore
      expect(crudManager.options.enableCache).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableAudit).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableMetrics).toBe(true)
    })

    it('should create instance with no options', () => {
      const crudManager = createCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)

      expect(crudManager).toBeInstanceOf(CrudManager)
      expect(crudManager.prisma).toBe(mockPrisma)
      expect(crudManager.schemaRegistry).toBe(mockSchemaRegistry)
      expect(crudManager.logger).toBe(mockLogger)
    })

    it('should handle plugin manager option', () => {
      const options = {
        pluginManager: mockPluginManager,
        enablePermissions: true,
      }

      const crudManager = createCrudManager(mockPrisma, mockSchemaRegistry, mockLogger, options)

      expect(crudManager).toBeInstanceOf(CrudManager)
      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.options.enablePermissions).toBe(true)
    })
  })

  describe('createDefaultCrudManager', () => {
    it('should create a CrudManager instance with default full options', () => {
      const crudManager = createDefaultCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)

      expect(crudManager).toBeInstanceOf(CrudManager)

      // 验证默认完整配置
      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.options.enablePermissions).toBe(true)
      // @ts-ignore
      expect(crudManager.options.enableValidation).toBe(true)
      // @ts-ignore
      expect(crudManager.options.enableCache).toBe(true)
      // @ts-ignore
      expect(crudManager.options.enableAudit).toBe(true)
      // @ts-ignore
      expect(crudManager.options.enableMetrics).toBe(true)
    })

    it('should handle plugin manager parameter', () => {
      const crudManager = createDefaultCrudManager(
        mockPrisma,
        mockSchemaRegistry,
        mockLogger,
        mockPluginManager
      )

      expect(crudManager).toBeInstanceOf(CrudManager)
    })
  })

  describe('Factory Function Parameters', () => {
    it('should handle missing optional parameters gracefully', () => {
      expect(() => {
        createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      }).not.toThrow()
    })

    it('should handle undefined options gracefully', () => {
      expect(() => {
        createCrudManager(mockPrisma, mockSchemaRegistry, mockLogger, undefined)
      }).not.toThrow()
    })
  })

  describe('Option Inheritance', () => {
    it('should properly merge options in createCrudManager', () => {
      const options = {
        enableValidation: false,
        enableCache: true,
        pluginManager: mockPluginManager,
      }

      const crudManager = createCrudManager(mockPrisma, mockSchemaRegistry, mockLogger, options)

      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.options.enableValidation).toBe(false)
      // @ts-ignore
      expect(crudManager.options.enableCache).toBe(true)
    })

    it('should use default values when options not provided', () => {
      const crudManager = createCrudManager(mockPrisma, mockSchemaRegistry, mockLogger, {})

      expect(crudManager).toBeInstanceOf(CrudManager)
    })
  })

  describe('Configuration Validation', () => {
    it('should create manager with minimal configuration', () => {
      const manager = createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      expect(manager).toBeInstanceOf(CrudManager)
    })

    it('should create manager with full configuration', () => {
      const manager = createDefaultCrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      expect(manager).toBeInstanceOf(CrudManager)
    })

    it('should create manager with custom configuration', () => {
      const manager = createCrudManager(mockPrisma, mockSchemaRegistry, mockLogger, {
        enablePermissions: false,
        enableValidation: true,
      })
      expect(manager).toBeInstanceOf(CrudManager)
    })
  })
})
