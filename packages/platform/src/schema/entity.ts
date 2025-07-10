/**
 * Entity定义系统 - 运行时版本
 * @module platform/schema/entity
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 字段类型定义
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'text' | 'email' | 'url'

/**
 * 字段定义
 */
export interface FieldDefinition {
  type: FieldType
  required?: boolean
  default?: unknown
  validation?: z.ZodSchema
  description?: string
}

/**
 * Entity选项
 */
export interface EntityOptions {
  timestamps?: boolean
  softDelete?: boolean
  tableName?: string
}

/**
 * Entity定义
 */
export interface EntityDefinition<T = Record<string, FieldDefinition>> {
  fields: T
  options?: EntityOptions
}

/**
 * Entity运行时实现
 */
export class Entity<T = Record<string, unknown>> {
  public readonly name: string
  public readonly fields: Record<keyof T, FieldDefinition>
  public readonly options: EntityOptions
  public readonly zodSchema: z.ZodObject<Record<string, z.ZodSchema>>
  
  private extensionContext?: ExtensionContext

  constructor(name: string, definition: EntityDefinition<Record<keyof T, FieldDefinition>>) {
    this.name = name
    this.fields = definition.fields as Record<keyof T, FieldDefinition>
    this.options = {
      timestamps: true,
      softDelete: false,
      ...definition.options,
    }
    
    this.zodSchema = this.buildZodSchema()
  }

  /**
   * 构建Zod验证schema
   */
  private buildZodSchema(): z.ZodObject<Record<string, z.ZodSchema>> {
    const schemaFields: Record<string, z.ZodSchema> = {}
    
    for (const [fieldName, fieldDef] of Object.entries(this.fields)) {
      let fieldSchema = this.fieldTypeToZod(fieldDef.type)
      
      // 应用自定义验证
      if (fieldDef.validation) {
        fieldSchema = fieldDef.validation
      }
      
      // 处理可选字段
      if (!fieldDef.required) {
        fieldSchema = fieldSchema.optional()
      }
      
      // 处理默认值
      if (fieldDef.default !== undefined) {
        fieldSchema = fieldSchema.default(fieldDef.default)
      }
      
      schemaFields[fieldName] = fieldSchema
    }
    
    return z.object(schemaFields)
  }

  /**
   * 字段类型转换为Zod schema
   */
  private fieldTypeToZod(type: FieldType): z.ZodSchema {
    switch (type) {
      case 'string':
        return z.string()
      case 'number':
        return z.number()
      case 'boolean':
        return z.boolean()
      case 'date':
        return z.date()
      case 'json':
        return z.record(z.unknown())
      case 'text':
        return z.string()
      case 'email':
        return z.string().email()
      case 'url':
        return z.string().url()
      default:
        return z.unknown()
    }
  }

  /**
   * 验证数据
   */
  validate(data: unknown): { success: boolean; data?: T; error?: z.ZodError } {
    const result = this.zodSchema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data as T }
    } else {
      this.extensionContext?.logger.warn(`Validation failed for entity ${this.name}`, result.error)
      return { success: false, error: result.error }
    }
  }

  /**
   * 验证并解析数据（抛出异常版本）
   */
  parse(data: unknown): T {
    return this.zodSchema.parse(data) as T
  }

  /**
   * 设置Extension上下文
   */
  setExtensionContext(context: ExtensionContext): void {
    this.extensionContext = context
  }

  /**
   * 获取字段列表
   */
  getFields(): string[] {
    return Object.keys(this.fields)
  }

  /**
   * 获取必填字段
   */
  getRequiredFields(): string[] {
    return Object.entries(this.fields)
      .filter(([, field]) => field.required)
      .map(([name]) => name)
  }

  /**
   * 检查字段是否存在
   */
  hasField(fieldName: string): boolean {
    return fieldName in this.fields
  }
}

/**
 * 创建Entity的便捷函数
 */
export function defineEntity<T = Record<string, unknown>>(
  name: string,
  definition: EntityDefinition<Record<keyof T, FieldDefinition>>
): Entity<T> {
  return new Entity<T>(name, definition)
}