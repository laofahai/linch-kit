/**
 * Type definitions for platform schema module
 * @module platform/schema/types
 */

import type { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

/**
 * 基础字段类型
 */
export type PrimitiveType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'text'
  | 'email'
  | 'url'
  | 'uuid'

/**
 * 复合字段类型
 */
export type ComplexType = 'array' | 'object' | 'enum' | 'relation' | 'computed'

/**
 * 所有支持的字段类型
 */
export type FieldType = PrimitiveType | ComplexType

/**
 * 字段约束
 */
export interface FieldConstraints {
  required?: boolean
  unique?: boolean
  index?: boolean
  nullable?: boolean
  default?: unknown
  min?: number
  max?: number
  length?: number
  pattern?: RegExp | string
  enum?: readonly string[] | readonly number[]
}

/**
 * 字段元数据
 */
export interface FieldMetadata {
  label?: string
  description?: string
  placeholder?: string
  help?: string
  group?: string
  order?: number
  hidden?: boolean
  readonly?: boolean
  computed?: boolean
  deprecated?: boolean
  version?: string
  tags?: string[]
  examples?: unknown[]
}

/**
 * 字段关系定义
 */
export interface FieldRelation {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'
  target: string
  foreignKey?: string
  localKey?: string
  through?: string
  as?: string
  onDelete?: 'cascade' | 'restrict' | 'setNull'
  onUpdate?: 'cascade' | 'restrict'
}

/**
 * 完整字段定义
 */
export interface FieldDefinition {
  name: string
  type: FieldType
  constraints?: FieldConstraints
  metadata?: FieldMetadata
  relation?: FieldRelation
  validation?: z.ZodSchema
  transform?: {
    input?: (value: unknown) => unknown
    output?: (value: unknown) => unknown
  }
}

/**
 * 实体索引定义
 */
export interface IndexDefinition {
  name: string
  fields: string[]
  unique?: boolean
  type?: 'btree' | 'hash' | 'gin' | 'gist'
  where?: string
  partial?: boolean
}

/**
 * 实体约束定义
 */
export interface ConstraintDefinition {
  name: string
  type: 'primary' | 'foreign' | 'unique' | 'check'
  fields: string[]
  reference?: {
    table: string
    fields: string[]
    onDelete?: 'cascade' | 'restrict' | 'setNull'
    onUpdate?: 'cascade' | 'restrict'
  }
  expression?: string
}

/**
 * 实体选项
 */
export interface EntityOptions {
  tableName?: string
  primaryKey?: string | string[]
  timestamps?:
    | boolean
    | {
        createdAt?: string
        updatedAt?: string
      }
  softDelete?:
    | boolean
    | {
        deletedAt?: string
      }
  version?:
    | boolean
    | {
        field?: string
      }
  audit?: boolean
  cache?: {
    enabled?: boolean
    ttl?: number
    tags?: string[]
  }
  permissions?: {
    create?: string[]
    read?: string[]
    update?: string[]
    delete?: string[]
  }
}

/**
 * 实体元数据
 */
export interface EntityMetadata {
  name: string
  description?: string
  version?: string
  author?: string
  created?: Date
  updated?: Date
  tags?: string[]
  category?: string
  deprecated?: boolean
  experimental?: boolean
}

/**
 * 实体事件钩子
 */
export interface EntityHooks<T = unknown> {
  beforeValidate?: (
    data: Partial<T>,
    context?: ExtensionContext
  ) => Promise<Partial<T>> | Partial<T>
  afterValidate?: (data: T, context?: ExtensionContext) => Promise<void> | void
  beforeCreate?: (data: Partial<T>, context?: ExtensionContext) => Promise<Partial<T>> | Partial<T>
  afterCreate?: (data: T, context?: ExtensionContext) => Promise<void> | void
  beforeUpdate?: (
    data: Partial<T>,
    oldData: T,
    context?: ExtensionContext
  ) => Promise<Partial<T>> | Partial<T>
  afterUpdate?: (data: T, oldData: T, context?: ExtensionContext) => Promise<void> | void
  beforeDelete?: (data: T, context?: ExtensionContext) => Promise<void> | void
  afterDelete?: (data: T, context?: ExtensionContext) => Promise<void> | void
}

/**
 * 实体配置
 */
export interface EntityConfig<T = unknown> {
  fields: Record<string, FieldDefinition>
  options?: EntityOptions
  metadata?: EntityMetadata
  indexes?: IndexDefinition[]
  constraints?: ConstraintDefinition[]
  hooks?: EntityHooks<T>
  plugins?: string[]
  extends?: string | string[]
}

/**
 * Schema注册表项
 */
export interface SchemaRegistryEntry {
  name: string
  entity: EntityConfig
  zodSchema: z.ZodSchema
  createdAt: Date
  updatedAt: Date
  version: string
  hash: string
}

/**
 * Schema验证结果
 */
export interface SchemaValidationResult<T = unknown> {
  valid: boolean
  data?: T
  errors: Array<{
    field: string
    message: string
    code: string
    value?: unknown
  }>
  warnings?: Array<{
    field: string
    message: string
    code: string
  }>
  metadata?: {
    validatedAt: Date
    schema: string
    version: string
    executionTime: number
  }
}

/**
 * Schema迁移操作
 */
export type MigrationOperation =
  | { type: 'createEntity'; entity: EntityConfig }
  | { type: 'dropEntity'; name: string }
  | { type: 'addField'; entity: string; field: string; definition: FieldDefinition }
  | { type: 'dropField'; entity: string; field: string }
  | { type: 'modifyField'; entity: string; field: string; definition: FieldDefinition }
  | { type: 'addIndex'; entity: string; index: IndexDefinition }
  | { type: 'dropIndex'; entity: string; name: string }
  | { type: 'addConstraint'; entity: string; constraint: ConstraintDefinition }
  | { type: 'dropConstraint'; entity: string; name: string }

/**
 * Schema迁移
 */
export interface SchemaMigration {
  version: string
  name: string
  description?: string
  operations: MigrationOperation[]
  dependencies?: string[]
  rollback?: MigrationOperation[]
  timestamp: Date
  author?: string
}

/**
 * Schema差异
 */
export interface SchemaDiff {
  added: {
    entities: string[]
    fields: Array<{ entity: string; field: string }>
    indexes: Array<{ entity: string; index: string }>
    constraints: Array<{ entity: string; constraint: string }>
  }
  removed: {
    entities: string[]
    fields: Array<{ entity: string; field: string }>
    indexes: Array<{ entity: string; index: string }>
    constraints: Array<{ entity: string; constraint: string }>
  }
  modified: {
    entities: Array<{ name: string; changes: string[] }>
    fields: Array<{ entity: string; field: string; changes: string[] }>
    indexes: Array<{ entity: string; index: string; changes: string[] }>
    constraints: Array<{ entity: string; constraint: string; changes: string[] }>
  }
}

/**
 * Schema同步选项
 */
export interface SchemaSyncOptions {
  dryRun?: boolean
  force?: boolean
  backup?: boolean
  parallel?: boolean
  timeout?: number
  onProgress?: (progress: { step: string; progress: number; total: number }) => void
  onError?: (error: Error, operation: MigrationOperation) => void
}

/**
 * Schema同步结果
 */
export interface SchemaSyncResult {
  success: boolean
  operations: Array<{
    operation: MigrationOperation
    success: boolean
    error?: string
    duration: number
  }>
  summary: {
    total: number
    successful: number
    failed: number
    skipped: number
    duration: number
  }
  backup?: {
    file: string
    timestamp: Date
  }
}

/**
 * 实体关系图
 */
export interface EntityRelationGraph {
  entities: Array<{
    name: string
    fields: string[]
    relations: Array<{
      field: string
      target: string
      type: string
    }>
  }>
  edges: Array<{
    from: string
    to: string
    type: string
    field: string
  }>
}

/**
 * Schema分析结果
 */
export interface SchemaAnalysis {
  entities: number
  fields: number
  relations: number
  indexes: number
  constraints: number
  complexity: 'low' | 'medium' | 'high'
  issues: Array<{
    type: 'warning' | 'error'
    entity?: string
    field?: string
    message: string
    suggestion?: string
  }>
  metrics: {
    averageFieldsPerEntity: number
    maxRelationDepth: number
    circularReferences: string[]
    orphanedEntities: string[]
  }
}

/**
 * 字段类型映射器
 */
export interface TypeMapper {
  fromPrimitive(type: PrimitiveType, constraints?: FieldConstraints): z.ZodSchema
  fromComplex(type: ComplexType, options?: Record<string, unknown>): z.ZodSchema
  toPrimitive(schema: z.ZodSchema): PrimitiveType | null
  toDatabase(type: FieldType, dialect: 'postgresql' | 'mysql' | 'sqlite'): string
  toTypeScript(type: FieldType, nullable?: boolean): string
}

/**
 * Schema生成器选项
 */
export interface SchemaGeneratorOptions {
  target: 'zod' | 'typescript' | 'json' | 'sql' | 'prisma' | 'graphql'
  dialect?: 'postgresql' | 'mysql' | 'sqlite'
  includeMetadata?: boolean
  includeComments?: boolean
  format?: boolean
  customTypes?: Record<string, string>
}

/**
 * Schema生成结果
 */
export interface SchemaGenerationResult {
  content: string
  metadata: {
    target: string
    entities: number
    generatedAt: Date
    version: string
  }
  dependencies?: string[]
  warnings?: string[]
}
