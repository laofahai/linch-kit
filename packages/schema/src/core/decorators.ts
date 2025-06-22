import { z } from 'zod'

import type { FieldAttributes, FieldConfig, I18nText } from './types'

/**
 * 字段元数据符号，用于标记字段属性
 */
const FIELD_META_SYMBOL = Symbol('fieldMeta')

/**
 * 为 Zod Schema 添加字段属性
 * 优化版本：完全移除泛型推断，使用运行时类型安全
 */
export function withFieldMeta(schema: any, attributes: any): any {
  // 使用最简单的方式，完全避免泛型推断
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
 * 🎯 定义字段 - 推荐使用
 *
 * @param schema Zod schema
 * @param config 字段配置对象（可选）
 *
 * @example
 * ```typescript
 * // 简单用法 - 直接使用 Zod schema
 * email: z.string().email()  // 会自动生成默认配置
 *
 * // 带配置的用法
 * email: defineField(z.string().email(), {
 *   label: 'user.email.label',
 *   placeholder: 'user.email.placeholder',
 *   unique: true,
 *   order: 1
 * })
 *
 * // 复杂配置
 * password: defineField(z.string().min(8), {
 *   label: 'user.password.label',
 *   group: 'security',
 *   order: 3,
 *   permissions: {
 *     write: 'users:change-password'
 *   }
 * })
 * ```
 */
export function defineField(schema: any, config?: any): any {
  if (!config) return schema

  // 创建简化的属性对象，完全避免复杂的类型推导
  const attributes = {
    // 数据库相关
    id: config.primary,
    unique: config.unique,
    default: config.default,
    map: config.map,
    updatedAt: config.updatedAt,
    createdAt: config.createdAt,
    softDelete: config.softDelete,
    db: config.db,
    relation: config.relation,

    // UI 相关
    label: config.label,
    description: config.description,
    placeholder: config.placeholder,
    helpText: config.helpText,
    order: config.order,
    hidden: config.hidden,
    group: config.group,
    required: config.required,
    readonly: config.readonly,
    errorMessages: config.errorMessages,

    // 高级特性（预留接口）
    permissions: config.permissions,
    transform: config.transform,
    audit: config.audit,
    virtual: config.virtual,
  }

  // 直接使用类型断言，避免复杂的泛型推断
  return withFieldMeta(schema, attributes)
}

// === 便捷装饰器（向后兼容） ===

// === 向后兼容的便捷装饰器 ===

/**
 * 主键装饰器
 */
export function primary(schema: z.ZodSchema): z.ZodSchema {
  return defineField(schema, { primary: true })
}

/**
 * 唯一约束装饰器
 */
export function unique(schema: z.ZodSchema): z.ZodSchema {
  return defineField(schema, { unique: true })
}

/**
 * 默认值装饰器
 */
export function defaultValue(schema: z.ZodSchema, value: any): z.ZodSchema {
  return defineField(schema, { default: value })
}

/**
 * 自动时间戳装饰器
 */
export function createdAt(schema: z.ZodSchema): z.ZodSchema {
  return defineField(schema, { createdAt: true })
}

export function updatedAt(schema: z.ZodSchema): z.ZodSchema {
  return defineField(schema, { updatedAt: true })
}

/**
 * 软删除装饰器
 */
export function softDelete(schema: z.ZodSchema): z.ZodSchema {
  return defineField(schema, { softDelete: true })
}

// === 向后兼容别名 ===

/**
 * @deprecated 使用 defineField 替代
 */
export const field = defineField

/**
 * 创建国际化 key 的辅助函数
 */
export function i18nKey(key: string): I18nText {
  return key
}
