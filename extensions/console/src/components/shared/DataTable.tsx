/**
 * 数据表格组件
 *
 * 基于 @linch-kit/ui 的 SchemaTable，为 Console 模块定制
 */

'use client'

import { useState, useMemo } from 'react'
import { SchemaTable } from '@linch-kit/ui/client'
import { Button } from '@linch-kit/ui/client'
import { Input } from '@linch-kit/ui/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@linch-kit/ui/client'
import { cn } from '@linch-kit/ui/shared'
import { Search, MoreHorizontal } from 'lucide-react'

import { useConsoleTranslation } from '../../i18n'

export interface DataTableColumn<T = Record<string, unknown>> {
  /** 列标识 */
  key: string
  /** 列标题 */
  title: string
  /** 数据字段 */
  dataIndex?: string
  /** 自定义渲染 */
  render?: (value: Record<string, unknown>, record: T, index: number) => React.ReactNode
  /** 是否可排序 */
  sortable?: boolean
  /** 是否可搜索 */
  searchable?: boolean
  /** 列宽度 */
  width?: number | string
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否固定 */
  fixed?: 'left' | 'right'
}

export interface DataTableAction<T = Record<string, unknown>> {
  /** 操作标识 */
  key: string
  /** 操作标题 */
  title: string
  /** 图标 */
  icon?: React.ReactNode
  /** 操作处理函数 */
  handler: (record: T, index: number) => void
  /** 是否危险操作 */
  danger?: boolean
  /** 是否禁用 */
  disabled?: (record: T) => boolean
  /** 权限要求 */
  permissions?: string[]
}

export interface DataTableProps<T = Record<string, unknown>> {
  /** 数据源 */
  data: T[]
  /** 列配置 */
  columns: DataTableColumn<T>[]
  /** 行操作 */
  actions?: DataTableAction<T>[]
  /** 是否加载中 */
  loading?: boolean
  /** 空数据文案 */
  emptyText?: string
  /** 分页配置 */
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  /** 搜索配置 */
  searchable?: boolean
  /** 搜索值 */
  searchValue?: string
  /** 搜索变化回调 */
  onSearch?: (value: string) => void
  /** 筛选配置 */
  filterable?: boolean
  /** 筛选选项 */
  filters?: Array<{
    key: string
    label: string
    options: Array<{ label: string; value: string }>
  }>
  /** 筛选值 */
  filterValues?: Record<string, string>
  /** 筛选变化回调 */
  onFilterChange?: (filters: Record<string, string>) => void
  /** 是否可选择 */
  selectable?: boolean
  /** 选中的行 */
  selectedRows?: T[]
  /** 选择变化回调 */
  onSelectionChange?: (selectedRows: T[]) => void
  /** 批量操作 */
  batchActions?: Array<{
    key: string
    title: string
    icon?: React.ReactNode
    handler: (selectedRows: T[]) => void
    danger?: boolean
  }>
  /** 工具栏操作 */
  toolbarActions?: Array<{
    key: string
    title: string
    icon?: React.ReactNode
    handler: () => void
    type?: 'primary' | 'default'
  }>
  /** 自定义样式类名 */
  className?: string
}

/**
 * Console 数据表格
 */
export function DataTable<T = Record<string, unknown>>({
  data,
  columns,
  actions,
  loading: _loading = false,
  emptyText: _emptyText,
  pagination,
  searchable = true,
  searchValue,
  onSearch,
  filterable = false,
  filters,
  filterValues,
  onFilterChange,
  selectable: _selectable = false,
  selectedRows: _selectedRows = [],
  onSelectionChange: _onSelectionChange,
  batchActions,
  toolbarActions,
  className,
}: DataTableProps<T>) {
  const t = useConsoleTranslation()
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || '')

  // 处理搜索
  const handleSearch = (value: string) => {
    setLocalSearchValue(value)
    onSearch?.(value)
  }

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value }
    onFilterChange?.(newFilters)
  }

  // 转换列配置为 SchemaTable 格式
  const schemaTableColumns = useMemo(() => {
    return columns.map(col => ({
      key: col.key,
      title: col.title,
      dataIndex: col.dataIndex || col.key,
      render: col.render,
      sortable: col.sortable,
      width: col.width,
      align: col.align,
      fixed: col.fixed,
    }))
  }, [columns])

  // 添加操作列
  const finalColumns = useMemo(() => {
    if (!actions || actions.length === 0) {
      return schemaTableColumns
    }

    return [
      ...schemaTableColumns,
      {
        key: 'actions',
        title: t('common.actions'),
        width: 120,
        align: 'center' as const,
        render: (_: Record<string, unknown>, record: T, index: number) => (
          <div className="flex items-center justify-center space-x-2">
            {actions.map(action => (
              <Button
                key={action.key}
                size="sm"
                variant={action.danger ? 'destructive' : 'ghost'}
                disabled={action.disabled?.(record)}
                onClick={() => action.handler(record, index)}
                className="h-8 w-8 p-0"
              >
                {action.icon || <MoreHorizontal className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        ),
      },
    ]
  }, [schemaTableColumns, actions, t])

  return (
    <div className={cn('data-table', className)}>
      {/* 工具栏 */}
      {(searchable || filterable || toolbarActions || batchActions) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* 搜索 */}
            {searchable && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('common.search')}
                  value={localSearchValue}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* 筛选 */}
            {filterable &&
              filters?.map(filter => (
                <Select
                  key={filter.key}
                  value={filterValues?.[filter.key] || ''}
                  onValueChange={value => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    {filter.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

            {/* 批量操作 */}
            {batchActions && _selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">已选择 {_selectedRows.length} 项</span>
                {batchActions.map(action => (
                  <Button
                    key={action.key}
                    size="sm"
                    variant={action.danger ? 'destructive' : 'default'}
                    onClick={() => action.handler(_selectedRows)}
                  >
                    {action.icon}
                    {action.title}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* 工具栏操作 */}
          {toolbarActions && (
            <div className="flex items-center gap-2">
              {toolbarActions.map(action => (
                <Button
                  key={action.key}
                  size="sm"
                  variant={action.type === 'primary' ? 'default' : 'outline'}
                  onClick={action.handler}
                >
                  {action.icon}
                  {action.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 表格 */}
      <SchemaTable
        schema={{
          name: 'DataTable',
          fields: finalColumns.reduce((acc, col) => {
            acc[col.key] = {
              type: 'string' as const,
              required: false,
              description: col.title
            }
            return acc
          }, {} as Record<string, { type: 'string'; required: boolean; description: string }>)
        }}
        data={data as Record<string, unknown>[]}
{...pagination && {
          pagination: {
            page: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page: number) => pagination.onChange(page, pagination.pageSize)
          }
        }}
        className="console-schema-table"
      />
    </div>
  )
}

/**
 * 简单数据表格
 */
export interface SimpleDataTableProps<T = Record<string, unknown>> {
  /** 数据源 */
  data: T[]
  /** 列配置 */
  columns: DataTableColumn<T>[]
  /** 是否加载中 */
  loading?: boolean
  /** 空数据文案 */
  emptyText?: string
  /** 自定义样式类名 */
  className?: string
}

export function SimpleDataTable<T = Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyText,
  className,
}: SimpleDataTableProps<T>) {
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
{...emptyText && { emptyText }}
      searchable={false}
      filterable={false}
      selectable={false}
{...className && { className }}
    />
  )
}
