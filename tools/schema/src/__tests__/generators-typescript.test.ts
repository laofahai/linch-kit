/**
 * @linch-kit/schema TypeScript Generator 测试套件
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { TypeScriptGenerator } from '../generators/typescript'
import { defineEntity } from '../core/entity'
import { defineField } from '../core/field'

const { string, number, boolean, date, json, relation, array, email, uuid } = defineField
import type { GeneratorContext } from '../types'

describe('TypeScriptGenerator', () => {
  let generator: TypeScriptGenerator

  beforeEach(() => {
    generator = new TypeScriptGenerator()
  })

  describe('基础功能', () => {
    it('应该有正确的生成器名称', () => {
      expect(generator.name).toBe('typescript')
    })

    it('应该生成多个TypeScript文件', async () => {
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

      expect(files.length).toBeGreaterThan(1)
      expect(files.some(f => f.path === 'user.types.ts')).toBe(true)
      expect(files.some(f => f.path === 'index.ts')).toBe(true)
      expect(files.some(f => f.path === 'common.types.ts')).toBe(true)
    })
  })

  describe('实体类型生成', () => {
    it('应该生成基础实体接口', async () => {
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export interface User extends BaseEntity')
      expect(userTypes.content).toContain('name: string')
      expect(userTypes.content).toContain('email?: string')
      expect(userTypes.content).toContain('age?: number')
    })

    it('应该为带时间戳的实体扩展时间戳字段', async () => {
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('extends BaseEntity, TimestampFields')
    })

    it('应该为软删除实体扩展软删除字段', async () => {
      const user = defineEntity(
        'User',
        {
          name: string().required(),
        },
        { timestamps: true, softDelete: true }
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('extends BaseEntity, TimestampFields, SoftDeleteFields')
    })
  })

  describe('创建输入类型生成', () => {
    it('应该生成创建输入接口', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        email: email(),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export interface CreateUserInput')
      expect(userTypes.content).toContain('name: string')
      expect(userTypes.content).toContain('email?: string')
      expect(userTypes.content).toContain('age?: number')
    })

    it('应该跳过反向关系字段', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        posts: relation('Post', 'oneToMany'),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      // 创建输入中不应包含反向关系
      const createInputMatch = userTypes.content.match(/export interface CreateUserInput \{([^}]+)\}/s)
      expect(createInputMatch).toBeTruthy()
      expect(createInputMatch![1]).not.toContain('posts')
    })
  })

  describe('更新输入类型生成', () => {
    it('应该生成更新输入接口', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        email: email(),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export interface UpdateUserInput extends Partial<CreateUserInput>')
    })
  })

  describe('字段类型映射', () => {
    it('应该正确映射基础类型', () => {
      const generator = new TypeScriptGenerator()
      
      const stringType = (generator as any).mapFieldTypeToTypeScript(string())
      const numberType = (generator as any).mapFieldTypeToTypeScript(number())
      const booleanType = (generator as any).mapFieldTypeToTypeScript(boolean())
      const dateType = (generator as any).mapFieldTypeToTypeScript(date())

      expect(stringType).toBe('string')
      expect(numberType).toBe('number')
      expect(booleanType).toBe('boolean')
      expect(dateType).toBe('Date')
    })

    it('应该正确映射特殊字符串类型', () => {
      const generator = new TypeScriptGenerator()
      
      const emailType = (generator as any).mapFieldTypeToTypeScript(email())
      const uuidType = (generator as any).mapFieldTypeToTypeScript(uuid())
      const urlType = (generator as any).mapFieldTypeToTypeScript({ type: 'url' })

      expect(emailType).toBe('string')
      expect(uuidType).toBe('string')
      expect(urlType).toBe('string')
    })

    it('应该正确映射JSON类型', () => {
      const generator = new TypeScriptGenerator()
      
      const jsonType = (generator as any).mapFieldTypeToTypeScript(json())
      expect(jsonType).toBe('Record<string, unknown>')
    })

    it('应该正确映射枚举类型', () => {
      const generator = new TypeScriptGenerator()
      const enumField = { type: 'enum', values: ['ACTIVE', 'INACTIVE'] } as any
      
      const enumType = (generator as any).mapFieldTypeToTypeScript(enumField)
      expect(enumType).toBe("'ACTIVE' | 'INACTIVE'")
    })

    it('应该正确映射数组类型', () => {
      const generator = new TypeScriptGenerator()
      const arrayField = array(string())
      
      const arrayType = (generator as any).mapFieldTypeToTypeScript(arrayField)
      expect(arrayType).toBe('string[]')
    })

    it('应该根据上下文映射关系类型', () => {
      const generator = new TypeScriptGenerator()
      const relationField = relation('Post', 'manyToOne')
      
      const readType = (generator as any).mapFieldTypeToTypeScript(relationField, 'read')
      const createType = (generator as any).mapFieldTypeToTypeScript(relationField, 'create')

      expect(readType).toBe('Post')
      expect(createType).toBe('string')
    })

    it('应该正确映射一对多关系', () => {
      const generator = new TypeScriptGenerator()
      const relationField = relation('Post', 'oneToMany')
      
      const readType = (generator as any).mapFieldTypeToTypeScript(relationField, 'read')
      const createType = (generator as any).mapFieldTypeToTypeScript(relationField, 'create')

      expect(readType).toBe('Post[]')
      expect(createType).toBe('string[]')
    })
  })

  describe('导入生成', () => {
    it('应该为关系字段生成导入', async () => {
      const user = defineEntity('User', {
        profile: relation('Profile', 'oneToOne'),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain("from './profile.types'")
    })

    it('应该导入通用类型', async () => {
      const user = defineEntity('User', {
        name: string().required(),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain("from './common.types'")
    })
  })

  describe('部分类型生成', () => {
    it('应该生成部分类型', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        posts: relation('Post', 'oneToMany'),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export type PartialUser = Partial<User>')
      expect(userTypes.content).toContain('export type UserWithoutRelations = Omit<User, \'posts\'>')
      expect(userTypes.content).toContain('export type UserSelect<T extends keyof User> = Pick<User, T>')
    })
  })

  describe('过滤器类型生成', () => {
    it('应该生成过滤器类型', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        age: number(),
        active: boolean(),
        createdAt: date(),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export interface UserFilter')
      expect(userTypes.content).toContain('export interface UserWhere extends UserFilter')
      expect(userTypes.content).toContain('name?: StringFilter | string')
      expect(userTypes.content).toContain('age?: NumberFilter | number')
      expect(userTypes.content).toContain('active?: BooleanFilter | boolean')
      expect(userTypes.content).toContain('createdAt?: DateFilter | Date')
    })
  })

  describe('关系类型生成', () => {
    it('应该生成关系包含类型', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        profile: relation('Profile', 'oneToOne'),
        posts: relation('Post', 'oneToMany'),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export interface UserInclude')
      expect(userTypes.content).toContain('profile?: boolean | ProfileFindUniqueArgs')
      expect(userTypes.content).toContain('posts?: boolean | PostFindManyArgs')
    })

    it('应该生成带关系的类型', async () => {
      const user = defineEntity('User', {
        name: string().required(),
        profile: relation('Profile', 'oneToOne'),
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export type UserWithRelations<T extends UserInclude = {}>')
    })
  })

  describe('索引文件生成', () => {
    it('应该生成正确的索引文件', async () => {
      const user = defineEntity('User', {
        name: string().required(),
      })
      const post = defineEntity('Post', {
        title: string().required(),
      })

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
      const indexFile = files.find(f => f.path === 'index.ts')!
      
      expect(indexFile.content).toContain("export * from './user.types'")
      expect(indexFile.content).toContain("export * from './post.types'")
      expect(indexFile.content).toContain("export * from './common.types'")
    })
  })

  describe('通用类型文件生成', () => {
    it('应该生成通用类型文件', async () => {
      const user = defineEntity('User', {
        name: string().required(),
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
      const commonTypes = files.find(f => f.path === 'common.types.ts')!
      
      expect(commonTypes.content).toContain('export interface BaseEntity')
      expect(commonTypes.content).toContain('export interface TimestampFields')
      expect(commonTypes.content).toContain('export interface SoftDeleteFields')
      expect(commonTypes.content).toContain('export interface StringFilter')
      expect(commonTypes.content).toContain('export interface NumberFilter')
      expect(commonTypes.content).toContain('export interface DateFilter')
      expect(commonTypes.content).toContain('export interface BooleanFilter')
    })
  })

  describe('复杂场景测试', () => {
    it('应该处理复杂的实体关系', async () => {
      const user = defineEntity(
        'User',
        {
          name: string().required(),
          email: email().unique(),
          profile: relation('Profile', 'oneToOne'),
          posts: relation('Post', 'oneToMany'),
          tags: relation('Tag', 'manyToMany'),
        },
        { timestamps: true, softDelete: true }
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
      const userTypes = files.find(f => f.path === 'user.types.ts')!
      
      expect(userTypes.content).toContain('export interface User extends BaseEntity, TimestampFields, SoftDeleteFields')
      expect(userTypes.content).toContain('profile?: Profile')
      expect(userTypes.content).toContain('posts?: Post[]')
      expect(userTypes.content).toContain('tags?: Tag[]')
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
})