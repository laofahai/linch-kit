/**
 * @linch-kit/schema Decorator System
 * Support decorator-based Schema definition
 */

import 'reflect-metadata'
import { defineField } from '../core/field'
import { defineEntity } from '../core/entity'
import type { 
  FieldDefinition, 
  Entity, 
  EntityOptions,
  StringFieldOptions,
  TextFieldOptions,
  NumberFieldOptions,
  EnumFieldOptions,
  RelationFieldOptions
} from '../types'

// Metadata keys
const ENTITY_KEY = Symbol('linch:entity')
const FIELDS_KEY = Symbol('linch:fields')
const OPTIONS_KEY = Symbol('linch:options')

/**
 * Entity decorator
 * 
 * @example
 * ```typescript
 * @Entity('User', { tableName: 'users' })
 * class User {
 *   @Field.string().required()
 *   name!: string
 * 
 *   @Field.email().required().unique()
 *   email!: string
 * 
 *   @Field.number().min(0).max(120)
 *   age?: number
 * }
 * ```
 */
export function Entity(name?: string, options?: EntityOptions) {
  return function <T extends new (...args: any[]) => any>(target: T) {
    const entityName = name || target.name
    
    // 设置实体元数据
    Reflect.defineMetadata(ENTITY_KEY, entityName, target)
    if (options) {
      Reflect.defineMetadata(OPTIONS_KEY, options, target)
    }
    
    // 返回增强的类
    return class extends target {
      static get entityName(): string {
        return entityName
      }
      
      static get entityOptions(): EntityOptions {
        return Reflect.getMetadata(OPTIONS_KEY, target) || {}
      }
      
      static toEntity(): Entity {
        return getEntityFromClass(target)
      }
    } as any
  }
}

/**
 * 字段装饰器工厂
 */
class FieldDecoratorFactory {
  /**
   * 字符串字段装饰器
   */
  string(options: Partial<StringFieldOptions> = {}) {
    return this.createFieldDecorator(defineField.string(options))
  }

  /**
   * 文本字段装饰器
   */
  text(options: Partial<TextFieldOptions> = {}) {
    return this.createFieldDecorator(defineField.text(options))
  }

  /**
   * 数字字段装饰器
   */
  number(options: Partial<NumberFieldOptions> = {}) {
    return this.createFieldDecorator(defineField.number(options))
  }

  /**
   * 整数字段装饰器
   */
  int(options: Partial<NumberFieldOptions> = {}) {
    return this.createFieldDecorator(defineField.int(options))
  }

  /**
   * 布尔字段装饰器
   */
  boolean() {
    return this.createFieldDecorator(defineField.boolean())
  }

  /**
   * 日期字段装饰器
   */
  date() {
    return this.createFieldDecorator(defineField.date())
  }

  /**
   * 枚举字段装饰器
   */
  enum<T extends readonly string[]>(values: T, options: Partial<EnumFieldOptions<T>> = {}) {
    return this.createFieldDecorator(defineField.enum(values, options))
  }

  /**
   * 邮箱字段装饰器
   */
  email() {
    return this.createFieldDecorator(defineField.email())
  }

  /**
   * URL字段装饰器
   */
  url() {
    return this.createFieldDecorator(defineField.url())
  }

  /**
   * UUID字段装饰器
   */
  uuid() {
    return this.createFieldDecorator(defineField.uuid())
  }

  /**
   * JSON字段装饰器
   */
  json() {
    return this.createFieldDecorator(defineField.json())
  }

  /**
   * 关系字段装饰器
   */
  relation(target: string, options: Partial<RelationFieldOptions> = {}) {
    return this.createFieldDecorator(defineField.relation(target, options))
  }

  /**
   * 一对一关系装饰器
   */
  oneToOne(target: string) {
    return this.createFieldDecorator(
      defineField.relation(target).oneToOne()
    )
  }

  /**
   * 一对多关系装饰器
   */
  oneToMany(target: string) {
    return this.createFieldDecorator(
      defineField.relation(target).oneToMany()
    )
  }

