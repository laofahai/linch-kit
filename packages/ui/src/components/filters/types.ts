/**
 * 筛选组件类型定义
 */

import type { FilterOperator, FilterCondition } from "../../schema/filter-generator"

/**
 * 筛选值类型
 */
export type FilterValue = string | number | boolean | Date | Array<any> | null | undefined

/**
 * 筛选变更处理器
 */
export type FilterChangeHandler = (condition: FilterCondition | null) => void

/**
 * 筛选组件基础属性
 */
export interface FilterComponentProps {
  /** 字段名 */
  field: string
  /** 字段标签 */
  label: string
  /** 当前操作符 */
  operator: FilterOperator
  /** 当前值 */
  value: FilterValue
  /** 支持的操作符 */
  operators: FilterOperator[]
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否必填 */
  required?: boolean
  /** 变更处理器 */
  onChange: FilterChangeHandler
  /** 操作符变更处理器 */
  onOperatorChange?: (operator: FilterOperator) => void
}

/**
 * 选择筛选器属性
 */
export interface SelectFilterProps extends FilterComponentProps {
  /** 选项列表 */
  options: Array<{ label: string; value: any }>
  /** 是否支持多选 */
  multiple?: boolean
  /** 是否支持搜索 */
  searchable?: boolean
  /** 异步选项加载 */
  asyncOptions?: {
    url: string
    valueField?: string
    labelField?: string
    searchParam?: string
  }
}

/**
 * 范围筛选器属性
 */
export interface RangeFilterProps extends FilterComponentProps {
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步长 */
  step?: number
  /** 值类型 */
  valueType?: 'number' | 'date'
}

/**
 * 日期筛选器属性
 */
export interface DateFilterProps extends FilterComponentProps {
  /** 日期格式 */
  format?: string
  /** 是否显示时间 */
  showTime?: boolean
  /** 最小日期 */
  minDate?: Date
  /** 最大日期 */
  maxDate?: Date
  /** 预设范围 */
  presets?: Array<{
    label: string
    value: [Date, Date] | Date
  }>
}

/**
 * 筛选器状态
 */
export interface FilterState {
  /** 筛选条件 */
  conditions: FilterCondition[]
  /** 是否显示高级筛选 */
  showAdvanced: boolean
  /** 快速筛选值 */
  quickFilter: string
}

/**
 * 筛选器配置
 */
export interface FilterBarConfig {
  /** 是否显示快速筛选 */
  showQuickFilter?: boolean
  /** 快速筛选占位符 */
  quickFilterPlaceholder?: string
  /** 是否显示高级筛选按钮 */
  showAdvancedToggle?: boolean
  /** 是否显示清除按钮 */
  showClearButton?: boolean
  /** 是否显示筛选条件数量 */
  showFilterCount?: boolean
  /** 最大显示的筛选条件数量 */
  maxVisibleFilters?: number
}
