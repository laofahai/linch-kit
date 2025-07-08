/**
 * @linch-kit/schema 字段定义系统
 */

import { z } from 'zod'

import type {
  FieldDefinition,
  FieldType,
  StringFieldOptions,
  NumberFieldOptions,
  BooleanFieldOptions,
  DateFieldOptions,
  EmailFieldOptions,
  UrlFieldOptions,
  UuidFieldOptions,
  TextFieldOptions,
  JsonFieldOptions,
  I18nFieldOptions,
  EnumFieldOptions,
  ArrayFieldOptions,
  RelationFieldOptions,
  BaseFieldDefinition,
} from '../types'

/**
 * 字段构建器基类
 */
abstract class FieldBuilder<T extends BaseFieldDefinition> {
  protected definition: T

  constructor(definition: T) {
    this.definition = { ...definition }
  }

  /**
   * 设置字段为必填
   */
  setRequired(required = true): this {
    this.definition.required = required
    return this
  }

  /**
   * 设置字段为可选
   */
  setOptional(): this {
    this.definition.required = false
    return this
  }

  /**
   * 设置字段为唯一
   */
  setUnique(unique = true): this {
    this.definition.unique = unique
    return this
  }

  /**
   * 设置字段索引
   */
  setIndex(index = true): this {
    this.definition.index = index
    return this
  }

  /**
   * 设置默认值
   */
  setDefault(value: unknown): this {
    this.definition.defaultValue = value
    return this
  }

  // 简化的别名方法
  /**
   * 设置字段为必填 (别名)
   */
  require(required = true): this {
    return this.setRequired(required)
  }

  /**
   * 设置字段为必填 (别名)
   */
  required(required = true): this {
    return this.setRequired(required)
  }

  /**
   * 设置字段为可选 (别名)
   */
  optional(): this {
    return this.setOptional()
  }

  /**
   * 设置字段为唯一 (别名)
   */
  makeUnique(unique = true): this {
    return this.setUnique(unique)
  }

  /**
   * 设置字段为唯一 (别名)
   */
  unique(unique = true): this {
    return this.setUnique(unique)
  }

  /**
   * 设置字段索引 (别名)
   */
  makeIndex(index = true): this {
    return this.setIndex(index)
  }

  /**
   * 设置字段索引 (别名)
   */
  index(index = true): this {
    return this.setIndex(index)
  }

  /**
   * 设置默认值 (别名)
   */
  default(value: unknown): this {
    return this.setDefault(value)
  }

  /**
   * 设置字段描述
   */
  description(description: string): this {
    this.definition.description = description
    return this
  }

  /**
   * 标记字段为已弃用
   */
  deprecated(deprecated = true): this {
    this.definition.deprecated = deprecated
    return this
  }

  /**
   * 构建最终的字段定义
   */
  build(): T {
    return { ...this.definition }
  }

  // Add direct access to common properties (non-conflicting names)
  get type(): FieldType {
    return this.definition.type
  }

  get isRequired(): boolean {
    return this.definition.required ?? false
  }

  get isUnique(): boolean {
    return this.definition.unique ?? false
  }

  get hasIndex(): boolean {
    return this.definition.index ?? false
  }

  get defaultValue(): unknown {
    return this.definition.defaultValue
  }
}

/**
 * 字符串类型字段构建器
 */
type StringLikeFieldOptions =
  | StringFieldOptions
  | EmailFieldOptions
  | UrlFieldOptions
  | UuidFieldOptions
  | TextFieldOptions

class StringFieldBuilder extends FieldBuilder<StringLikeFieldOptions> {
  constructor(options: Partial<StringLikeFieldOptions> = {}) {
    const mergedOptions = { type: 'string' as FieldType, required: false, ...options }
    super(mergedOptions as StringLikeFieldOptions)
    // Ensure type override works
    if (options.type) {
      this.definition.type = options.type
    }
  }

