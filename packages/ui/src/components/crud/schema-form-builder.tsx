/**
 * Schema 驱动的 FormBuilder 组件
 * 
 * 基于 @linch-kit/schema 的实体定义自动生成表单配置
 */

import React from "react"
import type { EntityDefinition } from "@linch-kit/schema"
import type { FieldValues, UseFormReturn } from "react-hook-form"

import { generateFormFields, type FormFieldConfig } from "../../schema"

import { FormBuilder, type FormBuilderProps } from "./form-builder"

/**
 * Schema FormBuilder 属性
 */
export interface SchemaFormBuilderProps<T extends FieldValues>
  extends Omit<FormBuilderProps<T>, 'schema' | 'fields'> {
  /** 实体定义 */
  entity: EntityDefinition
  /** 包含的字段 */
  include?: string[]
  /** 排除的字段 */
  exclude?: string[]
  /** 表单模式 */
  mode?: 'create' | 'update' | 'view'
  /** 自定义字段配置 */
  customFields?: Record<string, Partial<FormFieldConfig>>
  /** 字段分组配置 */
  groups?: Array<{
    name: string
    label: string
    fields: string[]
    collapsible?: boolean
    defaultExpanded?: boolean
  }>
}

/**
 * Schema 驱动的 FormBuilder 组件
 */
export function SchemaFormBuilder<T extends FieldValues>({
  entity,
  include,
  exclude,
  mode = 'create',
  customFields,
  groups,
  ...props
}: SchemaFormBuilderProps<T>) {
  // 生成表单字段配置
  const formFields = React.useMemo(() => {
    return generateFormFields(entity, {
      include,
      exclude,
      mode,
      customFields
    })
  }, [entity, include, exclude, mode, customFields])

  // 生成 Zod schema（从实体 schema 中提取）
  const zodSchema = React.useMemo(() => {
    // 这里需要根据 mode 和字段配置生成相应的 schema
    // 例如：create 模式可能需要排除 id 字段，update 模式可能需要部分字段可选
    let schema = entity.schema

    if (mode === 'update') {
      // 更新模式：所有字段都是可选的
      schema = schema.partial() as any
    }

    if (exclude) {
      // 排除指定字段
      const shape = schema.shape
      const newShape = Object.fromEntries(
        Object.entries(shape).filter(([key]) => !exclude.includes(key))
      )
      schema = schema.constructor(newShape) as any
    }

    if (include) {
      // 只包含指定字段
      const shape = schema.shape
      const newShape = Object.fromEntries(
        Object.entries(shape).filter(([key]) => include.includes(key))
      )
      schema = schema.constructor(newShape) as any
    }

    return schema
  }, [entity.schema, mode, include, exclude])

  // 如果有分组配置，渲染分组表单
  if (groups && groups.length > 0) {
    return (
      <div className="space-y-6">
        {groups.map((group) => {
          const groupFields = formFields.filter(field => 
            group.fields.includes(field.name)
          )

          if (groupFields.length === 0) return null

          return (
            <div key={group.name} className="space-y-4">
              <h3 className="text-lg font-medium">{group.label}</h3>
              <FormBuilder
                schema={zodSchema}
                fields={groupFields as any}
                {...props}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // 渲染普通表单
  return (
    <FormBuilder
      schema={zodSchema}
      fields={formFields as any}
      {...props}
    />
  )
}

/**
 * Schema 表单字段组件
 * 
 * 用于渲染单个字段，支持依赖关系和动态显示/隐藏
 */
export function SchemaFormField<T extends FieldValues>({
  field,
  form,
  entity
}: {
  field: FormFieldConfig
  form: UseFormReturn<T>
  entity: EntityDefinition
}) {
  const [isVisible, setIsVisible] = React.useState(true)
  const [isEnabled, setIsEnabled] = React.useState(!field.readonly)
  const [isRequired, setIsRequired] = React.useState(field.required || false)

  // 监听依赖字段变化
  React.useEffect(() => {
    if (!field.dependencies) return

    const subscription = form.watch((values) => {
      field.dependencies?.forEach((dep) => {
        const depValue = values[dep.field as keyof T]
        const conditionMet = evaluateCondition(depValue, dep.condition)

        switch (dep.action) {
          case 'show':
            setIsVisible(conditionMet)
            break
          case 'hide':
            setIsVisible(!conditionMet)
            break
          case 'enable':
            setIsEnabled(conditionMet)
            break
          case 'disable':
            setIsEnabled(!conditionMet)
            break
          case 'require':
            setIsRequired(conditionMet)
            break
        }
      })
    })

    return () => subscription.unsubscribe()
  }, [field.dependencies, form])

  if (!isVisible) return null

  // 这里可以根据字段类型渲染不同的表单控件
  // 暂时返回一个简单的占位符
  return (
    <div className="form-field">
      <label>{field.label}</label>
      {/* 根据 field.type 渲染相应的表单控件 */}
    </div>
  )
}

/**
 * 评估条件表达式
 */
function evaluateCondition(value: any, condition: any): boolean {
  if (typeof condition === 'function') {
    return condition(value)
  }

  if (typeof condition === 'object') {
    // 支持复杂的条件表达式
    // 例如：{ eq: 'value' }, { in: ['a', 'b'] }, { gt: 10 }
    const [operator, operand] = Object.entries(condition)[0]
    
    switch (operator) {
      case 'eq':
        return value === operand
      case 'ne':
        return value !== operand
      case 'in':
        return Array.isArray(operand) && operand.includes(value)
      case 'nin':
        return Array.isArray(operand) && !operand.includes(value)
      case 'gt':
        return value > operand
      case 'gte':
        return value >= operand
      case 'lt':
        return value < operand
      case 'lte':
        return value <= operand
      default:
        return false
    }
  }

  // 简单的相等比较
  return value === condition
}

/**
 * 获取字段的验证规则
 */
export function getFieldValidationRules(
  fieldConfig: FormFieldConfig,
  entity: EntityDefinition
): any {
  // 从实体 schema 中提取字段的验证规则
  const fieldSchema = entity.schema.shape[fieldConfig.name]
  
  if (!fieldSchema) return {}

  // 这里可以根据 Zod schema 生成相应的验证规则
  // 例如：required、min、max、pattern 等
  return {}
}
