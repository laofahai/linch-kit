/**
 * @linch-kit/crud CrudManager 测试
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'

import { CrudManager } from '../core/crud-manager'

describe('CrudManager', () => {
  let mockPrisma: any
  let mockSchemaRegistry: any
  let mockLogger: any
  let crudManager: CrudManager

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

    crudManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger, null, {
      enablePermissions: false,
      enableValidation: false,
      enableCache: false,
      enableAudit: false,
      enableMetrics: false,
    })
  })

  describe('Construction', () => {
    it('should create instance with required parameters', () => {
      expect(crudManager).toBeInstanceOf(CrudManager)
      expect(crudManager.prisma).toBe(mockPrisma)
    })

    it('should create instance with default options', () => {
      const defaultManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      expect(defaultManager).toBeInstanceOf(CrudManager)
    })
  })

  describe('Client Access', () => {
    it('should provide access to prisma client', () => {
      expect(crudManager.client).toBe(mockPrisma)
    })

    it('should provide access to original prisma instance', () => {
      expect(crudManager.prisma).toBe(mockPrisma)
    })
  })

  describe('Model Access', () => {
    it('should get model for entity name', () => {
      const userModel = crudManager.model('user')
      expect(userModel).toBe(mockPrisma.user)
    })

    it('should throw error for non-existent model', () => {
      expect(() => {
        crudManager.model('nonexistent')
      }).toThrow('Prisma model for entity nonexistent not found')
    })

    it('should handle uppercase entity names', () => {
      const userModel = crudManager.model('User')
      expect(userModel).toBe(mockPrisma.user)
    })
  })

  describe('Create Operations', () => {
    it('should create record with basic data', async () => {
      const testData = { email: 'test@example.com', name: 'Test User' }
      const expectedResult = { id: '1', ...testData }
      
      mockPrisma.user.create.mockResolvedValue(expectedResult)
      
      const result = await crudManager.create('user', testData)
      
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: testData
      })
      expect(result).toEqual(expectedResult)
    })

    it('should handle create with options', async () => {
      const testData = { email: 'test@example.com', name: 'Test User' }
      const expectedResult = { id: '1', ...testData }
      const options = { skipValidation: true }
      
      mockPrisma.user.create.mockResolvedValue(expectedResult)
      
      const result = await crudManager.create('user', testData, options)
      
      expect(result).toEqual(expectedResult)
    })
  })

  describe('Find Operations - Basic', () => {
    it('should find many records without query', async () => {
      const expectedResults = [
        { id: '1', email: 'test1@example.com', name: 'User 1' },
        { id: '2', email: 'test2@example.com', name: 'User 2' }
      ]
      
      mockPrisma.user.findMany.mockResolvedValue(expectedResults)
      
      const results = await crudManager.findMany('user')
      
      expect(mockPrisma.user.findMany).toHaveBeenCalled()
      expect(results).toEqual(expectedResults)
    })
  })

  describe('Configuration', () => {
    it('should respect enableValidation option', () => {
      const validationManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger, null, {
        enableValidation: true,
      })
      
      // @ts-ignore - 访问私有属性进行测试
      expect(validationManager.options.enableValidation).toBe(true)
    })

    it('should respect enablePermissions option', () => {
      const permissionManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger, null, {
        enablePermissions: true,
      })
      
      // @ts-ignore - 访问私有属性进行测试
      expect(permissionManager.options.enablePermissions).toBe(true)
    })

    it('should respect enableCache option', () => {
      const cacheManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger, null, {
        enableCache: true,
      })
      
      // @ts-ignore - 访问私有属性进行测试
      expect(cacheManager.options.enableCache).toBe(true)
    })

    it('should respect enableAudit option', () => {
      const auditManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger, null, {
        enableAudit: true,
      })
      
      // @ts-ignore - 访问私有属性进行测试
      expect(auditManager.options.enableAudit).toBe(true)
    })

    it('should respect enableMetrics option', () => {
      const metricsManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger, null, {
        enableMetrics: true,
      })
      
      // @ts-ignore - 访问私有属性进行测试
      expect(metricsManager.options.enableMetrics).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle prisma errors gracefully', async () => {
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'))
      
      await expect(crudManager.create('user', { email: 'test@example.com' }))
        .rejects.toThrow('Database error')
    })

    it('should handle invalid model names', () => {
      expect(() => {
        crudManager.model('invalidModel')
      }).toThrow('Prisma model for entity invalidModel not found')
    })
  })

  describe('Manager Components', () => {
    it('should have validation manager', () => {
      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.validationManager).toBeDefined()
    })

    it('should have permission checker', () => {
      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.permissionChecker).toBeDefined()
    })

    it('should have cache manager', () => {
      // @ts-ignore - 访问私有属性进行测试
      expect(crudManager.cacheManager).toBeDefined()
    })
  })

  describe('Default Options', () => {
    it('should use default options when none provided', () => {
      const defaultManager = new CrudManager(mockPrisma, mockSchemaRegistry, mockLogger)
      
      // @ts-ignore - 访问私有属性进行测试
      expect(defaultManager.options.enablePermissions).toBe(true)
      // @ts-ignore
      expect(defaultManager.options.enableValidation).toBe(true)
      // @ts-ignore
      expect(defaultManager.options.enableCache).toBe(true)
      // @ts-ignore
      expect(defaultManager.options.enableAudit).toBe(true)
      // @ts-ignore
      expect(defaultManager.options.enableMetrics).toBe(true)
    })
  })
})