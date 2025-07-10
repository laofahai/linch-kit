/**
 * Field definitions for platform schema module
 * @module platform/schema/field
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 字段类型枚举
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json',
  TEXT = 'text',
  EMAIL = 'email',
  URL = 'url',
  UUID = 'uuid',
  ENUM = 'enum',
  ARRAY = 'array',
  OBJECT = 'object',
}

/**
 * 字段验证规则
 */
export interface FieldValidation {
  min?: number
  max?: number
  length?: number
  pattern?: RegExp | string
  custom?: (value: unknown) => boolean | string
  required?: boolean
  unique?: boolean
}

/**
 * 字段选项
 */
export interface FieldOptions {
  label?: string
  description?: string
  placeholder?: string
  defaultValue?: unknown
  validation?: FieldValidation
  enumValues?: string[] | number[]
  format?: string
  hidden?: boolean
  readonly?: boolean
  computed?: boolean
  index?: boolean
  nullable?: boolean
}

/**
 * 字段定义接口
 */
export interface FieldDefinition {
  name: string
  type: FieldType
  options: FieldOptions
  zodSchema: z.ZodSchema
  metadata?: Record<string, unknown>
}

/**
 * 字段构建器
 */
export class FieldBuilder {
  private definition: Partial<FieldDefinition>
  private extensionContext?: ExtensionContext

  constructor(name: string, type: FieldType, extensionContext?: ExtensionContext) {
    this.definition = {
      name,
      type,
      options: {},
    }
    this.extensionContext = extensionContext
  }

  /**
   * 设置字段标签
   */
  label(label: string): this {
    this.definition.options!.label = label
    return this
  }

  /**
   * 设置字段描述
   */
  description(description: string): this {
    this.definition.options!.description = description
    return this
  }

  /**
   * 设置占位符
   */
  placeholder(placeholder: string): this {
    this.definition.options!.placeholder = placeholder
    return this
  }

  /**
   * 设置默认值
   */
  default(value: unknown): this {
    this.definition.options!.defaultValue = value
    return this
  }

  /**
   * 设置是否必填
   */
  required(required = true): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.required = required
    return this
  }

  /**
   * 设置是否唯一
   */
  unique(unique = true): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.unique = unique
    return this
  }

  /**
   * 设置最小值/长度
   */
  min(min: number): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.min = min
    return this
  }

  /**
   * 设置最大值/长度
   */
  max(max: number): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.max = max
    return this
  }

  /**
   * 设置精确长度
   */
  length(length: number): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.length = length
    return this
  }

  /**
   * 设置正则表达式验证
   */
  pattern(pattern: RegExp | string): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.pattern = pattern
    return this
  }

  /**
   * 设置自定义验证
   */
  custom(validator: (value: unknown) => boolean | string): this {
    if (!this.definition.options!.validation) {
      this.definition.options!.validation = {}
    }
    this.definition.options!.validation.custom = validator
    return this
  }

  /**
   * 设置枚举值
   */
  enum(values: string[] | number[]): this {
    this.definition.options!.enumValues = values
    return this
  }

  /**
   * 设置格式
   */
  format(format: string): this {
    this.definition.options!.format = format
    return this
  }

  /**
   * 设置是否隐藏
   */
  hidden(hidden = true): this {
    this.definition.options!.hidden = hidden
    return this
  }

  /**
   * 设置是否只读
   */
  readonly(readonly = true): this {
    this.definition.options!.readonly = readonly
    return this
  }

  /**
   * 设置是否计算字段
   */
  computed(computed = true): this {
    this.definition.options!.computed = computed
    return this
  }

  /**
   * 设置是否创建索引
   */
  index(index = true): this {
    this.definition.options!.index = index
    return this
  }

  /**
   * 设置是否可为空
   */
  nullable(nullable = true): this {
    this.definition.options!.nullable = nullable
    return this
  }

  /**
   * 添加元数据
   */
  metadata(key: string, value: unknown): this {
    if (!this.definition.metadata) {
      this.definition.metadata = {}
    }
    this.definition.metadata[key] = value
    return this
  }

  /**
   * 构建字段定义
   */
  build(): FieldDefinition {
    const zodSchema = this.buildZodSchema()

    const fieldDef: FieldDefinition = {
      name: this.definition.name!,
      type: this.definition.type!,
      options: this.definition.options!,
      zodSchema,
      metadata: this.definition.metadata,
    }

    this.extensionContext?.logger.info(`Built field definition: ${fieldDef.name}`, {
      type: fieldDef.type,
      required: fieldDef.options.validation?.required,
    })

    return fieldDef
  }

  /**
   * 构建Zod验证schema
   */
  private buildZodSchema(): z.ZodSchema {
    const { type, options } = this.definition
    let schema: z.ZodSchema

    // 基础类型
    switch (type) {
      case FieldType.STRING:
        schema = z.string()
        break
      case FieldType.NUMBER:
        schema = z.number()
        break
      case FieldType.BOOLEAN:
        schema = z.boolean()
        break
      case FieldType.DATE:
        schema = z.date()
        break
      case FieldType.JSON:
        schema = z.record(z.unknown())
        break
      case FieldType.TEXT:
        schema = z.string()
        break
      case FieldType.EMAIL:
        schema = z.string().email()
        break
      case FieldType.URL:
        schema = z.string().url()
        break
      case FieldType.UUID:
        schema = z.string().uuid()
        break
      case FieldType.ENUM:
        if (options?.enumValues) {
          schema = z.enum(options.enumValues as [string, ...string[]])
        } else {
          schema = z.string()
        }
        break
      case FieldType.ARRAY:
        schema = z.array(z.unknown())
        break
      case FieldType.OBJECT:
        schema = z.record(z.unknown())
        break
      default:
        schema = z.unknown()
    }

    // 应用验证规则
    if (options?.validation) {
      const validation = options.validation

      if (schema instanceof z.ZodString) {
        if (validation.min !== undefined) {
          schema = schema.min(validation.min)
        }
        if (validation.max !== undefined) {
          schema = schema.max(validation.max)
        }
        if (validation.length !== undefined) {
          schema = schema.length(validation.length)
        }
        if (validation.pattern) {
          const regex =
            typeof validation.pattern === 'string'
              ? new RegExp(validation.pattern)
              : validation.pattern
          schema = schema.regex(regex)
        }
      }

      if (schema instanceof z.ZodNumber) {
        if (validation.min !== undefined) {
          schema = schema.min(validation.min)
        }
        if (validation.max !== undefined) {
          schema = schema.max(validation.max)
        }
      }

      // 自定义验证
      if (validation.custom) {
        schema = schema.refine(validation.custom)
      }
    }

    // 处理可选和默认值
    if (!options?.validation?.required || options?.nullable) {
      schema = schema.optional()
    }

    if (options?.defaultValue !== undefined) {
      schema = schema.default(options.defaultValue)
    }

    return schema
  }
}

