/**
 * Entity Schema 测试套件
 * @module platform/__tests__/schema/entity.test.ts
 */

import { describe, it, expect } from 'bun:test'
import { z } from 'zod'

import { defineEntity, Entity, type EntityDefinition } from '../../schema/entity'

describe('Entity Schema', () => {
  describe('defineEntity 函数', () => {
    it('应该创建基础实体', () => {
      const User = defineEntity('User', {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'string', required: true },
        email: { type: 'email', required: true }
      })
      
      expect(User).toBeInstanceOf(Entity)
      expect(User.name).toBe('User')
      expect(User.getFieldNames()).toEqual(['id', 'name', 'email'])
    })

    it('应该支持实体选项', () => {
      const Post = defineEntity('Post', {
        id: { type: 'uuid', primaryKey: true },
        title: { type: 'string', required: true }
      }, {
        tableName: 'blog_posts',
        timestamps: true,
        softDelete: true
      })
      
      expect(Post.name).toBe('Post')
      expect(Post.options?.tableName).toBe('blog_posts')
      expect(Post.options?.timestamps).toBe(true)
      expect(Post.options?.softDelete).toBe(true)
    })

    it('应该处理复杂字段类型', () => {
      const ComplexEntity = defineEntity('ComplexEntity', {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'string', required: true, minLength: 3, maxLength: 50 },
        age: { type: 'number', min: 0, max: 150 },
        tags: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'json' },
        status: { type: 'enum', values: ['active', 'inactive', 'pending'] },
        createdAt: { type: 'date', defaultValue: () => new Date() }
      })
      
      expect(ComplexEntity.getFieldNames()).toContain('name')
      expect(ComplexEntity.getFieldNames()).toContain('age')
      expect(ComplexEntity.getFieldNames()).toContain('tags')
      expect(ComplexEntity.getFieldNames()).toContain('metadata')
      expect(ComplexEntity.getFieldNames()).toContain('status')
      expect(ComplexEntity.getFieldNames()).toContain('createdAt')
    })
  })

  describe('Entity 类方法', () => {
    let TestEntity: Entity<any>

    beforeEach(() => {
      TestEntity = defineEntity('TestEntity', {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        email: { type: 'email', required: true, unique: true },
        age: { type: 'number', min: 0, max: 120 },
        isActive: { type: 'boolean', defaultValue: true },
        tags: { type: 'array', items: { type: 'string' } }
      })
    })

    describe('字段查询方法', () => {
      it('getFieldNames() 应该返回所有字段名', () => {
        const fieldNames = TestEntity.getFieldNames()
        expect(fieldNames).toEqual(['id', 'name', 'email', 'age', 'isActive', 'tags'])
      })

      it('getRequiredFields() 应该返回必需字段', () => {
        const requiredFields = TestEntity.getRequiredFields()
        expect(requiredFields).toContain('name')
        expect(requiredFields).toContain('email')
        expect(requiredFields).not.toContain('age') // 非必需
        expect(requiredFields).not.toContain('isActive') // 有默认值
      })

      it('getUniqueFields() 应该返回唯一字段', () => {
        const uniqueFields = TestEntity.getUniqueFields()
        expect(uniqueFields).toContain('email')
        expect(uniqueFields).not.toContain('name')
      })

      it('getPrimaryKeyFields() 应该返回主键字段', () => {
        const primaryKeys = TestEntity.getPrimaryKeyFields()
        expect(primaryKeys).toEqual(['id'])
      })

      it('getIndexedFields() 应该返回索引字段', () => {
        const indexedFields = TestEntity.getIndexedFields()
        expect(indexedFields).toContain('email') // 唯一字段会被索引
      })

      it('getRelationFields() 应该返回关系字段', () => {
        const UserWithRelations = defineEntity('UserWithRelations', {
          id: { type: 'uuid', primaryKey: true },
          name: { type: 'string', required: true },
          posts: {
            type: 'relation',
            relationName: 'UserPosts',
            relationTo: 'Post',
            relationType: 'oneToMany'
          }
        })
        
        const relationFields = UserWithRelations.getRelationFields()
        expect(relationFields).toHaveLength(1)
        expect(relationFields[0][0]).toBe('posts')
        expect(relationFields[0][1].type).toBe('relation')
      })
    })

    describe('表名生成', () => {
      it('getTableName() 应该返回默认表名（snake_case）', () => {
        const UserProfile = defineEntity('UserProfile', {
          id: { type: 'uuid', primaryKey: true }
        })
        
        expect(UserProfile.getTableName()).toBe('user_profile')
      })

      it('getTableName() 应该返回自定义表名', () => {
        const CustomEntity = defineEntity('CustomEntity', {
          id: { type: 'uuid', primaryKey: true }
        }, {
          tableName: 'custom_table_name'
        })
        
        expect(CustomEntity.getTableName()).toBe('custom_table_name')
      })

      it('getTableName() 应该处理单词实体名', () => {
        const Post = defineEntity('Post', {
          id: { type: 'uuid', primaryKey: true }
        })
        
        expect(Post.getTableName()).toBe('post')
      })
    })

    describe('实体克隆和扩展', () => {
      it('clone() 应该创建独立副本', () => {
        const clonedEntity = TestEntity.clone()
        
        expect(clonedEntity).not.toBe(TestEntity)
        expect(clonedEntity.name).toBe(TestEntity.name)
        expect(clonedEntity.getFieldNames()).toEqual(TestEntity.getFieldNames())
      })

      it('extend() 应该添加新字段', () => {
        const extendedEntity = TestEntity.extend({
          phone: { type: 'string' },
          address: { type: 'text' }
        })
        
        expect(extendedEntity.getFieldNames()).toContain('phone')
        expect(extendedEntity.getFieldNames()).toContain('address')
        expect(extendedEntity.getFieldNames()).toContain('name') // 保留原字段
      })

      it('extend() 应该覆盖现有字段', () => {
        const extendedEntity = TestEntity.extend({
          name: { type: 'string', required: false } // 改为非必需
        })
        
        const requiredFields = extendedEntity.getRequiredFields()
        expect(requiredFields).not.toContain('name')
        expect(requiredFields).toContain('email') // 其他字段不变
      })

      it('withOptions() 应该更新实体选项', () => {
        const entityWithOptions = TestEntity.withOptions({
          timestamps: true,
          softDelete: true
        })
        
        expect(entityWithOptions.options?.timestamps).toBe(true)
        expect(entityWithOptions.options?.softDelete).toBe(true)
      })

      it('withOptions() 应该合并现有选项', () => {
        const EntityWithInitialOptions = defineEntity('TestEntity', {
          id: { type: 'uuid', primaryKey: true }
        }, {
          tableName: 'test_table',
          timestamps: false
        })
        
        const updatedEntity = EntityWithInitialOptions.withOptions({
          timestamps: true,
          softDelete: true
        })
        
        expect(updatedEntity.options?.tableName).toBe('test_table') // 保留
        expect(updatedEntity.options?.timestamps).toBe(true) // 更新
        expect(updatedEntity.options?.softDelete).toBe(true) // 新增
      })
    })

    describe('数据验证', () => {
      it('validate() 应该验证有效数据', () => {
        const validData = {
          id: 'test-uuid-123',
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          tags: ['user', 'admin']
        }
        
        const result = TestEntity.validate(validData)
        expect(result.success).toBe(true)
        expect(result.data).toEqual(validData)
      })

      it('validate() 应该拒绝无效数据', () => {
        const invalidData = {
          id: 'test-uuid-123',
          name: 'A', // 太短
          email: 'invalid-email',
          age: -5, // 负数
          tags: 'not-an-array' // 错误类型
        }
        
        const result = TestEntity.validate(invalidData)
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error!.errors.length).toBeGreaterThan(0)
      })

      it('parse() 应该解析并验证数据', () => {
        const validData = {
          id: 'test-uuid-123',
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        }
        
        const parsedData = TestEntity.parse(validData)
        expect(parsedData).toEqual(expect.objectContaining(validData))
        expect(parsedData.isActive).toBe(true) // 默认值
      })

      it('parse() 应该在数据无效时抛出错误', () => {
        const invalidData = {
          name: '', // 空字符串
          email: 'invalid'
        }
        
        expect(() => TestEntity.parse(invalidData)).toThrow()
      })

      it('safeParse() 应该安全解析数据', () => {
        const validData = {
          id: 'test-uuid-123',
          name: 'John Doe',
          email: 'john@example.com'
        }
        
        const result = TestEntity.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(expect.objectContaining(validData))
        }
      })
    })

    describe('Schema 构建', () => {
      it('buildZodSchema() 应该构建完整的Zod schema', () => {
        const zodSchema = TestEntity.buildZodSchema()
        expect(zodSchema).toBeInstanceOf(z.ZodObject)
        
        // 测试schema验证
        const validData = {
          id: 'test-uuid',
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          tags: ['user']
        }
        
        const result = zodSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('buildCreateSchema() 应该构建创建用的schema', () => {
        const createSchema = TestEntity.buildCreateSchema()
        
        // 创建schema不应该包含主键字段
        const testData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        }
        
        const result = createSchema.safeParse(testData)
        expect(result.success).toBe(true)
        
        // 包含主键字段应该失败或被忽略
        const dataWithId = { ...testData, id: 'should-be-ignored' }
        const resultWithId = createSchema.safeParse(dataWithId)
        expect(resultWithId.success).toBe(true)
      })

      it('buildUpdateSchema() 应该构建更新用的schema', () => {
        const updateSchema = TestEntity.buildUpdateSchema()
        
        // 更新schema所有字段都应该是可选的
        const partialData = { name: 'Updated Name' }
        const result = updateSchema.safeParse(partialData)
        expect(result.success).toBe(true)
        
        // 空对象也应该有效
        const emptyResult = updateSchema.safeParse({})
        expect(emptyResult.success).toBe(true)
      })
    })

    describe('类型安全性', () => {
      it('应该提供类型化的字段访问', () => {
        const entity = defineEntity('TypedEntity', {
          id: { type: 'uuid', primaryKey: true },
          name: { type: 'string', required: true },
          age: { type: 'number' }
        })
        
        // TypeScript类型检查
        const fields = entity.fields
        expect(fields.id.type).toBe('uuid')
        expect(fields.name.type).toBe('string')
        expect(fields.age.type).toBe('number')
      })

      it('应该维护实体定义的类型信息', () => {
        const entity = defineEntity('TypedEntity', {
          id: { type: 'uuid', primaryKey: true },
          name: { type: 'string', required: true }
        })
        
        expect(entity.name).toBe('TypedEntity')
        expect(typeof entity.fields).toBe('object')
        expect(entity.options).toBeDefined()
      })
    })

    describe('边界情况和错误处理', () => {
      it('应该处理空字段定义', () => {
        expect(() => {
          defineEntity('EmptyEntity', {})
        }).not.toThrow()
        
        const EmptyEntity = defineEntity('EmptyEntity', {})
        expect(EmptyEntity.getFieldNames()).toEqual([])
      })

      it('应该处理复杂嵌套结构', () => {
        const ComplexEntity = defineEntity('ComplexEntity', {
          id: { type: 'uuid', primaryKey: true },
          profile: {
            type: 'json',
            schema: {
              name: { type: 'string' },
              settings: {
                type: 'json',
                schema: {
                  theme: { type: 'string' },
                  notifications: { type: 'boolean' }
                }
              }
            }
          },
          relations: {
            type: 'relation',
            relationTo: 'RelatedEntity',
            relationType: 'oneToMany'
          }
        })
        
        expect(ComplexEntity.getFieldNames()).toContain('profile')
        expect(ComplexEntity.getFieldNames()).toContain('relations')
      })

      it('应该处理国际化字段', () => {
        const I18nEntity = defineEntity('I18nEntity', {
          id: { type: 'uuid', primaryKey: true },
          title: {
            type: 'i18n',
            locales: ['en', 'zh', 'ja'],
            required: true
          },
          description: {
            type: 'i18n',
            locales: ['en', 'zh']
          }
        })
        
        expect(I18nEntity.getFieldNames()).toContain('title')
        expect(I18nEntity.getFieldNames()).toContain('description')
      })
    })
  })
})