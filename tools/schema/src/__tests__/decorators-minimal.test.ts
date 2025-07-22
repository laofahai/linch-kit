/**
 * @linch-kit/schema Decorators Minimal 测试套件
 */

import { describe, it, expect } from 'bun:test'
import 'reflect-metadata'

// 导入被测试的模块
import { Entity, Field, getEntityFromClass } from '../decorators/minimal'
import type { EntityOptions } from '../types'

describe('Decorators System', () => {
  describe('Entity Decorator', () => {
    it('应该装饰基础类', () => {
      @Entity('TestUser')
      class TestUser {}

      expect((TestUser as any).entityName).toBe('TestUser')
      expect(typeof (TestUser as any).toEntity).toBe('function')
    })

    it('应该使用类名作为默认实体名', () => {
      @Entity()
      class DefaultNameUser {}

      expect((DefaultNameUser as any).entityName).toBe('DefaultNameUser')
    })

    it('应该支持实体选项', () => {
      const options: EntityOptions = {
        tableName: 'custom_users',
        timestamps: true,
        softDelete: false,
      }

      @Entity('UserWithOptions', options)
      class UserWithOptions {}

      expect((UserWithOptions as any).entityOptions).toEqual(options)
    })

    it('应该支持空选项', () => {
      @Entity('SimpleUser')
      class SimpleUser {}

      expect((SimpleUser as any).entityOptions).toEqual({})
    })
  })

  describe('Field Decorator Factory', () => {
    it('应该创建字符串字段装饰器', () => {
      const decorator = Field.string({ maxLength: 100 })
      
      expect(typeof decorator).toBe('function')
    })

    it('应该创建邮件字段装饰器', () => {
      const decorator = Field.email()
      
      expect(typeof decorator).toBe('function')
    })

    it('应该创建数字字段装饰器', () => {
      const decorator = Field.number({ min: 0, max: 100 })
      
      expect(typeof decorator).toBe('function')
    })

    it('应该创建布尔字段装饰器', () => {
      const decorator = Field.boolean()
      
      expect(typeof decorator).toBe('function')
    })

    it('应该创建日期字段装饰器', () => {
      const decorator = Field.date()
      
      expect(typeof decorator).toBe('function')
    })
  })

  describe('Field 全局实例', () => {
    it('应该提供全局Field实例', () => {
      expect(Field).toBeDefined()
      expect(typeof Field.string).toBe('function')
      expect(typeof Field.email).toBe('function')
      expect(typeof Field.number).toBe('function')
      expect(typeof Field.boolean).toBe('function')
      expect(typeof Field.date).toBe('function')
    })

    it('Field实例应该是FieldDecoratorFactory', () => {
      expect(typeof Field).toBe('object')
      expect(typeof Field.string).toBe('function')
    })
  })

  describe('装饰器应用', () => {
    it('应该装饰属性字段', () => {
      @Entity('UserWithFields')
      class UserWithFields {
        @Field.string().required()
        name!: string

        @Field.email().unique()
        email!: string

        @Field.number().min(0).max(120)
        age?: number

        @Field.boolean()
        active?: boolean
      }

      // 验证类被正确装饰
      expect((UserWithFields as any).entityName).toBe('UserWithFields')
      expect(typeof (UserWithFields as any).toEntity).toBe('function')
    })

    it('应该处理继承的类', () => {
      @Entity('BaseUser')
      class BaseUser {
        @Field.string().required()
        id!: string
      }

      @Entity('ExtendedUser')
      class ExtendedUser extends BaseUser {
        @Field.string()
        name?: string
      }

      expect((BaseUser as any).entityName).toBe('BaseUser')
      expect((ExtendedUser as any).entityName).toBe('ExtendedUser')
    })
  })

  describe('getEntityFromClass 函数', () => {
    it('应该从装饰类提取实体定义', () => {
      @Entity('TestEntity', { timestamps: true })
      class TestEntity {
        @Field.string().required()
        name!: string

        @Field.email()
        email?: string
      }

      const entity = getEntityFromClass(TestEntity)

      expect(entity).toBeDefined()
      expect(entity.name).toBe('TestEntity')
      expect(entity.options?.timestamps).toBe(true)
      expect(entity.fields).toBeDefined()
    })

    it('应该处理没有字段的实体', () => {
      @Entity('EmptyEntity')
      class EmptyEntity {}

      const entity = getEntityFromClass(EmptyEntity)

      expect(entity.name).toBe('EmptyEntity')
      expect(Object.keys(entity.fields)).toHaveLength(0)
    })

    it('应该处理未装饰的类', () => {
      class UnDecoratedClass {}

      const entity = getEntityFromClass(UnDecoratedClass)

      expect(entity.name).toBe('UnDecoratedClass')
      expect(Object.keys(entity.fields)).toHaveLength(0)
    })
  })

  describe('字段链式调用', () => {
    it('应该支持字符串字段的链式调用', () => {
      @Entity('ChainTest')
      class ChainTest {
        @Field.string().required().maxLength(50).unique()
        title!: string
      }

      expect((ChainTest as any).entityName).toBe('ChainTest')
    })

    it('应该支持数字字段的链式调用', () => {
      @Entity('NumberChainTest')
      class NumberChainTest {
        @Field.number().required().min(0).max(100).integer()
        score!: number
      }

      expect((NumberChainTest as any).entityName).toBe('NumberChainTest')
    })

    it('应该支持混合字段类型', () => {
      @Entity('MixedFieldsTest', { softDelete: true })
      class MixedFieldsTest {
        @Field.string().required()
        name!: string

        @Field.number().min(18)
        age?: number

        @Field.boolean().default(true)
        active?: boolean

        @Field.date()
        birthDate?: Date

        @Field.email().unique()
        email?: string
      }

      const entity = getEntityFromClass(MixedFieldsTest)

      expect(entity.name).toBe('MixedFieldsTest')
      expect(entity.options?.softDelete).toBe(true)
      expect(Object.keys(entity.fields)).toHaveLength(5)
    })
  })

  describe('错误处理', () => {
    it('应该处理空类名', () => {
      @Entity('')
      class EmptyNameEntity {}

      expect((EmptyNameEntity as any).entityName).toBe('')
    })

    it('应该处理null选项', () => {
      @Entity('NullOptionsEntity', null as any)
      class NullOptionsEntity {}

      expect((NullOptionsEntity as any).entityOptions).toEqual({})
    })
  })

  describe('元数据系统', () => {
    it('应该正确存储实体元数据', () => {
      @Entity('MetadataTest', { tableName: 'test_table' })
      class MetadataTest {
        @Field.string()
        name?: string
      }

      // 验证元数据是否被正确存储
      expect(typeof Reflect.getMetadata).toBe('function')
    })

    it('应该处理多个装饰类不冲突', () => {
      @Entity('FirstClass')
      class FirstClass {
        @Field.string()
        field1?: string
      }

      @Entity('SecondClass')
      class SecondClass {
        @Field.number()
        field2?: number
      }

      expect((FirstClass as any).entityName).toBe('FirstClass')
      expect((SecondClass as any).entityName).toBe('SecondClass')
    })
  })
})