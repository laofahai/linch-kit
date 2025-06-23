/**
 * 表格字段配置工具
 * 
 * 提供从 Schema 字段配置生成 DataTable 列配置的工具函数
 */

import type { ColumnDef } from "@tanstack/react-table"
import type { EntityDefinition, FieldConfig, TableFieldConfig } from "@linch-kit/schema"
import { uiT } from "../i18n"

/**
 * 从 Schema 生成 DataTable 列定义
 */
export function generateTableColumns<T extends Record<string, any>>(
  entity: EntityDefinition,
  options?: {
    /** 包含的字段 */
    include?: string[]
    /** 排除的字段 */
    exclude?: string[]
    /** 自定义列配置 */
    customColumns?: Record<string, Partial<ColumnDef<T>>>
    /** 默认列配置 */
    defaultColumnConfig?: Partial<TableFieldConfig>
  }
): ColumnDef<T>[] {
  const { include, exclude, customColumns = {}, defaultColumnConfig = {} } = options || {}
  const fields = entity.meta?.fields || {}
  
  const columns: ColumnDef<T>[] = []

  // 遍历字段生成列定义
  Object.entries(fields).forEach(([fieldName, fieldAttributes]) => {
    // 检查字段是否应该包含
    if (include && !include.includes(fieldName)) return
    if (exclude && exclude.includes(fieldName)) return
    if (fieldAttributes?.hidden) return

    // 转换为 FieldConfig 格式（临时解决方案）
    const fieldConfig = fieldAttributes as any as FieldConfig

    // 获取字段的表格配置
    const tableConfig = { ...defaultColumnConfig, ...fieldConfig.table }
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
 * 渲染单元格值
 */
export function renderCellValue(
  value: any, 
  renderConfig?: string, 
  fieldConfig?: FieldConfig
): React.ReactNode {
  if (!renderConfig) {
    return value?.toString() || ''
  }

  // 根据 renderConfig 调用相应的渲染函数
  switch (renderConfig) {
    case 'date':
      return value ? new Date(value).toLocaleDateString() : ''
    case 'datetime':
      return value ? new Date(value).toLocaleString() : ''
    case 'boolean':
      return value ? uiT('common.yes') : uiT('common.no')
    case 'currency':
      return value ? `¥${Number(value).toFixed(2)}` : ''
    case 'status':
      return renderStatusBadge(value)
    case 'avatar':
      return renderAvatar(value, fieldConfig?.label)
    case 'link':
      return renderLink(value)
    case 'json':
      return renderJsonValue(value)
    default:
      return value?.toString() || ''
  }
}

/**
 * 渲染状态徽章
 */
function renderStatusBadge(status: string): React.ReactNode {
  const statusConfig = {
    active: { label: uiT('status.active'), className: 'bg-green-100 text-green-800' },
    inactive: { label: uiT('status.inactive'), className: 'bg-gray-100 text-gray-800' },
    pending: { label: uiT('status.pending'), className: 'bg-yellow-100 text-yellow-800' },
    error: { label: uiT('status.error'), className: 'bg-red-100 text-red-800' },
  }
  
  const config = statusConfig[status as keyof typeof statusConfig]
  if (!config) return status
  
  return `<span class="px-2 py-1 text-xs rounded-full ${config.className}">${config.label}</span>`
}

/**
 * 渲染头像
 */
function renderAvatar(src: string, alt?: string): React.ReactNode {
  if (!src) return ''
  return `<img src="${src}" alt="${alt || 'Avatar'}" class="w-8 h-8 rounded-full" />`
}

/**
 * 渲染链接
 */
function renderLink(url: string): React.ReactNode {
  if (!url) return ''
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`
}

/**
 * 渲染 JSON 值
 */
function renderJsonValue(value: any): React.ReactNode {
  if (value == null) return ''
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return value.toString()
}

/**
 * 获取字段的默认表格配置
 */
export function getDefaultTableConfig(fieldConfig: FieldConfig): Partial<TableFieldConfig> {
  const config: Partial<TableFieldConfig> = {}
  
  // 根据字段类型设置默认配置
  if (fieldConfig.relation) {
    config.filterable = true
    config.sortable = true
  }
  
  if (fieldConfig.unique) {
    config.sortable = true
  }
  
  if (fieldConfig.readonly) {
    config.sortable = false
  }
  
  return config
}

/**
 * 创建表格列配置构建器
 */
export class TableColumnBuilder<T extends Record<string, any>> {
  private entity: EntityDefinition
  private options: Parameters<typeof generateTableColumns>[1] = {}

  constructor(entity: EntityDefinition) {
    this.entity = entity
  }
  
  include(fields: string[]): this {
    if (!this.options) this.options = {}
    this.options.include = fields
    return this
  }

  exclude(fields: string[]): this {
    if (!this.options) this.options = {}
    this.options.exclude = fields
    return this
  }

  customColumn(fieldName: string, config: Partial<ColumnDef<T>>): this {
    if (!this.options) this.options = {}
    if (!this.options.customColumns) {
      this.options.customColumns = {}
    }
    this.options.customColumns[fieldName] = config as any
    return this
  }

  defaultConfig(config: Partial<TableFieldConfig>): this {
    if (!this.options) this.options = {}
    this.options.defaultColumnConfig = config
    return this
  }

  build(): ColumnDef<T>[] {
    return generateTableColumns(this.entity, this.options) as ColumnDef<T>[]
  }
}

/**
 * 创建表格列构建器
 */
export function createTableColumnBuilder<T extends Record<string, any>>(
  entity: EntityDefinition
): TableColumnBuilder<T> {
  return new TableColumnBuilder(entity)
}
