/**
 * @linch-kit/schema 实体定义系统
 */

import { z } from 'zod'

import type {
  Entity,
  EntityDefinition,
  EntityOptions,
  FieldDefinition,
  CreateInput,
  UpdateInput,
  I18nFieldOptions
} from '../types'

import { fieldToZod } from './field'

/**
 * 默认实体选项
 */
const DEFAULT_ENTITY_OPTIONS: EntityOptions = {
  timestamps: true,
  softDelete: false
}

/**
 * 实体类实现
 */
export class EntityImpl<T = Record<string, unknown>> implements Entity<T> {
  name: string
  fields: Record<keyof T, FieldDefinition>
  options: EntityOptions
  
  // Zod Schemas
  zodSchema: z.ZodObject<Record<string, z.ZodSchema>>
  createSchema: z.ZodObject<Record<string, z.ZodSchema>>
  updateSchema: z.ZodObject<Record<string, z.ZodSchema>>

  constructor(
    name: string,
    definition: EntityDefinition<Record<keyof T, FieldDefinition>>
  ) {
    this.name = name
    this.fields = definition.fields as Record<keyof T, FieldDefinition>
    this.options = { ...DEFAULT_ENTITY_OPTIONS, ...definition.options }
    
    // 构建Zod Schemas
    this.zodSchema = this.buildZodSchema()
    this.createSchema = this.buildCreateSchema()
    this.updateSchema = this.buildUpdateSchema()
  }

  /**
   * 获取实体类型
   */
  get type(): T {
    return {} as T
  }

  /**
   * 获取创建输入类型
   */
  get createInput(): CreateInput<T> {
    return {} as CreateInput<T>
  }

  /**
   * 获取更新输入类型
   */
  get updateInput(): UpdateInput<T> {
    return {} as UpdateInput<T>
  }

