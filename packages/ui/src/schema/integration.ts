/**
 * Schema 包集成工具
 * 
 * 提供与 @linch-kit/schema 包的深度集成功能
 */

import type { 
  EntityDefinition, 
  FieldConfig, 
  TableFieldConfig,
  FormFieldConfig,
  PermissionFieldConfig 
} from "@linch-kit/schema"
import { validateFieldConfigs, sanitizeFieldConfig, mergeFieldConfigs } from "./validators"
import { generateTableColumns } from "./table-field-config"
import { generateFormFields } from "./form-field-config"
// import { checkFieldPermission, type UserPermissionContext } from "./permission-field-config"

// 临时类型定义，避免循环依赖
interface UserPermissionContext {
  userId: string
  roles: string[]
  permissions: string[]
  groups?: string[]
  metadata?: Record<string, any>
}

// 临时权限检查函数
function checkFieldPermission(
  fieldConfig: FieldConfig,
  user: UserPermissionContext,
  context?: Record<string, any>
): { canRead: boolean; canWrite: boolean; reason?: string } {
  return { canRead: true, canWrite: true } // 临时实现
}

/**
 * UI 集成配置选项
 */
export interface UIIntegrationOptions {
  /** 用户权限上下文 */
  user?: UserPermissionContext
  /** 全局上下文 */
  context?: Record<string, any>
  /** 是否启用严格验证 */
  strictValidation?: boolean
  /** 是否跳过无效配置 */
  skipInvalidConfigs?: boolean
  /** 默认 UI 配置 */
  defaultConfigs?: {
    table?: Partial<TableFieldConfig>
    form?: Partial<FormFieldConfig>
    permissions?: Partial<PermissionFieldConfig>
  }
}

/**
 * UI 集成结果
 */
export interface UIIntegrationResult<T extends Record<string, any>> {
  entity: EntityDefinition
  fields: Record<string, FieldConfig>
  tableColumns: ReturnType<typeof generateTableColumns>
  formFields: ReturnType<typeof generateFormFields>
  permissions: Record<string, {
    canRead: boolean
    canWrite: boolean
    reason?: string
  }>
  validation: {
    valid: Record<string, any>
    invalid: Record<string, any>
  }
}

/**
 * Schema UI 集成器
 */
export class SchemaUIIntegrator<T extends Record<string, any>> {
  private entity: EntityDefinition
  private options: UIIntegrationOptions

  constructor(entity: EntityDefinition, options: UIIntegrationOptions = {}) {
    this.entity = entity
    this.options = {
      strictValidation: false,
      skipInvalidConfigs: true,
      ...options
    }
  }

  /**
   * 执行完整的 UI 集成
   */
  integrate(): UIIntegrationResult<T> {
    // 1. 获取并验证字段配置
    const rawFields = this.entity.meta?.fields || {}
    const validation = validateFieldConfigs(rawFields, {
      strict: this.options.strictValidation,
      skipInvalid: this.options.skipInvalidConfigs
    })

    // 2. 应用默认配置和清理
    const fields = this.applyDefaultConfigs(validation.valid)

    // 3. 权限检查
    const permissions = this.checkPermissions(fields)

    // 4. 过滤有权限的字段
    const readableFields = this.filterFieldsByPermission(fields, 'read')
    const writableFields = this.filterFieldsByPermission(fields, 'write')

    // 5. 生成 UI 配置
    const tableColumns = generateTableColumns(
      { ...this.entity, meta: { ...this.entity.meta, fields: readableFields } },
      {
        defaultColumnConfig: this.options.defaultConfigs?.table
      }
    )

    const formFields = generateFormFields(
      { ...this.entity, meta: { ...this.entity.meta, fields: writableFields } },
      {
        defaultFieldConfig: this.options.defaultConfigs?.form
      }
    )

    return {
      entity: this.entity,
      fields,
      tableColumns,
      formFields,
      permissions,
      validation
    }
  }

