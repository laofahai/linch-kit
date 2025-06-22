import { z } from 'zod'

import type { FieldAttributes, FieldConfig, SimpleFieldConfig, I18nText } from './types'

/**
 * 字段元数据符号，用于标记字段属性
 */
const FIELD_META_SYMBOL = Symbol('fieldMeta')

/**
 * 为 Zod Schema 添加字段属性
 * 改进版本：保持基本类型安全，避免复杂泛型推导
 */
export function withFieldMeta<T extends z.ZodSchema>(
  schema: T,
  attributes: FieldAttributes
): T {
  // 使用类型断言，但保持输入输出类型一致
  const enhanced = schema as T & { [FIELD_META_SYMBOL]: FieldAttributes }
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
 * 🎯 定义字段 - 推荐使用（改进版本）
 *
 * @param schema Zod schema
 * @param config 简化的字段配置对象（可选）
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
 *   required: true
 * })
 * ```
 */
export function defineField<T extends z.ZodSchema>(
  schema: T,
  config?: SimpleFieldConfig
): T {
  if (!config) return schema

  // 转换为 FieldAttributes 格式，保持类型安全
  const attributes: FieldAttributes = {
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
  }

  return withFieldMeta(schema, attributes)
}

/**
 * 🔧 高级字段定义 - 支持完整功能（可能影响 DTS 性能）
 *
 * 注意：此函数支持所有高级功能，但可能导致 DTS 构建性能问题
 * 在大多数情况下推荐使用 defineField
 */
export function defineFieldAdvanced<T extends z.ZodSchema>(
  schema: T,
  config?: FieldConfig
): T {
  if (!config) return schema

  // 转换为 FieldAttributes 格式，支持所有功能
  const attributes: FieldAttributes = {
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

    // 高级特性
    permissions: config.permissions,
    transform: config.transform,
    audit: config.audit,
    virtual: config.virtual,
  }

  return withFieldMeta(schema, attributes)
}

// === 便捷装饰器（向后兼容） ===

// === 向后兼容的便捷装饰器 ===

/**
 * 主键装饰器
 */
export function primary<T extends z.ZodSchema>(schema: T): T {
  return defineField(schema, { primary: true })
}

/**
 * 唯一约束装饰器
 */
export function unique<T extends z.ZodSchema>(schema: T): T {
  return defineField(schema, { unique: true })
}

/**
 * 默认值装饰器
 */
export function defaultValue<T extends z.ZodSchema>(schema: T, value: unknown): T {
  return defineField(schema, { default: value })
}

/**
 * 自动时间戳装饰器
 */
export function createdAt<T extends z.ZodSchema>(schema: T): T {
  return defineField(schema, { createdAt: true })
}

export function updatedAt<T extends z.ZodSchema>(schema: T): T {
  return defineField(schema, { updatedAt: true })
}

/**
 * 软删除装饰器
 */
export function softDelete<T extends z.ZodSchema>(schema: T): T {
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
