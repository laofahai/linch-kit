/**
 * @linch-kit/schema Schema定义系统
 * 支持灵活的Schema组合和扩展
 */

import type { 
  Entity, 
  FieldDefinition, 
  EntityOptions 
} from '../types'

import { EntityImpl } from './entity'

/**
 * Schema构建器类 - 支持链式调用和动态扩展
 */
export class SchemaBuilder<T extends Record<string, FieldDefinition> = {}> {
  private _fields: T = {} as T
  private _options: EntityOptions = {}
  private _name?: string

  constructor(name?: string) {
    this._name = name
  }

  /**
   * 添加字段
   */
  field<K extends string, F extends FieldDefinition>(
    name: K, 
    definition: F
  ): SchemaBuilder<T & Record<K, F>> {
    return this.fields({ [name]: definition } as Record<K, F>)
  }

  /**
   * 批量添加字段
   */
  fields<F extends Record<string, FieldDefinition>>(
    fields: F
  ): SchemaBuilder<T & F> {
    const newBuilder = new SchemaBuilder<T & F>(this._name)
    newBuilder._fields = { ...this._fields, ...fields } as T & F
    newBuilder._options = { ...this._options }
    return newBuilder
  }

  /**
   * 设置实体选项
   */
  options(options: Partial<EntityOptions>): SchemaBuilder<T> {
    const newBuilder = new SchemaBuilder<T>(this._name)
    newBuilder._fields = { ...this._fields }
    newBuilder._options = { ...this._options, ...options }
    return newBuilder
  }

  /**
   * 设置表名
   */
  tableName(name: string): SchemaBuilder<T> {
    return this.options({ tableName: name })
  }

  /**
   * 启用时间戳
   */
  timestamps(enabled = true): SchemaBuilder<T> {
    return this.options({ timestamps: enabled })
  }

  /**
   * 启用软删除
   */
  softDelete(enabled = true): SchemaBuilder<T> {
    return this.options({ softDelete: enabled })
  }

  /**
   * 扩展另一个Schema
   */
  extend(
    other: SchemaBuilder<any> | Entity<any>
  ): SchemaBuilder<any> {
    if (other instanceof SchemaBuilder) {
      return this.fields(other._fields).options(other._options) as SchemaBuilder<any>
    } else {
      return this.fields(other.fields as any).options(other.options) as SchemaBuilder<any>
    }
  }

  /**
   * 构建实体
   */
  build(name?: string): Entity {
    const entityName = name || this._name
    if (!entityName) {
      throw new Error('Entity name is required')
    }

    return new EntityImpl(entityName, {
      name: entityName,
      fields: this._fields,
      options: this._options
    }) as Entity
  }

  /**
   * 获取当前字段定义
   */
  getFields(): T {
    return { ...this._fields }
  }

  /**
   * 获取当前选项
   */
  getOptions(): EntityOptions {
    return { ...this._options }
  }
}

/**
 * 创建Schema构建器
 * 
 * @example
 * ```typescript
 * // 创建基础Schema
 * const userSchema = schema()
 *   .field('name', defineField.string().required())
 *   .field('email', defineField.email().required().unique())
 *   .field('age', defineField.number().min(0))
 *   .timestamps()
 *   .tableName('users')
 * 
 * // 扩展Schema
 * const adminSchema = userSchema
 *   .field('role', defineField.enum(['admin', 'superadmin']))
 *   .field('permissions', defineField.array(defineField.string()))
 * 
 * // 构建实体
 * const User = userSchema.build('User')
 * const Admin = adminSchema.build('Admin')
 * ```
 */
export function schema<T extends Record<string, FieldDefinition> = {}>(
  name?: string
): SchemaBuilder<T> {
  return new SchemaBuilder<T>(name)
}

/**
 * 从现有实体创建Schema构建器
 * 
 * @example
 * ```typescript
 * const baseUser = defineEntity('User', {
 *   name: defineField.string().required(),
 *   email: defineField.email().required()
 * })
 * 
 * const extendedUser = fromEntity(baseUser)
 *   .field('age', defineField.number())
 *   .field('avatar', defineField.url())
 *   .build('ExtendedUser')
 * ```
 */
export function fromEntity<T extends Record<string, FieldDefinition>>(
  entity: Entity<T>
): SchemaBuilder<T> {
  return schema<T>()
    .fields(entity.fields as T)
    .options(entity.options)
}

/**
 * Mixin功能 - 允许复用字段组合
 * 
 * @example
 * ```typescript
 * // 定义混入
 * const timestampMixin = mixin({
 *   createdAt: defineField.date().required(),
 *   updatedAt: defineField.date().required()
 * })
 * 
 * const auditMixin = mixin({
 *   createdBy: defineField.relation('User').required(),
 *   updatedBy: defineField.relation('User')
 * })
 * 
 * // 使用混入
 * const Post = schema('Post')
 *   .field('title', defineField.string().required())
 *   .field('content', defineField.text())
 *   .extend(timestampMixin)
 *   .extend(auditMixin)
 *   .build()
 * ```
 */
export function mixin<T extends Record<string, FieldDefinition>>(
  fields: T
): SchemaBuilder<T> {
  return schema<T>().fields(fields)
}

