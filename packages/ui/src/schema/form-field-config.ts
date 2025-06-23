/**
 * 表单字段配置工具
 * 
 * 提供从 Schema 字段配置生成表单字段配置的工具函数
 */

import type { EntityDefinition, FieldConfig, FormFieldConfig } from "@linch-kit/schema"
import { uiT } from "../i18n"

/**
 * 扩展的表单字段配置接口
 */
export interface ExtendedFormFieldConfig extends FormFieldConfig {
  name: string
  label?: string
  required?: boolean
  readonly?: boolean
  placeholder?: string
  description?: string
  order?: number
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | undefined
  }
}

/**
 * 从 Schema 生成表单字段配置
 */
export function generateFormFields<T extends Record<string, any>>(
  entity: EntityDefinition,
  options?: {
    /** 包含的字段 */
    include?: string[]
    /** 排除的字段 */
    exclude?: string[]
    /** 表单模式 */
    mode?: 'create' | 'update' | 'view'
    /** 自定义字段配置 */
    customFields?: Record<string, Partial<ExtendedFormFieldConfig>>
    /** 默认字段配置 */
    defaultFieldConfig?: Partial<FormFieldConfig>
  }
): ExtendedFormFieldConfig[] {
  const { 
    include, 
    exclude, 
    mode = 'create', 
    customFields = {}, 
    defaultFieldConfig = {} 
  } = options || {}
  
  const fields = entity.meta?.fields || {}
  const formFields: ExtendedFormFieldConfig[] = []

  // 遍历字段生成表单配置
  Object.entries(fields).forEach(([fieldName, fieldAttributes]) => {
    // 检查字段是否应该包含
    if (include && !include.includes(fieldName)) return
    if (exclude && exclude.includes(fieldName)) return
    if (fieldAttributes?.hidden) return
    if (mode === 'view' && !fieldAttributes?.readonly) return

    // 转换为 FieldConfig 格式（临时解决方案）
    const fieldConfig = fieldAttributes as any as FieldConfig

    // 获取字段的表单配置
    const formConfig = { ...defaultFieldConfig, ...fieldConfig.form }
    const customConfig = customFields[fieldName] || {}

    // 推断字段类型
    const fieldType = inferFormFieldType(fieldConfig, formConfig)

    // 生成表单字段配置
    const formField: ExtendedFormFieldConfig = {
      name: fieldName,
      label: fieldConfig.label || fieldName,
      type: fieldType as any,
      required: fieldConfig.required || false,
      readonly: fieldConfig.readonly || mode === 'view',
      placeholder: fieldConfig.placeholder,
      description: fieldConfig.description,
      order: fieldConfig.order || 0,

      // 应用表单配置
      ...formConfig,

      // 应用自定义配置（优先级最高）
      ...customConfig,
    }

    formFields.push(formField)
  })

  // 按 order 排序
  formFields.sort((a, b) => (a.order || 0) - (b.order || 0))

  return formFields
}

/**
 * 推断表单字段类型
 */
export function inferFormFieldType(
  fieldConfig: FieldConfig, 
  formConfig: Partial<FormFieldConfig>
): string {
  // 如果明确指定了类型，直接使用
  if (formConfig.type) {
    return formConfig.type
  }

  // 根据字段配置推断类型
  if (fieldConfig.relation) {
    return 'select' // 关联字段默认为选择器
  }

  // 根据字段名推断
  const fieldName = fieldConfig.label?.toLowerCase() || ''
  if (fieldName.includes('email')) return 'email'
  if (fieldName.includes('password')) return 'password'
  if (fieldName.includes('phone')) return 'tel'
  if (fieldName.includes('url') || fieldName.includes('link')) return 'url'
  if (fieldName.includes('date')) return 'date'
  if (fieldName.includes('time')) return 'datetime-local'
  if (fieldName.includes('number') || fieldName.includes('count')) return 'number'
  if (fieldName.includes('description') || fieldName.includes('bio')) return 'textarea'

  // 默认类型
  return 'text'
}

/**
 * 获取字段验证规则
 */
