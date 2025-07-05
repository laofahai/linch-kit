/**
 * @linch-kit/schema 实体类型定义
 * 
 * @description 实体相关的类型定义
 * @author LinchKit Team
 * @since 0.1.0
 */

import type { z } from 'zod'

import type { FieldDefinition, PermissionRule } from './field'

/**
 * 索引定义
 */
export interface IndexDefinition {
  name?: string
  fields: string[]
  unique?: boolean
  type?: 'btree' | 'hash' | 'gin' | 'gist'
}

/**
 * 实体权限
 */
export interface EntityPermissions {
  create?: PermissionRule[]
  read?: PermissionRule[]
  update?: PermissionRule[]
  delete?: PermissionRule[]
}

/**
 * 实体钩子
 */
export interface EntityHooks {
  beforeCreate?: (data: unknown) => Promise<unknown> | unknown
  afterCreate?: (entity: unknown) => Promise<void> | void
  beforeUpdate?: (data: unknown, entity: unknown) => Promise<unknown> | unknown
  afterUpdate?: (entity: unknown) => Promise<void> | void
  beforeDelete?: (entity: unknown) => Promise<void> | void
  afterDelete?: (entity: unknown) => Promise<void> | void
}

/**
 * 实体选项
 */
export interface EntityOptions {
  tableName?: string
  schema?: string
  description?: string
  softDelete?: boolean
  timestamps?: boolean
  audit?: boolean
  cache?: boolean
  permissions?: EntityPermissions
  hooks?: EntityHooks
  indexes?: IndexDefinition[]
}

/**
 * 实体定义
 */
export interface EntityDefinition<T = Record<string, FieldDefinition>> {
  name: string
  fields: T
  options?: EntityOptions
}

/**
 * 实体类 - Schema定义，不包含数据库操作
 */
export interface Entity<T = Record<string, unknown>> {
  name: string
  fields: Record<keyof T, FieldDefinition>
  options: EntityOptions

  // Zod Schemas
  zodSchema: z.ZodObject<Record<string, z.ZodSchema>>
  createSchema: z.ZodObject<Record<string, z.ZodSchema>>
  updateSchema: z.ZodObject<Record<string, z.ZodSchema>>

  // 类型获取属性
  type: T
  createInput: CreateInput<T>
  updateInput: UpdateInput<T>

  // Schema相关方法（不包含数据库操作）
  validate(data: unknown): Promise<boolean>
  validateAndParse(data: unknown): T
  validateCreate(data: unknown): CreateInput<T>
  validateUpdate(data: unknown): UpdateInput<T>

  // 实体信息获取方法
  getTableName(): string
  getFieldNames(): string[]
  getRequiredFields(): string[]
  getUniqueFields(): string[]
  getIndexedFields(): string[]
  getRelationFields(): Array<[string, FieldDefinition]>

  // Schema操作方法
  clone(): Entity<T>
  extend(fields: Record<string, FieldDefinition | { build(): FieldDefinition }>): Entity
  withOptions(options: Partial<EntityOptions>): Entity<T>
}

/**
 * 迁移操作类型
 */
export type MigrationOperation = 
  | 'CREATE_TABLE'
  | 'DROP_TABLE'
  | 'ADD_COLUMN'
  | 'DROP_COLUMN'
  | 'MODIFY_COLUMN'
  | 'ADD_INDEX'
  | 'DROP_INDEX'
  | 'ADD_CONSTRAINT'
  | 'DROP_CONSTRAINT'

/**
 * 迁移定义
 */
export interface Migration {
  id: string
  name: string
  timestamp: number
  operations: {
    type: MigrationOperation
    table: string
    column?: string
    definition?: unknown
    options?: unknown
  }[]
}

/**
 * 创建输入类型
 */
export type CreateInput<T = Record<string, unknown>> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

/**
 * 更新输入类型
 */
export type UpdateInput<T = Record<string, unknown>> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