  /**
   * 验证完整数据
   */
  async validate(data: unknown): Promise<boolean> {
    try {
      this.zodSchema.parse(data)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证并解析数据
   */
  validateAndParse(data: unknown): T {
    return this.zodSchema.parse(data) as T
  }

  /**
   * 验证创建数据
   */
  validateCreate(data: unknown): CreateInput<T> {
    return this.createSchema.parse(data) as CreateInput<T>
  }

  /**
   * 验证更新数据
   */
  validateUpdate(data: unknown): UpdateInput<T> {
    return this.updateSchema.parse(data) as UpdateInput<T>
  }

  /**
   * 构建完整的Zod Schema
   */
  private buildZodSchema(): z.ZodObject<Record<string, z.ZodSchema>> {
    const shape: Record<string, z.ZodSchema> = {}
    
    // 添加ID字段
    shape.id = z.string().uuid()
    
    // 添加用户定义的字段
    Object.entries(this.fields).forEach(([key, field]) => {
      shape[key] = fieldToZod(field as FieldDefinition)
    })
    
    // 添加时间戳字段
    if (this.options.timestamps) {
      shape.createdAt = z.date()
      shape.updatedAt = z.date()
    }
    
    // 添加软删除字段
    if (this.options.softDelete) {
      shape.deletedAt = z.date().nullable().optional()
    }
    
    return z.object(shape)
  }

  /**
   * 构建创建数据的Zod Schema
   */
  private buildCreateSchema(): z.ZodObject<Record<string, z.ZodSchema>> {
    const shape: Record<string, z.ZodSchema> = {}
    
    // 只包含用户定义的字段（排除自动生成的字段）
    Object.entries(this.fields).forEach(([key, field]) => {
      const fieldDef = field as FieldDefinition
      // 跳过关系字段的反向引用
      if (fieldDef.type === 'relation' && 'relationType' in fieldDef && fieldDef.relationType === 'oneToMany') {
        return
      }
      shape[key] = fieldToZod(fieldDef)
    })
    
    return z.object(shape)
  }

  /**
   * 构建更新数据的Zod Schema
   */
  private buildUpdateSchema(): z.ZodObject<Record<string, z.ZodSchema>> {
    const shape: Record<string, z.ZodSchema> = {}
    
    // 所有字段都是可选的
    Object.entries(this.fields).forEach(([key, field]) => {
      const fieldDef = field as FieldDefinition
      // 跳过关系字段的反向引用
      if (fieldDef.type === 'relation' && 'relationType' in fieldDef && fieldDef.relationType === 'oneToMany') {
        return
      }
      const fieldSchema = fieldToZod(fieldDef)
      shape[key] = fieldSchema.optional()
    })
    
    return z.object(shape).partial()
  }

  /**
   * 获取表名
   */
  getTableName(): string {
    return this.options.tableName || this.toSnakeCase(this.name)
  }

  /**
   * 转换为snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }

  /**
   * 获取所有字段名
   */
  getFieldNames(): string[] {
    return Object.keys(this.fields)
  }

  /**
   * 获取必填字段
   */
  getRequiredFields(): string[] {
    return Object.entries(this.fields)
      .filter(([_, field]) => {
        const fieldDef = field as FieldDefinition
        return fieldDef.required
      })
      .map(([key]) => key)
  }

  /**
   * 获取唯一字段
   */
  getUniqueFields(): string[] {
    return Object.entries(this.fields)
      .filter(([_, field]) => {
        const fieldDef = field as FieldDefinition
        return fieldDef.unique
      })
      .map(([key]) => key)
  }

  /**
   * 获取索引字段
   */
  getIndexedFields(): string[] {
    return Object.entries(this.fields)
      .filter(([_, field]) => {
        const fieldDef = field as FieldDefinition
        return fieldDef.index || fieldDef.unique
      })
      .map(([key]) => key)
  }

  /**
   * 获取关系字段
   */
  getRelationFields(): Array<[string, FieldDefinition]> {
    return Object.entries(this.fields)
      .filter(([_, field]) => {
        const fieldDef = field as FieldDefinition
        return fieldDef.type === 'relation'
      }) as Array<[string, FieldDefinition]>
  }

  /**
   * 克隆实体定义
   */
  clone(): Entity<T> {
    return new EntityImpl(this.name, {
      name: this.name,
      fields: { ...this.fields },
      options: { ...this.options }
    })
  }

  /**
   * 扩展实体定义
   */
  extend<E extends Record<string, FieldDefinition>>(
    fields: E
  ): Entity {
    return new EntityImpl(this.name, {
      name: this.name,
      fields: { ...this.fields, ...fields },
      options: { ...this.options }
    }) as Entity
  }

  /**
   * 合并实体选项
   */
  withOptions(options: Partial<EntityOptions>): Entity<T> {
    return new EntityImpl(this.name, {
      name: this.name,
      fields: { ...this.fields },
      options: { ...this.options, ...options }
    })
  }


}

/**
 * 定义实体 - 支持两种调用方式
 * 
 * @param name - 实体名称
 * @param definition - 实体定义或字段定义
 * @returns 实体对象
 * 
 * @example
 * ```typescript
 * // 方式1: 传入完整定义
 * const User = defineEntity('User', {
 *   fields: {
 *     name: defineField.string().required(),
 *     email: defineField.email().required().unique(),
 *     age: defineField.number().min(0).max(120)
 *   },
 *   options: {
 *     tableName: 'users',
 *     timestamps: true
 *   }
 * })
 * 
 * // 方式2: 只传入字段定义（简化写法）
 * const User = defineEntity('User', {
 *   name: defineField.string().required(),
 *   email: defineField.email().required().unique(),
 *   age: defineField.number().min(0).max(120)
 * })
 * ```
 */
export function defineEntity<T extends Record<string, FieldDefinition>>(
  name: string,
  definition: EntityDefinition<T> | T | Record<string, unknown>
): Entity {
  // 检查是否为简化写法（直接传入字段）
  const isSimplified = !('fields' in definition) && !('options' in definition)

  let entityDef: EntityDefinition<T>

  if (isSimplified) {
    // 转换FieldBuilder对象为FieldDefinition对象
    const fields: Record<string, FieldDefinition> = {}
    Object.entries(definition as Record<string, unknown>).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'build' in value && typeof value.build === 'function') {
        // 这是一个FieldBuilder对象
        fields[key] = (value as { build(): FieldDefinition }).build()
      } else {
        // 这已经是一个FieldDefinition对象
        fields[key] = value as FieldDefinition
      }
    })
    entityDef = { name, fields: fields as T }
  } else {
    const def = definition as EntityDefinition<T>
    // 如果有fields属性，也需要转换其中的FieldBuilder对象
    if (def.fields) {
      const fields: Record<string, FieldDefinition> = {}
      Object.entries(def.fields).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'build' in value && typeof value.build === 'function') {
          fields[key] = (value as { build(): FieldDefinition }).build()
        } else {
          fields[key] = value as FieldDefinition
        }
      })
      entityDef = { ...def, fields: fields as T }
    } else {
      entityDef = def
    }
  }

  return new EntityImpl(name, entityDef) as Entity
}

