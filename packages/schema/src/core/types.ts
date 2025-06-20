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
 * 字段配置 - 统一的字段配置接口
 */
export interface FieldConfig {
  // === 数据库相关 ===
  /** 是否为主键 */
  primary?: boolean
  /** 是否唯一 */
  unique?: boolean
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
  /** 数据库特定属性 */
  db?: {
    type?: 'JSON' | 'TEXT' | 'VARCHAR' | 'CHAR' | 'DECIMAL' | 'INT' | 'BIGINT' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | string
    length?: number
    precision?: number
    scale?: number
    /** 是否存储为 JSON（自动推断嵌套对象） */
    json?: boolean
  }

  // === 基础 UI 相关（最小化） ===
  /** 字段标签 */
  label?: string | I18nText
  /** 字段描述 */
  description?: string | I18nText
  /** 占位符文本 */
  placeholder?: string | I18nText
  /** 帮助文本 */
  helpText?: string | I18nText

  /** 字段显示顺序 */
  order?: number
  /** 是否隐藏字段 */
  hidden?: boolean
  /** 字段分组（简单分组） */
  group?: string

  // === 验证相关 ===
  /** 是否必填 */
  required?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 错误消息 */
  errorMessages?: {
    required?: string | I18nText
    invalid?: string | I18nText
    min?: string | I18nText
    max?: string | I18nText
    pattern?: string | I18nText
    custom?: Record<string, string | I18nText>
  }

  // === 权限相关（预留接口） ===
  /** 字段级别权限 */
  permissions?: {
    /** 读取权限 */
    read?: string | string[]
    /** 写入权限 */
    write?: string | string[]
    /** 自定义权限检查函数 */
    custom?: (user: any, context?: any) => boolean
  }

  // === 数据转换（预留接口） ===
  /** 数据转换配置 */
  transform?: {
    /** 输入转换（清理、格式化） */
    input?: (value: any) => any
    /** 输出转换（格式化、脱敏） */
    output?: (value: any) => any
  }

  // === 审计日志（预留接口） ===
  /** 是否启用变更追踪 */
  audit?: boolean | {
    /** 是否记录变更 */
    enabled: boolean
    /** 敏感字段（不记录具体值） */
    sensitive?: boolean
  }

  // === 虚拟字段（预留接口） ===
  /** 虚拟字段配置 */
  virtual?: {
    /** 是否为计算字段 */
    computed?: boolean
    /** 计算函数 */
    compute?: (entity: any) => any
    /** 依赖字段 */
    dependencies?: string[]
  }

  // === 关系相关 ===
  /** 关系配置 */
  relation?: {
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
    model: string
    foreignKey?: string
    references?: string
    onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
    onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
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
