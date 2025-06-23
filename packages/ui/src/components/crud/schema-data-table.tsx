/**
 * Schema 驱动的 DataTable 组件
 * 
 * 基于 @linch-kit/schema 的实体定义自动生成表格配置
 */

import React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { EntityDefinition } from "@linch-kit/schema"

import { generateTableColumns } from "../../schema"

import { DataTable, type DataTableProps } from "./data-table"

/**
 * Schema DataTable 属性
 */
export interface SchemaDataTableProps<T extends Record<string, any>>
  extends Omit<DataTableProps<T, any>, 'columns'> {
  /** 实体定义 */
  entity: EntityDefinition
  /** 包含的字段 */
  include?: string[]
  /** 排除的字段 */
  exclude?: string[]
  /** 自定义列配置 */
  customColumns?: Record<string, Partial<ColumnDef<T>>>
  /** 是否自动生成操作列 */
  showActions?: boolean
  /** 自定义操作列配置 */
  actionsColumn?: Partial<ColumnDef<T>>
}

/**
 * Schema 驱动的 DataTable 组件
 */
export function SchemaDataTable<T extends Record<string, any>>({
  entity,
  include,
  exclude,
  customColumns,
  showActions = true,
  actionsColumn,
  ...props
}: SchemaDataTableProps<T>) {
  // 生成列定义
  const columns = React.useMemo(() => {
    const generatedColumns = generateTableColumns(entity, {
      include,
      exclude,
      customColumns
    })

    // 添加操作列
    if (showActions) {
      const defaultActionsColumn: ColumnDef<T> = {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => handleView?.(row.original)}
            >
              查看
            </button>
            <button
              className="text-sm text-green-600 hover:text-green-800"
              onClick={() => handleEdit?.(row.original)}
            >
              编辑
            </button>
            <button
              className="text-sm text-red-600 hover:text-red-800"
              onClick={() => handleDelete?.(row.original)}
            >
              删除
            </button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        ...actionsColumn
      }

      generatedColumns.push(defaultActionsColumn)
    }

    return generatedColumns
  }, [entity, include, exclude, customColumns, showActions, actionsColumn])

  // 操作处理函数（可以通过 props 传入）
  const handleView = (props as any).onView
  const handleEdit = (props as any).onEdit
  const handleDelete = (props as any).onDelete

  return <DataTable columns={columns} {...props} />
}

/**
 * 扩展的 Schema DataTable 属性（包含操作回调）
 */
export interface SchemaDataTableWithActionsProps<T extends Record<string, any>>
  extends SchemaDataTableProps<T> {
  /** 查看操作回调 */
  onView?: (item: T) => void
  /** 编辑操作回调 */
  onEdit?: (item: T) => void
  /** 删除操作回调 */
  onDelete?: (item: T) => void
}

/**
 * 带操作回调的 Schema DataTable 组件
 */
export function SchemaDataTableWithActions<T extends Record<string, any>>(
  props: SchemaDataTableWithActionsProps<T>
) {
  return <SchemaDataTable {...props} />
}
