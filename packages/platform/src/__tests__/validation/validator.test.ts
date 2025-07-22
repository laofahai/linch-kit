/**
 * Validator 简化测试套件
 * @module platform/__tests__/validation/validator-simple.test.ts
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

import { Validator, createValidator, CommonValidationRules, type ValidationRule, type CustomValidator } from '../../schema/validator'

// Mock ExtensionContext
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

// Mock Entity for testing
class MockEntity {
  constructor(public name: string) {}
  
  validate(data: unknown) {
    const schema = z.object({
      id: z.string(),
      email: z.string().email(),
      username: z.string().min(3),
      password: z.string().min(8),
      age: z.number().min(0).max(150).optional(),
      isActive: z.boolean().default(true)
    })
    
    return schema.safeParse(data)
  }
}

describe('Validator', () => {
  let validator: Validator

  beforeEach(() => {
    validator = new Validator(mockExtensionContext)
    mock.restore()
  })

  describe('构造函数和初始化', () => {
    it('应该创建验证器实例', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('应该通过工厂函数创建验证器', () => {
      const factoryValidator = createValidator(mockExtensionContext)
      expect(factoryValidator).toBeInstanceOf(Validator)
    })

    it('应该在没有ExtensionContext的情况下创建验证器', () => {
      const simpleValidator = new Validator()
      expect(simpleValidator).toBeInstanceOf(Validator)
    })

    it('应该初始化内置自定义验证器', () => {
      const emailValidator = validator.getCustomValidator('uniqueEmail')
      const passwordValidator = validator.getCustomValidator('strongPassword')
      const usernameValidator = validator.getCustomValidator('availableUsername')
      
      expect(emailValidator).toBeDefined()
      expect(passwordValidator).toBeDefined()
      expect(usernameValidator).toBeDefined()
    })
  })

  describe('验证规则管理', () => {
    const testRule: ValidationRule = {
      field: 'testField',
      validator: z.string().min(1),
      message: 'Test field is required',
      priority: 1
    }

    it('应该添加验证规则', () => {
      validator.addRule('TestEntity', testRule)
      
      const rules = validator.getRules('TestEntity')
      expect(rules).toHaveLength(1)
      expect(rules[0]).toEqual(testRule)
      
      expect(mockExtensionContext.logger.info).toHaveBeenCalledWith(
        'Added validation rule for TestEntity.testField'
      )
    })

    it('应该批量添加验证规则', () => {
      const rules: ValidationRule[] = [
        testRule,
        {
          field: 'anotherField',
          validator: z.number(),
          priority: 2
        }
      ]
      
      validator.addRules('TestEntity', rules)
      
      const addedRules = validator.getRules('TestEntity')
      expect(addedRules).toHaveLength(2)
      // 应该按优先级排序
      expect(addedRules[0].priority).toBe(2)
      expect(addedRules[1].priority).toBe(1)
    })

    it('应该移除实体的所有验证规则', () => {
      validator.addRule('TestEntity', testRule)
      expect(validator.getRules('TestEntity')).toHaveLength(1)
      
      const removed = validator.removeRules('TestEntity')
      expect(removed).toBe(true)
      expect(validator.getRules('TestEntity')).toHaveLength(0)
    })

    it('应该移除特定字段的验证规则', () => {
      validator.addRule('TestEntity', testRule)
      validator.addRule('TestEntity', {
        field: 'otherField',
        validator: z.string()
      })
      
      expect(validator.getRules('TestEntity')).toHaveLength(2)
      
      const removed = validator.removeFieldRules('TestEntity', 'testField')
      expect(removed).toBe(true)
      
      const remainingRules = validator.getRules('TestEntity')
      expect(remainingRules).toHaveLength(1)
      expect(remainingRules[0].field).toBe('otherField')
    })
  })

  describe('自定义验证器管理', () => {
    const customValidator: CustomValidator = (value) => {
      return typeof value === 'string' && value.length > 0
    }

    it('应该添加自定义验证器', () => {
      validator.addCustomValidator('testValidator', customValidator)
      
      const retrieved = validator.getCustomValidator('testValidator')
      expect(retrieved).toBe(customValidator)
      
      expect(mockExtensionContext.logger.info).toHaveBeenCalledWith(
        'Added custom validator: testValidator'
      )
    })

    it('应该移除自定义验证器', () => {
      validator.addCustomValidator('testValidator', customValidator)
      expect(validator.getCustomValidator('testValidator')).toBeDefined()
      
      const removed = validator.removeCustomValidator('testValidator')
      expect(removed).toBe(true)
      expect(validator.getCustomValidator('testValidator')).toBeUndefined()
    })
  })

  describe('实体验证', () => {
    const TestUser = new MockEntity('TestUser')

    it('应该验证有效的实体数据', async () => {
      const validData = {
        id: 'test-uuid-123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPassword123!',
        age: 25,
        isActive: true
      }
      
      const result = await validator.validateEntity(TestUser, validData)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toHaveLength(0)
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.validatedAt).toBeInstanceOf(Date)
      expect(result.metadata?.validatorVersion).toBe('1.0.0')
      expect(typeof result.metadata?.executionTime).toBe('number')
    })

    it('应该验证失败并返回错误信息', async () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab', // 太短
        age: -5, // 负数
        password: '123' // 太短
      }
      
      const result = await validator.validateEntity(TestUser, invalidData)
      
      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.metadata).toBeDefined()
    })

    it('应该应用自定义验证规则', async () => {
      // 添加自定义规则
      validator.addRule('TestUser', {
        field: 'username',
        validator: (value) => {
          if (value === 'admin') {
            return 'Username "admin" is reserved'
          }
          return true
        },
        priority: 1
      })
      
      const dataWithReservedUsername = {
        id: 'test-uuid-123',
        email: 'test@example.com',
        username: 'admin',
        password: 'ValidPassword123!',
        age: 25
      }
      
      const result = await validator.validateEntity(TestUser, dataWithReservedUsername)
      
      expect(result.success).toBe(false)
      expect(result.errors.some(err => 
        err.field === 'username' && err.message === 'Username "admin" is reserved'
      )).toBe(true)
    })
  })

  describe('内置验证器测试', () => {
    it('应该验证唯一邮箱', async () => {
      const uniqueEmailValidator = validator.getCustomValidator('uniqueEmail')!
      
      const validEmail = await uniqueEmailValidator('user@example.com', {
        field: 'email',
        entity: 'User',
        data: {},
        extensionContext: mockExtensionContext
      })
      
      const duplicateEmail = await uniqueEmailValidator('admin@example.com', {
        field: 'email',
        entity: 'User',
        data: {},
        extensionContext: mockExtensionContext
      })
      
      expect(validEmail).toBe(true)
      expect(duplicateEmail).toBe('Email already exists')
    })

    it('应该验证密码强度', async () => {
      const passwordValidator = validator.getCustomValidator('strongPassword')!
      
      const weakPassword = passwordValidator('123456', {
        field: 'password',
        entity: 'User',
        data: {}
      })
      
      const strongPassword = passwordValidator('StrongPass123!', {
        field: 'password',
        entity: 'User',
        data: {}
      })
      
      expect(typeof weakPassword).toBe('string')
      expect(strongPassword).toBe(true)
    })

    it('应该验证用户名可用性', async () => {
      const usernameValidator = validator.getCustomValidator('availableUsername')!
      
      const availableUsername = await usernameValidator('normaluser', {
        field: 'username',
        entity: 'User',
        data: {}
      })
      
      const reservedUsername = await usernameValidator('admin', {
        field: 'username',
        entity: 'User',
        data: {}
      })
      
      expect(availableUsername).toBe(true)
      expect(reservedUsername).toBe('Username is reserved')
    })
  })

  describe('Schema验证器创建', () => {
    it('应该创建Schema验证器', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      
      const schemaValidator = validator.createSchemaValidator(schema)
      
      const validData = { name: 'Test', age: 25 }
      const result = schemaValidator(validData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('应该在Schema验证失败时返回错误', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      
      const schemaValidator = validator.createSchemaValidator(schema)
      
      const invalidData = { name: 'Test', age: 'invalid' }
      const result = schemaValidator(invalidData)
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('通用验证规则预设', () => {
    it('应该包含用户验证规则', () => {
      expect(CommonValidationRules.user).toBeDefined()
      expect(CommonValidationRules.user).toHaveLength(3)
      
      const emailRule = CommonValidationRules.user.find(rule => rule.field === 'email')
      const passwordRule = CommonValidationRules.user.find(rule => rule.field === 'password')
      const usernameRule = CommonValidationRules.user.find(rule => rule.field === 'username')
      
      expect(emailRule).toBeDefined()
      expect(passwordRule).toBeDefined()
      expect(usernameRule).toBeDefined()
    })

    it('应该包含文章验证规则', () => {
      expect(CommonValidationRules.post).toBeDefined()
      expect(CommonValidationRules.post).toHaveLength(3)
      
      const titleRule = CommonValidationRules.post.find(rule => rule.field === 'title')
      const contentRule = CommonValidationRules.post.find(rule => rule.field === 'content')
      const slugRule = CommonValidationRules.post.find(rule => rule.field === 'slug')
      
      expect(titleRule).toBeDefined()
      expect(contentRule).toBeDefined()
      expect(slugRule).toBeDefined()
    })
  })
})