/**
 * Schema 集成工具
 * 
 * 提供从 @linch-kit/schema 到 UI 组件的适配功能
 */

import type { ColumnDef } from "@tanstack/react-table"
import type { EntityDefinition, FieldConfig } from "@linch-kit/schema"
import { uiT } from "../i18n"

/**
 * 从 Schema 生成 DataTable 列定义
 */
export function generateTableColumns<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  options?: {
    /** 包含的字段 */
    include?: string[]
    /** 排除的字段 */
    exclude?: string[]
    /** 自定义列配置 */
    customColumns?: Record<string, Partial<ColumnDef<T>>>
  }
): ColumnDef<T>[] {
  const { include, exclude, customColumns = {} } = options || {}
  const fields = entity.meta?.fields || {}
  
  const columns: ColumnDef<T>[] = []

  // 遍历字段生成列定义
  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    // 检查字段是否应该包含
    if (include && !include.includes(fieldName)) return
    if (exclude && exclude.includes(fieldName)) return
    if (fieldConfig.hidden) return

    // 获取字段的表格配置
    const tableConfig = fieldConfig.table || {}
    const customConfig = customColumns[fieldName] || {}

    // 生成列定义
    const column: ColumnDef<T> = {
      id: fieldName,
      accessorKey: fieldName as keyof T,
      header: fieldConfig.label || fieldName,
      
      // 应用表格配置
      ...(tableConfig.sortable !== false && { enableSorting: tableConfig.sortable }),
      ...(tableConfig.filterable !== false && { enableColumnFilter: tableConfig.filterable }),
      ...(tableConfig.hideable !== false && { enableHiding: tableConfig.hideable }),
      
      // 列样式配置
      ...(tableConfig.width && { size: typeof tableConfig.width === 'number' ? tableConfig.width : undefined }),
      ...(tableConfig.minWidth && { minSize: tableConfig.minWidth }),
      ...(tableConfig.maxWidth && { maxSize: tableConfig.maxWidth }),
      
      // 自定义渲染
      ...(tableConfig.render && {
        cell: ({ getValue }) => {
          // 这里可以根据 render 配置调用相应的渲染函数
          const value = getValue()
          return renderCellValue(value, tableConfig.render, fieldConfig)
        }
      }),

      // 应用自定义配置（优先级最高）
      ...customConfig,
    }

    columns.push(column)
  })

  // 按 order 排序
  columns.sort((a, b) => {
    const aOrder = fields[a.id as string]?.order || 0
    const bOrder = fields[b.id as string]?.order || 0
    return aOrder - bOrder
  })

  return columns
}

/**
 * 从 Schema 生成 FormBuilder 字段配置
 */
export function generateFormFields<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  options?: {
    /** 包含的字段 */
    include?: string[]
    /** 排除的字段 */
    exclude?: string[]
    /** 表单模式 */
    mode?: 'create' | 'update' | 'view'
    /** 自定义字段配置 */
    customFields?: Record<string, Partial<FormFieldConfig>>
  }
): FormFieldConfig[] {
  const { include, exclude, mode = 'create', customFields = {} } = options || {}
  const fields = entity.meta?.fields || {}
  
  const formFields: FormFieldConfig[] = []

  // 遍历字段生成表单配置
  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    // 检查字段是否应该包含
    if (include && !include.includes(fieldName)) return
    if (exclude && exclude.includes(fieldName)) return
    if (fieldConfig.hidden) return
    if (mode === 'view' && !fieldConfig.readonly) return

    // 获取字段的表单配置
    const formConfig = fieldConfig.form || {}
    const customConfig = customFields[fieldName] || {}

    // 推断字段类型
    const fieldType = inferFormFieldType(fieldConfig, formConfig)

    // 生成表单字段配置
    const formField: FormFieldConfig = {
      name: fieldName,
      label: fieldConfig.label || fieldName,
      type: fieldType,
      required: fieldConfig.required || false,
      readonly: fieldConfig.readonly || mode === 'view',
      placeholder: fieldConfig.placeholder,
      description: fieldConfig.description,
      order: fieldConfig.order || 0,

      // 应用表单配置
      ...formConfig,

      // 应用自定义配置（优先级最高）
      ...customConfig,
    }

    formFields.push(formField)
  })

  // 按 order 排序
  formFields.sort((a, b) => (a.order || 0) - (b.order || 0))

  return formFields
}