  /**
   * 多对一关系装饰器
   */
  manyToOne(target: string) {
    return this.createFieldDecorator(
      defineField.relation(target).manyToOne()
    )
  }

  /**
   * 多对多关系装饰器
   */
  manyToMany(target: string, through?: string) {
    return this.createFieldDecorator(
      defineField.relation(target).manyToMany(through)
    )
  }

  /**
   * 创建字段装饰器
   */
  private createFieldDecorator(fieldBuilder: any) {
    return (target: any, propertyKey: string) => {
      const fieldDef = fieldBuilder.build()
      
      // 获取现有字段元数据
      const existingFields = Reflect.getMetadata(FIELDS_KEY, target.constructor) || {}
      
      // 添加新字段
      existingFields[propertyKey] = fieldDef
      
      // 设置更新的字段元数据
      Reflect.defineMetadata(FIELDS_KEY, existingFields, target.constructor)
    }
  }
}

/**
 * 字段装饰器实例
 */
export const Field = new FieldDecoratorFactory()

/**
 * 必填字段装饰器
 */
export function Required(target: any, propertyKey: string) {
  const fields = Reflect.getMetadata(FIELDS_KEY, target.constructor) || {}
  if (fields[propertyKey]) {
    fields[propertyKey] = { ...fields[propertyKey], required: true }
    Reflect.defineMetadata(FIELDS_KEY, fields, target.constructor)
  }
}

/**
 * 唯一字段装饰器
 */
export function Unique(target: any, propertyKey: string) {
  const fields = Reflect.getMetadata(FIELDS_KEY, target.constructor) || {}
  if (fields[propertyKey]) {
    fields[propertyKey] = { ...fields[propertyKey], unique: true }
    Reflect.defineMetadata(FIELDS_KEY, fields, target.constructor)
  }
}

/**
 * 索引字段装饰器
 */
export function Index(target: any, propertyKey: string) {
  const fields = Reflect.getMetadata(FIELDS_KEY, target.constructor) || {}
  if (fields[propertyKey]) {
    fields[propertyKey] = { ...fields[propertyKey], index: true }
    Reflect.defineMetadata(FIELDS_KEY, fields, target.constructor)
  }
}

/**
 * 默认值装饰器
 */
export function Default(value: any) {
  return (target: any, propertyKey: string) => {
    const fields = Reflect.getMetadata(FIELDS_KEY, target.constructor) || {}
    if (fields[propertyKey]) {
      fields[propertyKey] = { ...fields[propertyKey], default: value }
      Reflect.defineMetadata(FIELDS_KEY, fields, target.constructor)
    }
  }
}

/**
 * 描述装饰器
 */
export function Description(description: string) {
  return (target: any, propertyKey: string) => {
    const fields = Reflect.getMetadata(FIELDS_KEY, target.constructor) || {}
    if (fields[propertyKey]) {
      fields[propertyKey] = { ...fields[propertyKey], description }
      Reflect.defineMetadata(FIELDS_KEY, fields, target.constructor)
    }
  }
}

/**
 * 链式字段装饰器 - 支持链式调用
 * 
 * @example
 * ```typescript
 * @Entity('User')
 * class User {
 *   @ChainField.string().required().min(2).max(50)
 *   name!: string
 * 
 *   @ChainField.email().required().unique()
 *   email!: string
 * 
 *   @ChainField.number().min(0).max(120).default(0)
 *   age?: number
 * }
 * ```
 */
class ChainFieldDecoratorFactory {
  string(options: Partial<StringFieldOptions> = {}) {
    return new ChainableStringDecorator(defineField.string(options))
  }

  number(options: Partial<NumberFieldOptions> = {}) {
    return new ChainableNumberDecorator(defineField.number(options))
  }

  email() {
    return new ChainableStringDecorator(defineField.email())
  }

  // ... 其他字段类型
}

/**
 * 可链式调用的字符串装饰器
 */
class ChainableStringDecorator {
  constructor(private builder: unknown) {}

