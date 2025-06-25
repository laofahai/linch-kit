import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { Entity, Field, Required, Unique, Index, Table, Timestamps } from '../index'
import { getEntityMetadata, getFieldMetadata } from '../index'

describe('Decorator System', () => {
  beforeEach(() => {
    // Clear any existing metadata
    Reflect.deleteMetadata('entity:fields', Object.prototype)
    Reflect.deleteMetadata('entity:config', Object.prototype)
  })

  describe('@Entity Decorator', () => {
    it('should register entity metadata', () => {
      @Entity('User')
      class User {
        name!: string
      }

      const metadata = getEntityMetadata(User)
      expect(metadata).toBeDefined()
      expect(metadata?.name).toBe('User')
    })

    it('should register entity with configuration', () => {
      @Entity('User', {
        table: { name: 'users', comment: 'User table' },
        timestamps: true,
        softDelete: true
      })
      class User {
        name!: string
      }

      const metadata = getEntityMetadata(User)
      expect(metadata?.table?.name).toBe('users')
      expect(metadata?.table?.comment).toBe('User table')
      expect(metadata?.timestamps).toBe(true)
      expect(metadata?.softDelete).toBe(true)
    })
  })

  describe('@Field Decorators', () => {
    it('should register string field metadata', () => {
      class User {
        @Field.string().required()
        name!: string

        @Field.string().optional()
        nickname?: string
      }

      const nameMetadata = getFieldMetadata(User, 'name')
      const nicknameMetadata = getFieldMetadata(User, 'nickname')

      expect(nameMetadata?.type).toBe('string')
      expect(nameMetadata?.required).toBe(true)
      expect(nicknameMetadata?.type).toBe('string')
      expect(nicknameMetadata?.required).toBe(false)
    })

    it('should register number field metadata', () => {
      class User {
        @Field.number().min(0).max(120)
        age!: number

        @Field.number().precision(2)
        balance!: number
      }

      const ageMetadata = getFieldMetadata(User, 'age')
      const balanceMetadata = getFieldMetadata(User, 'balance')

      expect(ageMetadata?.type).toBe('number')
      expect(ageMetadata?.min).toBe(0)
      expect(ageMetadata?.max).toBe(120)
      expect(balanceMetadata?.precision).toBe(2)
    })

    it('should register boolean field metadata', () => {
      class User {
        @Field.boolean().default(true)
        active!: boolean
      }

      const metadata = getFieldMetadata(User, 'active')
      expect(metadata?.type).toBe('boolean')
      expect(metadata?.defaultValue).toBe(true)
    })

    it('should register date field metadata', () => {
      class Event {
        @Field.date().required()
        startDate!: Date

        @Field.date().optional()
        endDate?: Date
      }

      const startMetadata = getFieldMetadata(Event, 'startDate')
      const endMetadata = getFieldMetadata(Event, 'endDate')

      expect(startMetadata?.type).toBe('date')
      expect(startMetadata?.required).toBe(true)
      expect(endMetadata?.type).toBe('date')
      expect(endMetadata?.required).toBe(false)
    })

    it('should register email field metadata', () => {
      class User {
        @Field.email().required().unique()
        email!: string
      }

      const metadata = getFieldMetadata(User, 'email')
      expect(metadata?.type).toBe('email')
      expect(metadata?.required).toBe(true)
      expect(metadata?.unique).toBe(true)
    })

    it('should register URL field metadata', () => {
      class User {
        @Field.url().optional()
        website?: string
      }

      const metadata = getFieldMetadata(User, 'website')
      expect(metadata?.type).toBe('url')
      expect(metadata?.required).toBe(false)
    })

    it('should register UUID field metadata', () => {
      class User {
        @Field.uuid().auto()
        id!: string
      }

      const metadata = getFieldMetadata(User, 'id')
      expect(metadata?.type).toBe('uuid')
      expect(metadata?.auto).toBe(true)
    })

    it('should register JSON field metadata', () => {
      class User {
        @Field.json().required()
        metadata!: unknown
      }

      const metadata = getFieldMetadata(User, 'metadata')
      expect(metadata?.type).toBe('json')
      expect(metadata?.required).toBe(true)
    })

    it('should register text field metadata', () => {
      class Post {
        @Field.text().required()
        content!: string
      }

      const metadata = getFieldMetadata(Post, 'content')
      expect(metadata?.type).toBe('text')
      expect(metadata?.required).toBe(true)
    })

    it('should register enum field metadata', () => {
      class User {
        @Field.enum(['active', 'inactive']).required()
        status!: 'active' | 'inactive'
      }

      const metadata = getFieldMetadata(User, 'status')
      expect(metadata?.type).toBe('enum')
      expect(metadata?.values).toEqual(['active', 'inactive'])
      expect(metadata?.required).toBe(true)
    })

    it('should register array field metadata', () => {
      class User {
        @Field.array(Field.string()).required()
        tags!: string[]
      }

      const metadata = getFieldMetadata(User, 'tags')
      expect(metadata?.type).toBe('array')
      expect(metadata?.required).toBe(true)
      expect(metadata?.items?.type).toBe('string')
    })

    it('should register relation field metadata', () => {
      class User {
        @Field.relation('Post').oneToMany()
        posts!: unknown[]

        @Field.relation('Profile').oneToOne()
        profile!: unknown
      }

      const postsMetadata = getFieldMetadata(User, 'posts')
      const profileMetadata = getFieldMetadata(User, 'profile')

      expect(postsMetadata?.type).toBe('relation')
      expect(postsMetadata?.target).toBe('Post')
      expect(postsMetadata?.relationType).toBe('oneToMany')

      expect(profileMetadata?.type).toBe('relation')
      expect(profileMetadata?.target).toBe('Profile')
      expect(profileMetadata?.relationType).toBe('oneToOne')
    })

    it('should register i18n field metadata', () => {
      class Product {
        @Field.i18n(['en', 'zh-CN']).required()
        name!: Record<string, string>
      }

      const metadata = getFieldMetadata(Product, 'name')
      expect(metadata?.type).toBe('i18n')
      expect(metadata?.locales).toEqual(['en', 'zh-CN'])
      expect(metadata?.required).toBe(true)
    })
  })

  describe('Constraint Decorators', () => {
    it('should apply @Required decorator', () => {
      class User {
        @Field.string()
        @Required()
        name!: string
      }

      const metadata = getFieldMetadata(User, 'name')
      expect(metadata?.required).toBe(true)
    })

    it('should apply @Unique decorator', () => {
      class User {
        @Field.email()
        @Unique()
        email!: string
      }

      const metadata = getFieldMetadata(User, 'email')
      expect(metadata?.unique).toBe(true)
    })

    it('should apply @Index decorator', () => {
      class User {
        @Field.date()
        @Index()
        createdAt!: Date
      }

      const metadata = getFieldMetadata(User, 'createdAt')
      expect(metadata?.index).toBe(true)
    })

    it('should apply multiple constraint decorators', () => {
      class User {
        @Field.email()
        @Required()
        @Unique()
        @Index()
        email!: string
      }

      const metadata = getFieldMetadata(User, 'email')
      expect(metadata?.required).toBe(true)
      expect(metadata?.unique).toBe(true)
      expect(metadata?.index).toBe(true)
    })
  })

  describe('Configuration Decorators', () => {
    it('should apply @Table decorator', () => {
      @Table({ name: 'app_users', comment: 'Application users' })
      class User {
        name!: string
      }

      const metadata = getEntityMetadata(User)
      expect(metadata?.table?.name).toBe('app_users')
      expect(metadata?.table?.comment).toBe('Application users')
    })

    it('should apply @Timestamps decorator', () => {
      @Timestamps()
      class User {
        name!: string
      }

      const metadata = getEntityMetadata(User)
      expect(metadata?.timestamps).toBe(true)
    })

    it('should apply @Timestamps decorator with custom field names', () => {
      @Timestamps({ createdAt: 'created', updatedAt: 'modified' })
      class User {
        name!: string
      }

      const metadata = getEntityMetadata(User)
      expect(metadata?.timestamps).toEqual({
        createdAt: 'created',
        updatedAt: 'modified'
      })
    })
  })

  describe('Chained Field Decorators', () => {
    it('should support method chaining on field decorators', () => {
      class User {
        @Field.string().required().min(2).max(50).unique().index()
        username!: string

        @Field.number().required().min(0).max(120).default(18)
        age!: number
      }

      const usernameMetadata = getFieldMetadata(User, 'username')
      const ageMetadata = getFieldMetadata(User, 'age')

      expect(usernameMetadata?.type).toBe('string')
      expect(usernameMetadata?.required).toBe(true)
      expect(usernameMetadata?.minLength).toBe(2)
      expect(usernameMetadata?.maxLength).toBe(50)
      expect(usernameMetadata?.unique).toBe(true)
      expect(usernameMetadata?.index).toBe(true)

      expect(ageMetadata?.type).toBe('number')
      expect(ageMetadata?.required).toBe(true)
      expect(ageMetadata?.min).toBe(0)
      expect(ageMetadata?.max).toBe(120)
      expect(ageMetadata?.defaultValue).toBe(18)
    })
  })

  describe('Complete Entity Example', () => {
    it('should handle complex entity with all decorator types', () => {
      @Entity('User', {
        table: { name: 'users', comment: 'System users' },
        timestamps: true,
        softDelete: true
      })
      @Table({ name: 'app_users' }) // This should override the table name
      @Timestamps()
      class User {
        @Field.uuid().auto()
        id!: string

        @Field.string().required().min(2).max(50).unique()
        username!: string

        @Field.email().required().unique().index()
        email!: string

        @Field.string().min(8).max(100)
        @Required()
        password!: string

        @Field.string().optional().max(100)
        firstName?: string

        @Field.string().optional().max(100)
        lastName?: string

        @Field.number().optional().min(0).max(120)
        age?: number

        @Field.boolean().default(true)
        active!: boolean

        @Field.enum(['admin', 'user', 'moderator']).default('user')
        role!: string

        @Field.json().optional()
        metadata?: unknown

        @Field.relation('Post').oneToMany()
        posts!: unknown[]

        @Field.relation('Profile').oneToOne()
        profile!: unknown
      }

      const entityMetadata = getEntityMetadata(User)
      expect(entityMetadata?.name).toBe('User')
      expect(entityMetadata?.table?.name).toBe('app_users') // Should be overridden
      expect(entityMetadata?.timestamps).toBe(true)
      expect(entityMetadata?.softDelete).toBe(true)

      // Check various field metadata
      const idMetadata = getFieldMetadata(User, 'id')
      expect(idMetadata?.type).toBe('uuid')
      expect(idMetadata?.auto).toBe(true)

      const usernameMetadata = getFieldMetadata(User, 'username')
      expect(usernameMetadata?.type).toBe('string')
      expect(usernameMetadata?.required).toBe(true)
      expect(usernameMetadata?.unique).toBe(true)

      const emailMetadata = getFieldMetadata(User, 'email')
      expect(emailMetadata?.type).toBe('email')
      expect(emailMetadata?.unique).toBe(true)
      expect(emailMetadata?.index).toBe(true)

      const roleMetadata = getFieldMetadata(User, 'role')
      expect(roleMetadata?.type).toBe('enum')
      expect(roleMetadata?.values).toEqual(['admin', 'user', 'moderator'])
      expect(roleMetadata?.defaultValue).toBe('user')

      const postsMetadata = getFieldMetadata(User, 'posts')
      expect(postsMetadata?.type).toBe('relation')
      expect(postsMetadata?.target).toBe('Post')
      expect(postsMetadata?.relationType).toBe('oneToMany')
    })
  })
})