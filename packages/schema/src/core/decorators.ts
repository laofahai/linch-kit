import { z } from 'zod'

import type { FieldAttributes, FieldConfig, SimpleFieldConfig, I18nText } from './types'
import {
  type CoreFieldConfig,
  type FieldMetadata,
  FIELD_META_SYMBOL,
  validateFieldConfig,
} from './core-types'

// 重新导出符号以保持兼容性
export { FIELD_META_SYMBOL }

/**
 * 为 Zod Schema 添加字段属性
 * 性能优化版本：使用更简单的类型操作，避免复杂泛型推导
 */
export function withFieldMeta<T extends z.ZodSchema>(
  schema: T,
  attributes: FieldAttributes
): T {
  // 直接在对象上添加属性，避免复杂的类型断言
  ;(schema as any)[FIELD_META_SYMBOL] = attributes
  return schema
}

/**
 * 获取字段元数据
 */
export function getFieldMeta(schema: z.ZodSchema): FieldAttributes | undefined {
  return (schema as any)[FIELD_META_SYMBOL]
}

/**
 * 🎯 定义字段 - 推荐使用（性能优化版本）
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
 * ```
 */
export function defineField<T extends z.ZodSchema>(
  schema: T,
  config?: CoreFieldConfig
): T {
  // 快速路径：如果没有配置，直接返回
  if (!config) return schema

  // 运行时验证（替代复杂的类型推导）
  if (!validateFieldConfig(config)) {
    console.warn('Invalid field config provided, using default')
    return schema
  }

  // 创建最小化的元数据对象
  const metadata: FieldMetadata = {}

  // 只设置有值的属性
  if (config.primary) metadata.isPrimary = true
  if (config.unique) metadata.isUnique = true
  if (config.default !== undefined) metadata.defaultValue = config.default

  // 直接设置元数据，避免复杂的类型操作
  ;(schema as any)[FIELD_META_SYMBOL] = {
    ...metadata,
    // 保存完整配置用于后续处理
    _fullConfig: config
  }

  return schema
}

// defineFieldAdvanced 已移除 - 使用 defineField 替代

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

/**
 * 便捷装饰器 - 标签
 */
export function label<T extends z.ZodSchema>(schema: T, labelText: string): T {
  return defineField(schema, { label: labelText })
}

/**
 * 便捷装饰器 - 描述
 */
export function description<T extends z.ZodSchema>(schema: T, desc: string): T {
  return defineField(schema, { description: desc })
}

/**
 * 便捷装饰器 - 占位符
 */
export function placeholder<T extends z.ZodSchema>(schema: T, text: string): T {
  return defineField(schema, { placeholder: text })
}

/**
 * 便捷装饰器 - 字段分组
 */
export function group<T extends z.ZodSchema>(schema: T, groupName: string): T {
  return defineField(schema, { group: groupName })
}

/**
 * 便捷装饰器 - 显示顺序
 */
export function order<T extends z.ZodSchema>(schema: T, orderNum: number): T {
  return defineField(schema, { order: orderNum })
}

/**
 * 便捷装饰器 - 隐藏字段
 */
export function hidden<T extends z.ZodSchema>(schema: T): T {
  return defineField(schema, { hidden: true })
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
