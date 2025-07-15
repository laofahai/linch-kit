/**
 * UI 相关共享类型
 * @module shared-types/ui
 */

import type { ComponentType } from 'react'

/**
 * 通用组件属性类型
 */
export type ComponentProps = Record<string, unknown>

/**
 * 组件定义
 */
export interface ComponentDefinition {
  name: string
  component: ComponentType<ComponentProps>
  props?: ComponentProps
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
  wrapper?: ComponentType<ComponentProps>
  fallback?: ComponentType<ComponentProps>
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  header?: ComponentType<ComponentProps>
  footer?: ComponentType<ComponentProps>
  sidebar?: ComponentType<ComponentProps>
  navigation?: ComponentType<ComponentProps>
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