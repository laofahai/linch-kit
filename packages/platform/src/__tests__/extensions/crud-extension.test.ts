/**
 * CRUD Extension 简化测试套件
 * @module platform/__tests__/extensions/crud-extension-simple.test.ts
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

import { CRUDExtension, createCRUDExtension } from '../../extensions/crud-extension'

// Mock ExtensionContext with proper event system
const mockExtensionContext: ExtensionContext = {
  logger: {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {}),
  },
  config: {},
  registry: new Map(),
  hooks: new Map(),
  events: {
    emit: mock(() => Promise.resolve()),
    on: mock(() => {}),
    off: mock(() => {}),
  },
  eventBus: {
    emit: mock(() => {}),
    on: mock(() => {}),
    off: mock(() => {}),
  },
  metrics: {
    increment: mock(() => {}),
    histogram: mock(() => {}),
    gauge: mock(() => {}),
  },
  performance: {
    mark: mock(() => {}),
    measure: mock(() => {}),
  },
} as ExtensionContext

describe('CRUDExtension', () => {
  let crudExtension: CRUDExtension

  beforeEach(() => {
    mock.restore()
  })

  describe('构造函数', () => {
    it('应该创建CRUD Extension实例', () => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext
      })
      
      expect(crudExtension).toBeInstanceOf(CRUDExtension)
    })

    it('应该通过工厂函数创建实例', () => {
      crudExtension = createCRUDExtension(mockExtensionContext)
      
      expect(crudExtension).toBeInstanceOf(CRUDExtension)
    })

    it('应该支持自定义配置', () => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext,
        enableAudit: false,
        enableEvents: true
      })
      
      expect(crudExtension).toBeInstanceOf(CRUDExtension)
    })
  })

  describe('实体操作创建', () => {
    beforeEach(() => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext
      })
    })

    it('应该创建基本实体操作', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string()
      })
      
      const operations = crudExtension.createEntityOperations('TestEntity', schema)
      
      expect(operations).toBeDefined()
      expect(typeof operations.create).toBe('function')
      expect(typeof operations.findById).toBe('function')
      expect(typeof operations.find).toBe('function')
      expect(typeof operations.update).toBe('function')
      expect(typeof operations.delete).toBe('function')
    })

    it('应该支持复杂schema', () => {
      const schema = z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        email: z.string().email(),
        age: z.number().min(0).max(150),
        isActive: z.boolean().default(true)
      })
      
      const operations = crudExtension.createEntityOperations('User', schema)
      
      expect(operations).toBeDefined()
    })
  })

  describe('CRUD操作', () => {
    let operations: any

    beforeEach(() => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext
      })
      
      const schema = z.object({
        id: z.string().optional(),
        name: z.string(),
        email: z.string().email()
      })
      
      operations = crudExtension.createEntityOperations('User', schema)
    })

    describe('Create', () => {
      it('应该创建记录并返回结果', async () => {
        const data = { name: 'John', email: 'john@example.com' }
        
        const result = await operations.create(data)
        
        expect(result).toEqual(expect.objectContaining({
          id: expect.any(Number),
          name: 'John',
          email: 'john@example.com'
        }))
      })

      it('应该验证输入数据', async () => {
        const invalidData = { name: 123 } // 类型错误
        
        await expect(operations.create(invalidData)).rejects.toThrow()
      })

      it('应该触发审计日志', async () => {
        const data = { name: 'John', email: 'john@example.com' }
        
        await operations.create(data)
        
        expect(mockExtensionContext.logger.info).toHaveBeenCalledWith(
          'Creating User',
          expect.objectContaining({ data })
        )
      })
    })

    describe('FindById', () => {
      it('应该查找记录', async () => {
        const result = await operations.findById('test-id')
        
        expect(result).toBeNull() // Mock实现返回null
        expect(mockExtensionContext.logger.debug).toHaveBeenCalledWith(
          'Finding User by id: test-id'
        )
      })
    })

    describe('Find', () => {
      it('应该查找多个记录', async () => {
        const query = { name: 'John' }
        const result = await operations.find(query)
        
        expect(Array.isArray(result)).toBe(true)
        expect(mockExtensionContext.logger.debug).toHaveBeenCalledWith(
          'Finding User',
          expect.objectContaining({ query })
        )
      })
    })

    describe('Update', () => {
      it('应该更新记录', async () => {
        const updateData = { name: 'Jane' }
        
        const result = await operations.update('test-id', updateData)
        
        expect(result).toEqual(expect.objectContaining({
          id: 'test-id',
          name: 'Jane'
        }))
      })

      it('应该验证更新数据', async () => {
        const invalidData = { email: 'invalid-email' }
        
        await expect(operations.update('test-id', invalidData)).rejects.toThrow()
      })
    })

    describe('Delete', () => {
      it('应该删除记录', async () => {
        const result = await operations.delete('test-id')
        
        expect(result).toBe(true)
        expect(mockExtensionContext.logger.info).toHaveBeenCalledWith(
          'Deleting User #test-id'
        )
      })
    })
  })

  describe('事件处理', () => {
    beforeEach(() => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext
      })
    })

    it('应该注册事件处理器', () => {
      const handlers = {
        beforeCreate: mock(() => Promise.resolve()),
        afterCreate: mock(() => Promise.resolve()),
        beforeUpdate: mock(() => Promise.resolve()),
        afterUpdate: mock(() => Promise.resolve()),
        beforeDelete: mock(() => Promise.resolve()),
        afterDelete: mock(() => Promise.resolve())
      }
      
      crudExtension.registerEventHandlers(handlers)
      
      expect(mockExtensionContext.events.on).toHaveBeenCalledTimes(6)
    })

    it('应该支持部分事件处理器', () => {
      const handlers = {
        beforeCreate: mock(() => Promise.resolve()),
        afterDelete: mock(() => Promise.resolve())
      }
      
      crudExtension.registerEventHandlers(handlers)
      
      expect(mockExtensionContext.events.on).toHaveBeenCalledTimes(2)
    })
  })

  describe('事件触发', () => {
    let operations: any

    beforeEach(() => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext,
        enableEvents: true
      })
      
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      })
      
      operations = crudExtension.createEntityOperations('User', schema)
    })

    it('应该在创建时触发事件', async () => {
      const data = { name: 'John', email: 'john@example.com' }
      
      await operations.create(data)
      
      expect(mockExtensionContext.events.emit).toHaveBeenCalledWith(
        'crud:before:create',
        expect.any(Object)
      )
      expect(mockExtensionContext.events.emit).toHaveBeenCalledWith(
        'crud:after:create',
        expect.any(Object)
      )
    })

    it('应该在删除时触发事件', async () => {
      await operations.delete('test-id')
      
      expect(mockExtensionContext.events.emit).toHaveBeenCalledWith(
        'crud:before:delete',
        expect.any(Object)
      )
      expect(mockExtensionContext.events.emit).toHaveBeenCalledWith(
        'crud:after:delete',
        expect.any(Object)
      )
    })
  })

  describe('配置选项', () => {
    it('应该禁用事件时不触发事件', async () => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext,
        enableEvents: false
      })
      
      const schema = z.object({ name: z.string() })
      const operations = crudExtension.createEntityOperations('Test', schema)
      
      await operations.create({ name: 'test' })
      
      expect(mockExtensionContext.events.emit).not.toHaveBeenCalled()
    })

    it('应该禁用审计时不记录日志', async () => {
      crudExtension = new CRUDExtension({
        extensionContext: mockExtensionContext,
        enableAudit: false
      })
      
      const schema = z.object({ name: z.string() })
      const operations = crudExtension.createEntityOperations('Test', schema)
      
      await operations.create({ name: 'test' })
      
      expect(mockExtensionContext.logger.info).not.toHaveBeenCalled()
    })
  })
})