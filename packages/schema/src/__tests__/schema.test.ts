import { describe, it, expect } from 'vitest'
import { schema } from '../schema'
import { defineField } from '../field'

describe('Schema Builder System', () => {
  describe('Basic Schema Creation', () => {
    it('should create empty schema', () => {
      const userSchema = schema('User')
      expect(userSchema.name).toBe('User')
      expect(userSchema.fields).toEqual({})
    })

    it('should create schema with fields', () => {
      const userSchema = schema('User')
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())
        .field('age', defineField.number().min(0))

      expect(userSchema.name).toBe('User')
      expect(userSchema.fields.name.type).toBe('string')
      expect(userSchema.fields.email.type).toBe('email')
      expect(userSchema.fields.age.type).toBe('number')
    })

    it('should build final entity from schema', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())
        .build()

      expect(User.name).toBe('User')
      expect(User.zodSchema).toBeDefined()
      expect(User.createSchema).toBeDefined()
      expect(User.updateSchema).toBeDefined()
    })
  })

  describe('Schema with Timestamps', () => {
    it('should add timestamps to schema', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .timestamps()
        .build()

      expect(User.fields.createdAt).toBeDefined()
      expect(User.fields.updatedAt).toBeDefined()
      expect(User.fields.createdAt.type).toBe('date')
      expect(User.fields.updatedAt.type).toBe('date')
    })

    it('should add custom timestamp fields', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .timestamps({ createdAt: 'created', updatedAt: 'modified' })
        .build()

      expect(User.fields.created).toBeDefined()
      expect(User.fields.modified).toBeDefined()
      expect(User.fields.createdAt).toBeUndefined()
      expect(User.fields.updatedAt).toBeUndefined()
    })
  })

  describe('Schema with Soft Delete', () => {
    it('should add soft delete to schema', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .softDelete()
        .build()

      expect(User.fields.deletedAt).toBeDefined()
      expect(User.fields.deletedAt.type).toBe('date')
      expect(User.fields.deletedAt.required).toBe(false)
    })

    it('should add custom soft delete field', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .softDelete('deleted')
        .build()

      expect(User.fields.deleted).toBeDefined()
      expect(User.fields.deletedAt).toBeUndefined()
    })
  })

  describe('Schema Indexes', () => {
    it('should add single field index', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())
        .index('email')
        .build()

      expect(User.indexes).toBeDefined()
      expect(User.indexes).toHaveLength(1)
      expect(User.indexes?.[0].fields).toEqual(['email'])
    })

    it('should add composite index', () => {
      const User = schema('User')
        .field('firstName', defineField.string().required())
        .field('lastName', defineField.string().required())
        .index(['firstName', 'lastName'], { unique: true })
        .build()

      expect(User.indexes).toBeDefined()
      expect(User.indexes).toHaveLength(1)
      expect(User.indexes?.[0].fields).toEqual(['firstName', 'lastName'])
      expect(User.indexes?.[0].unique).toBe(true)
    })

    it('should add multiple indexes', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())
        .field('createdAt', defineField.date().required())
        .index('email', { unique: true })
        .index(['name', 'createdAt'])
        .build()

      expect(User.indexes).toHaveLength(2)
    })
  })

  describe('Schema Extension', () => {
    it('should extend existing schema', () => {
      const baseSchema = schema('Base')
        .field('id', defineField.uuid().auto())
        .timestamps()

      const User = schema('User')
        .extend(baseSchema)
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())
        .build()

      expect(User.fields.id).toBeDefined()
      expect(User.fields.createdAt).toBeDefined()
      expect(User.fields.updatedAt).toBeDefined()
      expect(User.fields.name).toBeDefined()
      expect(User.fields.email).toBeDefined()
    })

    it('should override fields when extending', () => {
      const baseSchema = schema('Base')
        .field('name', defineField.string())

      const User = schema('User')
        .extend(baseSchema)
        .field('name', defineField.string().required()) // Override to make required
        .build()

      expect(User.fields.name.required).toBe(true)
    })
  })

  describe('Schema Mixins', () => {
    it('should apply mixins to schema', () => {
      const timestampMixin = schema()
        .field('createdAt', defineField.date().required())
        .field('updatedAt', defineField.date().required())

      const softDeleteMixin = schema()
        .field('deletedAt', defineField.date())

      const User = schema('User')
        .field('name', defineField.string().required())
        .mixin(timestampMixin)
        .mixin(softDeleteMixin)
        .build()

      expect(User.fields.name).toBeDefined()
      expect(User.fields.createdAt).toBeDefined()
      expect(User.fields.updatedAt).toBeDefined()
      expect(User.fields.deletedAt).toBeDefined()
    })
  })

  describe('Schema Templates', () => {
    it('should create schema from template', () => {
      const auditableTemplate = schema()
        .field('id', defineField.uuid().auto())
        .timestamps()
        .softDelete()

      const User = schema('User')
        .template(auditableTemplate)
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())
        .build()

      expect(User.fields.id).toBeDefined()
      expect(User.fields.createdAt).toBeDefined()
      expect(User.fields.updatedAt).toBeDefined()
      expect(User.fields.deletedAt).toBeDefined()
      expect(User.fields.name).toBeDefined()
      expect(User.fields.email).toBeDefined()
    })
  })

  describe('Schema Variants', () => {
    it('should create schema variants', () => {
      const baseUser = schema('User')
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())

      const variants = baseUser.variants({
        Admin: (s) => s
          .field('permissions', defineField.json().required())
          .field('level', defineField.number().required()),
        Customer: (s) => s
          .field('tier', defineField.enum(['bronze', 'silver', 'gold']))
          .field('points', defineField.number().default(0))
      })

      expect(variants.Admin.fields.permissions).toBeDefined()
      expect(variants.Admin.fields.level).toBeDefined()
      expect(variants.Customer.fields.tier).toBeDefined()
      expect(variants.Customer.fields.points).toBeDefined()

      // Both should have base fields
      expect(variants.Admin.fields.name).toBeDefined()
      expect(variants.Customer.fields.email).toBeDefined()
    })
  })

  describe('Schema Conditional Fields', () => {
    it('should add conditional fields', () => {
      const User = schema('User')
        .field('name', defineField.string().required())
        .field('type', defineField.enum(['admin', 'user']).required())
        .conditional(
          (fields) => fields.type === 'admin',
          (s) => s.field('permissions', defineField.json().required())
        )
        .build()

      expect(User.fields.name).toBeDefined()
      expect(User.fields.type).toBeDefined()
      // Conditional fields are added to schema but may be conditionally validated
      expect(User.conditionalFields).toBeDefined()
    })
  })

  describe('Schema Composition', () => {
    it('should compose multiple schemas', () => {
      const userFields = schema()
        .field('name', defineField.string().required())
        .field('email', defineField.email().required())

      const profileFields = schema()
        .field('avatar', defineField.url())
        .field('bio', defineField.text())

      const auditFields = schema()
        .timestamps()
        .softDelete()

      const User = schema('User')
        .compose(userFields, profileFields, auditFields)
        .build()

      expect(User.fields.name).toBeDefined()
      expect(User.fields.email).toBeDefined()
      expect(User.fields.avatar).toBeDefined()
      expect(User.fields.bio).toBeDefined()
      expect(User.fields.createdAt).toBeDefined()
      expect(User.fields.deletedAt).toBeDefined()
    })
  })

  describe('Schema Validation', () => {
    it('should validate schema data', () => {
      const User = schema('User')
        .field('name', defineField.string().required().min(2))
        .field('email', defineField.email().required())
        .field('age', defineField.number().min(0).max(120))
        .build()

      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      }

      const result = User.zodSchema.safeParse(validData)
      expect(result.success).toBe(true)

      const invalidData = {
        name: 'J', // Too short
        email: 'invalid-email',
        age: -5 // Negative
      }

      const invalidResult = User.zodSchema.safeParse(invalidData)
      expect(invalidResult.success).toBe(false)
    })
  })
})