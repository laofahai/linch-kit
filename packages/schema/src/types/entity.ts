/**
 * @linch-kit/schema 实体相关类型定义
 */

import type { z } from 'zod'

import type { FieldDefinition, PermissionRule } from './field'

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
 * 实体定义接口
 */
export interface EntityDefinition<T = Record<string, FieldDefinition>> {
  fields: T
  options?: EntityOptions
}

/**
 * 实体接口
 */
export interface Entity<T = Record<string, unknown>> {
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
