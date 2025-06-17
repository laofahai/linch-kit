import { z } from 'zod'
import type { FieldAttributes } from './types'

/**
 * 字段元数据符号，用于标记字段属性
 */
const FIELD_META_SYMBOL = Symbol('fieldMeta')

/**
 * 为 Zod Schema 添加字段属性
 */
export function withFieldMeta<T extends z.ZodSchema>(schema: T, attributes: FieldAttributes): T {
  const enhanced = schema as any
  enhanced[FIELD_META_SYMBOL] = attributes
  return enhanced
}

/**
 * 获取字段元数据
 */
export function getFieldMeta(schema: z.ZodSchema): FieldAttributes | undefined {
  return (schema as any)[FIELD_META_SYMBOL]
}

/**
 * 主键装饰器
 */
export function primary<T extends z.ZodSchema>(schema: T): T {
  return withFieldMeta(schema, { id: true })
}

/**
 * 唯一约束装饰器
 */
export function unique<T extends z.ZodSchema>(schema: T): T {
  return withFieldMeta(schema, { unique: true })
}

/**
 * 默认值装饰器
 */
export function defaultValue<T extends z.ZodSchema>(schema: T, value: any): T {
  return withFieldMeta(schema, { default: value })
}

/**
 * 数据库字段映射装饰器
 */
export function dbField<T extends z.ZodSchema>(schema: T, name: string): T {
  return withFieldMeta(schema, { map: name })
}

/**
 * 自动时间戳装饰器
 */
export function createdAt<T extends z.ZodSchema>(schema: T): T {
  return withFieldMeta(schema, { createdAt: true })
}

export function updatedAt<T extends z.ZodSchema>(schema: T): T {
  return withFieldMeta(schema, { updatedAt: true })
}

/**
 * 软删除装饰器
 */
export function softDelete<T extends z.ZodSchema>(schema: T): T {
  return withFieldMeta(schema, { softDelete: true })
}

/**
 * 数据库特定类型装饰器
 */
export function dbType<T extends z.ZodSchema>(
  schema: T,
  type: string,
  options?: { length?: number; precision?: number; scale?: number }
): T {
  return withFieldMeta(schema, {
    db: { type, ...options },
  })
}

/**
 * 关系字段装饰器
 */
export function relation<T extends z.ZodSchema>(
  schema: T,
  targetEntity: string,
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many',
  options?: {
    foreignKey?: string
    references?: string
    onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
    onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  }
): T {
  return withFieldMeta(schema, {
    relation: {
      type,
      model: targetEntity,
      foreignKey: options?.foreignKey,
      references: options?.references,
      onDelete: options?.onDelete,
      onUpdate: options?.onUpdate,
    },
  })
}