  setMin(length: number): this {
    ;(this.definition as StringFieldOptions & BaseFieldDefinition).minLength = length
    ;(this.definition as StringFieldOptions & BaseFieldDefinition).min = length
    return this
  }

  setMax(length: number): this {
    ;(this.definition as StringFieldOptions & BaseFieldDefinition).maxLength = length
    ;(this.definition as StringFieldOptions & BaseFieldDefinition).max = length
    return this
  }

  setPattern(regex: RegExp): this {
    ;(this.definition as StringFieldOptions & BaseFieldDefinition).pattern = regex
    return this
  }

  transform(fn: (value: string) => string): this {
    ;(this.definition as StringFieldOptions & BaseFieldDefinition).transform = fn
    return this
  }

  auto(): this {
    this.definition.auto = true
    return this
  }

  // 简化的别名方法
  minimum(length: number): this {
    return this.setMin(length)
  }

  maximum(length: number): this {
    return this.setMax(length)
  }

  min(length: number): this {
    return this.setMin(length)
  }

  max(length: number): this {
    return this.setMax(length)
  }

  // Getters for test compatibility
  get minLength(): number | undefined {
    return 'minLength' in this.definition
      ? (this.definition as StringFieldOptions & BaseFieldDefinition).minLength
      : undefined
  }

  get maxLength(): number | undefined {
    return 'maxLength' in this.definition
      ? (this.definition as StringFieldOptions & BaseFieldDefinition).maxLength
      : undefined
  }

  get regexPattern(): string | RegExp | undefined {
    return 'pattern' in this.definition
      ? (this.definition as StringFieldOptions & BaseFieldDefinition).pattern
      : undefined
  }

  get isAuto(): boolean {
    return this.definition.auto ?? false
  }
}

/**
 * 数字字段构建器
 */
class NumberFieldBuilder extends FieldBuilder<NumberFieldOptions> {
  constructor(options: Partial<NumberFieldOptions> = {}) {
    super({ type: 'number', required: false, ...options } as NumberFieldOptions)
  }

  setMin(value: number): this {
    this.definition.min = value
    return this
  }

  setMax(value: number): this {
    this.definition.max = value
    return this
  }

  setInteger(): this {
    this.definition.integer = true
    return this
  }

  setPositive(): this {
    this.definition.positive = true
    return this
  }

  setNegative(): this {
    this.definition.negative = true
    return this
  }

  setPrecision(digits: number): this {
    this.definition.precision = digits
    return this
  }

  // 简化的别名方法
  minimum(value: number): this {
    return this.setMin(value)
  }

  maximum(value: number): this {
    return this.setMax(value)
  }

  makeInteger(): this {
    return this.setInteger()
  }

  makePositive(): this {
    return this.setPositive()
  }

  makeNegative(): this {
    return this.setNegative()
  }

  setPrecisionDigits(digits: number): this {
    return this.setPrecision(digits)
  }

  min(value: number): this {
    return this.setMin(value)
  }

  max(value: number): this {
    return this.setMax(value)
  }

  precision(digits: number): this {
    return this.setPrecision(digits)
  }

  // Add getters for number-specific properties (non-conflicting names)
  get minValue(): number | undefined {
    return this.definition.min
  }

  get maxValue(): number | undefined {
    return this.definition.max
  }

  get isInteger(): boolean {
    return this.definition.integer ?? false
  }

  get isPositive(): boolean {
    return this.definition.positive ?? false
  }

  get precisionDigits(): number | undefined {
    return this.definition.precision
  }
}

/**
 * 布尔字段构建器
 */
class BooleanFieldBuilder extends FieldBuilder<BooleanFieldOptions> {
  constructor(options: Partial<BooleanFieldOptions> = {}) {
    super({ type: 'boolean', required: false, ...options } as BooleanFieldOptions)
  }
}

/**
 * 日期字段构建器
 */
class DateFieldBuilder extends FieldBuilder<DateFieldOptions> {
  constructor(options: Partial<DateFieldOptions> = {}) {
    super({ type: 'date', required: false, ...options } as DateFieldOptions)
  }

