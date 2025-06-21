/**
 * Schema 驱动的筛选器生成器
 * 
 * 基于 @linch-kit/schema 的字段定义自动生成筛选组件配置
 */

import type { EntityDefinition, FieldConfig } from "@linch-kit/schema"
import { z } from "zod"

/**
 * 筛选器类型
 */
export type FilterType = 
  | 'text'           // 文本筛选
  | 'number'         // 数字筛选
  | 'date'           // 日期筛选
  | 'select'         // 选择筛选
  | 'boolean'        // 布尔筛选
  | 'range'          // 范围筛选
  | 'multiSelect'    // 多选筛选

/**
 * 筛选操作符
 */
export type FilterOperator = 
  | 'eq'             // 等于
  | 'ne'             // 不等于
  | 'gt'             // 大于
  | 'gte'            // 大于等于
  | 'lt'             // 小于
  | 'lte'            // 小于等于
  | 'contains'       // 包含
  | 'startsWith'     // 开始于
  | 'endsWith'       // 结束于
  | 'in'             // 在列表中
  | 'notIn'          // 不在列表中
  | 'between'        // 在范围内
  | 'isNull'         // 为空
  | 'isNotNull'      // 不为空

/**
 * 筛选器配置
 */
export interface FilterConfig {
  /** 字段名 */
  field: string
  /** 字段标签 */
  label: string
  /** 筛选器类型 */
  type: FilterType
  /** 支持的操作符 */
  operators: FilterOperator[]
  /** 默认操作符 */
  defaultOperator: FilterOperator
  /** 选项配置（用于 select 类型） */
  options?: Array<{ label: string; value: any }>
  /** 异步选项加载 */
  asyncOptions?: {
    url: string
    valueField?: string
    labelField?: string
    searchParam?: string
  }
  /** 是否支持多值 */
  multiple?: boolean
  /** 占位符文本 */
  placeholder?: string
  /** 字段描述 */
  description?: string
  /** 是否必填 */
  required?: boolean
  /** 验证规则 */
  validation?: z.ZodSchema
}

/**
 * 筛选条件
 */
export interface FilterCondition {
  /** 字段名 */
  field: string
  /** 操作符 */
  operator: FilterOperator
  /** 筛选值 */
  value: any
  /** 逻辑连接符 */
  logic?: 'AND' | 'OR'
}

/**
 * 复合筛选条件
 */
export interface FilterGroup {
  /** 逻辑连接符 */
  logic: 'AND' | 'OR'
  /** 筛选条件 */
  conditions: (FilterCondition | FilterGroup)[]
}

/**
 * 从 Schema 生成筛选器配置
 */
export function generateFilterConfigs<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  options?: {
    /** 包含的字段 */
    include?: string[]
    /** 排除的字段 */
    exclude?: string[]
    /** 自定义筛选器配置 */
    customFilters?: Record<string, Partial<FilterConfig>>
  }
): FilterConfig[] {
  const { include, exclude, customFilters = {} } = options || {}
  const fields = entity.meta?.fields || {}
  
  const filterConfigs: FilterConfig[] = []

  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    // 检查字段是否应该包含
    if (include && !include.includes(fieldName)) return
    if (exclude && exclude.includes(fieldName)) return
    if (fieldConfig.hidden) return

    // 获取自定义配置
    const customConfig = customFilters[fieldName] || {}

    // 推断筛选器类型和操作符
    const filterType = inferFilterType(fieldConfig)
    const operators = getAvailableOperators(filterType, fieldConfig)
    const defaultOperator = getDefaultOperator(filterType)

    // 生成筛选器配置
    const filterConfig: FilterConfig = {
      field: fieldName,
      label: fieldConfig.label || fieldName,
      type: filterType,
      operators,
      defaultOperator,
      placeholder: fieldConfig.placeholder,
      description: fieldConfig.description,
      
      // 选项配置
      ...(fieldConfig.form?.options && {
        options: fieldConfig.form.options.map(opt => ({
          label: opt.label,
          value: opt.value
        }))
      }),
      
      // 异步选项配置
      ...(fieldConfig.form?.asyncOptions && {
        asyncOptions: fieldConfig.form.asyncOptions
      }),

      // 应用自定义配置（优先级最高）
      ...customConfig,
    }

    filterConfigs.push(filterConfig)
  })

  // 按 order 排序
  filterConfigs.sort((a, b) => {
    const aOrder = fields[a.field]?.order || 0
    const bOrder = fields[b.field]?.order || 0
    return aOrder - bOrder
  })

  return filterConfigs
}

/**
 * 推断筛选器类型
 */
