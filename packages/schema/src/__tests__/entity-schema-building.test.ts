/**
 * @linch-kit/schema 实体Schema构建测试
 *
 * 测试实体的 Zod Schema 构建功能，包括：
 * - buildZodSchema() - 完整Schema构建
 * - buildCreateSchema() - 创建数据Schema构建
 * - buildUpdateSchema() - 更新数据Schema构建
 */

import { describe, it, expect } from 'bun:test'
import { z } from 'zod'

import { defineEntity, defineField } from '../index'
import type { Entity } from '../types'

describe('Entity Schema Building', () => {
  describe('buildZodSchema - Complete Schema', () => {
    it('should build complete schema with all fields', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const schema = User.zodSchema

      // Test valid data
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => schema.parse(validData)).not.toThrow()
      const parsed = schema.parse(validData)
      expect(parsed.id).toBe(validData.id)
      expect(parsed.name).toBe(validData.name)
      expect(parsed.email).toBe(validData.email)
      expect(parsed.age).toBe(validData.age)
    })

    it('should include ID field automatically', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
      })

      const schema = User.zodSchema

      // Test that ID is required and must be UUID
      expect(() =>
        schema.parse({
          name: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow() // missing id

      expect(() =>
        schema.parse({
          id: 'invalid-uuid',
          name: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow() // invalid UUID

      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).not.toThrow()
    })

    it('should include timestamp fields when enabled', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
      })

      const schema = User.zodSchema

      // Test that timestamps are required
      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
        })
      ).toThrow() // missing timestamps

      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).not.toThrow()
    })

    it('should exclude timestamp fields when disabled', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
      }).withOptions({ timestamps: false })

      const schema = User.zodSchema

      // Test that timestamps are not expected
      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
        })
      ).not.toThrow()
    })

    it('should include soft delete field when enabled', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
      }).withOptions({ softDelete: true })

      const schema = User.zodSchema

      // Test that deletedAt is optional
      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })
      ).not.toThrow()

      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date(),
        })
      ).not.toThrow()
    })

    it('should handle relation fields in schema', () => {
      const Post = defineEntity('Post', {
        title: defineField.string().required(),
        authorId: defineField.relation('User', 'manyToOne').required(),
      })

      const schema = Post.zodSchema

      // Test that relation field expects UUID
      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Post',
          authorId: '456e7890-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).not.toThrow()

      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Post',
          authorId: 'invalid-uuid',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow()
    })

    it('should handle complex field types', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        status: defineField.enum(['active', 'inactive']).required(),
        tags: defineField.array(defineField.string()).optional(),
        metadata: defineField.json().optional(),
      })

      const schema = User.zodSchema

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John',
        status: 'active',
        tags: ['user', 'admin'],
        metadata: { role: 'admin', permissions: ['read', 'write'] },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => schema.parse(validData)).not.toThrow()
    })
  })

  describe('buildCreateSchema - Creation Schema', () => {
    it('should build schema for creation data', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const schema = User.createSchema

      // Test valid creation data (no id, timestamps)
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      }

      expect(() => schema.parse(validData)).not.toThrow()
      const parsed = schema.parse(validData)
      expect(parsed.name).toBe(validData.name)
      expect(parsed.email).toBe(validData.email)
      expect(parsed.age).toBe(validData.age)
    })

    it('should not include ID field in creation schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
      })

      const schema = User.createSchema

      // Test that ID is not part of creation schema
      expect(() =>
        schema.parse({
          name: 'John',
        })
      ).not.toThrow()

      // Including ID should not cause error, but it's not validated
      expect(() =>
        schema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
        })
      ).not.toThrow()
    })

    it('should not include timestamp fields in creation schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
      })

      const schema = User.createSchema

      // Test that timestamps are not part of creation schema
      expect(() =>
        schema.parse({
          name: 'John',
        })
      ).not.toThrow()
    })

    it('should handle required fields in creation schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const schema = User.createSchema

      // Test required fields
      expect(() =>
        schema.parse({
          name: 'John',
        })
      ).toThrow() // missing email

      expect(() =>
        schema.parse({
          email: 'john@example.com',
        })
      ).toThrow() // missing name

      expect(() =>
        schema.parse({
          name: 'John',
          email: 'john@example.com',
        })
      ).not.toThrow() // all required fields present
    })

    it('should handle optional fields in creation schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        age: defineField.number().optional(),
        bio: defineField.text().optional(),
      })

      const schema = User.createSchema

      // Test optional fields can be omitted
      expect(() =>
        schema.parse({
          name: 'John',
        })
      ).not.toThrow()

      // Test optional fields can be included
      expect(() =>
        schema.parse({
          name: 'John',
          age: 30,
          bio: 'Software developer',
        })
      ).not.toThrow()
    })

    it('should skip oneToMany relations in creation schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        posts: defineField.relation('Post', 'oneToMany').optional(),
      })

      const schema = User.createSchema

      // Test that oneToMany relations are not part of creation schema
      expect(() =>
        schema.parse({
          name: 'John',
        })
      ).not.toThrow()

      // oneToMany field should be ignored even if provided
      expect(() =>
        schema.parse({
          name: 'John',
          posts: ['post1', 'post2'],
        })
      ).not.toThrow()
    })
  })

  describe('buildUpdateSchema - Update Schema', () => {
    it('should build schema for update data', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const schema = User.updateSchema

      // Test partial update data
      expect(() =>
        schema.parse({
          name: 'John Updated',
        })
      ).not.toThrow()

      expect(() =>
        schema.parse({
          email: 'john.updated@example.com',
        })
      ).not.toThrow()

      expect(() =>
        schema.parse({
          age: 31,
        })
      ).not.toThrow()
    })

    it('should make all fields optional in update schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
      })

      const schema = User.updateSchema

      // Test that no fields are required in update
      expect(() => schema.parse({})).not.toThrow()

      // Test that individual fields can be updated
      expect(() =>
        schema.parse({
          name: 'New Name',
        })
      ).not.toThrow()

      expect(() =>
        schema.parse({
          email: 'new@example.com',
        })
      ).not.toThrow()
    })

    it('should validate field types in update schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        age: defineField.number().required(),
      })

      const schema = User.updateSchema

      // Test valid updates
      expect(() =>
        schema.parse({
          name: 'Valid Name',
          age: 30,
        })
      ).not.toThrow()

      // Test invalid types
      expect(() =>
        schema.parse({
          name: 123,
        })
      ).toThrow()

      expect(() =>
        schema.parse({
          age: 'not-a-number',
        })
      ).toThrow()
    })

    it('should handle field constraints in update schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().min(2).max(50).required(),
        age: defineField.number().min(0).max(120).required(),
      })

      const schema = User.updateSchema

      // Test valid updates with constraints
      expect(() =>
        schema.parse({
          name: 'Valid Name',
          age: 30,
        })
      ).not.toThrow()

      // Test constraint violations
      expect(() =>
        schema.parse({
          name: 'A',
        })
      ).toThrow() // too short

      expect(() =>
        schema.parse({
          age: -1,
        })
      ).toThrow() // below min

      expect(() =>
        schema.parse({
          age: 150,
        })
      ).toThrow() // above max
    })

    it('should skip oneToMany relations in update schema', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        posts: defineField.relation('Post', 'oneToMany').optional(),
      })

      const schema = User.updateSchema

      // Test that oneToMany relations are not part of update schema
      expect(() =>
        schema.parse({
          name: 'John',
        })
      ).not.toThrow()

      // oneToMany field should be ignored even if provided
      expect(() =>
        schema.parse({
          name: 'John',
          posts: ['post1', 'post2'],
        })
      ).not.toThrow()
    })
  })

  describe('Schema Integration', () => {
    it('should maintain consistency between all schemas', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      // Test that all schemas are properly defined
      expect(User.zodSchema).toBeDefined()
      expect(User.createSchema).toBeDefined()
      expect(User.updateSchema).toBeDefined()

      // Test that all schemas are ZodObject instances
      expect(User.zodSchema).toBeInstanceOf(z.ZodObject)
      expect(User.createSchema).toBeInstanceOf(z.ZodObject)
      expect(User.updateSchema).toBeInstanceOf(z.ZodObject)
    })

    it('should handle complex entities with all field types', () => {
      const ComplexEntity = defineEntity('ComplexEntity', {
        // Basic types
        name: defineField.string().required(),
        count: defineField.number().required(),
        active: defineField.boolean().required(),

        // Optional types
        description: defineField.text().optional(),
        metadata: defineField.json().optional(),

        // Constrained types
        email: defineField.email().required(),
        website: defineField.url().optional(),

        // Complex types
        status: defineField.enum(['draft', 'published', 'archived']).required(),
        tags: defineField.array(defineField.string()).optional(),

        // Relations
        authorId: defineField.relation('User', 'manyToOne').required(),
        comments: defineField.relation('Comment', 'oneToMany').optional(),
      })

      // Test complete schema
      const completeData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Entity',
        count: 42,
        active: true,
        description: 'A test entity',
        metadata: { version: '1.0' },
        email: 'test@example.com',
        website: 'https://example.com',
        status: 'published',
        tags: ['test', 'example'],
        authorId: '456e7890-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => ComplexEntity.zodSchema.parse(completeData)).not.toThrow()

      // Test create schema
      const createData = {
        name: 'Test Entity',
        count: 42,
        active: true,
        email: 'test@example.com',
        status: 'published',
        authorId: '456e7890-e89b-12d3-a456-426614174000',
      }

      expect(() => ComplexEntity.createSchema.parse(createData)).not.toThrow()

      // Test update schema
      const updateData = {
        name: 'Updated Entity',
        active: false,
        description: 'Updated description',
      }

      expect(() => ComplexEntity.updateSchema.parse(updateData)).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should provide meaningful error messages', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        age: defineField.number().min(0).max(120).required(),
      })

      // Test complete schema errors
      try {
        User.zodSchema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          age: 150, // invalid age
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        expect((error as z.ZodError).issues).toHaveLength(1)
        expect((error as z.ZodError).issues[0].path).toContain('age')
      }

      // Test create schema errors
      try {
        User.createSchema.parse({
          name: 'John',
          // missing age
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        expect((error as z.ZodError).issues).toHaveLength(1)
        expect((error as z.ZodError).issues[0].path).toContain('age')
      }
    })
  })
})
