/**
 * @linch-kit/schema 字段类型定义
 * 
 * @description 字段相关的类型定义
 * @author LinchKit Team
 * @since 0.1.0
 */

/**
 * 字段类型枚举
 */
export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'email'
  | 'url'
  | 'uuid'
  | 'json'
  | 'array'
  | 'enum'
  | 'relation'
  | 'i18n'

/**
 * 验证规则
 */
export interface ValidationRule {
  type: string
  value?: any
  message?: string
}

/**
 * 权限规则
 */
export interface PermissionRule {
  action: string
  roles?: string[]
  conditions?: Record<string, any>
}

/**
 * 字段权限
 */
export interface FieldPermissions {
  read?: PermissionRule[]
  write?: PermissionRule[]
  create?: PermissionRule[]
  update?: PermissionRule[]
}

/**
 * 国际化字段配置
 */
export interface I18nFieldConfig {
  enabled: boolean
  locales?: string[]
  fallback?: string
}



/**
 * 基础字段定义
 */
export interface BaseFieldDefinition {
  type: FieldType
  required?: boolean
  unique?: boolean
  index?: boolean
  default?: any
  defaultValue?: any
  description?: string
  validation?: ValidationRule[]
  permissions?: FieldPermissions
  deprecated?: boolean
  locales?: string[]
}

/**
 * 字符串字段选项
 */
export interface StringFieldOptions extends BaseFieldDefinition {
  type: 'string'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string | RegExp
  transform?: (value: string) => string
  auto?: boolean
  i18n?: I18nFieldConfig
}

/**
 * 文本字段选项
 */
export interface TextFieldOptions extends BaseFieldDefinition {
  type: 'text'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  auto?: boolean
  i18n?: I18nFieldConfig
}

/**
 * 数字字段选项
 */
export interface NumberFieldOptions extends BaseFieldDefinition {
  type: 'number'
  min?: number
  max?: number
  precision?: number
  scale?: number
  integer?: boolean
  positive?: boolean
  negative?: boolean
}

/**
 * 布尔字段选项
 */
export interface BooleanFieldOptions extends BaseFieldDefinition {
  type: 'boolean'
}

/**
 * 日期字段选项
 */
export interface DateFieldOptions extends BaseFieldDefinition {
  type: 'date'
  autoNow?: boolean
  autoNowAdd?: boolean
  min?: Date
  max?: Date
}

/**
 * 邮箱字段选项
 */
export interface EmailFieldOptions extends BaseFieldDefinition {
  type: 'email'
  min?: number
  max?: number
  auto?: boolean
}

/**
 * URL字段选项
 */
export interface UrlFieldOptions extends BaseFieldDefinition {
  type: 'url'
  min?: number
  max?: number
  auto?: boolean
}

/**
 * UUID字段选项
 */
export interface UuidFieldOptions extends BaseFieldDefinition {
  type: 'uuid'
  version?: 4 | 5
  auto?: boolean
  min?: number
  max?: number
}

/**
 * JSON字段选项
 */
export interface JsonFieldOptions extends BaseFieldDefinition {
  type: 'json'
  schema?: Record<string, any>
}

/**
 * 数组字段选项
 */
export interface ArrayFieldOptions extends BaseFieldDefinition {
  type: 'array'
  items: FieldDefinition
  minItems?: number
  maxItems?: number
  min?: number
  max?: number
}

/**
 * 枚举字段选项
 */
export interface EnumFieldOptions<T extends readonly string[] = readonly string[]> extends BaseFieldDefinition {
  type: 'enum'
  values: T
}

/**
 * 关系字段选项
 */
export interface RelationFieldOptions extends BaseFieldDefinition {
  type: 'relation'
  target: string
  relationName?: string
  relationType: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany'
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  through?: string
  foreignKey?: string
  cascade?: boolean
}

/**
 * 国际化字段选项
 */
export interface I18nFieldOptions extends BaseFieldDefinition {
  type: 'i18n'
  baseType: Exclude<FieldType, 'i18n' | 'relation' | 'array'>
  locales: string[]
  fallback?: string
  i18n?: {
    locales: string[]
    required?: string[]
  }
}

/**
 * 自定义字段类型配置
 */
export interface CustomFieldTypeConfig {
  name: string
  baseType: FieldType
  validation?: ValidationRule[]
  transform?: (value: any) => any
}

/**
 * 字符串类字段选项联合类型
 */
export type StringLikeFieldOptions = StringFieldOptions | TextFieldOptions | EmailFieldOptions | UrlFieldOptions | UuidFieldOptions

/**
 * 字段定义联合类型
 */
export type FieldDefinition =
  | StringFieldOptions
  | TextFieldOptions
  | NumberFieldOptions
  | BooleanFieldOptions
  | DateFieldOptions
  | EmailFieldOptions
  | UrlFieldOptions
  | UuidFieldOptions
  | JsonFieldOptions
  | ArrayFieldOptions
  | EnumFieldOptions
  | RelationFieldOptions
  | I18nFieldOptions
