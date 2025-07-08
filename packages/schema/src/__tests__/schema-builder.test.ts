/**
 * @linch-kit/schema 构建器系统测试
 */

import { describe, it, expect } from 'bun:test'

import { SchemaBuilder } from '../core/schema'
import { defineField } from '../core/field'
import type { Entity, FieldDefinition } from '../types'

describe('Schema Builder', () => {
  describe('Builder Creation', () => {
    it('should create empty schema builder', () => {
      const builder = new SchemaBuilder()
      expect(builder).toBeDefined()
    })

    it('should create named schema builder', () => {
      const builder = new SchemaBuilder('User')
      expect(builder).toBeDefined()
    })
  })

  describe('Field Management', () => {
    it('should add single field', () => {
      const builder = new SchemaBuilder()
      const nameField = defineField.string().required().build()

      const newBuilder = builder.field('name', nameField)
      expect(newBuilder).toBeDefined()
      expect(newBuilder).not.toBe(builder) // Should return new instance
    })

    it('should add multiple fields', () => {
      const builder = new SchemaBuilder()

      const result = builder.fields({
        name: defineField.string().required().build(),
        email: defineField.email().required().build(),
        age: defineField.number().min(0).build(),
      })

      expect(result).toBeDefined()
      expect(result).not.toBe(builder)
    })

    it('should support method chaining', () => {
      const builder = new SchemaBuilder('User')

      const result = builder
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().build())
        .timestamps(true)
        .softDelete(false)

      expect(result).toBeDefined()
    })
  })

  describe('Entity Options', () => {
    it('should set timestamps option', () => {
      const builder = new SchemaBuilder('User')

      const withTimestamps = builder.timestamps(true)
      const withoutTimestamps = builder.timestamps(false)

      expect(withTimestamps).toBeDefined()
      expect(withoutTimestamps).toBeDefined()
    })

    it('should set soft delete option', () => {
      const builder = new SchemaBuilder('User')

      const withSoftDelete = builder.softDelete(true)
      const withoutSoftDelete = builder.softDelete(false)

      expect(withSoftDelete).toBeDefined()
      expect(withoutSoftDelete).toBeDefined()
    })

    it('should set custom options', () => {
      const builder = new SchemaBuilder('User')

      const withOptions = builder.options({
        timestamps: false,
        softDelete: true,
        tableName: 'users',
      })

      expect(withOptions).toBeDefined()
    })

    it('should set table name', () => {
      const builder = new SchemaBuilder('User')

      const withTableName = builder.tableName('custom_users')

      expect(withTableName).toBeDefined()
    })
  })

  describe('Schema Extension', () => {
    it('should extend with another schema builder', () => {
      const baseBuilder = new SchemaBuilder()
        .field('id', defineField.uuid().required().build())
        .field('createdAt', defineField.date().required().build())

      const userBuilder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().build())

      const extended = userBuilder.extend(baseBuilder)

      expect(extended).toBeDefined()
      expect(extended).not.toBe(userBuilder)
      expect(extended).not.toBe(baseBuilder)
    })

    it('should extend with entity', () => {
      const baseSchema = new SchemaBuilder('Base')
        .field('id', defineField.uuid().required().build())
        .field('createdAt', defineField.date().required().build())

      const baseEntity = baseSchema.build('Base') as Entity<Record<string, FieldDefinition>>

      const userBuilder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .extend(baseEntity)

      expect(userBuilder).toBeDefined()
    })
  })

  describe('Entity Building', () => {
    it('should build entity with name', () => {
      const builder = new SchemaBuilder()
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().build())

      const entity = builder.build('User')

      expect(entity).toBeDefined()
      expect(entity.name).toBe('User')
      expect(entity.fields.name).toBeDefined()
      expect(entity.fields.email).toBeDefined()
    })

    it('should build entity with constructor name', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().build())

      const entity = builder.build()

      expect(entity).toBeDefined()
      expect(entity.name).toBe('User')
    })

    it('should throw error when no name provided', () => {
      const builder = new SchemaBuilder().field('name', defineField.string().required().build())

      expect(() => builder.build()).toThrow('Entity name is required')
    })

    it('should build entity with options', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .timestamps(false)
        .softDelete(true)

      const entity = builder.build()

      expect(entity.options.timestamps).toBe(false)
      expect(entity.options.softDelete).toBe(true)
    })
  })

  describe('Immutability', () => {
    it('should return new instance when adding fields', () => {
      const original = new SchemaBuilder('User')
      const withField = original.field('name', defineField.string().required().build())

      expect(withField).not.toBe(original)
    })

    it('should return new instance when setting options', () => {
      const original = new SchemaBuilder('User')
      const withOptions = original.timestamps(true)

      expect(withOptions).not.toBe(original)
    })

    it('should not modify original when extending', () => {
      const base = new SchemaBuilder('Base').field('id', defineField.uuid().required().build())

      const extended = base.field('name', defineField.string().required().build())

      expect(extended).not.toBe(base)
    })
  })

  describe('Complex Schema Building', () => {
    it('should build complex user schema', () => {
      const userSchema = new SchemaBuilder('User')
        .field('id', defineField.uuid().required().build())
        .field('name', defineField.string().required().min(2).max(50).build())
        .field('email', defineField.email().required().unique().build())
        .field('age', defineField.number().optional().min(0).max(120).build())
        .field('isActive', defineField.boolean().default(true).build())
        .field('posts', defineField.relation('Post').build())
        .timestamps(true)
        .softDelete(true)
        .tableName('users')

      const entity = userSchema.build()

      expect(entity.name).toBe('User')
      expect(entity.fields.id).toBeDefined()
      expect(entity.fields.name).toBeDefined()
      expect(entity.fields.email).toBeDefined()
      expect(entity.fields.age).toBeDefined()
      expect(entity.fields.isActive).toBeDefined()
      expect(entity.fields.posts).toBeDefined()
      expect(entity.options.timestamps).toBe(true)
      expect(entity.options.softDelete).toBe(true)
      expect(entity.options.tableName).toBe('users')
    })

    it('should build hierarchical schema with base', () => {
      const baseSchema = new SchemaBuilder()
        .field('id', defineField.uuid().required().build())
        .field('createdAt', defineField.date().required().build())
        .field('updatedAt', defineField.date().required().build())
        .timestamps(true)

      const userSchema = new SchemaBuilder('User')
        .extend(baseSchema)
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().unique().build())
        .softDelete(true)

      const entity = userSchema.build()

      expect(entity.name).toBe('User')
      expect(entity.fields.id).toBeDefined()
      expect(entity.fields.createdAt).toBeDefined()
      expect(entity.fields.updatedAt).toBeDefined()
      expect(entity.fields.name).toBeDefined()
      expect(entity.fields.email).toBeDefined()
      expect(entity.options.timestamps).toBe(true)
      expect(entity.options.softDelete).toBe(true)
    })
  })
})