export function getFieldValidation(fieldConfig: FieldConfig): ExtendedFormFieldConfig['validation'] {
  const validation: ExtendedFormFieldConfig['validation'] = {}
  
  if (fieldConfig.required) {
    validation.custom = (value) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return uiT('validation.required')
      }
    }
  }
  
  // 这里可以根据 Zod schema 提取更多验证规则
  // 暂时使用简单的实现
  
  return Object.keys(validation).length > 0 ? validation : undefined
}

/**
 * 创建表单字段配置构建器
 */
export class FormFieldBuilder<T extends Record<string, any>> {
  private entity: EntityDefinition
  private options: Parameters<typeof generateFormFields>[1] = {}

  constructor(entity: EntityDefinition) {
    this.entity = entity
  }
  
  include(fields: string[]): this {
    if (!this.options) this.options = {}
    this.options.include = fields
    return this
  }

  exclude(fields: string[]): this {
    if (!this.options) this.options = {}
    this.options.exclude = fields
    return this
  }

  mode(mode: 'create' | 'update' | 'view'): this {
    if (!this.options) this.options = {}
    this.options.mode = mode
    return this
  }

  customField(fieldName: string, config: Partial<ExtendedFormFieldConfig>): this {
    if (!this.options) this.options = {}
    if (!this.options.customFields) {
      this.options.customFields = {}
    }
    this.options.customFields[fieldName] = config
    return this
  }

  defaultConfig(config: Partial<FormFieldConfig>): this {
    if (!this.options) this.options = {}
    this.options.defaultFieldConfig = config
    return this
  }
  
  build(): ExtendedFormFieldConfig[] {
    return generateFormFields(this.entity, this.options)
  }
}

/**
 * 创建表单字段构建器
 */
export function createFormFieldBuilder<T extends Record<string, any>>(
  entity: EntityDefinition
): FormFieldBuilder<T> {
  return new FormFieldBuilder(entity)
}

/**
 * 表单字段分组
 */
export interface FormFieldGroup {
  title: string
  description?: string
  fields: ExtendedFormFieldConfig[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

/**
 * 将表单字段按组分类
 */
export function groupFormFields(
  fields: ExtendedFormFieldConfig[],
  groupConfig?: Record<string, {
    title: string
    description?: string
    fields: string[]
    collapsible?: boolean
    defaultExpanded?: boolean
  }>
): FormFieldGroup[] {
  if (!groupConfig) {
    return [{
      title: uiT('form.basicInfo'),
      fields
    }]
  }
  
  const groups: FormFieldGroup[] = []
  const usedFields = new Set<string>()
  
  // 创建配置的分组
  Object.entries(groupConfig).forEach(([groupKey, config]) => {
    const groupFields = fields.filter(field => 
      config.fields.includes(field.name)
    )
    
    if (groupFields.length > 0) {
      groups.push({
        title: config.title,
        description: config.description,
        fields: groupFields,
        collapsible: config.collapsible,
        defaultExpanded: config.defaultExpanded
      })
      
      groupFields.forEach(field => usedFields.add(field.name))
    }
  })
  
  // 添加未分组的字段
  const ungroupedFields = fields.filter(field => !usedFields.has(field.name))
  if (ungroupedFields.length > 0) {
    groups.push({
      title: uiT('form.other'),
      fields: ungroupedFields
    })
  }
  
  return groups
}

/**
 * 表单布局配置
 */
export interface FormLayoutConfig {
  columns: number
  spacing: 'sm' | 'md' | 'lg'
  labelPosition: 'top' | 'left' | 'floating'
  submitButton?: {
    text: string
    position: 'left' | 'center' | 'right'
  }
  cancelButton?: {
    text: string
    position: 'left' | 'center' | 'right'
  }
}

/**
 * 获取默认表单布局配置
 */
export function getDefaultFormLayout(): FormLayoutConfig {
  return {
    columns: 2,
    spacing: 'md',
    labelPosition: 'top',
    submitButton: {
      text: uiT('form.submit'),
      position: 'right'
    },
    cancelButton: {
      text: uiT('form.cancel'),
      position: 'right'
    }
  }
}
