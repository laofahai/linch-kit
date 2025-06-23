/**
 * 核心类型定义 - 零依赖的基础类型
 * 
 * 这个文件包含最基础的类型定义，避免复杂的类型推导
 * 目标：提升 DTS 构建性能，保持类型安全
 */

import { z } from 'zod'

/**
 * 数据库字段类型映射（简化版）
 */
export type DatabaseFieldType =
  | 'String'
  | 'Int'
  | 'BigInt'
  | 'Float'
  | 'Decimal'
  | 'Boolean'
  | 'DateTime'
  | 'Json'
  | 'Bytes'

/**
 * 数据库关系类型（简化版）
 */
export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one'

/**
 * 国际化文本类型（简化版）
 */
export type I18nText = string

/**
 * 最小化字段配置 - 只包含最核心的数据库相关配置
 */
export interface MinimalFieldConfig {
  /** 是否为主键 */
  primary?: boolean
  /** 是否唯一 */
  unique?: boolean
  /** 默认值 */
  default?: unknown
  /** 数据库字段名 */
  map?: string
  /** 是否自动更新时间戳 */
  updatedAt?: boolean
  /** 是否自动创建时间戳 */
  createdAt?: boolean
  /** 是否为软删除字段 */
  softDelete?: boolean
}

/**
 * 基础字段配置 - 包含基本的 UI 配置
 */
export interface BasicFieldConfig extends MinimalFieldConfig {
  /** 字段标签 */
  label?: string
  /** 字段描述 */
  description?: string
  /** 占位符文本 */
  placeholder?: string
  /** 帮助文本 */
  helpText?: string
  /** 字段显示顺序 */
  order?: number
  /** 是否隐藏字段 */
  hidden?: boolean
  /** 字段分组 */
  group?: string
}

/**
 * 数据库配置（分离出来避免嵌套复杂度）
 */
export interface DatabaseConfig {
  type?: 'JSON' | 'TEXT' | 'VARCHAR' | 'CHAR' | 'DECIMAL' | 'INT' | 'BIGINT' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | string
  length?: number
  precision?: number
  scale?: number
  /** 是否存储为 JSON（自动推断嵌套对象） */
  json?: boolean
}

/**
 * 关系配置（分离出来避免嵌套复杂度）
 */
export interface RelationConfig {
  type: RelationType
  model: string
  foreignKey?: string
  references?: string
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
}

/**
 * 验证配置（分离出来避免嵌套复杂度）
 */
export interface ValidationConfig {
  /** 是否必填 */
  required?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 错误消息（简化版本） */
  errorMessages?: Record<string, string>
}

/**
 * 核心字段配置 - 包含所有核心功能但避免复杂嵌套
 */
export interface CoreFieldConfig extends BasicFieldConfig {
  /** 数据库配置 */
  db?: DatabaseConfig
  /** 关系配置 */
  relation?: RelationConfig
  /** 验证配置 */
  validation?: ValidationConfig
}

/**
 * 字段元数据（简化版）
 */
export interface FieldMetadata {
  /** 字段名 */
  name?: string
  /** 字段类型 */
  type?: string
  /** 是否为主键 */
  isPrimary?: boolean
  /** 是否唯一 */
  isUnique?: boolean
  /** 是否可空 */
  isOptional?: boolean
  /** 默认值 */
  defaultValue?: unknown
}

/**
 * 实体元数据（简化版）
 */
export interface EntityMetadata {
  /** 实体名称 */
  name: string
  /** 表名 */
  tableName?: string
  /** 字段元数据 */
  fields?: Record<string, FieldMetadata>
  /** 索引配置 */
  indexes?: Array<{
    fields: string[]
    unique?: boolean
    name?: string
  }>
}

/**
 * 简化的 Zod Schema 扩展
 * 移除复杂的泛型参数，防止无限类型递归
 */
export type CoreSchema = z.ZodObject<any> & {
  _meta?: EntityMetadata
}

/**
 * 简化的实体定义接口
 */
export interface CoreEntityDefinition {
  /** 实体名称 */
  name: string
  /** Zod Schema */
  schema: CoreSchema
  /** 元数据 */
  meta?: EntityMetadata
}

/**
 * 字段装饰器类型（简化版）
 */
export type FieldDecorator<T extends z.ZodSchema = z.ZodSchema> = (schema: T) => T

/**
 * 实体构建器类型（简化版）
 */
export type EntityBuilder = (
  name: string,
  fields: Record<string, z.ZodSchema>,
  config?: {
    tableName?: string
    indexes?: Array<{
      fields: string[]
      unique?: boolean
      name?: string
    }>
  }
) => CoreEntityDefinition

/**
 * 类型辅助函数：从 Schema 推断类型（简化版）
 */
export type InferSchemaType<T extends z.ZodSchema> = z.infer<T>

/**
 * 类型辅助函数：从字段定义推断实体类型（简化版）
 */
export type InferEntityType<T extends Record<string, z.ZodSchema>> = {
  [K in keyof T]: z.infer<T[K]>
}

/**
 * 性能优化的字段符号
 */
export const FIELD_META_SYMBOL = Symbol('fieldMeta')

/**
 * 性能优化的实体符号
 */
export const ENTITY_META_SYMBOL = Symbol('entityMeta')

/**
 * 字段配置验证函数（运行时类型安全）
 */
export function validateFieldConfig(config: unknown): config is CoreFieldConfig {
  if (!config || typeof config !== 'object') return false
  
  const cfg = config as Record<string, unknown>
  
  // 基本类型检查
  if (cfg.primary !== undefined && typeof cfg.primary !== 'boolean') return false
  if (cfg.unique !== undefined && typeof cfg.unique !== 'boolean') return false
  if (cfg.label !== undefined && typeof cfg.label !== 'string') return false
  if (cfg.order !== undefined && typeof cfg.order !== 'number') return false
  if (cfg.hidden !== undefined && typeof cfg.hidden !== 'boolean') return false
  
  return true
}

/**
 * 实体配置验证函数（运行时类型安全）
 */
export function validateEntityConfig(config: unknown): config is EntityMetadata {
  if (!config || typeof config !== 'object') return false
  
  const cfg = config as Record<string, unknown>
  
  // 基本类型检查
  if (cfg.name !== undefined && typeof cfg.name !== 'string') return false
  if (cfg.tableName !== undefined && typeof cfg.tableName !== 'string') return false
  
  return true
}

/**
 * 性能优化的字段元数据获取函数
 */
export function getFieldMeta(schema: z.ZodSchema): FieldMetadata | undefined {
  return (schema as any)[FIELD_META_SYMBOL]
}

/**
 * 性能优化的字段元数据设置函数
 */
export function setFieldMeta<T extends z.ZodSchema>(
  schema: T,
  meta: FieldMetadata
): T {
  ;(schema as any)[FIELD_META_SYMBOL] = meta
  return schema
}

/**
 * 性能优化的实体元数据获取函数
 */
export function getEntityMeta(schema: CoreSchema): EntityMetadata | undefined {
  return (schema as any)[ENTITY_META_SYMBOL]
}

/**
 * 性能优化的实体元数据设置函数
 */
export function setEntityMeta(
  schema: CoreSchema,
  meta: EntityMetadata
): CoreSchema {
  ;(schema as any)[ENTITY_META_SYMBOL] = meta
  return schema
}
