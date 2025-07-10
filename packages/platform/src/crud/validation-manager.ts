/**
 * Validation Manager for platform package
 * @module platform/crud/validation-manager
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'
// 导入schema模块中的验证定义，避免重复
import type { ValidationRule, ValidationResult } from '../schema/validator'

/**
 * 验证选项
 */
export interface ValidationOptions {
  strict?: boolean
  skipUndefined?: boolean
  transformData?: boolean
}

/**
 * 验证管理器
 */
export class ValidationManager {
  private rules: Map<string, ValidationRule[]> = new Map()
  private extensionContext?: ExtensionContext

  constructor(extensionContext?: ExtensionContext) {
    this.extensionContext = extensionContext
  }

  /**
   * 添加验证规则
   */
  addRule(entityName: string, rule: ValidationRule): void {
    if (!this.rules.has(entityName)) {
      this.rules.set(entityName, [])
    }

    const rules = this.rules.get(entityName)!
    rules.push(rule)

    this.extensionContext?.logger.info(`Added validation rule for ${entityName}.${rule.field}`)
  }

  /**
   * 批量添加验证规则
   */
  addRules(entityName: string, rules: ValidationRule[]): void {
    if (!this.rules.has(entityName)) {
      this.rules.set(entityName, [])
    }

    const entityRules = this.rules.get(entityName)!
    entityRules.push(...rules)

    this.extensionContext?.logger.info(`Added ${rules.length} validation rules for ${entityName}`)
  }

  /**
   * 创建实体验证schema
   */
  createEntitySchema(entityName: string): z.ZodSchema | null {
    const rules = this.rules.get(entityName)
    if (!rules || rules.length === 0) {
      return null
    }

    const schemaFields: Record<string, z.ZodSchema> = {}

    for (const rule of rules) {
      // 只处理Zod schema，跳过函数验证器
      if (typeof rule.validator !== 'function') {
        let fieldSchema = rule.validator

        // 处理可选字段
        if (!rule.required) {
          fieldSchema = fieldSchema.optional()
        }

        schemaFields[rule.field] = fieldSchema
      }
    }

    // 如果没有Zod schema字段，返回null
    if (Object.keys(schemaFields).length === 0) {
      return null
    }

    return z.object(schemaFields)
  }

  /**
   * 验证数据
   */
  async validate(
    entityName: string,
    data: unknown,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    this.extensionContext?.logger.info(`Validating data for entity: ${entityName}`)

    // 触发Extension事件
    this.extensionContext?.events.emit('validation:before', { entityName, data, options })

    const rules = this.rules.get(entityName)
    if (!rules || rules.length === 0) {
      const result = { valid: true, errors: [], data }
      this.extensionContext?.events.emit('validation:after', { entityName, result })
      return result
    }

    const errors: Array<{ field: string; message: string; value?: unknown }> = []
    let validatedData = data

    // 先处理函数验证器
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>

      for (const rule of rules) {
        if (typeof rule.validator === 'function') {
          const value = dataObj[rule.field]

          // 检查必填字段
          if (rule.required && (value === undefined || value === null)) {
            errors.push({
              field: rule.field,
              message: rule.message || `${rule.field} is required`,
              value,
            })
            continue
          }

          // 如果字段存在，进行函数验证
          if (value !== undefined && value !== null) {
            const isValid = rule.validator(value)
            if (!isValid) {
              errors.push({
                field: rule.field,
                message: rule.message || `Invalid ${rule.field}`,
                value,
              })
            }
          }
        }
      }
    }

    // 如果函数验证器有错误，直接返回
    if (errors.length > 0) {
      const result = { valid: false, errors, data }
      this.extensionContext?.events.emit('validation:after', { entityName, result })
      return result
    }

