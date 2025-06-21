# DataTable 高级用法指南

DataTable 组件提供了多种高级用法，既保持了简单易用的默认行为，又提供了完整的 TanStack Table API 访问能力。

## 基础用法

```tsx
import { DataTable } from '@linch-kit/ui'

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
]

<DataTable
  columns={columns}
  data={users}
  config={{
    searchable: true,
    selectable: true,
    pagination: { defaultPageSize: 10 }
  }}
/>
```

## 高级用法 1: 完全控制状态

```tsx
import { useState } from 'react'
import { DataTable } from '@linch-kit/ui'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'

function AdvancedDataTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  return (
    <DataTable
      columns={columns}
      data={data}
      state={{
        sorting,
        columnFilters,
        pagination
      }}
      onStateChange={{
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination
      }}
    />
  )
}
```

## 高级用法 2: 服务端数据获取

```tsx
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@linch-kit/ui'

function ServerSideDataTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['users', sorting, columnFilters, pagination],
    queryFn: () => fetchUsers({ sorting, columnFilters, pagination }),
  })

  return (
    <DataTable
      columns={columns}
      data={data?.users || []}
      loading={isLoading}
      state={{ sorting, columnFilters, pagination }}
      onStateChange={{
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination
      }}
      tableOptions={{
        manualSorting: true,
        manualFiltering: true,
        manualPagination: true,
        pageCount: data?.pageCount ?? -1,
      }}
    />
  )
}
```

## 高级用法 3: 完全自定义渲染

```tsx
import { DataTable } from '@linch-kit/ui'
import { flexRender } from '@tanstack/react-table'

function CustomRenderedTable() {
  return (
    <DataTable
      columns={columns}
      data={data}
      renderTable={(table) => (
        <div className="custom-table-container">
          <div className="custom-header">
            <h2>Custom Table Header</h2>
            <button onClick={() => table.resetSorting()}>
              Reset Sorting
            </button>
          </div>
          
          <table className="custom-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? ' 🔼' : 
                       header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="custom-pagination">
            <button 
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button 
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    />
  )
}
```

## 高级用法 4: 访问原生 TanStack Table API

```tsx
import { DataTable } from '@linch-kit/ui'

function AdvancedTableWithNativeAPI() {
  return (
    <DataTable
      columns={columns}
      data={data}
      tableOptions={{
        // 完全访问 TanStack Table 的所有选项
        enableRowSelection: true,
        enableMultiRowSelection: true,
        enableSubRowSelection: false,
        
        // 自定义排序函数
        sortingFns: {
          customSort: (rowA, rowB, columnId) => {
            // 自定义排序逻辑
            return rowA.getValue(columnId) > rowB.getValue(columnId) ? 1 : -1
          }
        },
        
        // 自定义过滤函数
        filterFns: {
          customFilter: (row, columnId, value) => {
            // 自定义过滤逻辑
            return row.getValue(columnId).includes(value)
          }
        },
        
        // 其他高级选项
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        enableColumnPinning: true,
        
        // 调试模式
        debugTable: process.env.NODE_ENV === 'development',
        debugHeaders: process.env.NODE_ENV === 'development',
        debugColumns: process.env.NODE_ENV === 'development',
      }}
    />
  )
}
```

## 高级用法 5: 国际化支持

```tsx
import { DataTable } from '@linch-kit/ui'
import { useTranslation } from 'react-i18next'

function InternationalizedTable() {
  const { t } = useTranslation()

  return (
    <DataTable
      columns={columns}
      data={data}
      t={t} // 传入翻译函数
      config={{
        searchPlaceholder: t('table.searchPlaceholder'),
      }}
      emptyMessage={t('table.noData')}
    />
  )
}
```

## 最佳实践

1. **状态管理**: 对于简单场景使用内置状态，复杂场景使用受控状态
2. **性能优化**: 使用 `React.useMemo` 稳定 columns 和 data 引用
3. **服务端集成**: 使用 `manualSorting`、`manualFiltering`、`manualPagination` 选项
4. **自定义渲染**: 使用 `renderTable` 进行完全自定义，使用 `tableOptions` 进行配置自定义
5. **类型安全**: 充分利用 TypeScript 类型定义确保类型安全

## 迁移指南

从旧版本迁移时：
- `tableProps` 已重命名为 `tableOptions`
- 新增了 `state` 和 `onStateChange` 用于受控状态
- 新增了 `renderTable` 用于完全自定义渲染
- 新增了 `t` 属性用于国际化支持
