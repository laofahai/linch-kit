/**
 * @linch-kit/schema 主入口测试
 */

import { describe, it, expect } from 'vitest'

import { defineField, defineEntity, schema } from '../index'

describe('Schema Package', () => {
  describe('Exports', () => {
    it('should export defineField', () => {
      expect(defineField).toBeDefined()
      expect(typeof defineField.string).toBe('function')
      expect(typeof defineField.number).toBe('function')
      expect(typeof defineField.boolean).toBe('function')
    })

    it('should export defineEntity', () => {
      expect(defineEntity).toBeDefined()
      expect(typeof defineEntity).toBe('function')
    })

    it('should export schema builder', () => {
      expect(schema).toBeDefined()
      expect(typeof schema).toBe('function')
    })
  })

  describe('Integration', () => {
    it('should work with basic user entity example', () => {
      const User = defineEntity('User', {
        id: defineField.uuid(),
        name: defineField.string().required().min(2).max(50),
        email: defineField.email().required().unique(),
        age: defineField.number().optional().min(0).max(120),
        isActive: defineField.boolean(),
        metadata: defineField.json().optional()
      })

      expect(User.name).toBe('User')
      expect(Object.keys(User.fields)).toHaveLength(6)

      // Test field types
      expect(User.fields.id.type).toBe('uuid')
      expect(User.fields.name.type).toBe('string')
      expect(User.fields.email.type).toBe('email')
      expect(User.fields.age.type).toBe('number')
      expect(User.fields.isActive.type).toBe('boolean')
      expect(User.fields.metadata.type).toBe('json')
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety in field definitions', () => {
      const field = defineField.string().required().min(2).max(50)
      const definition = field.build()

      expect(definition.required).toBe(true)
      expect(definition.min).toBe(2)
      expect(definition.max).toBe(50)
    })

    it('should maintain type safety in entity definitions', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required()
      })

      expect(User.fields.name.required).toBe(true)
      expect(User.fields.email.required).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid field configurations gracefully', () => {
      // This should not throw during definition
      const field = defineField.string().min(-1)
      expect(field).toBeDefined()
    })

    it('should handle empty entity definitions', () => {
      const Empty = defineEntity('Empty', {})
      expect(Empty.name).toBe('Empty')
      expect(Object.keys(Empty.fields)).toHaveLength(0)
    })
  })
})
