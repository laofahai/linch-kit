import { describe, it, expect } from 'vitest'
import { PrismaGenerator } from '../generators/prisma'
import { defineEntity } from '../core/entity'
import { defineField } from '../core/field'

describe('Prisma Generator', () => {
  const generator = new PrismaGenerator()

  describe('Basic Model Generation', () => {
    it('should generate basic Prisma model', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        email: defineField.email().required().unique(),
        age: defineField.number().optional()
      })

      const result = await generator.generate([User])
      expect(result).toHaveLength(1)
      
      const file = result[0]
      expect(file.path).toBe('schema.prisma')
      expect(file.content).toContain('model User {')
      expect(file.content).toContain('name String')
      expect(file.content).toContain('email String @unique')
      expect(file.content).toContain('age Int?')
    })

    it('should generate model with ID field', async () => {
      const User = defineEntity('User', {
        id: defineField.uuid().auto(),
        name: defineField.string().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('id String @id @default(uuid())')
    })

    it('should generate model with timestamps', async () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        timestamps: true
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('createdAt DateTime @default(now())')
      expect(content).toContain('updatedAt DateTime @updatedAt')
    })

    it('should generate model with soft delete', async () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        softDelete: true
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('deletedAt DateTime?')
    })
  })

  describe('Field Type Mapping', () => {
    it('should map string fields correctly', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required(),
        nickname: defineField.string().optional(),
        bio: defineField.text().optional()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('name String')
      expect(content).toContain('nickname String?')
      expect(content).toContain('bio String?') // text maps to String in Prisma
    })

    it('should map number fields correctly', async () => {
      const User = defineEntity('User', {
        age: defineField.number().required(),
        score: defineField.number().optional(),
        balance: defineField.number().precision(2).required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('age Int')
      expect(content).toContain('score Int?')
      expect(content).toContain('balance Decimal')
    })

    it('should map boolean fields correctly', async () => {
      const User = defineEntity('User', {
        active: defineField.boolean().required(),
        verified: defineField.boolean().default(false)
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('active Boolean')
      expect(content).toContain('verified Boolean @default(false)')
    })

    it('should map date fields correctly', async () => {
      const Event = defineEntity('Event', {
        startDate: defineField.date().required(),
        endDate: defineField.date().optional()
      })

      const result = await generator.generate([Event])
      const content = result[0].content
      
      expect(content).toContain('startDate DateTime')
      expect(content).toContain('endDate DateTime?')
    })

    it('should map JSON fields correctly', async () => {
      const User = defineEntity('User', {
        metadata: defineField.json().optional(),
        settings: defineField.json().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('metadata Json?')
      expect(content).toContain('settings Json')
    })

    it('should map enum fields correctly', async () => {
      const User = defineEntity('User', {
        status: defineField.enum(['active', 'inactive', 'pending']).required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('status UserStatus')
      expect(content).toContain('enum UserStatus {')
      expect(content).toContain('active')
      expect(content).toContain('inactive')
      expect(content).toContain('pending')
    })
  })

  describe('Relations Generation', () => {
    it('should generate one-to-many relations', async () => {
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
      
      expect(content).toContain('posts Post[]')
      expect(content).toContain('author User')
      expect(content).toContain('authorId String')
    })

    it('should generate many-to-many relations', async () => {
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
      
      expect(content).toContain('tags Tag[]')
      expect(content).toContain('posts Post[]')
    })

    it('should generate one-to-one relations', async () => {
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
      
      expect(content).toContain('profile Profile?')
      expect(content).toContain('user User @relation(fields: [userId], references: [id])')
      expect(content).toContain('userId String @unique')
    })
  })

  describe('Indexes Generation', () => {
    it('should generate unique indexes', async () => {
      const User = defineEntity('User', {
        email: defineField.email().required().unique(),
        username: defineField.string().required().unique()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('email String @unique')
      expect(content).toContain('username String @unique')
    })

    it('should generate composite indexes', async () => {
      const User = defineEntity('User', {
        fields: {
          firstName: defineField.string().required(),
          lastName: defineField.string().required(),
          email: defineField.email().required()
        },
        indexes: [
          { fields: ['firstName', 'lastName'], unique: true },
          { fields: ['email'], name: 'email_index' }
        ]
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('@@unique([firstName, lastName])')
      expect(content).toContain('@@index([email], map: "email_index")')
    })
  })

  describe('Default Values', () => {
    it('should generate default values', async () => {
      const User = defineEntity('User', {
        name: defineField.string().default('Anonymous'),
        active: defineField.boolean().default(true),
        createdAt: defineField.date().default(new Date())
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('name String @default("Anonymous")')
      expect(content).toContain('active Boolean @default(true)')
      expect(content).toContain('createdAt DateTime @default(now())')
    })

    it('should generate auto-generated UUIDs', async () => {
      const User = defineEntity('User', {
        id: defineField.uuid().auto()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('id String @id @default(uuid())')
    })
  })

  describe('Table Configuration', () => {
    it('should use custom table name', async () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        table: {
          name: 'app_users'
        }
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('@@map("app_users")')
    })

    it('should include table comments', async () => {
      const User = defineEntity('User', {
        fields: {
          name: defineField.string().required()
        },
        table: {
          comment: 'Application users table'
        }
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('// Application users table')
    })
  })

  describe('Generator Configuration', () => {
    it('should include generator and datasource blocks', async () => {
      const User = defineEntity('User', {
        name: defineField.string().required()
      })

      const result = await generator.generate([User])
      const content = result[0].content
      
      expect(content).toContain('generator client {')
      expect(content).toContain('provider = "prisma-client-js"')
      expect(content).toContain('datasource db {')
      expect(content).toContain('provider = "postgresql"')
    })
  })
})