/**
 * 创建可复用的Schema模板
 * 
 * @example
 * ```typescript
 * // 创建模板
 * const baseEntityTemplate = template(() => 
 *   schema()
 *     .field('id', defineField.uuid().required())
 *     .field('createdAt', defineField.date().required())
 *     .field('updatedAt', defineField.date().required())
 * )
 * 
 * // 使用模板
 * const User = baseEntityTemplate()
 *   .field('name', defineField.string().required())
 *   .field('email', defineField.email().required())
 *   .build('User')
 * 
 * const Post = baseEntityTemplate()
 *   .field('title', defineField.string().required())
 *   .field('content', defineField.text())
 *   .build('Post')
 * ```
 */
export function template<T extends Record<string, FieldDefinition>>(
  factory: () => SchemaBuilder<T>
): () => SchemaBuilder<T> {
  return factory
}

/**
 * 条件字段 - 根据条件动态添加字段
 * 
 * @example
 * ```typescript
 * const User = schema('User')
 *   .field('name', defineField.string().required())
 *   .field('email', defineField.email().required())
 *   .fields(conditional(process.env.NODE_ENV === 'development', {
 *     debugInfo: defineField.json(),
 *     internalId: defineField.number()
 *   }))
 *   .build()
 * ```
 */
export function conditional<T extends Record<string, FieldDefinition>>(
  condition: boolean,
  fields: T
): T | {} {
  return condition ? fields : {}
}

/**
 * 字段组 - 逻辑分组字段便于管理
 * 
 * @example
 * ```typescript
 * const identityFields = group({
 *   firstName: defineField.string().required(),
 *   lastName: defineField.string().required(),
 *   email: defineField.email().required().unique()
 * })
 * 
 * const addressFields = group({
 *   street: defineField.string(),
 *   city: defineField.string(),
 *   country: defineField.string(),
 *   zipCode: defineField.string()
 * })
 * 
 * const User = schema('User')
 *   .fields(identityFields)
 *   .fields(addressFields)
 *   .build()
 * ```
 */
export function group<T extends Record<string, FieldDefinition>>(
  fields: T
): T {
  return fields
}

/**
 * 创建变体Schema - 基于基础Schema创建多个变体
 * 
 * @example
 * ```typescript
 * const baseUser = schema()
 *   .field('name', defineField.string().required())
 *   .field('email', defineField.email().required())
 * 
 * const userVariants = variants(baseUser, {
 *   admin: schema => schema
 *     .field('permissions', defineField.array(defineField.string()))
 *     .field('role', defineField.enum(['admin', 'superadmin'])),
 *   
 *   customer: schema => schema
 *     .field('orders', defineField.relation('Order'))
 *     .field('loyaltyPoints', defineField.number().default(0)),
 *   
 *   guest: schema => schema
 *     .field('sessionId', defineField.string().required())
 * })
 * 
 * const AdminUser = userVariants.admin.build('AdminUser')
 * const Customer = userVariants.customer.build('Customer')
 * const Guest = userVariants.guest.build('Guest')
 * ```
 */
export function variants<
  T extends Record<string, FieldDefinition>,
  V extends Record<string, (builder: SchemaBuilder<T>) => SchemaBuilder<Record<string, FieldDefinition>>>
>(
  baseSchema: SchemaBuilder<T>,
  variants: V
): { [K in keyof V]: ReturnType<V[K]> } {
  const result: Record<string, unknown> = {}
  
  Object.entries(variants).forEach(([key, transform]) => {
    result[key] = transform(baseSchema)
  })
  
  return result as { [K in keyof V]: ReturnType<V[K]> }
}

/**
 * Schema组合器 - 将多个Schema合并
 * 
 * @example
 * ```typescript
 * const userSchema = schema()
 *   .field('name', defineField.string().required())
 *   .field('email', defineField.email().required())
 * 
 * const profileSchema = schema()
 *   .field('bio', defineField.text())
 *   .field('avatar', defineField.url())
 * 
 * const settingsSchema = schema()
 *   .field('theme', defineField.enum(['light', 'dark']))
 *   .field('notifications', defineField.boolean().default(true))
 * 
 * const CompleteUser = compose(
 *   userSchema,
 *   profileSchema,
 *   settingsSchema
 * ).build('CompleteUser')
 * ```
 */
export function compose<
  S1 extends SchemaBuilder<Record<string, FieldDefinition>>,
  S2 extends SchemaBuilder<Record<string, FieldDefinition>>,
  S3 extends SchemaBuilder<Record<string, FieldDefinition>> = SchemaBuilder<{}>,
  S4 extends SchemaBuilder<Record<string, FieldDefinition>> = SchemaBuilder<{}>,
  S5 extends SchemaBuilder<Record<string, FieldDefinition>> = SchemaBuilder<{}>
>(
  schema1: S1,
  schema2: S2,
  schema3?: S3,
  schema4?: S4,
  schema5?: S5
): SchemaBuilder<Record<string, FieldDefinition>> {
  let result = schema1.extend(schema2)
  
  if (schema3) result = result.extend(schema3)
  if (schema4) result = result.extend(schema4)  
  if (schema5) result = result.extend(schema5)
  
  return result
}