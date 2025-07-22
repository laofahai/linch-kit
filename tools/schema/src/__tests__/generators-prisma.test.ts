/**
 * @linch-kit/schema Prisma Generator 测试套件
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { PrismaGenerator } from '../generators/prisma'
import { defineEntity } from '../core/entity'
import { defineField } from '../core/field'

const { string, number, boolean, date, json, relation, array, uuid, email } = defineField
import type { GeneratorContext } from '../types'

describe('PrismaGenerator', () => {
  let generator: PrismaGenerator

  beforeEach(() => {
    generator = new PrismaGenerator()
  })

  describe('基础功能', () => {
    it('应该有正确的生成器名称', () => {
      expect(generator.name).toBe('prisma')
    })

    it('应该生成基础schema.prisma文件', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        email: email().unique(),
        age: number(),
      })

      const context: GeneratorContext = {
        entities: [user],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [user],
          config: {},
        },
        options: { entities: [user] },
      }

      const files = await generator.generate(context)

      expect(files).toHaveLength(1)
      expect(files[0].path).toBe('schema.prisma')
      expect(files[0].type).toBe('prisma')
      expect(files[0].content).toContain('generator client')
      expect(files[0].content).toContain('datasource db')
      expect(files[0].content).toContain('model User')
    })
  })

  describe('generator配置生成', () => {
    it('应该生成正确的generator配置', () => {
      const generator = new PrismaGenerator()
      const generatorConfig = (generator as any).generateGenerator()

      expect(generatorConfig).toContain('generator client {')
      expect(generatorConfig).toContain('provider = "prisma-client-js"')
      expect(generatorConfig).toContain('output   = "./generated/client"')
    })
  })

  describe('datasource配置生成', () => {
    it('应该生成正确的datasource配置', () => {
      const generator = new PrismaGenerator()
      const datasourceConfig = (generator as any).generateDatasource()

      expect(datasourceConfig).toContain('datasource db {')
      expect(datasourceConfig).toContain('provider = "postgresql"')
      expect(datasourceConfig).toContain('url      = env("DATABASE_URL")')
    })
  })

  describe('模型生成', () => {
    it('应该为简单实体生成模型', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        email: email().unique(),
        active: boolean().default(true),
      })

      const context: GeneratorContext = {
        entities: [user],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [user],
          config: {},
        },
        options: { entities: [user] },
      }

      const files = await generator.generate(context)
      const content = files[0].content

      expect(content).toContain('model User {')
      expect(content).toContain('id        String   @id @default(uuid())')
      expect(content).toContain('name      String')
      expect(content).toContain('email     String?  @unique')
      expect(content).toContain('active    Boolean? @default(true)')
      expect(content).toContain('@@map("user")')
    })

    it('应该为带时间戳的实体生成时间字段', async () => {
      const user = defineEntity(
        'User',
        {
          name: string().required(),
        },
        { timestamps: true }
      )

      const context: GeneratorContext = {
        entities: [user],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [user],
          config: {},
        },
        options: { entities: [user] },
      }

      const files = await generator.generate(context)
      const content = files[0].content

      expect(content).toContain('createdAt DateTime @default(now()) @map("created_at")')
      expect(content).toContain('updatedAt DateTime @updatedAt @map("updated_at")')
    })

    it('应该为软删除实体生成删除时间字段', async () => {
      const user = defineEntity(
        'User',
        {
          name: string().required(),
        },
        { softDelete: true }
      )

      const context: GeneratorContext = {
        entities: [user],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [user],
          config: {},
        },
        options: { entities: [user] },
      }

      const files = await generator.generate(context)
      const content = files[0].content

      expect(content).toContain('deletedAt DateTime? @map("deleted_at")')
    })

    it('应该为自定义表名生成正确映射', async () => {
      const user = defineEntity(
        'User',
        {
          name: string().required(),
        },
        { tableName: 'app_users' }
      )

      const context: GeneratorContext = {
        entities: [user],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [user],
          config: {},
        },
        options: { entities: [user] },
      }

      const files = await generator.generate(context)
      const content = files[0].content

      expect(content).toContain('@@map("app_users")')
    })
  })

  describe('字段类型映射', () => {
    it('应该正确映射字符串类型', () => {
      const generator = new PrismaGenerator()
      const field = string()

      const prismaType = (generator as any).mapFieldTypeToPrisma(field)
      expect(prismaType).toBe('String')
    })

    it('应该正确映射email和url类型', () => {
      const generator = new PrismaGenerator()
      
      const emailType = (generator as any).mapFieldTypeToPrisma(email())
      const urlType = (generator as any).mapFieldTypeToPrisma({ type: 'url' })

      expect(emailType).toBe('String')
      expect(urlType).toBe('String')
    })

    it('应该正确映射UUID类型', () => {
      const generator = new PrismaGenerator()
      const field = uuid()

      const prismaType = (generator as any).mapFieldTypeToPrisma(field)
      expect(prismaType).toBe('String')
    })

    it('应该正确映射数字类型', () => {
      const generator = new PrismaGenerator()
      
      const intField = number().integer()
      const floatField = number()

      const intType = (generator as any).mapFieldTypeToPrisma(intField)
      const floatType = (generator as any).mapFieldTypeToPrisma(floatField)

      expect(intType).toBe('Int')
      expect(floatType).toBe('Float')
    })

    it('应该正确映射布尔类型', () => {
      const generator = new PrismaGenerator()
      const field = boolean()

      const prismaType = (generator as any).mapFieldTypeToPrisma(field)
      expect(prismaType).toBe('Boolean')
    })

    it('应该正确映射日期类型', () => {
      const generator = new PrismaGenerator()
      const field = date()

      const prismaType = (generator as any).mapFieldTypeToPrisma(field)
      expect(prismaType).toBe('DateTime')
    })

    it('应该正确映射JSON类型', () => {
      const generator = new PrismaGenerator()
      const field = json()

      const prismaType = (generator as any).mapFieldTypeToPrisma(field)
      expect(prismaType).toBe('Json')
    })

    it('应该正确映射数组类型', () => {
      const generator = new PrismaGenerator()
      const field = array(string())

      const prismaType = (generator as any).mapFieldTypeToPrisma(field)
      expect(prismaType).toBe('String[]')
    })

    it('应该正确映射关系类型', () => {
      const generator = new PrismaGenerator()
      
      const oneToOneField = relation('Profile', 'oneToOne')
      const oneToManyField = relation('Post', 'oneToMany')
      const manyToManyField = relation('Tag', 'manyToMany')

      const oneToOneType = (generator as any).mapFieldTypeToPrisma(oneToOneField)
      const oneToManyType = (generator as any).mapFieldTypeToPrisma(oneToManyField)
      const manyToManyType = (generator as any).mapFieldTypeToPrisma(manyToManyField)

      expect(oneToOneType).toBe('Profile')
      expect(oneToManyType).toBe('Post')
      expect(manyToManyType).toBe('Tag[]')
    })
  })

  describe('字段属性生成', () => {
    it('应该为唯一字段生成@unique属性', () => {
      const generator = new PrismaGenerator()
      const field = string().unique()

      const attributes = (generator as any).generateFieldAttributes(field)
      expect(attributes).toContain('@unique')
    })

    it('应该为默认值生成@default属性', () => {
      const generator = new PrismaGenerator()
      
      const stringField = string().default('test')
      const numberField = number().default(42)
      const booleanField = boolean().default(true)

      const stringAttrs = (generator as any).generateFieldAttributes(stringField)
      const numberAttrs = (generator as any).generateFieldAttributes(numberField)
      const booleanAttrs = (generator as any).generateFieldAttributes(booleanField)

      expect(stringAttrs).toContain('@default("test")')
      expect(numberAttrs).toContain('@default(42)')
      expect(booleanAttrs).toContain('@default(true)')
    })

    it('应该为UUID字段自动添加默认值', () => {
      const generator = new PrismaGenerator()
      const field = uuid()

      const attributes = (generator as any).generateFieldAttributes(field)
      expect(attributes).toContain('@default(uuid())')
    })
  })

  describe('默认值格式化', () => {
    it('应该正确格式化字符串默认值', () => {
      const generator = new PrismaGenerator()
      
      const formatted = (generator as any).formatDefaultValue('test', 'string')
      expect(formatted).toBe('"test"')
    })

    it('应该正确格式化数字默认值', () => {
      const generator = new PrismaGenerator()
      
      const formatted = (generator as any).formatDefaultValue(42, 'number')
      expect(formatted).toBe('42')
    })

    it('应该正确格式化布尔默认值', () => {
      const generator = new PrismaGenerator()
      
      const formatted = (generator as any).formatDefaultValue(true, 'boolean')
      expect(formatted).toBe('true')
    })

    it('应该为now日期值生成now()函数', () => {
      const generator = new PrismaGenerator()
      
      const formatted = (generator as any).formatDefaultValue('now', 'date')
      expect(formatted).toBe('now()')
    })

    it('应该为UUID生成uuid()函数', () => {
      const generator = new PrismaGenerator()
      
      const formatted = (generator as any).formatDefaultValue(undefined, 'uuid')
      expect(formatted).toBe('uuid()')
    })
  })

  describe('枚举生成', () => {
    it('应该生成枚举定义', () => {
      const generator = new PrismaGenerator()
      const user = defineEntity('User', {
        status: { type: 'enum', values: ['ACTIVE', 'INACTIVE', 'PENDING'] } as any,
      })

      const enums = (generator as any).generateEnums([user])
      
      expect(enums).toHaveLength(1)
      expect(enums[0]).toContain('enum StatusEnum {')
      expect(enums[0]).toContain('ACTIVE')
      expect(enums[0]).toContain('INACTIVE')
      expect(enums[0]).toContain('PENDING')
    })
  })

  describe('错误处理', () => {
    it('应该在没有实体时抛出错误', async () => {
      const context: GeneratorContext = {
        entities: [],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [],
          config: {},
        },
        options: { entities: [] },
      }

      await expect(generator.generate(context)).rejects.toThrow('No entities provided for code generation')
    })
  })

  describe('复杂场景测试', () => {
    it('应该生成带关系的完整模型', async () => {
      const user = defineEntity(
        'User',
        {
          name: string().required(),
          email: email().unique(),
          posts: relation('Post', 'oneToMany'),
        },
        { timestamps: true, softDelete: true }
      )

      const post = defineEntity(
        'Post',
        {
          title: string().required(),
          content: { type: 'text' } as any,
          authorId: uuid().required(),
          author: relation('User', 'manyToOne', { foreignKey: 'authorId' }),
        },
        { timestamps: true }
      )

      const context: GeneratorContext = {
        entities: [user, post],
        outputDir: './generated',
        config: {},
        schema: {
          name: 'test',
          version: '1.0.0',
          entities: [user, post],
          config: {},
        },
        options: { entities: [user, post] },
      }

      const files = await generator.generate(context)
      const content = files[0].content

      expect(content).toContain('model User')
      expect(content).toContain('model Post')
      expect(content).toContain('posts    Post[]')
      expect(content).toContain('author   User')
      expect(content).toContain('authorId String')
    })
  })
})