/**
 * 字段类型工厂函数
 */
export const Field = {
  /**
   * 字符串字段
   */
  string(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.STRING, extensionContext)
  },

  /**
   * 数字字段
   */
  number(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.NUMBER, extensionContext)
  },

  /**
   * 布尔字段
   */
  boolean(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.BOOLEAN, extensionContext)
  },

  /**
   * 日期字段
   */
  date(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.DATE, extensionContext)
  },

  /**
   * JSON字段
   */
  json(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.JSON, extensionContext)
  },

  /**
   * 文本字段
   */
  text(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.TEXT, extensionContext)
  },

  /**
   * 邮箱字段
   */
  email(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.EMAIL, extensionContext)
  },

  /**
   * URL字段
   */
  url(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.URL, extensionContext)
  },

  /**
   * UUID字段
   */
  uuid(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.UUID, extensionContext)
  },

  /**
   * 枚举字段
   */
  enum(
    name: string,
    values: string[] | number[],
    extensionContext?: ExtensionContext
  ): FieldBuilder {
    return new FieldBuilder(name, FieldType.ENUM, extensionContext).enum(values)
  },

  /**
   * 数组字段
   */
  array(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.ARRAY, extensionContext)
  },

  /**
   * 对象字段
   */
  object(name: string, extensionContext?: ExtensionContext): FieldBuilder {
    return new FieldBuilder(name, FieldType.OBJECT, extensionContext)
  },
}

/**
 * 常用字段预设
 */
export const CommonFields = {
  /**
   * ID字段（UUID）
   */
  id(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.uuid('id', extensionContext)
      .label('ID')
      .description('Unique identifier')
      .required()
      .readonly()
  },

  /**
   * 创建时间字段
   */
  createdAt(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.date('createdAt', extensionContext)
      .label('Created At')
      .description('Record creation timestamp')
      .default(() => new Date())
      .readonly()
  },

  /**
   * 更新时间字段
   */
  updatedAt(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.date('updatedAt', extensionContext)
      .label('Updated At')
      .description('Record last update timestamp')
      .readonly()
  },

  /**
   * 删除时间字段（软删除）
   */
  deletedAt(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.date('deletedAt', extensionContext)
      .label('Deleted At')
      .description('Record deletion timestamp (soft delete)')
      .nullable()
      .readonly()
  },

  /**
   * 用户名字段
   */
  username(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.string('username', extensionContext)
      .label('Username')
      .description('User login name')
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .unique()
  },

  /**
   * 邮箱字段
   */
  email(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.email('email', extensionContext)
      .label('Email')
      .description('Email address')
      .required()
      .unique()
  },

  /**
   * 密码字段
   */
  password(extensionContext?: ExtensionContext): FieldBuilder {
    return Field.string('password', extensionContext)
      .label('Password')
      .description('User password')
      .min(8)
      .required()
      .hidden()
  },

  /**
   * 状态字段
   */
  status(values: string[], extensionContext?: ExtensionContext): FieldBuilder {
    return Field.enum('status', values, extensionContext)
      .label('Status')
      .description('Record status')
      .default(values[0])
  },
}
