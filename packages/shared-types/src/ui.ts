/**
 * UI 相关共享类型
 * @module shared-types/ui
 */

import type { ComponentType } from 'react'

/**
 * 组件定义
 */
export interface ComponentDefinition {
  name: string
  component: ComponentType<any>
  props?: Record<string, unknown>
  category?: string
  description?: string
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  colors: Record<string, string>
  fonts: Record<string, string>
  spacing: Record<string, string>
  breakpoints: Record<string, string>
}

/**
 * 响应式值
 */
export type ResponsiveValue<T> = T | T[] | Record<string, T>

/**
 * 组件覆盖选项
 */
export interface OverrideOptions {
  replace?: boolean
  wrapper?: ComponentType<any>
  fallback?: ComponentType<any>
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  header?: ComponentType<any>
  footer?: ComponentType<any>
  sidebar?: ComponentType<any>
  navigation?: ComponentType<any>
}

/**
 * 表单字段配置
 */
export interface FormFieldConfig {
  name: string
  label?: string
  type: string
  required?: boolean
  placeholder?: string
  description?: string
  validation?: Record<string, unknown>
  options?: Array<{ label: string; value: unknown }>
}

/**
 * 表单配置
 */
export interface FormConfig {
  fields: FormFieldConfig[]
  layout?: 'vertical' | 'horizontal' | 'inline'
  submitText?: string
  cancelText?: string
  validation?: Record<string, unknown>
}