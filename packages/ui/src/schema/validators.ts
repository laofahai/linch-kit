/**
 * UI 类型验证器
 * 
 * 提供运行时类型验证，确保 UI 配置的正确性
 */

import { z } from 'zod'

/**
 * 表格字段配置验证器
 */
export const TableFieldConfigSchema = z.object({
  width: z.union([z.number(), z.string()]).optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  hideable: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  render: z.string().optional(),
  headerRender: z.string().optional(),
  fixed: z.union([z.enum(['left', 'right']), z.boolean()]).optional(),
  group: z.string().optional(),
}).strict()

/**
 * 表单字段配置验证器
 */
export const FormFieldConfigSchema = z.object({
  type: z.enum([
    'text', 'email', 'password', 'number', 'textarea', 'select', 
    'checkbox', 'switch', 'date', 'file', 'custom'
  ]).optional(),
  layout: z.object({
    colSpan: z.number().min(1).max(12).optional(),
    rowSpan: z.number().optional(),
  }).optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    disabled: z.boolean().optional(),
  })).optional(),
  asyncOptions: z.object({
    url: z.string(),
    valueField: z.string().optional(),
    labelField: z.string().optional(),
    searchParam: z.string().optional(),
  }).optional(),
  upload: z.object({
    accept: z.string().optional(),
    maxSize: z.number().optional(),
    multiple: z.boolean().optional(),
    uploadUrl: z.string().optional(),
  }).optional(),
  dependencies: z.array(z.object({
    field: z.string(),
    condition: z.unknown(),
    action: z.enum(['show', 'hide', 'enable', 'disable', 'require']),
  })).optional(),
}).strict()

/**
 * 权限字段配置验证器
 */
export const PermissionFieldConfigSchema = z.object({
  read: z.union([z.string(), z.array(z.string())]).optional(),
  write: z.union([z.string(), z.array(z.string())]).optional(),
  custom: z.function().optional(),
}).strict()

/**
 * 数据转换配置验证器
 */
export const TransformFieldConfigSchema = z.object({
  input: z.function().optional(),
  output: z.function().optional(),
}).strict()

/**
 * 虚拟字段配置验证器
 */
export const VirtualFieldConfigSchema = z.object({
  computed: z.boolean().optional(),
  compute: z.function().optional(),
  dependencies: z.array(z.string()).optional(),
}).strict()

/**
 * UI 字段配置扩展验证器
 */
export const UIFieldConfigExtensionsSchema = z.object({
  table: TableFieldConfigSchema.optional(),
  form: FormFieldConfigSchema.optional(),
  permissions: PermissionFieldConfigSchema.optional(),
  transform: TransformFieldConfigSchema.optional(),
  virtual: VirtualFieldConfigSchema.optional(),
}).strict()

/**
 * 验证表格字段配置
 */
export function validateTableFieldConfig(config: unknown): config is z.infer<typeof TableFieldConfigSchema> {
  try {
    TableFieldConfigSchema.parse(config)
    return true
  } catch {
    return false
  }
}

/**
 * 验证表单字段配置
 */
export function validateFormFieldConfig(config: unknown): config is z.infer<typeof FormFieldConfigSchema> {
  try {
    FormFieldConfigSchema.parse(config)
    return true
  } catch {
    return false
  }
}

/**
 * 验证权限字段配置
 */
export function validatePermissionFieldConfig(config: unknown): config is z.infer<typeof PermissionFieldConfigSchema> {
  try {
    PermissionFieldConfigSchema.parse(config)
    return true
  } catch {
    return false
  }
}

/**
 * 验证 UI 字段配置扩展
 */
export function validateUIFieldConfigExtensions(config: unknown): config is z.infer<typeof UIFieldConfigExtensionsSchema> {
  try {
    UIFieldConfigExtensionsSchema.parse(config)
    return true
  } catch {
    return false
  }
}

/**
 * 配置验证错误处理
 */