  required(): this {
    this.builder = (this.builder as { required(): unknown }).required()
    return this
  }

  unique(): this {
    this.builder = (this.builder as { unique(): unknown }).unique()
    return this
  }

  min(length: number): this {
    this.builder = (this.builder as { min(length: number): unknown }).min(length)
    return this
  }

  max(length: number): this {
    this.builder = (this.builder as { max(length: number): unknown }).max(length)
    return this
  }

  default(value: string): this {
    this.builder = (this.builder as { default(value: string): unknown }).default(value)
    return this
  }

  // 最终装饰器方法
  applyDecorator(target: unknown, propertyKey: string): void {
    const fieldDef = (this.builder as { build(): FieldDefinition }).build()
    const constructor = (target as { constructor: object }).constructor
    const existingFields = Reflect.getMetadata(FIELDS_KEY, constructor) || {}
    existingFields[propertyKey] = fieldDef
    Reflect.defineMetadata(FIELDS_KEY, existingFields, constructor)
  }
}

/**
 * 可链式调用的数字装饰器
 */
class ChainableNumberDecorator {
  constructor(private builder: unknown) {}

  required(): this {
    this.builder = (this.builder as { required(): unknown }).required()
    return this
  }

  min(value: number): this {
    this.builder = (this.builder as { min(value: number): unknown }).min(value)
    return this
  }

  max(value: number): this {
    this.builder = (this.builder as { max(value: number): unknown }).max(value)
    return this
  }

  int(): this {
    this.builder = (this.builder as { int(): unknown }).int()
    return this
  }

  default(value: number): this {
    this.builder = (this.builder as { default(value: number): unknown }).default(value)
    return this
  }

  // 最终装饰器方法
  applyDecorator(target: unknown, propertyKey: string): void {
    const fieldDef = (this.builder as { build(): FieldDefinition }).build()
    const constructor = (target as { constructor: object }).constructor
    const existingFields = Reflect.getMetadata(FIELDS_KEY, constructor) || {}
    existingFields[propertyKey] = fieldDef
    Reflect.defineMetadata(FIELDS_KEY, existingFields, constructor)
  }
}

/**
 * 链式字段装饰器实例
 */
export const ChainField = new ChainFieldDecoratorFactory()

/**
 * 从装饰器类创建实体
 */
export function getEntityFromClass(target: any): Entity {
  const entityName = Reflect.getMetadata(ENTITY_KEY, target)
  const fields = Reflect.getMetadata(FIELDS_KEY, target) || {}
  const options = Reflect.getMetadata(OPTIONS_KEY, target) || {}

  if (!entityName) {
    throw new Error(`Class ${target.name} is not decorated with @Entity`)
  }

  return defineEntity(entityName, { fields, options })
}

/**
 * 批量从装饰器类创建实体
 */
export function getEntitiesFromClasses(classes: any[]): Record<string, Entity> {
  const entities: Record<string, Entity> = {}
  
  classes.forEach(cls => {
    const entity = getEntityFromClass(cls)
    entities[entity.name] = entity
  })
  
  return entities
}

/**
 * 表装饰器 - 设置表选项
 */
export function Table(options: EntityOptions) {
  return function (target: any) {
    const existingOptions = Reflect.getMetadata(OPTIONS_KEY, target) || {}
    Reflect.defineMetadata(OPTIONS_KEY, { ...existingOptions, ...options }, target)
  }
}

/**
 * 时间戳装饰器
 */
export function Timestamps(target: any) {
  const existingOptions = Reflect.getMetadata(OPTIONS_KEY, target) || {}
  Reflect.defineMetadata(OPTIONS_KEY, { ...existingOptions, timestamps: true }, target)
}

/**
 * 软删除装饰器
 */
export function SoftDelete(target: any) {
  const existingOptions = Reflect.getMetadata(OPTIONS_KEY, target) || {}
  Reflect.defineMetadata(OPTIONS_KEY, { ...existingOptions, softDelete: true }, target)
}