  min(date: Date): this {
    this.definition.min = date
    return this
  }

  max(date: Date): this {
    this.definition.max = date
    return this
  }

  // Add getters for date-specific properties (non-conflicting names)
  get minDate(): Date | undefined {
    return this.definition.min
  }

  get maxDate(): Date | undefined {
    return this.definition.max
  }
}

/**
 * 枚举字段构建器
 */
class EnumFieldBuilder<T extends readonly string[]> extends FieldBuilder<EnumFieldOptions<T>> {
  constructor(values: T, options: Partial<EnumFieldOptions<T>> = {}) {
    super({ type: 'enum', values, required: false, ...options } as EnumFieldOptions<T>)
  }

  // Add getter for enum-specific properties
  get values(): T {
    return this.definition.values
  }
}

/**
 * 数组字段构建器
 */
class ArrayFieldBuilder extends FieldBuilder<ArrayFieldOptions> {
  constructor(
    items: FieldDefinition | { build(): FieldDefinition },
    options: Partial<ArrayFieldOptions> = {}
  ) {
    // 如果传入的是构建器，先构建出定义
    const itemDefinition =
      items && typeof items === 'object' && 'build' in items && typeof items.build === 'function'
        ? items.build()
        : (items as FieldDefinition)
    super({
      type: 'array',
      items: itemDefinition,
      required: false,
      ...options,
    } as ArrayFieldOptions)
  }

  min(length: number): this {
    this.definition.min = length
    return this
  }

  max(length: number): this {
    this.definition.max = length
    return this
  }

  // Add getters for array-specific properties (non-conflicting names)
  get itemType(): FieldDefinition {
    return this.definition.items
  }

  get minLength(): number | undefined {
    return this.definition.min
  }

  get maxLength(): number | undefined {
    return this.definition.max
  }
}

/**
 * 关系字段构建器
 */
class RelationFieldBuilder extends FieldBuilder<RelationFieldOptions> {
  constructor(target: string, options: Partial<RelationFieldOptions> = {}) {
    super({
      type: 'relation',
      target,
      relationType: 'manyToOne',
      required: false,
      ...options,
    } as RelationFieldOptions)
  }

  oneToOne(): this {
    this.definition.relationType = 'oneToOne'
    return this
  }

  oneToMany(): this {
    this.definition.relationType = 'oneToMany'
    return this
  }

  manyToOne(): this {
    this.definition.relationType = 'manyToOne'
    return this
  }

  manyToMany(through?: string): this {
    this.definition.relationType = 'manyToMany'
    if (through) {
      this.definition.through = through
    }
    return this
  }

  foreignKey(key: string): this {
    this.definition.foreignKey = key
    return this
  }

  cascade(cascade = true): this {
    this.definition.cascade = cascade
    return this
  }

  onDelete(action: 'CASCADE' | 'SET_NULL' | 'RESTRICT'): this {
    this.definition.onDelete = action
    return this
  }

  onUpdate(action: 'CASCADE' | 'SET_NULL' | 'RESTRICT'): this {
    this.definition.onUpdate = action
    return this
  }

  // Add getters for relation-specific properties (non-conflicting names)
  get targetEntity(): string {
    return this.definition.target
  }

  get relationKind(): string {
    return this.definition.relationType
  }

  get foreignKeyName(): string | undefined {
    return this.definition.foreignKey
  }

  get throughTable(): string | undefined {
    return this.definition.through
  }

  get isCascade(): boolean {
    return this.definition.cascade ?? false
  }
}

/**
 * JSON字段构建器
 */
class JsonFieldBuilder extends FieldBuilder<JsonFieldOptions> {
  constructor(options: Partial<JsonFieldOptions> = {}) {
    super({ type: 'json', required: false, ...options } as JsonFieldOptions)
  }

  schema(schema: Record<string, unknown>): this {
    this.definition.schema = schema
    return this
  }

  get jsonSchema(): Record<string, unknown> | undefined {
    return this.definition.schema
  }
}

