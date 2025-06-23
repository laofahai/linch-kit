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
 * 国际化文本配置 - 简化版本，只需要 key
 */
export type I18nText = string

/**
 * 组件配置
 */
export interface ComponentConfig {
  /** 组件名称或组件引用 */
  name: string
  /** 组件属性 */
  props?: Record<string, any>
  /** 组件插槽内容 */
  slots?: Record<string, any>
}

/**
 * 核心字段配置 - 最基础的字段配置，避免复杂类型推导
 */
export interface CoreFieldConfig {
  // === 数据库相关 ===
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
 * 数据库配置 - 分离出来避免嵌套复杂度
 */
export interface DatabaseFieldConfig {
  type?: 'JSON' | 'TEXT' | 'VARCHAR' | 'CHAR' | 'DECIMAL' | 'INT' | 'BIGINT' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | string
  length?: number
  precision?: number
  scale?: number
  /** 是否存储为 JSON（自动推断嵌套对象） */
  json?: boolean
}

/**
 * 基础 UI 配置 - 简化的 UI 配置
 */
export interface BasicUIConfig {
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
  /** 字段分组（简单分组） */
  group?: string
}

/**
 * 关系配置 - 分离出来避免嵌套复杂度
 */
export interface RelationConfig {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  model: string
  foreignKey?: string
  references?: string
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
}

/**
 * 验证配置 - 分离出来避免嵌套复杂度
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
 * 简化的字段配置接口 - 用于 defineField 函数
 * 只包含最常用的配置，避免复杂的类型推导
 */
export interface SimpleFieldConfig extends CoreFieldConfig, BasicUIConfig, ValidationConfig {
  /** 数据库配置 */
  db?: DatabaseFieldConfig
  /** 关系配置 */
  relation?: RelationConfig
}

/**
 * 完整的字段配置接口 - 仅包含核心功能，复杂 UI 类型移至 UI 包
 *
 * 注意：复杂的 UI 配置（table、form、permissions、transform、virtual）
 * 已移动到 @linch-kit/ui 包中，通过模块扩展的方式提供
 * 这样可以显著提升 DTS 构建性能，同时保持功能完整性
 */
export interface FieldConfig extends Omit<SimpleFieldConfig, 'errorMessages'> {
  // === 基础 UI 相关（支持国际化） ===
  /** 字段标签 */
  label?: string | I18nText
  /** 字段描述 */
  description?: string | I18nText
  /** 占位符文本 */
  placeholder?: string | I18nText
  /** 帮助文本 */
  helpText?: string | I18nText

  // === 扩展验证相关 ===
  /** 错误消息（支持国际化） */
  errorMessages?: {
    required?: string | I18nText
    invalid?: string | I18nText
    min?: string | I18nText
    max?: string | I18nText
    pattern?: string | I18nText
    custom?: Record<string, string | I18nText>
  }

  // === 审计日志（简化版本） ===
  /** 是否启用变更追踪 */
  audit?: boolean | {
    /** 是否记录变更 */
    enabled: boolean
    /** 敏感字段（不记录具体值） */
    sensitive?: boolean
  }
}

/**
 * 字段属性配置（向后兼容）
 */
export interface FieldAttributes extends FieldConfig {
  /** 是否为主键（向后兼容） */
  id?: boolean
}

/**
 * 关系字段配置（向后兼容）
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
 * 实体基础 UI 配置（简化版，复杂 UI 配置移到 CRUD 包）
 */
export interface EntityUIConfig {
  /** 实体显示名称 */
  displayName?: string | I18nText
  /** 实体描述 */
  description?: string | I18nText
  /** 实体图标 */
  icon?: string
  /** 简单字段分组 */
  groups?: Array<{
    name: string
    label: string | I18nText
    fields: string[]
  }>
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
  /** UI 配置 */
  ui?: EntityUIConfig
  /** 权限配置（预留接口） */
  permissions?: {
    /** 创建权限 */
    create?: string | string[]
    /** 读取权限 */
    read?: string | string[]
    /** 更新权限 */
    update?: string | string[]
    /** 删除权限 */
    delete?: string | string[]
    /** 自定义权限检查函数 */
    custom?: Record<string, (user: any, context?: any) => boolean>
  }

  /** 实体级别验证（预留接口） */
  validation?: {
    /** 跨字段验证规则 */
    crossField?: Array<{
      name: string
      fields: string[]
      validate: (values: Record<string, any>) => boolean | string
      message?: string | I18nText
    }>
    /** 条件验证规则 */
    conditional?: Array<{
      name: string
      condition: (values: Record<string, any>) => boolean
      rules: Record<string, any>
      message?: string | I18nText
    }>
  }

  /** 审计配置（预留接口） */
  audit?: {
    /** 是否启用审计 */
    enabled?: boolean
    /** 审计字段配置 */
    fields?: {
      /** 创建者字段 */
      createdBy?: string
      /** 更新者字段 */
      updatedBy?: string
      /** 版本字段 */
      version?: string
    }
    /** 敏感操作记录 */
    sensitiveOperations?: ('create' | 'update' | 'delete')[]
  }
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
  /** 是否禁用软删除（默认启用） */
  softDelete?: boolean
}

/**
 * 扩展的 Zod Object Schema，包含 Prisma 元数据
 * 优化版本：完全移除泛型参数，防止无限类型递归
 */
export type EntitySchema = z.ZodObject<any> & {
  _meta?: SchemaMetadata
}

/**
 * 实体定义接口
 * 简化版本：移除泛型参数，避免类型递归
 */
export interface EntityDefinition {
  /** 实体名称 */
  name: string
  /** Zod Schema */
  schema: EntitySchema
  /** 元数据 */
  meta?: SchemaMetadata
}