    // 处理Zod schema验证器
    const entitySchema = this.createEntitySchema(entityName)
    if (entitySchema) {
      try {
        validatedData = entitySchema.parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.input,
          }))

          const result = { valid: false, errors: zodErrors, data }
          this.extensionContext?.events.emit('validation:after', { entityName, result })
          return result
        }

        // 处理其他类型的错误
        const result = {
          valid: false,
          errors: [{ field: 'unknown', message: 'Validation failed with unknown error' }],
          data,
        }

        this.extensionContext?.events.emit('validation:after', { entityName, result })
        return result
      }
    }

    const result = { valid: true, errors: [], data: validatedData }
    this.extensionContext?.events.emit('validation:after', { entityName, result })
    return result
  }

  /**
   * 验证单个字段
   */
  async validateField(
    entityName: string,
    field: string,
    value: unknown
  ): Promise<ValidationResult> {
    const rules = this.rules.get(entityName)
    if (!rules) {
      return { valid: true, errors: [] }
    }

    const fieldRule = rules.find(rule => rule.field === field)
    if (!fieldRule) {
      return { valid: true, errors: [] }
    }

    // 处理函数验证器
    if (typeof fieldRule.validator === 'function') {
      // 检查必填字段
      if (fieldRule.required && (value === undefined || value === null)) {
        return {
          valid: false,
          errors: [
            {
              field,
              message: fieldRule.message || `${field} is required`,
              value,
            },
          ],
        }
      }

      // 如果字段存在，进行函数验证
      if (value !== undefined && value !== null) {
        const isValid = fieldRule.validator(value)
        if (!isValid) {
          return {
            valid: false,
            errors: [
              {
                field,
                message: fieldRule.message || `Invalid ${field}`,
                value,
              },
            ],
          }
        }
      }

      return { valid: true, errors: [], data: value }
    }

    // 处理Zod schema验证器
    try {
      const validatedValue = fieldRule.validator.parse(value)
      return { valid: true, errors: [], data: validatedValue }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field,
          message: fieldRule.message || err.message,
          value,
        }))
        return { valid: false, errors }
      }

      return {
        valid: false,
        errors: [{ field, message: 'Validation failed', value }],
      }
    }
  }

  /**
   * 批量验证数据
   */
  async validateBatch(
    entityName: string,
    dataArray: unknown[],
    options: ValidationOptions = {}
  ): Promise<ValidationResult[]> {
    const results = await Promise.all(
      dataArray.map(data => this.validate(entityName, data, options))
    )

    return results
  }

  /**
   * 获取实体的所有验证规则
   */
  getRules(entityName: string): ValidationRule[] {
    return this.rules.get(entityName) || []
  }

  /**
   * 移除实体的验证规则
   */
  removeRules(entityName: string): boolean {
    const removed = this.rules.delete(entityName)
    if (removed) {
      this.extensionContext?.logger.info(`Removed validation rules for entity: ${entityName}`)
    }
    return removed
  }

  /**
   * 移除实体的特定字段验证规则
   */
  removeFieldRule(entityName: string, field: string): boolean {
    const rules = this.rules.get(entityName)
    if (!rules) {
      return false
    }

    const initialLength = rules.length
    const filtered = rules.filter(rule => rule.field !== field)

    if (filtered.length < initialLength) {
      this.rules.set(entityName, filtered)
      this.extensionContext?.logger.info(`Removed validation rule for ${entityName}.${field}`)
      return true
    }

    return false
  }

  /**
   * 获取所有实体的验证规则
   */
  getAllRules(): Record<string, ValidationRule[]> {
    const allRules: Record<string, ValidationRule[]> = {}
    for (const [entityName, rules] of this.rules.entries()) {
      allRules[entityName] = [...rules]
    }
    return allRules
  }
}

/**
 * 创建验证管理器的便捷函数
 */
export function createValidationManager(extensionContext?: ExtensionContext): ValidationManager {
  return new ValidationManager(extensionContext)
}

/**
 * 常用验证规则预设
 */
// CommonValidationRules 已移至 schema/validator 模块，避免重复定义
