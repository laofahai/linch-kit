import { z } from 'zod'

/**
 * 数据库字段类型映射
 */
export type PrismaFieldType =
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
 * 数据库关系类型
 */
export type PrismaRelationType = 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one'

/**
 * 字段属性配置
 */
export interface FieldAttributes {
  /** 是否为主键 */
  id?: boolean
  /** 是否唯一 */
  unique?: boolean
  /** 是否可选 */
  optional?: boolean
  /** 默认值 */
  default?: any
  /** 数据库字段名 */
  map?: string
  /** 是否自动更新时间戳 */
  updatedAt?: boolean
  /** 是否自动创建时间戳 */
  createdAt?: boolean
  /** 是否为软删除字段 */
  softDelete?: boolean
  /** 关系配置 */
  relation?: RelationAttributes
  /** 数据库特定属性 */
  db?: {
    type?: string
    length?: number
    precision?: number
    scale?: number
  }
}

/**
 * 关系字段配置
 */
export interface RelationAttributes {
  /** 关系类型 */
  type: PrismaRelationType
  /** 关联的模型 */
  model: string
  /** 外键字段 */
  foreignKey?: string
  /** 引用字段 */
  references?: string
  /** 级联删除 */
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  /** 级联更新 */
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
}

/**
 * 模型配置
 */
export interface ModelConfig {
  /** 表名映射 */
  tableName?: string
  /** 索引配置 */
  indexes?: Array<{
    fields: string[]
    unique?: boolean
    name?: string
  }>
  /** 复合主键 */
  compositePrimaryKey?: string[]
}

/**
 * Schema 元数据
 */
export interface SchemaMetadata {
  /** 字段属性 */
  fields?: Record<string, FieldAttributes>
  /** 关系配置 */
  relations?: Record<string, RelationAttributes>
  /** 模型配置 */
  model?: ModelConfig
}

/**
 * 扩展的 Zod Object Schema，包含 Prisma 元数据
 */
export type EntitySchema<T extends Record<string, any> = any> = z.ZodObject<
  z.ZodRawShape,
  'strip',
  z.ZodTypeAny,
  T,
  T
> & {
  _meta?: SchemaMetadata
}

/**
 * 实体定义接口
 */
export interface EntityDefinition<T extends Record<string, any> = any> {
  /** 实体名称 */
  name: string
  /** Zod Schema */
  schema: EntitySchema<T>
  /** 元数据 */
  meta?: SchemaMetadata
}
