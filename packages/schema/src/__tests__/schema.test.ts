/**
 * @linch-kit/schema Schema构建器测试
 */

import { describe, it, expect } from 'bun:test'

import { SchemaBuilder } from '../core/schema'
import { defineField } from '../core/field'

describe('Schema Builder', () => {
  describe('基础功能', () => {
    it('should create empty schema builder', () => {
      const builder = new SchemaBuilder()
      expect(builder).toBeDefined()
    })

    it('should create named schema builder', () => {
      const builder = new SchemaBuilder('User')
      expect(builder).toBeDefined()
    })

    it('should add single field', () => {
      const builder = new SchemaBuilder('User')
      const result = builder.field('name', defineField.string().required().build())
      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(SchemaBuilder)
    })

    it('should add multiple fields', () => {
      const builder = new SchemaBuilder('User')
      const result = builder.fields({
        name: defineField.string().required().build(),
        email: defineField.email().required().build(),
        age: defineField.number().optional().build()
      })
      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(SchemaBuilder)
    })
  })

  describe('链式调用', () => {
    it('should support method chaining', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().build())
        .field('age', defineField.number().optional().build())
      
      expect(builder).toBeDefined()
      expect(builder).toBeInstanceOf(SchemaBuilder)
    })

    it('should support mixed field addition', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .fields({
          email: defineField.email().required().build(),
          age: defineField.number().optional().build()
        })
        .field('isActive', defineField.boolean().build())
      
      expect(builder).toBeDefined()
      expect(builder).toBeInstanceOf(SchemaBuilder)
    })
  })

  describe('实体构建', () => {
    it('should build entity from schema', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .field('email', defineField.email().required().build())
      
      const entity = builder.build()
      expect(entity).toBeDefined()
      expect(entity.name).toBe('User')
      expect(entity.fields.name).toBeDefined()
      expect(entity.fields.email).toBeDefined()
    })

    it('should build entity with options', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .options({ 
          tableName: 'users',
          timestamps: true,
          softDelete: true
        })
      
      const entity = builder.build()
      expect(entity).toBeDefined()
      expect(entity.name).toBe('User')
      expect(entity.options?.tableName).toBe('users')
      expect(entity.options?.timestamps).toBe(true)
      expect(entity.options?.softDelete).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('should handle empty field definitions', () => {
      const builder = new SchemaBuilder('Empty')
      const entity = builder.build()
      expect(entity).toBeDefined()
      expect(entity.name).toBe('Empty')
      expect(Object.keys(entity.fields)).toHaveLength(0)
    })

    it('should handle field override', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .field('name', defineField.text().optional().build()) // 覆盖定义
      
      const entity = builder.build()
      expect(entity).toBeDefined()
      expect(entity.fields.name.type).toBe('text')
      expect(entity.fields.name.required).toBe(false)
    })
  })

  describe('类型安全性', () => {
    it('should maintain type safety in field definitions', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .field('age', defineField.number().optional().build())
      
      const entity = builder.build()
      expect(entity.fields.name.type).toBe('string')
      expect(entity.fields.age.type).toBe('number')
    })

    it('should support complex field types', () => {
      const builder = new SchemaBuilder('Product')
        .field('id', defineField.uuid().auto().build())
        .field('name', defineField.i18n(['en', 'zh-CN']).required().build())
        .field('category', defineField.enum(['electronics', 'clothing', 'books']).build())
        .field('metadata', defineField.json().optional().build())
      
      const entity = builder.build()
      expect(entity.fields.id.type).toBe('uuid')
      expect(entity.fields.name.type).toBe('i18n')
      expect(entity.fields.category.type).toBe('enum')
      expect(entity.fields.metadata.type).toBe('json')
    })
  })

  describe('实体选项', () => {
    it('should support database options', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .options({
          tableName: 'users',
          schema: 'public',
          indexes: [{ fields: ['name'] }]
        })
      
      const entity = builder.build()
      expect(entity.options?.tableName).toBe('users')
      expect(entity.options?.schema).toBe('public')
      expect(entity.options?.indexes).toHaveLength(1)
    })

    it('should support audit options', () => {
      const builder = new SchemaBuilder('User')
        .field('name', defineField.string().required().build())
        .options({
          timestamps: true,
          softDelete: true,
          audit: true
        })
      
      const entity = builder.build()
      expect(entity.options?.timestamps).toBe(true)
      expect(entity.options?.softDelete).toBe(true)
      expect(entity.options?.audit).toBe(true)
    })
  })
})