/**
 * 批量定义实体
 * 
 * @param entities - 实体定义映射
 * @returns 实体映射
 * 
 * @example
 * ```typescript
 * const entities = defineEntities({
 *   User: {
 *     fields: {
 *       name: defineField.string().required(),
 *       email: defineField.email().required()
 *     }
 *   },
 *   Post: {
 *     fields: {
 *       title: defineField.string().required(),
 *       content: defineField.text()
 *     }
 *   }
 * })
 * ```
 */
export function defineEntities<T extends Record<string, EntityDefinition>>(
  entities: T
): { [K in keyof T]: Entity } {
  const result = {} as Record<string, Entity>

  Object.entries(entities).forEach(([name, definition]) => {
    result[name] = defineEntity(name, definition)
  })

  return result as { [K in keyof T]: Entity }
}

/**
 * 检查是否为实体对象
 */
export function isEntity(value: unknown): value is Entity {
  return value instanceof EntityImpl
}

/**
 * 从实体创建TypeScript类型字符串
 */
export function entityToTypeString(entity: Entity): string {
  const fields: string[] = []
  
  // ID字段
  fields.push('id: string')
  
  // 用户定义的字段
  Object.entries(entity.fields).forEach(([name, field]) => {
    const optional = field.required ? '' : '?'
    const type = fieldToTsType(field)
    fields.push(`${name}${optional}: ${type}`)
  })
  
  // 时间戳字段
  if (entity.options.timestamps) {
    fields.push('createdAt: Date')
    fields.push('updatedAt: Date')
  }
  
  // 软删除字段
  if (entity.options.softDelete) {
    fields.push('deletedAt?: Date | null')
  }
  
  return `export interface ${entity.name} {\n  ${fields.join('\n  ')}\n}`
}

/**
 * 将字段定义转换为TypeScript类型
 */
function fieldToTsType(field: FieldDefinition): string {
  switch (field.type) {
    case 'string':
    case 'email':
    case 'url':
    case 'uuid':
    case 'text':
      return 'string'
    
    case 'number':
      return 'number'
    
    case 'boolean':
      return 'boolean'
    
    case 'date':
      return 'Date'
    
    case 'json':
      return 'Record<string, unknown>'
    
    case 'enum':
      return field.values.map(v => `'${v}'`).join(' | ')
    
    case 'array':
      return `${fieldToTsType(field.items)}[]`
    
    case 'relation':
      if (field.relationType === 'oneToMany' || field.relationType === 'manyToMany') {
        return `${field.target}[]`
      }
      return field.target
    
    case 'i18n':
      if (field.type === 'i18n') {
        const i18nField = field as I18nFieldOptions
        const locales = i18nField.locales.map((l: string) => `'${l}'`).join(' | ')
        return `Partial<Record<${locales}, string>>`
      }
      return 'Record<string, string>'
    
    default:
      return 'unknown'
  }
}