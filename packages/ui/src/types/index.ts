/**
 * @fileoverview UI组件库类型定义
 */

import type { ReactNode } from 'react'
import type { FieldDefinition, EntityDefinition } from '@linch-kit/schema'

/**
 * 基础组件属性
 */
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

/**
 * UI实体定义 - 扩展Schema的EntityDefinition
 */
export interface UIEntityDefinition extends EntityDefinition {
  displayName?: string
}

/**
 * Schema驱动表单属性
 */
export interface SchemaFormProps extends BaseComponentProps {
  schema: UIEntityDefinition
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void
  onCancel?: () => void
  initialData?: Record<string, unknown>
  mode?: 'create' | 'edit' | 'view'
  validation?: 'strict' | 'permissive'
}

/**
 * Schema驱动表格属性
 */
export interface SchemaTableProps extends BaseComponentProps {
  schema: UIEntityDefinition
  data: Array<Record<string, unknown>>
  onEdit?: (item: Record<string, unknown>) => void
  onDelete?: (item: Record<string, unknown>) => void
  onView?: (item: Record<string, unknown>) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    field: string
    direction: 'asc' | 'desc'
    onSort: (field: string, direction: 'asc' | 'desc') => void
  }
  filtering?: {
    filters: Record<string, unknown>
    onFilter: (filters: Record<string, unknown>) => void
  }
}

/**
 * 字段渲染器属性
 */
export interface FieldRendererProps extends BaseComponentProps {
  field: FieldDefinition
  value?: unknown
  onChange?: (value: unknown) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

/**
 * 主题变体类型
 */
export type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

/**
 * 大小变体类型
 */
export type Size = 'default' | 'sm' | 'lg' | 'icon'