/**
 * I18n字段构建器
 */
class I18nFieldBuilder extends FieldBuilder<I18nFieldOptions> {
  constructor(locales: string[] = ['en', 'zh-CN'], options: Partial<I18nFieldOptions> = {}) {
    super({
      type: 'i18n',
      baseType: 'string',
      locales,
      required: false,
      ...options,
    } as I18nFieldOptions)
  }

  baseType(type: Exclude<FieldType, 'i18n' | 'relation' | 'array'>): this {
    this.definition.baseType = type
    return this
  }

  fallback(locale: string): this {
    this.definition.fallback = locale
    return this
  }

  get locales(): string[] {
    return this.definition.locales
  }

  get fallbackLocale(): string | undefined {
    return this.definition.fallback
  }
}

/**
 * 定义字段的主入口
 */
export const defineField = {
  /**
   * 定义字符串字段
   */
  string(options?: Partial<StringFieldOptions>): StringFieldBuilder {
    return new StringFieldBuilder(options)
  },

  /**
   * 定义文本字段（长字符串）
   */
  text(options?: Partial<TextFieldOptions>): StringFieldBuilder {
    return new StringFieldBuilder({ ...options, type: 'text' })
  },

  /**
   * 定义数字字段
   */
  number(options?: Partial<NumberFieldOptions>): NumberFieldBuilder {
    return new NumberFieldBuilder(options)
  },

  /**
   * 定义整数字段
   */
  int(options?: Partial<NumberFieldOptions>): NumberFieldBuilder {
    return new NumberFieldBuilder({ ...options, integer: true })
  },

  /**
   * 定义布尔字段
   */
  boolean(options?: Partial<BooleanFieldOptions>): BooleanFieldBuilder {
    return new BooleanFieldBuilder(options)
  },

  /**
   * 定义日期字段
   */
  date(options?: Partial<DateFieldOptions>): DateFieldBuilder {
    return new DateFieldBuilder(options)
  },

  /**
   * 定义枚举字段
   */
  enum<T extends readonly string[]>(
    values: T,
    options?: Partial<EnumFieldOptions<T>>
  ): EnumFieldBuilder<T> {
    return new EnumFieldBuilder(values, options)
  },

  /**
   * 定义数组字段
   */
  array(
    items: FieldDefinition | { build(): FieldDefinition },
    options?: Partial<ArrayFieldOptions>
  ): ArrayFieldBuilder {
    return new ArrayFieldBuilder(items, options)
  },

  /**
   * 定义关系字段
   */
  relation(
    target: string,
    relationTypeOrOptions?: string | Partial<RelationFieldOptions>
  ): RelationFieldBuilder {
    // 兼容性处理：如果第二个参数是字符串，则作为 relationType
    if (typeof relationTypeOrOptions === 'string') {
      return new RelationFieldBuilder(target, {
        relationType: relationTypeOrOptions as
          | 'oneToOne'
          | 'oneToMany'
          | 'manyToOne'
          | 'manyToMany',
      })
    }
    return new RelationFieldBuilder(target, relationTypeOrOptions)
  },

  /**
   * 定义邮箱字段
   */
  email(options?: Partial<EmailFieldOptions>): StringFieldBuilder {
    return new StringFieldBuilder({
      ...options,
      type: 'email',
    }).description('Email address')
  },

  /**
   * 定义URL字段
   */
  url(options?: Partial<UrlFieldOptions>): StringFieldBuilder {
    return new StringFieldBuilder({
      ...options,
      type: 'url',
    }).description('URL')
  },

  /**
   * 定义UUID字段
   */
  uuid(options?: Partial<UuidFieldOptions>): StringFieldBuilder {
    return new StringFieldBuilder({
      ...options,
      type: 'uuid',
    }).description('UUID')
  },

  /**
   * 定义JSON字段
   */
  json(options?: Partial<JsonFieldOptions>): JsonFieldBuilder {
    return new JsonFieldBuilder(options)
  },

  /**
   * 定义国际化字段
   */
  i18n(locales?: string[], options?: Partial<I18nFieldOptions>): I18nFieldBuilder {
    return new I18nFieldBuilder(locales || ['en', 'zh-CN'], options)
  },
}

