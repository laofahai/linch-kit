/**
 * UI 相关的复杂类型定义
 * 
 * 这些类型将在 @linch-kit/ui 包中通过模块扩展的方式添加到 FieldConfig 接口中
 * 分离这些类型可以显著提升 Schema 包的 DTS 构建性能
 */

import type { I18nText } from './types'

/**
 * DataTable 列配置
 */
export interface TableFieldConfig {
  /** 列宽度 */
  width?: number | string
  /** 最小宽度 */
  minWidth?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 是否可排序 */
  sortable?: boolean
  /** 是否可筛选 */
  filterable?: boolean
  /** 是否可隐藏 */
  hideable?: boolean
  /** 列对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 自定义渲染函数 */
  render?: string // 函数名或组件名
  /** 列头自定义渲染 */
  headerRender?: string
  /** 是否固定列 */
  fixed?: 'left' | 'right' | boolean
  /** 列分组 */
  group?: string
}

/**
 * FormBuilder 字段配置
 */
export interface FormFieldConfig {
  /** 表单字段类型 */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'date' | 'file' | 'custom'
  /** 字段布局配置 */
  layout?: {
    /** 列跨度 (1-12) */
    colSpan?: number
    /** 行跨度 */
    rowSpan?: number
  }
  /** 选项配置（用于 select、radio、checkbox 等） */
  options?: Array<{ label: string; value: string | number; disabled?: boolean }>
  /** 异步选项加载 */
  asyncOptions?: {
    /** API 端点 */
    url: string
    /** 值字段名 */
    valueField?: string
    /** 标签字段名 */
    labelField?: string
    /** 搜索参数名 */
    searchParam?: string
  }
  /** 文件上传配置 */
  upload?: {
    /** 接受的文件类型 */
    accept?: string
    /** 最大文件大小 (bytes) */
    maxSize?: number
    /** 是否支持多文件 */
    multiple?: boolean
    /** 上传 API 端点 */
    uploadUrl?: string
  }
  /** 依赖字段配置 */
  dependencies?: Array<{
    /** 依赖的字段名 */
    field: string
    /** 依赖条件 */
    condition: unknown
    /** 满足条件时的行为 */
    action: 'show' | 'hide' | 'enable' | 'disable' | 'require'
  }>
}

/**
 * 权限配置
 */
export interface PermissionFieldConfig {
  /** 读取权限 */
  read?: string | string[]
  /** 写入权限 */
  write?: string | string[]
  /** 自定义权限检查函数 */
  custom?: (user: unknown, context?: unknown) => boolean
}

/**
 * 数据转换配置
 */
export interface TransformFieldConfig {
  /** 输入转换（清理、格式化） */
  input?: (value: unknown) => unknown
  /** 输出转换（格式化、脱敏） */
  output?: (value: unknown) => unknown
}

/**
 * 虚拟字段配置
 */
export interface VirtualFieldConfig {
  /** 是否为计算字段 */
  computed?: boolean
  /** 计算函数 */
  compute?: (entity: unknown) => unknown
  /** 依赖字段 */
  dependencies?: string[]
}

/**
 * 扩展的字段配置接口 - 包含所有 UI 相关的复杂类型
 * 
 * 这个接口将在 @linch-kit/ui 包中通过模块扩展的方式
 * 添加到 FieldConfig 接口中
 */
export interface UIFieldConfigExtensions {
  /** DataTable 列配置 */
  table?: TableFieldConfig
  /** FormBuilder 字段配置 */
  form?: FormFieldConfig
  /** 字段级别权限 */
  permissions?: PermissionFieldConfig
  /** 数据转换配置 */
  transform?: TransformFieldConfig
  /** 虚拟字段配置 */
  virtual?: VirtualFieldConfig
}
