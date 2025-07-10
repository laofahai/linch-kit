'use client'

/**
 * @fileoverview Schema驱动的CRUD表格组件 - 基于@tanstack/react-table
 */

import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'

import { useUITranslation } from '../infrastructure'
import type { SchemaTableProps } from '../types'
import { Button } from '../server/button'
import { Input } from '../server/input'
import { Card, CardContent, CardHeader, CardTitle } from '../server/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../server/table'
import { cn } from '../utils'

/**
 * Schema驱动的CRUD表格组件
 * 基于Entity定义自动生成表格列和操作
 */
export function SchemaTable({
  schema,
  data,
  onEdit,
  onDelete,
  onView,
  pagination,
  sorting,
  filtering: _filtering,
  className,
  children,
}: SchemaTableProps) {
  const { t } = useUITranslation()
  const [tableSorting, setTableSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columnHelper = createColumnHelper<Record<string, unknown>>()

  // 从Schema生成表格列定义
  const columns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const schemaColumns = Object.entries(schema.fields).map(([fieldName, fieldDef]) => {
      return columnHelper.accessor(fieldName, {
        id: fieldName,
        header: fieldName,
        cell: ({ getValue }) => {
          const value = getValue()
          return formatFieldValue(value, fieldDef.type)
        },
        enableSorting: true,
        enableColumnFilter: true,
      })
    })

    // 添加操作列
    const actionColumn = columnHelper.display({
      id: 'actions',
      header: t('table.actions'),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(row.original)}>
              {t('table.view')}
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
              {t('table.edit')}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(t('table.confirm_delete'))) {
                  onDelete(row.original)
                }
              }}
            >
              {t('table.delete')}
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    })

    return [...schemaColumns, actionColumn]
  }, [schema.fields, onEdit, onDelete, onView, t, columnHelper])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: updater => {
      const newSorting = typeof updater === 'function' ? updater(tableSorting) : updater
      setTableSorting(newSorting)

      if (sorting && newSorting.length > 0) {
        const { id, desc } = newSorting[0]
        sorting.onSort(id, desc ? 'desc' : 'asc')
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting: tableSorting,
      columnFilters,
      globalFilter,
      pagination: pagination
        ? {
            pageIndex: pagination.page - 1,
            pageSize: pagination.pageSize,
          }
        : undefined,
    },
    pageCount: pagination ? Math.ceil(pagination.total / pagination.pageSize) : undefined,
    manualPagination: !!pagination,
    manualSorting: !!sorting,
  })

  const formatFieldValue = (value: unknown, fieldType?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }

    switch (fieldType) {
      case 'boolean':
        return value ? t('common.yes') : t('common.no')

      case 'datetime':
        return new Date(value as string).toLocaleString()

      case 'date':
        return new Date(value as string).toLocaleDateString()

      case 'array': {
        const arrayValue = value as unknown[]
        return arrayValue?.length > 0 ? `[${arrayValue.length} items]` : '[]'
      }

      case 'object':
      case 'json':
        return <span className="font-mono text-xs">JSON</span>

      default:
        return String(value)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {schema.name} {t('table.list')}
          </span>

          {/* 全局搜索 */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder={t('table.search')}
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* 表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted',
                        header.column.getIsSorted() && 'bg-muted'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center space-x-1">
                          <span>
                            {typeof header.column.columnDef.header === 'function'
                              ? header.column.columnDef.header(header.getContext())
                              : header.column.columnDef.header}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground">
                              {header.column.getIsSorted() === 'asc' && '↑'}
                              {header.column.getIsSorted() === 'desc' && '↓'}
                              {!header.column.getIsSorted() && '↕'}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : (cell.getValue() as React.ReactNode)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('table.no_data')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        {pagination && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {t('table.showing')} {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('table.of')}{' '}
              {pagination.total} {t('table.entries')}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                {t('table.previous')}
              </Button>

              <span className="text-sm">
                {t('table.page')} {pagination.page} {t('table.of')}{' '}
                {Math.ceil(pagination.total / pagination.pageSize)}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                {t('table.next')}
              </Button>
            </div>
          </div>
        )}

        {/* 自定义子元素 */}
        {children}
      </CardContent>
    </Card>
  )
}