/**
 * 将字段定义转换为Zod Schema
 */
export function fieldToZod(field: FieldDefinition): z.ZodSchema {
  let schema: z.ZodSchema

  switch (field.type) {
    case 'string':
    case 'text':
      schema = z.string()
      if ('minLength' in field && field.minLength !== undefined)
        schema = (schema as z.ZodString).min(field.minLength)
      if ('maxLength' in field && field.maxLength !== undefined)
        schema = (schema as z.ZodString).max(field.maxLength)
      if ('pattern' in field && field.pattern) {
        const pattern =
          typeof field.pattern === 'string' ? new RegExp(field.pattern) : field.pattern
        schema = (schema as z.ZodString).regex(pattern)
      }
      if ('transform' in field && field.transform) schema = schema.transform(field.transform)
      break

    case 'email':
      schema = z.string().email()
      if ('minLength' in field && typeof field.minLength === 'number')
        schema = (schema as z.ZodString).min(field.minLength)
      if ('maxLength' in field && typeof field.maxLength === 'number')
        schema = (schema as z.ZodString).max(field.maxLength)
      if ('transform' in field && field.transform) schema = schema.transform(field.transform)
      break

    case 'url':
      schema = z.string().url()
      if ('minLength' in field && typeof field.minLength === 'number')
        schema = (schema as z.ZodString).min(field.minLength)
      if ('maxLength' in field && typeof field.maxLength === 'number')
        schema = (schema as z.ZodString).max(field.maxLength)
      if ('transform' in field && field.transform) schema = schema.transform(field.transform)
      break

    case 'uuid':
      schema = z.string().uuid()
      if ('transform' in field && field.transform) schema = schema.transform(field.transform)
      break

    case 'number':
      schema = z.number()
      if (field.min !== undefined) schema = (schema as z.ZodNumber).min(field.min)
      if (field.max !== undefined) schema = (schema as z.ZodNumber).max(field.max)
      if (field.integer) schema = (schema as z.ZodNumber).int()
      if (field.positive) schema = (schema as z.ZodNumber).positive()
      if (field.negative) schema = (schema as z.ZodNumber).negative()
      break

    case 'boolean':
      schema = z.boolean()
      break

    case 'date':
      schema = z.date()
      if (field.min) schema = (schema as z.ZodDate).min(field.min)
      if (field.max) schema = (schema as z.ZodDate).max(field.max)
      break

    case 'enum':
      schema = z.enum(field.values as [string, ...string[]])
      break

    case 'array': {
      const itemSchema = fieldToZod(field.items)
      schema = z.array(itemSchema)
      if (field.min !== undefined) schema = (schema as z.ZodArray<z.ZodSchema>).min(field.min)
      if (field.max !== undefined) schema = (schema as z.ZodArray<z.ZodSchema>).max(field.max)
      break
    }

    case 'json':
      schema = z.record(z.unknown())
      break

    case 'relation':
      // 关系字段在验证时通常只验证ID
      schema = z.string().uuid()
      break

    case 'i18n':
      // 国际化字段验证
      if ('locales' in field && field.locales) {
        const localeShape: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {}
        field.locales.forEach(locale => {
          let localeSchema = z.string()
          if ('i18n' in field && field.i18n?.required?.includes(locale)) {
            localeSchema = localeSchema.min(1)
            localeShape[locale] = localeSchema
          } else {
            localeShape[locale] = localeSchema.optional()
          }
        })
        schema = z.object(localeShape)
      } else {
        schema = z.record(z.string())
      }
      break

    default:
      schema = z.unknown()
  }

  // 处理必填和默认值
  if (!field.required) {
    schema = schema.optional()
  }
  if (field.defaultValue !== undefined) {
    schema = schema.default(field.defaultValue)
  }

  return schema
}
