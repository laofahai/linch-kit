import { describe, it, expect } from 'vitest'
import { defineEntity } from '../entity'
import { defineField } from '../field'

describe('Entity System', () => {
  describe('Basic Entity Creation', () => {
    it('should create entity with simple field definition', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required().unique(),
        age: defineField.number().min(0).max(120)
      })

      expect(User.name).toBe('User')
      expect(User.fields.name.type).toBe('string')
      expect(User.fields.name.required).toBe(true)
      expect(User.fields.email.type).toBe('email')
      expect(User.fields.email.unique).toBe(true)
      expect(User.fields.age.type).toBe('number')
      expect(User.fields.age.min).toBe(0)
      expect(User.fields.age.max).toBe(120)
    })

    it('should create entity with configuration object', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required(),
          email: defineField.email().required()
        },
        table: {
          name: 'users',
          comment: 'User table'
        },
        timestamps: true,
        softDelete: true
      })

      expect(User.name).toBe('User')
      expect(User.table?.name).toBe('users')
      expect(User.table?.comment).toBe('User table')
      expect(User.timestamps).toBe(true)
      expect(User.softDelete).toBe(true)
    })

    it('should generate Zod schemas for entity', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      expect(User.zodSchema).toBeDefined()
      expect(User.createSchema).toBeDefined()
      expect(User.updateSchema).toBeDefined()

      // Test validation
      const validUser = { name: 'John', email: 'john@example.com', age: 30 }
      const result = User.zodSchema.safeParse(validUser)
      expect(result.success).toBe(true)

      const invalidUser = { name: '', email: 'invalid-email' }
      const invalidResult = User.zodSchema.safeParse(invalidUser)
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('Entity with Relations', () => {
    it('should create entity with relations', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        posts: defineField.relation('Post').oneToMany()
      })

      expect(User.fields.posts.type).toBe('relation')
      expect(User.fields.posts.target).toBe('Post')
      expect(User.fields.posts.relationType).toBe('oneToMany')
    })

    it('should create entity with multiple relation types', () => {
      const Post = defineEntity('Post', {
        title: defineField.string().required(),
        author: defineField.relation('User').manyToOne(),
        tags: defineField.relation('Tag').manyToMany(),
        category: defineField.relation('Category').oneToOne()
      })

      expect(Post.fields.author.relationType).toBe('manyToOne')
      expect(Post.fields.tags.relationType).toBe('manyToMany')
      expect(Post.fields.category.relationType).toBe('oneToOne')
    })
  })

  describe('Entity Validation', () => {
    it('should validate required fields', () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required()
      })

      const result = User.createSchema.safeParse({})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2)
      }
    })

    it('should validate field constraints', () => {
      const User = defineEntity('User', {
        name: defineField.string().min(2).max(50),
        age: defineField.number().min(0).max(120)
      })

      const result1 = User.createSchema.safeParse({ name: 'A', age: -1 })
      expect(result1.success).toBe(false)

      const result2 = User.createSchema.safeParse({ name: 'John', age: 25 })
      expect(result2.success).toBe(true)
    })
  })

  describe('Entity with Timestamps', () => {
    it('should add timestamp fields when enabled', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        timestamps: true
      })

      expect(User.fields.createdAt).toBeDefined()
      expect(User.fields.updatedAt).toBeDefined()
      expect(User.fields.createdAt.type).toBe('date')
      expect(User.fields.updatedAt.type).toBe('date')
    })

    it('should not add timestamp fields when disabled', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        timestamps: false
      })

      expect(User.fields.createdAt).toBeUndefined()
      expect(User.fields.updatedAt).toBeUndefined()
    })
  })

  describe('Entity with Soft Delete', () => {
    it('should add soft delete field when enabled', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        softDelete: true
      })

      expect(User.fields.deletedAt).toBeDefined()
      expect(User.fields.deletedAt.type).toBe('date')
      expect(User.fields.deletedAt.required).toBe(false)
    })
  })

  describe('Entity Indexes', () => {
    it('should define indexes on entity', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required(),
          email: defineField.email().required().unique(),
          createdAt: defineField.date().index()
        },
        indexes: [
          { fields: ['name', 'email'], unique: true },
          { fields: ['createdAt'], name: 'idx_created_at' }
        ]
      })

      expect(User.indexes).toBeDefined()
      expect(User.indexes).toHaveLength(2)
      expect(User.indexes?.[0].fields).toEqual(['name', 'email'])
      expect(User.indexes?.[0].unique).toBe(true)
      expect(User.indexes?.[1].name).toBe('idx_created_at')
    })
  })

  describe('Entity I18n Support', () => {
    it('should create entity with i18n fields', () => {
      const Product = defineEntity('Product', {
        name: defineField.i18n(['en', 'zh-CN']).required(),
        description: defineField.i18n(['en', 'zh-CN']),
        price: defineField.number().required()
      })

      expect(Product.fields.name.type).toBe('i18n')
      expect(Product.fields.name.locales).toEqual(['en', 'zh-CN'])
      expect(Product.fields.description.type).toBe('i18n')
    })
  })

  describe('Entity Hooks', () => {
    it('should define entity hooks', () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required(),
          email: defineField.email().required()
        },
        hooks: {
          beforeCreate: [
            (data) => {
              data.email = data.email.toLowerCase()
              return data
            }
          ],
          afterCreate: [
            (entity) => {
              console.log('User created:', entity.name)
            }
          ]
        }
      })

      expect(User.hooks?.beforeCreate).toBeDefined()
      expect(User.hooks?.afterCreate).toBeDefined()
      expect(User.hooks?.beforeCreate).toHaveLength(1)
      expect(User.hooks?.afterCreate).toHaveLength(1)
    })
  })
})