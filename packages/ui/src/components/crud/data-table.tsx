"use client"

import * as React from "react"
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
} from "@tanstack/react-table"
import { ChevronDown, MoreHorizontal, Search } from "lucide-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination"

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
  emptyMessage = "No results found.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Default configuration
  const {
    searchable = true,
    searchPlaceholder = "Search...",
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
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  })

  // Handle selection change
  React.useEffect(() => {
    if (selectable && onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, selectable, onSelectionChange, table])

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="pl-8"
            />
          </div>
        )}
        {showColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                  Loading...
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
                  {emptyMessage}
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
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          {showSizeChanger && (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
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