/**
 * 表单字段配置接口
 */
export interface FormFieldConfig {
  name: string
  label?: string
  type?: string
  required?: boolean
  readonly?: boolean
  placeholder?: string
  description?: string
  order?: number
  layout?: {
    colSpan?: number
    rowSpan?: number
  }
  options?: Array<{ label: string; value: string | number; disabled?: boolean }>
  asyncOptions?: {
    url: string
    valueField?: string
    labelField?: string
    searchParam?: string
  }
  upload?: {
    accept?: string
    maxSize?: number
    multiple?: boolean
    uploadUrl?: string
  }
  dependencies?: Array<{
    field: string
    condition: any
    action: 'show' | 'hide' | 'enable' | 'disable' | 'require'
  }>
}

/**
 * 推断表单字段类型
 */
function inferFormFieldType(fieldConfig: FieldConfig, formConfig: any): string {
  // 如果明确指定了类型，直接使用
  if (formConfig.type) {
    return formConfig.type
  }

  // 根据字段配置推断类型
  if (fieldConfig.relation) {
    return 'select' // 关联字段默认为选择器
  }

  // 根据验证规则推断
  // 这里可以根据 Zod schema 的类型进行更精确的推断
  // 暂时使用简单的推断逻辑
  return 'text'
}

/**
 * 渲染单元格值
 */
function renderCellValue(value: any, renderConfig?: string, fieldConfig?: FieldConfig): React.ReactNode {
  if (!renderConfig) {
    return value?.toString() || ''
  }

  // 这里可以根据 renderConfig 调用相应的渲染函数
  // 例如：日期格式化、状态标签、链接等
  switch (renderConfig) {
    case 'date':
      return value ? new Date(value).toLocaleDateString() : ''
    case 'datetime':
      return value ? new Date(value).toLocaleString() : ''
    case 'boolean':
      return value ? uiT('common.yes') : uiT('common.no')
    case 'currency':
      return value ? `¥${Number(value).toFixed(2)}` : ''
    default:
      return value?.toString() || ''
  }
}

/**
 * 从 Schema 生成搜索配置
 */
export function generateSearchConfig<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  options?: {
    /** 可搜索的字段 */
    searchableFields?: string[]
    /** 默认搜索字段 */
    defaultSearchField?: string
  }
): SearchConfig {
  const { searchableFields, defaultSearchField } = options || {}
  const fields = entity.meta?.fields || {}

  const searchConfig: SearchConfig = {
    fields: [],
    defaultField: defaultSearchField
  }

  // 生成搜索字段配置
  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    // 检查字段是否可搜索
    if (searchableFields && !searchableFields.includes(fieldName)) return
    if (fieldConfig.hidden) return
    if (fieldConfig.table?.filterable === false) return

    searchConfig.fields.push({
      name: fieldName,
      label: fieldConfig.label || fieldName,
      type: inferSearchFieldType(fieldConfig)
    })
  })

  return searchConfig
}

/**
 * 搜索配置接口
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
 * 推断搜索字段类型
 */
function inferSearchFieldType(fieldConfig: FieldConfig): 'text' | 'select' | 'date' | 'number' {
  if (fieldConfig.relation) {
    return 'select'
  }

  if (fieldConfig.form?.type === 'date') {
    return 'date'
  }

  if (fieldConfig.form?.type === 'number') {
    return 'number'
  }

  return 'text'
}

/**
 * 获取字段的显示值
 */
export function getFieldDisplayValue(value: any, fieldConfig: FieldConfig): string {
  if (value == null) return ''

  // 根据字段配置格式化显示值
  if (fieldConfig.table?.render) {
    return renderCellValue(value, fieldConfig.table.render, fieldConfig) as string
  }

  return value.toString()
}
