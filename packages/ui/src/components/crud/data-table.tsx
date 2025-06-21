"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type TableOptions,
    type Table as TanStackTable
} from "@tanstack/react-table"
import { ChevronDown, MoreHorizontal, Search } from "lucide-react"
import * as React from "react"

import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious
} from "../ui/pagination"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table"
import { useTableTranslation } from "../../i18n/hooks"

/**
 * Action configuration for DataTable rows
 */
export interface DataTableAction<TData> {
  /** Action label */
  label: string
  /** Action handler */
  onClick: (row: TData) => void
  /** Action variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  /** Whether action is disabled */
  disabled?: boolean | ((row: TData) => boolean)
}

/**
 * Configuration options for DataTable
 */
export interface DataTableConfig {
  /** Enable search functionality */
  searchable?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Search column key */
  searchColumn?: string
  /** Enable column visibility toggle */
  columnVisibility?: boolean
  /** Enable row selection */
  selectable?: boolean
  /** Pagination configuration */
  pagination?: {
    /** Page size options */
    pageSizeOptions?: number[]
    /** Default page size */
    defaultPageSize?: number
    /** Show page size selector */
    showSizeChanger?: boolean
  }
}

/**
 * Props for DataTable component
 */
export interface DataTableProps<TData, TValue> {
  /** Table columns configuration */
  columns: ColumnDef<TData, TValue>[]
  /** Table data */
  data: TData[]
  /** Table configuration */
  config?: DataTableConfig
  /** Row actions */
  actions?: DataTableAction<TData>[]
  /** Row click handler */
  onRowClick?: (row: TData) => void
  /** Selection change handler */
  onSelectionChange?: (selectedRows: TData[]) => void
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Additional table options for TanStack Table - provides full access to native API */
  tableOptions?: Partial<TableOptions<TData>>
  /** Render prop to access the table instance for advanced usage */
  renderTable?: (table: TanStackTable<TData>) => React.ReactNode
  /** Custom table state management */
  state?: {
    sorting?: SortingState
    columnFilters?: ColumnFiltersState
    columnVisibility?: VisibilityState
    rowSelection?: Record<string, boolean>
    pagination?: { pageIndex: number; pageSize: number }
  }
  /** State change handlers for controlled state */
  onStateChange?: {
    onSortingChange?: (sorting: SortingState) => void
    onColumnFiltersChange?: (filters: ColumnFiltersState) => void
    onColumnVisibilityChange?: (visibility: VisibilityState) => void
    onRowSelectionChange?: (selection: Record<string, boolean>) => void
    onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  }
  /** Translation function for i18n support */
  t?: (key: string, params?: Record<string, any>) => string
}

/**
 * Advanced DataTable component with sorting, filtering, pagination, and actions
 * 
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   {
 *     accessorKey: "name",
 *     header: "Name",
 *   },
 *   {
 *     accessorKey: "email",
 *     header: "Email",
 *   },
 * ]
 * 
 * const actions: DataTableAction<User>[] = [
 *   {
 *     label: "Edit",
 *     onClick: (user) => handleEdit(user),
 *   },
 *   {
 *     label: "Delete",
 *     onClick: (user) => handleDelete(user),
 *     variant: "destructive",
 *   },
 * ]
 * 
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   config={{
 *     searchable: true,
 *     selectable: true,
 *     pagination: { defaultPageSize: 10 }
 *   }}
 *   actions={actions}
 *   onRowClick={handleRowClick}
 * />
 * ```
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  config = {},
  actions = [],
  onRowClick,
  onSelectionChange,
  loading = false,
  emptyMessage,
  tableOptions = {},
  renderTable,
  state: controlledState,
  onStateChange = {},
  t: userT,
}: DataTableProps<TData, TValue>) {
  const { t } = useTableTranslation({ t: userT })

  // Internal state (used when not controlled)
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([])
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  const [internalPagination, setInternalPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  // Use controlled state if provided, otherwise use internal state
  const sorting = controlledState?.sorting ?? internalSorting
  const columnFilters = controlledState?.columnFilters ?? internalColumnFilters
  const columnVisibility = controlledState?.columnVisibility ?? internalColumnVisibility
  const rowSelection = controlledState?.rowSelection ?? internalRowSelection
  const pagination = controlledState?.pagination ?? internalPagination

  // State change handlers
  const setSorting = onStateChange.onSortingChange ?? setInternalSorting
  const setColumnFilters = onStateChange.onColumnFiltersChange ?? setInternalColumnFilters
  const setColumnVisibility = onStateChange.onColumnVisibilityChange ?? setInternalColumnVisibility
  const setRowSelection = onStateChange.onRowSelectionChange ?? setInternalRowSelection
  const setPagination = onStateChange.onPaginationChange ?? setInternalPagination

  // Default configuration
  const {
    searchable = true,
    searchPlaceholder = t('search'),
    searchColumn,
    columnVisibility: showColumnVisibility = true,
    selectable = false,
    pagination = {},
  } = config

  const {
    pageSizeOptions = [10, 20, 30, 40, 50],
    defaultPageSize = 10,
    showSizeChanger = true,
  } = pagination

  // Add selection column if selectable
  const tableColumns = React.useMemo(() => {
    if (!selectable) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('selectRow')}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, selectable])

  // Add actions column if actions are provided
  const finalColumns = React.useMemo(() => {
    if (!actions.length) return tableColumns

    const actionsColumn: ColumnDef<TData, TValue> = {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {actions.map((action, index) => {
                const isDisabled = typeof action.disabled === "function" 
                  ? action.disabled(rowData) 
                  : action.disabled

                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => !isDisabled && action.onClick(rowData)}
                    disabled={isDisabled}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {action.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }

    return [...tableColumns, actionsColumn]
  }, [tableColumns, actions])

  const table = useReactTable({
    data,
    columns: finalColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    // Merge user-provided table options (provides full access to TanStack Table API)
    ...tableOptions,
  })

  // Handle selection change
  React.useEffect(() => {
    if (selectable && onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, selectable, onSelectionChange, table])

  // If renderTable is provided, use it for custom rendering
  if (renderTable) {
    return <>{renderTable(table)}</>
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {searchable && searchColumn && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchColumn)?.setFilterValue((event.target as HTMLInputElement).value)
              }
              className="pl-8"
            />
          </div>
        )}
        {showColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {t('columns')} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className="h-24 text-center">
                  {t('loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className="h-24 text-center">
                  {emptyMessage || t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectable && (
            <>
              {t('selectedRows', { count: table.getFilteredSelectedRowModel().rows.length })}
            </>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          {showSizeChanger && (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">{t('rowsPerPage')}</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number((e.target as HTMLSelectElement).value))
                }}
                className="h-8 w-[70px] rounded border border-input bg-background px-2 text-sm"
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {t('page')} {table.getState().pagination.pageIndex + 1} {t('of')} {table.getPageCount()}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