export class ConfigValidationError extends Error {
  constructor(
    public field: string,
    public errors: z.ZodError,
    message?: string
  ) {
    super(message || `Validation failed for field "${field}"`)
    this.name = 'ConfigValidationError'
  }

  getFormattedErrors(): string[] {
    return this.errors.errors.map(error => 
      `${error.path.join('.')}: ${error.message}`
    )
  }
}

/**
 * 安全验证函数 - 抛出详细错误信息
 */
export function safeValidateTableFieldConfig(config: unknown, fieldName: string): z.infer<typeof TableFieldConfigSchema> {
  try {
    return TableFieldConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigValidationError(fieldName, error)
    }
    throw error
  }
}

export function safeValidateFormFieldConfig(config: unknown, fieldName: string): z.infer<typeof FormFieldConfigSchema> {
  try {
    return FormFieldConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigValidationError(fieldName, error)
    }
    throw error
  }
}

export function safeValidatePermissionFieldConfig(config: unknown, fieldName: string): z.infer<typeof PermissionFieldConfigSchema> {
  try {
    return PermissionFieldConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigValidationError(fieldName, error)
    }
    throw error
  }
}

/**
 * 批量验证字段配置
 */
export function validateFieldConfigs(
  fields: Record<string, any>,
  options?: {
    strict?: boolean
    skipInvalid?: boolean
  }
): {
  valid: Record<string, any>
  invalid: Record<string, ConfigValidationError>
} {
  const { strict = false, skipInvalid = false } = options || {}
  const valid: Record<string, any> = {}
  const invalid: Record<string, ConfigValidationError> = {}

  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    try {
      if (fieldConfig.table) {
        safeValidateTableFieldConfig(fieldConfig.table, `${fieldName}.table`)
      }
      if (fieldConfig.form) {
        safeValidateFormFieldConfig(fieldConfig.form, `${fieldName}.form`)
      }
      if (fieldConfig.permissions) {
        safeValidatePermissionFieldConfig(fieldConfig.permissions, `${fieldName}.permissions`)
      }
      
      valid[fieldName] = fieldConfig
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        invalid[fieldName] = error
        if (!skipInvalid && strict) {
          throw error
        }
      } else {
        throw error
      }
    }
  })

  return { valid, invalid }
}

/**
 * 配置清理工具 - 移除无效的配置
 */
export function sanitizeFieldConfig(config: any): any {
  if (!config || typeof config !== 'object') {
    return config
  }

  const sanitized = { ...config }

  // 清理表格配置
  if (sanitized.table && !validateTableFieldConfig(sanitized.table)) {
    console.warn('Invalid table config detected, removing:', sanitized.table)
    delete sanitized.table
  }

  // 清理表单配置
  if (sanitized.form && !validateFormFieldConfig(sanitized.form)) {
    console.warn('Invalid form config detected, removing:', sanitized.form)
    delete sanitized.form
  }

  // 清理权限配置
  if (sanitized.permissions && !validatePermissionFieldConfig(sanitized.permissions)) {
    console.warn('Invalid permissions config detected, removing:', sanitized.permissions)
    delete sanitized.permissions
  }

  return sanitized
}

/**
 * 配置合并工具 - 安全合并配置对象
 */
export function mergeFieldConfigs(base: any, override: any): any {
  if (!base && !override) return {}
  if (!base) return sanitizeFieldConfig(override)
  if (!override) return sanitizeFieldConfig(base)

  const merged = {
    ...base,
    ...override,
    table: override.table ? { ...base.table, ...override.table } : base.table,
    form: override.form ? { ...base.form, ...override.form } : base.form,
    permissions: override.permissions ? { ...base.permissions, ...override.permissions } : base.permissions,
    transform: override.transform ? { ...base.transform, ...override.transform } : base.transform,
    virtual: override.virtual ? { ...base.virtual, ...override.virtual } : base.virtual,
  }

  return sanitizeFieldConfig(merged)
}