function inferFilterType(fieldConfig: FieldConfig): FilterType {
  // 如果有明确的筛选器类型配置，使用它
  if (fieldConfig.filter?.type) {
    return fieldConfig.filter.type as FilterType
  }

  // 根据表单类型推断
  if (fieldConfig.form?.type) {
    switch (fieldConfig.form.type) {
      case 'select':
        return fieldConfig.form.options ? 'select' : 'text'
      case 'checkbox':
      case 'switch':
        return 'boolean'
      case 'date':
        return 'date'
      case 'number':
        return 'number'
      case 'textarea':
      case 'text':
      case 'email':
      case 'password':
      default:
        return 'text'
    }
  }

  // 根据关系推断
  if (fieldConfig.relation) {
    return 'select'
  }

  // 根据数据库类型推断
  if (fieldConfig.db?.type) {
    switch (fieldConfig.db.type) {
      case 'BOOLEAN':
        return 'boolean'
      case 'INT':
      case 'BIGINT':
      case 'DECIMAL':
        return 'number'
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'date'
      default:
        return 'text'
    }
  }

  // 默认为文本筛选
  return 'text'
}

/**
 * 获取可用的操作符
 */
function getAvailableOperators(filterType: FilterType, fieldConfig: FieldConfig): FilterOperator[] {
  // 如果有明确的操作符配置，使用它
  if (fieldConfig.filter?.operators) {
    return fieldConfig.filter.operators as FilterOperator[]
  }

  switch (filterType) {
    case 'text':
      return ['eq', 'ne', 'contains', 'startsWith', 'endsWith', 'isNull', 'isNotNull']
    case 'number':
      return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull']
    case 'date':
      return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull']
    case 'select':
      return ['eq', 'ne', 'in', 'notIn', 'isNull', 'isNotNull']
    case 'multiSelect':
      return ['in', 'notIn', 'isNull', 'isNotNull']
    case 'boolean':
      return ['eq', 'ne', 'isNull', 'isNotNull']
    case 'range':
      return ['between', 'gt', 'gte', 'lt', 'lte']
    default:
      return ['eq', 'ne', 'isNull', 'isNotNull']
  }
}

/**
 * 获取默认操作符
 */
function getDefaultOperator(filterType: FilterType): FilterOperator {
  switch (filterType) {
    case 'text':
      return 'contains'
    case 'number':
    case 'date':
    case 'select':
    case 'boolean':
      return 'eq'
    case 'multiSelect':
      return 'in'
    case 'range':
      return 'between'
    default:
      return 'eq'
  }
}

/**
 * 构建筛选查询
 */
export function buildFilterQuery(conditions: FilterCondition[]): Record<string, any> {
  if (conditions.length === 0) return {}

  const query: Record<string, any> = {}

  conditions.forEach(condition => {
    const { field, operator, value } = condition

    if (value === undefined || value === null || value === '') {
      if (operator !== 'isNull' && operator !== 'isNotNull') {
        return // 跳过空值条件
      }
    }

    switch (operator) {
      case 'eq':
        query[field] = value
        break
      case 'ne':
        query[field] = { not: value }
        break
      case 'gt':
        query[field] = { gt: value }
        break
      case 'gte':
        query[field] = { gte: value }
        break
      case 'lt':
        query[field] = { lt: value }
        break
      case 'lte':
        query[field] = { lte: value }
        break
      case 'contains':
        query[field] = { contains: value, mode: 'insensitive' }
        break
      case 'startsWith':
        query[field] = { startsWith: value, mode: 'insensitive' }
        break
      case 'endsWith':
        query[field] = { endsWith: value, mode: 'insensitive' }
        break
      case 'in':
        query[field] = { in: Array.isArray(value) ? value : [value] }
        break
      case 'notIn':
        query[field] = { notIn: Array.isArray(value) ? value : [value] }
        break
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          query[field] = { gte: value[0], lte: value[1] }
        }
        break
      case 'isNull':
        query[field] = null
        break
      case 'isNotNull':
        query[field] = { not: null }
        break
    }
  })

  return query
}

/**
 * 验证筛选条件
 */
export function validateFilterCondition(
  condition: FilterCondition,
  filterConfig: FilterConfig
): { valid: boolean; error?: string } {
  const { operator, value } = condition

  // 检查操作符是否支持
  if (!filterConfig.operators.includes(operator)) {
    return {
      valid: false,
      error: `操作符 "${operator}" 不支持字段 "${filterConfig.field}"`
    }
  }

  // 检查值是否为空（对于非空值检查操作符）
  if (operator !== 'isNull' && operator !== 'isNotNull') {
    if (value === undefined || value === null || value === '') {
      if (filterConfig.required) {
        return {
          valid: false,
          error: `字段 "${filterConfig.field}" 的值不能为空`
        }
      }
    }
  }

  // 使用 Zod 验证值
  if (filterConfig.validation && value !== undefined && value !== null && value !== '') {
    try {
      filterConfig.validation.parse(value)
    } catch (error) {
      return {
        valid: false,
        error: `字段 "${filterConfig.field}" 的值格式不正确`
      }
    }
  }

  return { valid: true }
}
