/**
 * Schema 集成工具
 *
 * 提供从 @linch-kit/schema 到 UI 组件的适配功能
 */

// 导入模块扩展，确保 FieldConfig 接口被正确扩展
import './field-config-extensions'

// 重新导出所有功能模块
export * from './field-config-extensions'
export * from './table-field-config'
export * from './form-field-config'
// export * from './permission-field-config' // 暂时注释掉，避免循环依赖
export * from './validators'
export * from './integration'

// 保持向后兼容的导出
import type { ColumnDef } from "@tanstack/react-table"
import type { EntityDefinition, FieldConfig } from "@linch-kit/schema"
import { uiT } from "../i18n"
import { generateTableColumns } from './table-field-config'
import { generateFormFields, type ExtendedFormFieldConfig } from './form-field-config'

// 为了向后兼容，保留原有的 generateTableColumns 函数
// 但现在它内部调用新的实现

// 向后兼容的 generateFormFields 函数
export { generateFormFields }

// 向后兼容的类型导出
export type { ExtendedFormFieldConfig as FormFieldConfig }

// 这些函数现在在各自的模块中实现，这里不再重复定义

/**
 * 搜索配置接口 - 保持向后兼容
 */
export interface SearchConfig {
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'select' | 'date' | 'number'
  }>
  defaultField?: string
}

/**
 * 从 Schema 生成搜索配置 - 简化版本，保持向后兼容
 */
export function generateSearchConfig<T extends Record<string, any>>(
  entity: EntityDefinition,
  options?: {
    searchableFields?: string[]
    defaultSearchField?: string
  }
): SearchConfig {
  const { searchableFields, defaultSearchField } = options || {}
  const fields = entity.meta?.fields || {}

  const searchConfig: SearchConfig = {
    fields: [],
    defaultField: defaultSearchField
  }

  Object.entries(fields).forEach(([fieldName, fieldAttributes]) => {
    if (searchableFields && !searchableFields.includes(fieldName)) return
    if (fieldAttributes?.hidden) return

    // 转换为 FieldConfig 格式（临时解决方案）
    const fieldConfig = fieldAttributes as any as FieldConfig
    if (fieldConfig.table?.filterable === false) return

    searchConfig.fields.push({
      name: fieldName,
      label: fieldConfig.label || fieldName,
      type: fieldConfig.relation ? 'select' : 'text'
    })
  })

  return searchConfig
}

/**
 * 获取字段的显示值 - 保持向后兼容
 */
export function getFieldDisplayValue(value: any, fieldConfig: FieldConfig): string {
  if (value == null) return ''
  return value.toString()
}