  /**
   * 应用默认配置
   */
  private applyDefaultConfigs(fields: Record<string, FieldConfig>): Record<string, FieldConfig> {
    const { defaultConfigs } = this.options
    if (!defaultConfigs) return fields

    const processedFields: Record<string, FieldConfig> = {}

    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
      let processed = { ...fieldConfig }

      // 应用默认表格配置
      if (defaultConfigs.table) {
        processed = mergeFieldConfigs(processed, {
          table: defaultConfigs.table
        })
      }

      // 应用默认表单配置
      if (defaultConfigs.form) {
        processed = mergeFieldConfigs(processed, {
          form: defaultConfigs.form
        })
      }

      // 应用默认权限配置
      if (defaultConfigs.permissions) {
        processed = mergeFieldConfigs(processed, {
          permissions: defaultConfigs.permissions
        })
      }

      processedFields[fieldName] = sanitizeFieldConfig(processed)
    })

    return processedFields
  }

  /**
   * 检查字段权限
   */
  private checkPermissions(fields: Record<string, FieldConfig>): Record<string, {
    canRead: boolean
    canWrite: boolean
    reason?: string
  }> {
    const permissions: Record<string, any> = {}

    if (!this.options.user) {
      // 没有用户上下文，默认允许所有操作
      Object.keys(fields).forEach(fieldName => {
        permissions[fieldName] = { canRead: true, canWrite: true }
      })
      return permissions
    }

    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
      permissions[fieldName] = checkFieldPermission(
        fieldConfig,
        this.options.user!,
        this.options.context
      )
    })

    return permissions
  }

  /**
   * 根据权限过滤字段
   */
  private filterFieldsByPermission(
    fields: Record<string, FieldConfig>,
    permission: 'read' | 'write'
  ): Record<string, FieldConfig> {
    if (!this.options.user) return fields

    const filtered: Record<string, FieldConfig> = {}

    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
      const permissionResult = checkFieldPermission(
        fieldConfig,
        this.options.user!,
        this.options.context
      )

      const hasPermission = permission === 'read' ? permissionResult.canRead : permissionResult.canWrite
      if (hasPermission) {
        filtered[fieldName] = fieldConfig
      }
    })

    return filtered
  }

  /**
   * 更新用户上下文
   */
  setUser(user: UserPermissionContext): this {
    this.options.user = user
    return this
  }

  /**
   * 更新全局上下文
   */
  setContext(context: Record<string, any>): this {
    this.options.context = { ...this.options.context, ...context }
    return this
  }

  /**
   * 更新默认配置
   */
  setDefaultConfigs(configs: UIIntegrationOptions['defaultConfigs']): this {
    this.options.defaultConfigs = { ...this.options.defaultConfigs, ...configs }
    return this
  }
}

/**
 * 创建 Schema UI 集成器
 */
export function createSchemaUIIntegrator<T extends Record<string, any>>(
  entity: EntityDefinition,
  options?: UIIntegrationOptions
): SchemaUIIntegrator<T> {
  return new SchemaUIIntegrator(entity, options)
}

/**
 * 快速集成函数 - 一步完成所有集成
 */
export function integrateSchemaUI<T extends Record<string, any>>(
  entity: EntityDefinition,
  options?: UIIntegrationOptions
): UIIntegrationResult<T> {
  return createSchemaUIIntegrator(entity, options).integrate()
}

/**
 * UI 配置预设
 */
export const UIConfigPresets = {
  /**
   * 管理后台预设
   */
  admin: {
    defaultConfigs: {
      table: {
        sortable: true,
        filterable: true,
        hideable: true
      },
      form: {
        layout: { colSpan: 6 }
      },
      permissions: {
        read: ['admin'],
        write: ['admin']
      }
    }
  },

  /**
   * 用户界面预设
   */
  user: {
    defaultConfigs: {
      table: {
        sortable: false,
        filterable: false,
        hideable: false
      },
      form: {
        layout: { colSpan: 12 }
      },
      permissions: {
        read: ['user'],
        write: ['user']
      }
    }
  },

  /**
   * 只读预设
   */
  readonly: {
    defaultConfigs: {
      table: {
        sortable: true,
        filterable: true,
        hideable: true
      },
      form: {
        readonly: true
      },
      permissions: {
        read: ['user'],
        write: []
      }
    }
  }
}

/**
 * 批量处理多个实体
 */
export function batchIntegrateSchemaUI<T extends Record<string, any>>(
  entities: EntityDefinition[],
  options?: UIIntegrationOptions
): Record<string, UIIntegrationResult<T>> {
  const results: Record<string, UIIntegrationResult<T>> = {}

  entities.forEach(entity => {
    const entityName = entity.name || 'unknown'
    results[entityName] = integrateSchemaUI(entity, options)
  })

  return results
}
