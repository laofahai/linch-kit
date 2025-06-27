/**
 * @linch-kit/schema 实体系统测试
 */

import { describe, it, expect } from 'vitest'

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
})
