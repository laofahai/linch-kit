/**
 * @linch-kit/schema 核心类型定义
 */

import type { z } from 'zod'

/**
 * 字段类型枚举
 */
export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date'
  | 'email' 
  | 'url' 
  | 'uuid' 
  | 'json'
  | 'text'
  | 'enum' 
  | 'array'
  | 'relation'
  | 'i18n'

/**
 * 基础字段定义接口
 */
export interface BaseFieldDefinition {
  type: FieldType
  required?: boolean
  unique?: boolean
  index?: boolean
  defaultValue?: unknown
  description?: string
  deprecated?: boolean
  permissions?: FieldPermissions
  i18n?: I18nFieldConfig
  auto?: boolean
}

/**
 * 字符串字段选项
 */
export interface StringFieldOptions extends BaseFieldDefinition {
  type: 'string'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  transform?: (value: string) => string
  auto?: boolean
}

/**
 * 数字字段选项
 */
export interface NumberFieldOptions extends BaseFieldDefinition {
  type: 'number'
  min?: number
  max?: number
  integer?: boolean
  positive?: boolean
  negative?: boolean
  precision?: number
}

/**
 * 邮箱字段选项
 */
export interface EmailFieldOptions extends BaseFieldDefinition {
  type: 'email'
  minLength?: number
  maxLength?: number
  domain?: string[]
}

/**
 * URL字段选项
 */
export interface UrlFieldOptions extends BaseFieldDefinition {
  type: 'url'
  protocols?: string[]
}

/**
 * UUID字段选项
 */
export interface UuidFieldOptions extends BaseFieldDefinition {
  type: 'uuid'
  version?: 1 | 2 | 3 | 4 | 5
  auto?: boolean
}

/**
 * 文本字段选项
 */
export interface TextFieldOptions extends BaseFieldDefinition {
  type: 'text'
  minLength?: number
  maxLength?: number
}

/**
 * JSON字段选项
 */
export interface JsonFieldOptions extends BaseFieldDefinition {
  type: 'json'
  schema?: Record<string, unknown>
}

/**
 * 国际化字段选项
 */
export interface I18nFieldOptions extends BaseFieldDefinition {
  type: 'i18n'
  i18n: I18nFieldConfig
}

/**
 * 布尔字段选项
 */
export interface BooleanFieldOptions extends BaseFieldDefinition {
  type: 'boolean'
}

/**
 * 日期字段选项
 */
export interface DateFieldOptions extends BaseFieldDefinition {
  type: 'date'
  min?: Date
  max?: Date
}

/**
 * 枚举字段选项
 */
export interface EnumFieldOptions<T extends readonly string[]> extends BaseFieldDefinition {
  type: 'enum'
  values: T
  default?: T[number]
}

/**
 * 数组字段选项
 */
export interface ArrayFieldOptions extends BaseFieldDefinition {
  type: 'array'
  items: FieldDefinition
  min?: number
  max?: number
}

/**
 * 关系字段选项
 */
export interface RelationFieldOptions extends BaseFieldDefinition {
  type: 'relation'
  target: string
  relationType: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany'
  foreignKey?: string
  through?: string
  cascade?: boolean
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
}

/**
 * 国际化字段配置
 */
export interface I18nFieldConfig {
  locales: string[]
  fallback?: string
  required?: string[]
  type?: 'string' | 'text'
}

/**
 * 联合字段定义类型
 */
export type FieldDefinition = 
  | StringFieldOptions
  | NumberFieldOptions
  | BooleanFieldOptions
  | DateFieldOptions
  | EmailFieldOptions
  | UrlFieldOptions
  | UuidFieldOptions
  | TextFieldOptions
  | JsonFieldOptions
  | I18nFieldOptions
  | EnumFieldOptions<readonly string[]>
  | ArrayFieldOptions
  | RelationFieldOptions

/**
 * 验证规则接口
 */
export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom'
  value?: unknown
  message?: string
  condition?: (value: unknown, context?: unknown) => boolean
}

/**
 * 字段权限配置
 */
export interface FieldPermissions {
  read?: PermissionRule[]
  write?: PermissionRule[]
}

/**
 * 权限规则接口
 */
export interface PermissionRule {
  role?: string
  condition?: string
  fields?: string[]
  context?: Record<string, unknown>
}

/**
 * 实体权限配置
 */
