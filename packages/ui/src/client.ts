'use client'

/**
 * @fileoverview 客户端组件导出
 * @description 包含所有需要在客户端渲染的交互式组件
 */

// 基础设施（客户端专用）
export * from './infrastructure'

// 交互式UI组件
export * from './client/accordion'
export * from './client/button'
export * from './client/collapsible'
export * from './client/dialog'
export * from './client/dropdown-menu'
export * from './client/error-boundary'
export * from './client/input'
export * from './client/loading-overlay'
export * from './client/scroll-area'
export * from './client/select'
export * from './client/sheet'
export * from './client/sidebar'
export * from './client/switch'
export * from './client/tabs'
export * from './client/textarea'
export * from './client/theme-toggle'
export * from './client/toast'
export * from './client/tooltip'

// Schema驱动的交互组件
export * from './client/form'
export * from './client/schema-field-renderer'
export * from './client/schema-form'
export * from './client/schema-table'

// 布局组件
export * from './client/dashboard-layout'
export type { DashboardLayoutShellProps, DashboardUser, NavigationItem } from './client/dashboard-layout'

// Extension 管理组件
export * from './client/extension-manager'

// Hooks - 客户端专用
export * from './hooks'

// Note: Button is exported from server components, client button provides enhanced functionality
