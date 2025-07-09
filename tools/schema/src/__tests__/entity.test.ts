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
        age: defineField.number().min(0).max(120),
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
        age: defineField.number().optional(),
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
        posts: defineField.relation('Post'),
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
        price: defineField.number().required(),
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
        age: defineField.number().min(0).max(120),
      })

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await User.validate(validData)
      expect(result).toBe(true)
    })

    it('should reject invalid entity data', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().min(0).max(120),
      })

      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        email: 'invalid-email',
        age: -5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await User.validate(invalidData)
      expect(result).toBe(false)
    })

    it('should parse and validate complete data', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = User.validateAndParse(validData)
      expect(result).toEqual(validData)
    })

    it('should validate create input', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const createData = {
        name: 'John Doe',
        email: 'john@example.com',
      }

      const result = User.validateCreate(createData)
      expect(result).toEqual(createData)
    })

    it('should validate update input', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional(),
      })

      const updateData = {
        name: 'John Smith',
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
          email: defineField.email().required(),
        },
        options: {
          timestamps: false,
          softDelete: true,
        },
      })

      expect(User.options.timestamps).toBe(false)
      expect(User.options.softDelete).toBe(true)
    })

    it('should use default options when not specified', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
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
        age: defineField.number().optional(),
      })

      // 测试类型访问器
      expect(User.type).toBeDefined()
      expect(User.createInput).toBeDefined()
      expect(User.updateInput).toBeDefined()
    })
  })

  describe('Entity Helper Methods', () => {
    describe('getTableName', () => {
      it('should return snake_case table name by default', () => {
        const UserProfile = defineEntity('UserProfile', {
          name: defineField.string().required(),
        })

        expect(UserProfile.getTableName()).toBe('user_profile')
      })

      it('should return custom table name when specified', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        }).withOptions({ tableName: 'custom_users' })

        expect(User.getTableName()).toBe('custom_users')
      })

      it('should handle single word entity names', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        })

        expect(User.getTableName()).toBe('user')
      })

      it('should handle complex entity names', () => {
        const VeryLongEntityName = defineEntity('VeryLongEntityName', {
          name: defineField.string().required(),
        })

        expect(VeryLongEntityName.getTableName()).toBe('very_long_entity_name')
      })
    })

    describe('getFieldNames', () => {
      it('should return all field names', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          email: defineField.email().required(),
          age: defineField.number().optional(),
          bio: defineField.text().optional(),
        })

        const fieldNames = User.getFieldNames()
        expect(fieldNames).toContain('name')
        expect(fieldNames).toContain('email')
        expect(fieldNames).toContain('age')
        expect(fieldNames).toContain('bio')
        expect(fieldNames).toHaveLength(4)
      })

      it('should return empty array for entity with no fields', () => {
        const Empty = defineEntity('Empty', {})

        const fieldNames = Empty.getFieldNames()
        expect(fieldNames).toEqual([])
      })
    })

    describe('getRequiredFields', () => {
      it('should return only required field names', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          email: defineField.email().required(),
          age: defineField.number().optional(),
          bio: defineField.text().optional(),
        })

        const requiredFields = User.getRequiredFields()
        expect(requiredFields).toContain('name')
        expect(requiredFields).toContain('email')
        expect(requiredFields).not.toContain('age')
        expect(requiredFields).not.toContain('bio')
        expect(requiredFields).toHaveLength(2)
      })

      it('should return empty array when no required fields', () => {
        const User = defineEntity('User', {
          name: defineField.string().optional(),
          age: defineField.number().optional(),
        })

        const requiredFields = User.getRequiredFields()
        expect(requiredFields).toEqual([])
      })

      it('should return all fields when all are required', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          email: defineField.email().required(),
          age: defineField.number().required(),
        })

        const requiredFields = User.getRequiredFields()
        expect(requiredFields).toHaveLength(3)
        expect(requiredFields).toContain('name')
        expect(requiredFields).toContain('email')
        expect(requiredFields).toContain('age')
      })
    })

    describe('getUniqueFields', () => {
      it('should return only unique field names', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          email: defineField.email().required().unique(),
          username: defineField.string().required().unique(),
          age: defineField.number().optional(),
        })

        const uniqueFields = User.getUniqueFields()
        expect(uniqueFields).toContain('email')
        expect(uniqueFields).toContain('username')
        expect(uniqueFields).not.toContain('name')
        expect(uniqueFields).not.toContain('age')
        expect(uniqueFields).toHaveLength(2)
      })

      it('should return empty array when no unique fields', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          age: defineField.number().optional(),
        })

        const uniqueFields = User.getUniqueFields()
        expect(uniqueFields).toEqual([])
      })
    })

    describe('getIndexedFields', () => {
      it('should return indexed and unique field names', () => {
        const User = defineEntity('User', {
          name: defineField.string().required().index(),
          email: defineField.email().required().unique(),
          username: defineField.string().required().unique().index(),
          age: defineField.number().optional(),
        })

        const indexedFields = User.getIndexedFields()
        expect(indexedFields).toContain('name') // indexed
        expect(indexedFields).toContain('email') // unique (implies indexed)
        expect(indexedFields).toContain('username') // both unique and indexed
        expect(indexedFields).not.toContain('age')
        expect(indexedFields).toHaveLength(3)
      })

      it('should return empty array when no indexed fields', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          age: defineField.number().optional(),
        })

        const indexedFields = User.getIndexedFields()
        expect(indexedFields).toEqual([])
      })
    })

    describe('getRelationFields', () => {
      it('should return relation field entries', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          posts: defineField.relation('Post', 'oneToMany'),
          profile: defineField.relation('Profile', 'oneToOne'),
          roles: defineField.relation('Role', 'manyToMany'),
        })

        const relationFields = User.getRelationFields()
        expect(relationFields).toHaveLength(3)

        const fieldNames = relationFields.map(([name]) => name)
        expect(fieldNames).toContain('posts')
        expect(fieldNames).toContain('profile')
        expect(fieldNames).toContain('roles')

        const postField = relationFields.find(([name]) => name === 'posts')?.[1]
        expect(postField?.type).toBe('relation')
        expect((postField as any)?.target).toBe('Post')
      })

      it('should return empty array when no relation fields', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          email: defineField.email().required(),
        })

        const relationFields = User.getRelationFields()
        expect(relationFields).toEqual([])
      })
    })
  })

  describe('Entity Manipulation Methods', () => {
    describe('clone', () => {
      it('should create a copy of the entity', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          email: defineField.email().required(),
        })

        const clonedUser = User.clone()

        expect(clonedUser.name).toBe(User.name)
        expect(clonedUser.fields).toEqual(User.fields)
        expect(clonedUser.options).toEqual(User.options)
        expect(clonedUser).not.toBe(User) // Different instance
      })

      it('should create independent copy', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        })

        const clonedUser = User.clone()

        // Modifying clone should not affect original
        const extendedClone = clonedUser.extend({
          email: defineField.email().required(),
        })

        expect(User.getFieldNames()).toHaveLength(1)
        expect(extendedClone.getFieldNames()).toHaveLength(2)
      })
    })

    describe('extend', () => {
      it('should add new fields to entity', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        })

        const ExtendedUser = User.extend({
          email: defineField.email().required(),
          age: defineField.number().optional(),
        })

        expect(ExtendedUser.getFieldNames()).toHaveLength(3)
        expect(ExtendedUser.getFieldNames()).toContain('name')
        expect(ExtendedUser.getFieldNames()).toContain('email')
        expect(ExtendedUser.getFieldNames()).toContain('age')
      })

      it('should override existing fields', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
          age: defineField.number().optional(),
        })

        const ExtendedUser = User.extend({
          age: defineField.number().required(), // Override optional with required
        })

        expect(ExtendedUser.fields.age.required).toBe(true)
        expect(User.fields.age.required).toBe(false) // Original unchanged
      })

      it('should preserve original entity options', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        }).withOptions({ timestamps: false, softDelete: true })

        const ExtendedUser = User.extend({
          email: defineField.email().required(),
        })

        expect(ExtendedUser.options.timestamps).toBe(false)
        expect(ExtendedUser.options.softDelete).toBe(true)
      })
    })

    describe('withOptions', () => {
      it('should create entity with new options', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        })

        const UserWithOptions = User.withOptions({
          timestamps: false,
          softDelete: true,
          tableName: 'custom_users',
        })

        expect(UserWithOptions.options.timestamps).toBe(false)
        expect(UserWithOptions.options.softDelete).toBe(true)
        expect(UserWithOptions.options.tableName).toBe('custom_users')

        // Original should be unchanged
        expect(User.options.timestamps).toBe(true)
        expect(User.options.softDelete).toBe(false)
        expect(User.options.tableName).toBeUndefined()
      })

      it('should merge with existing options', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        }).withOptions({ timestamps: false })

        const UserWithMoreOptions = User.withOptions({
          softDelete: true,
          tableName: 'users',
        })

        expect(UserWithMoreOptions.options.timestamps).toBe(false) // Preserved
        expect(UserWithMoreOptions.options.softDelete).toBe(true) // Added
        expect(UserWithMoreOptions.options.tableName).toBe('users') // Added
      })

      it('should override existing options', () => {
        const User = defineEntity('User', {
          name: defineField.string().required(),
        }).withOptions({ timestamps: true })

        const UserWithOverride = User.withOptions({
          timestamps: false, // Override
        })

        expect(UserWithOverride.options.timestamps).toBe(false)
        expect(User.options.timestamps).toBe(true) // Original unchanged
      })
    })
  })

  describe('Complex Entity Scenarios', () => {
    it('should handle entity with all field types and methods', () => {
      const ComplexEntity = defineEntity('ComplexEntity', {
        // Basic types
        name: defineField.string().required().unique().index(),
        count: defineField.number().min(0).required(),
        active: defineField.boolean().required(),

        // Optional types
        description: defineField.text().optional(),
        metadata: defineField.json().optional(),

        // Constrained types
        email: defineField.email().required().unique(),
        website: defineField.url().optional(),

        // Complex types
        status: defineField.enum(['draft', 'published']).required(),
        tags: defineField.array(defineField.string()).optional(),

        // Relations
        authorId: defineField.relation('User', 'manyToOne').required(),
        comments: defineField.relation('Comment', 'oneToMany').optional(),
      }).withOptions({
        tableName: 'complex_entities',
        timestamps: true,
        softDelete: true,
      })

      // Test all helper methods
      expect(ComplexEntity.getTableName()).toBe('complex_entities')
      expect(ComplexEntity.getFieldNames()).toHaveLength(11)
      expect(ComplexEntity.getRequiredFields()).toHaveLength(6)
      expect(ComplexEntity.getUniqueFields()).toHaveLength(2)
      expect(ComplexEntity.getIndexedFields()).toHaveLength(2) // name (unique+index), email (unique)
      expect(ComplexEntity.getRelationFields()).toHaveLength(2)

      // Test manipulation methods
      const cloned = ComplexEntity.clone()
      expect(cloned.getFieldNames()).toHaveLength(11)

      const extended = ComplexEntity.extend({
        newField: defineField.string().optional(),
      })
      expect(extended.getFieldNames()).toHaveLength(12)

      const withNewOptions = ComplexEntity.withOptions({
        timestamps: false,
      })
      expect(withNewOptions.options.timestamps).toBe(false)
      expect(withNewOptions.options.tableName).toBe('complex_entities') // Preserved
    })
  })
})
