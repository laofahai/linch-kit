import { describe, it, expect } from 'vitest'
import { TypeScriptGenerator } from '../generators/typescript'
import { defineEntity } from '../core/entity'
import { defineField } from '../core/field'

describe('TypeScript Generator', () => {
  const generator = new TypeScriptGenerator()

  describe('Basic Type Generation', () => {
    it('should generate basic TypeScript interfaces', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      const result = await generator.generate([User])
      expect(result).toHaveLength(1)
      
      const file = result[0]
      expect(file.path).toBe('types.ts')
      expect(file.content).toContain('export interface User {')
      expect(file.content).toContain('name: string')
      expect(file.content).toContain('email: string')
      expect(file.content).toContain('age?: number')
    })

    it('should generate create and update types', async () => {
      const User = defineEntity('User', {
        id: defineField.uuid().auto(),
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('export interface CreateUser {')
      expect(content).toContain('export interface UpdateUser {')
      expect(content).not.toContain('id: string') // ID should not be in create type
      expect(content).toContain('id?: string') // ID should be optional in update type
    })

    it('should generate filter types', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required(),
        age: defineField.number().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('export interface UserFilter {')
      expect(content).toContain('name?: StringFilter')
      expect(content).toContain('email?: StringFilter')
      expect(content).toContain('age?: NumberFilter')
    })
  })

  describe('Field Type Mapping', () => {
    it('should map string fields to string type', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        nickname: defineField.string().optional(),
        bio: defineField.text().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('name: string')
      expect(content).toContain('nickname?: string')
      expect(content).toContain('bio?: string')
    })

    it('should map number fields to number type', async () => {
      const User = defineEntity('User', {
        age: defineField.number().required(),
        score: defineField.number().optional(),
        balance: defineField.number().precision(2).required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('age: number')
      expect(content).toContain('score?: number')
      expect(content).toContain('balance: number')
    })

    it('should map boolean fields to boolean type', async () => {
      const User = defineEntity('User', {
        active: defineField.boolean().required(),
        verified: defineField.boolean().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('active: boolean')
      expect(content).toContain('verified?: boolean')
    })

    it('should map date fields to Date type', async () => {
      const Event = defineEntity('Event', {
        startDate: defineField.date().required(),
        endDate: defineField.date().optional()
      })

      const result = await generator.generate([Event])
      const content = result[0].content
      
      expect(content).toContain('startDate: Date')
      expect(content).toContain('endDate?: Date')
    })

    it('should map JSON fields to unknown type', async () => {
      const User = defineEntity('User', {
        metadata: defineField.json().optional(),
        settings: defineField.json().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('metadata?: unknown')
      expect(content).toContain('settings: unknown')
    })

    it('should map enum fields to union types', async () => {
      const User = defineEntity('User', {
        status: defineField.enum(['active', 'inactive', 'pending']).required(),
        role: defineField.enum(['admin', 'user']).optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('status: "active" | "inactive" | "pending"')
      expect(content).toContain('role?: "admin" | "user"')
    })

    it('should map array fields to array types', async () => {
      const User = defineEntity('User', {
        tags: defineField.array(defineField.string()).required(),
        scores: defineField.array(defineField.number()).optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('tags: string[]')
      expect(content).toContain('scores?: number[]')
    })

    it('should map UUID fields to string type', async () => {
      const User = defineEntity('User', {
        id: defineField.uuid().auto(),
        parentId: defineField.uuid().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('id: string')
      expect(content).toContain('parentId?: string')
    })

    it('should map email and url fields to string type', async () => {
      const User = defineEntity('User', {
        email: defineField.email().required(),
        website: defineField.url().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('email: string')
      expect(content).toContain('website?: string')
    })
  })

  describe('Relation Type Generation', () => {
    it('should generate one-to-many relation types', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        posts: defineField.relation('Post').oneToMany()
      })

      const Post = defineEntity('Post', {
        title: defineField.string().required(),
        author: defineField.relation('User').manyToOne()
      })

      const result = await generator.generate([User, Post])
      const content = result[0].content
      
      expect(content).toContain('posts?: Post[]')
      expect(content).toContain('author?: User')
    })

    it('should generate many-to-many relation types', async () => {
      const Post = defineEntity('Post', {
        title: defineField.string().required(),
        tags: defineField.relation('Tag').manyToMany()
      })

      const Tag = defineEntity('Tag', {
        name: defineField.string().required(),
        posts: defineField.relation('Post').manyToMany()
      })

      const result = await generator.generate([Post, Tag])
      const content = result[0].content
      
      expect(content).toContain('tags?: Tag[]')
      expect(content).toContain('posts?: Post[]')
    })

    it('should generate one-to-one relation types', async () => {
      const User = defineEntity('User', {
        email: defineField.email().required(),
        profile: defineField.relation('Profile').oneToOne()
      })

      const Profile = defineEntity('Profile', {
        bio: defineField.text().optional(),
        user: defineField.relation('User').oneToOne()
      })

      const result = await generator.generate([User, Profile])
      const content = result[0].content
      
      expect(content).toContain('profile?: Profile')
      expect(content).toContain('user?: User')
    })
  })

  describe('Filter Type Generation', () => {
    it('should generate string filter types', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('export interface StringFilter {')
      expect(content).toContain('equals?: string')
      expect(content).toContain('contains?: string')
      expect(content).toContain('startsWith?: string')
      expect(content).toContain('endsWith?: string')
      expect(content).toContain('in?: string[]')
      expect(content).toContain('notIn?: string[]')
    })

    it('should generate number filter types', async () => {
      const User = defineEntity('User', {
        age: defineField.number().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('export interface NumberFilter {')
      expect(content).toContain('equals?: number')
      expect(content).toContain('gt?: number')
      expect(content).toContain('gte?: number')
      expect(content).toContain('lt?: number')
      expect(content).toContain('lte?: number')
      expect(content).toContain('in?: number[]')
      expect(content).toContain('notIn?: number[]')
    })

    it('should generate boolean filter types', async () => {
      const User = defineEntity('User', {
        active: defineField.boolean().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('export interface BooleanFilter {')
      expect(content).toContain('equals?: boolean')
    })

    it('should generate date filter types', async () => {
      const Event = defineEntity('Event', {
        startDate: defineField.date().required()
      })

      const result = await generator.generate([Event])
      const content = result[0].content
      
      expect(content).toContain('export interface DateFilter {')
      expect(content).toContain('equals?: Date')
      expect(content).toContain('gt?: Date')
      expect(content).toContain('gte?: Date')
      expect(content).toContain('lt?: Date')
      expect(content).toContain('lte?: Date')
    })
  })

  describe('Timestamp Integration', () => {
    it('should include timestamp fields in types', async () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        timestamps: true
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('createdAt: Date')
      expect(content).toContain('updatedAt: Date')
    })

    it('should include soft delete field in types', async () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        softDelete: true
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('deletedAt?: Date')
    })
  })

  describe('I18n Type Generation', () => {
    it('should generate i18n field types', async () => {
      const Product = defineEntity('Product', {
        name: defineField.i18n(['en', 'zh-CN']).required(),
        description: defineField.i18n(['en', 'zh-CN']).optional()
      })

      const result = await generator.generate([Product])
      const content = result[0].content
      
      expect(content).toContain('name: Record<"en" | "zh-CN", string>')
      expect(content).toContain('description?: Record<"en" | "zh-CN", string>')
    })
  })

  describe('Export Organization', () => {
    it('should organize exports properly', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      // Should have proper TypeScript exports
      expect(content).toContain('export interface User')
      expect(content).toContain('export interface CreateUser')
      expect(content).toContain('export interface UpdateUser')
      expect(content).toContain('export interface UserFilter')
      
      // Should have filter type exports
      expect(content).toContain('export interface StringFilter')
    })

    it('should avoid duplicate filter type exports', async () => {
      const User = defineEntity('User', {
        firstName: defineField.string().required(),
        lastName: defineField.string().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      // Should only export StringFilter once
      const stringFilterMatches = content.match(/export interface StringFilter/g)
      expect(stringFilterMatches).toHaveLength(1)
    })
  })
})