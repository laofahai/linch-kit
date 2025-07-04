/**
 * @linch-kit/schema 实体系统测试
 */

import { describe, it, expect } from 'bun:test'

import { defineField, defineEntity } from '../index'

describe('Entity System', () => {
  describe('Basic Entity Creation', () => {
    it('should create entity with simple field definition', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required().unique(),
        age: defineField.number().min(0).max(120)
      })

      expect(User.name).toBe('User')
      expect(User.fields.name).toBeDefined()
      expect(User.fields.email).toBeDefined()
      expect(User.fields.age).toBeDefined()
    })

    it('should create entity with field types', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      expect(User.fields.name.type).toBe('string')
      expect(User.fields.email.type).toBe('email')
      expect(User.fields.age.type).toBe('number')
    })
  })

  describe('Entity with Relations', () => {
    it('should create entity with relations', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        posts: defineField.relation('Post')
      })

      expect(User.fields.posts).toBeDefined()
      expect(User.fields.posts.type).toBe('relation')
    })
  })

  describe('Entity I18n Support', () => {
    it('should create entity with i18n fields', () => {
      const Product = defineEntity('Product', {
        name: defineField.i18n(['en', 'zh-CN']).required(),
        description: defineField.i18n(['en', 'zh-CN']).optional(),
        price: defineField.number().required()
      })

      expect(Product.fields.name.type).toBe('i18n')
      expect(Product.fields.description.type).toBe('i18n')
    })
  })

  describe('Entity Validation', () => {
    it('should validate complete entity data', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().min(0).max(120)
      })

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await User.validate(validData)
      expect(result).toBe(true)
    })

    it('should reject invalid entity data', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().min(0).max(120)
      })

      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        email: 'invalid-email',
        age: -5,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await User.validate(invalidData)
      expect(result).toBe(false)
    })

    it('should parse and validate complete data', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = User.validateAndParse(validData)
      expect(result).toEqual(validData)
    })

    it('should validate create input', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      const createData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const result = User.validateCreate(createData)
      expect(result).toEqual(createData)
    })

    it('should validate update input', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      const updateData = {
        name: 'John Smith'
      }

      const result = User.validateUpdate(updateData)
      expect(result).toEqual(updateData)
    })
  })

  describe('Entity Options', () => {
    it('should create entity with custom options', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required(),
          email: defineField.email().required()
        },
        options: {
          timestamps: false,
          softDelete: true
        }
      })

      expect(User.options.timestamps).toBe(false)
      expect(User.options.softDelete).toBe(true)
    })

    it('should use default options when not specified', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required()
      })

      expect(User.options.timestamps).toBe(true)
      expect(User.options.softDelete).toBe(false)
    })
  })

  describe('Entity Type Safety', () => {
    it('should provide typed access to entity properties', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      // 测试类型访问器
      expect(User.type).toBeDefined()
      expect(User.createInput).toBeDefined()
      expect(User.updateInput).toBeDefined()
    })
  })
})