export interface EntityPermissions {
  read?: PermissionRule[]
  write?: PermissionRule[]
  create?: PermissionRule[]
  delete?: PermissionRule[]
}

/**
 * 实体选项接口
 */
export interface EntityOptions {
  tableName?: string
  timestamps?: boolean
  softDelete?: boolean
  permissions?: EntityPermissions
  indexes?: IndexDefinition[]
  hooks?: EntityHooks
}

/**
 * 索引定义接口
 */
export interface IndexDefinition {
  fields: string[]
  unique?: boolean
  name?: string
}

/**
 * 实体钩子接口
 */
export interface EntityHooks {
  beforeCreate?: (data: unknown) => unknown | Promise<unknown>
  afterCreate?: (data: unknown) => void | Promise<void>
  beforeUpdate?: (data: unknown) => unknown | Promise<unknown>
  afterUpdate?: (data: unknown) => void | Promise<void>
  beforeDelete?: (id: unknown) => void | Promise<void>
  afterDelete?: (id: unknown) => void | Promise<void>
}

/**
 * 实体定义接口
 */
export interface EntityDefinition<T = Record<string, FieldDefinition>> {
  fields: T
  options?: EntityOptions
}

/**
 * 实体接口
 */
export interface Entity<T = any> {
  name: string
  fields: Record<keyof T, FieldDefinition>
  options: EntityOptions
  
  // 类型推导
  type: T
  createInput: CreateInput<T>
  updateInput: UpdateInput<T>
  
  // Zod Schema
  zodSchema: z.ZodObject<Record<string, z.ZodSchema>>
  createSchema: z.ZodObject<Record<string, z.ZodSchema>>
  updateSchema: z.ZodObject<Record<string, z.ZodSchema>>
  
  // 辅助方法
  validate(data: unknown): T
  validateCreate(data: unknown): CreateInput<T>
  validateUpdate(data: unknown): UpdateInput<T>
}

/**
 * 创建输入类型
 */
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

/**
 * 更新输入类型
 */
export type UpdateInput<T> = Partial<CreateInput<T>>

/**
 * 生成文件接口
 */
export interface GeneratedFile {
  path: string
  content: string
  type: 'types' | 'prisma' | 'api' | 'validation'
}

/**
 * 代码生成器选项
 */
export interface CodeGeneratorOptions {
  entities: Entity[]
  outputDir?: string
  incremental?: boolean
  cache?: string
  hooks?: GeneratorHooks
}

/**
 * 生成器钩子
 */
export interface GeneratorHooks {
  beforeGenerate?: (context: GeneratorContext) => void | Promise<void>
  afterFileGenerated?: (file: GeneratedFile) => void | Promise<void>
  afterGenerate?: (files: GeneratedFile[]) => void | Promise<void>
}

/**
 * 生成器上下文
 */
export interface GeneratorContext {
  entities: Entity[]
  options: CodeGeneratorOptions
}

/**
 * Schema插件接口
 */
export interface SchemaPlugin {
  name: string
  transformEntity?: (entity: Entity) => Entity
  transformField?: (field: FieldDefinition) => FieldDefinition
  transformCode?: (code: GeneratedFile) => GeneratedFile
  registerGenerators?: () => Generator[]
}

/**
 * 生成器接口
 */
export interface Generator {
  name: string
  generate(entities: Entity[]): Promise<GeneratedFile[]>
}

/**
 * 迁移接口
 */
export interface Migration {
  id: string
  timestamp: Date
  operations: MigrationOperation[]
  sql: string
  checksum: string
}

/**
 * 迁移操作
 */
export interface MigrationOperation {
  type: 'create_table' | 'drop_table' | 'add_column' | 'drop_column' | 'alter_column' | 'create_index' | 'drop_index'
  table: string
  details: Record<string, unknown>
}

/**
 * Schema上下文
 */
export interface SchemaContext {
  entities: Map<string, Entity>
  generators: Generator[]
  plugins: SchemaPlugin[]
  validators: Map<string, ValidationRule>
}

/**
 * 自定义字段类型配置
 */
export interface CustomFieldTypeConfig<T = unknown> {
  name: string
  tsType: string
  prismaType: string
  validate?: (value: unknown) => boolean
  transform?: (value: unknown) => T
  defaultValue?: T
  mock?: () => T
}