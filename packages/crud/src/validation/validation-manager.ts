/**
 * 验证管理器
 * 
 * 提供数据验证功能：
 * - Schema 验证
 * - 字段级验证
 * - 自定义验证规则
 * - 异步验证支持
 */

import type { Entity, FieldDefinition, SchemaRegistry } from '@linch-kit/schema'
import type { Logger } from '@linch-kit/core'
import type { 
  IValidationManager, 
  ValidationError, 
  QueryInput,
  WhereClause 
} from '../types'
import { z } from 'zod'

/**
 * 验证管理器实现
 */
export class ValidationManager implements IValidationManager {
  constructor(
    private readonly schemaRegistry: SchemaRegistry,
    private readonly logger?: Logger
  ) {}

  /**
   * 验证创建数据
   */
  async validateCreate(entity: Entity, data: unknown): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'root',
        message: 'Data must be a valid object',
        code: 'INVALID_TYPE',
        value: data
      })
      return errors
    }

    const dataRecord = data as Record<string, unknown>

    // 验证必需字段
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      if (field.required && !(fieldName in dataRecord)) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' is required`,
          code: 'REQUIRED_FIELD_MISSING',
          value: undefined
        })
      }
    }

    // 验证每个字段
    for (const [fieldName, fieldValue] of Object.entries(dataRecord)) {
      const field = entity.fields[fieldName]
      if (field) {
        const fieldErrors = await this.validateField(field, fieldValue)
        errors.push(...fieldErrors.map(error => ({
          ...error,
          field: fieldName
        })))
      } else {
        // 未定义的字段
        if (entity.options?.strictMode) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' is not defined in schema`,
            code: 'UNDEFINED_FIELD',
            value: fieldValue
          })
        }
      }
    }

    // 自定义验证规则
    const customErrors = await this.validateCustomRules(entity, data, 'create')
    errors.push(...customErrors)

    return errors
  }

  /**
   * 验证更新数据
   */
  async validateUpdate(entity: Entity, id: string, data: unknown): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'root',
        message: 'Data must be a valid object',
        code: 'INVALID_TYPE',
        value: data
      })
      return errors
    }

    const dataRecord = data as Record<string, unknown>

    // 验证ID
    if (!id || typeof id !== 'string') {
      errors.push({
        field: 'id',
        message: 'Valid ID is required for update',
        code: 'INVALID_ID',
        value: id
      })
    }

    // 验证每个字段（更新时不要求所有必需字段都存在）
    for (const [fieldName, fieldValue] of Object.entries(dataRecord)) {
      const field = entity.fields[fieldName]
      if (field) {
        // 检查字段是否允许更新
        if (field.readonly && fieldName !== 'id') {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' is readonly and cannot be updated`,
            code: 'READONLY_FIELD',
            value: fieldValue
          })
          continue
        }

        const fieldErrors = await this.validateField(field, fieldValue)
        errors.push(...fieldErrors.map(error => ({
          ...error,
          field: fieldName
        })))
      } else {
        // 未定义的字段
        if (entity.options?.strictMode) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' is not defined in schema`,
            code: 'UNDEFINED_FIELD',
            value: fieldValue
          })
        }
      }
    }

    // 自定义验证规则
    const customErrors = await this.validateCustomRules(entity, data, 'update', id)
    errors.push(...customErrors)

    return errors
  }

  /**
   * 验证查询条件
   */
  async validateQuery(entity: Entity, query: QueryInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    // 验证 WHERE 条件
    if (query.where) {
      for (const whereClause of query.where) {
        const whereErrors = await this.validateWhereClause(entity, whereClause)
        errors.push(...whereErrors)
      }
    }

    // 验证 ORDER BY
    if (query.orderBy) {
      for (const orderBy of query.orderBy) {
        if (!entity.fields[orderBy.field]) {
          errors.push({
            field: 'orderBy',
            message: `Field '${orderBy.field}' does not exist for ordering`,
            code: 'INVALID_ORDER_FIELD',
            value: orderBy.field
          })
        }

        if (!['asc', 'desc'].includes(orderBy.direction)) {
          errors.push({
            field: 'orderBy',
            message: `Order direction must be 'asc' or 'desc'`,
            code: 'INVALID_ORDER_DIRECTION',
            value: orderBy.direction
          })
        }
      }
    }

    // 验证 INCLUDE
    if (query.include) {
      for (const includeField of query.include) {
        const field = entity.fields[includeField]
        if (!field || field.type !== 'relation') {
          errors.push({
            field: 'include',
            message: `Field '${includeField}' is not a valid relation field`,
            code: 'INVALID_INCLUDE_FIELD',
            value: includeField
          })
        }
      }
    }

    // 验证分页参数
    if (query.limit !== undefined) {
      if (typeof query.limit !== 'number' || query.limit < 0) {
        errors.push({
          field: 'limit',
          message: 'Limit must be a non-negative number',
          code: 'INVALID_LIMIT',
          value: query.limit
        })
      }

      if (query.limit > 1000) {
        errors.push({
          field: 'limit',
          message: 'Limit cannot exceed 1000',
          code: 'LIMIT_TOO_LARGE',
          value: query.limit
        })
      }
    }

    if (query.offset !== undefined) {
      if (typeof query.offset !== 'number' || query.offset < 0) {
        errors.push({
          field: 'offset',
          message: 'Offset must be a non-negative number',
          code: 'INVALID_OFFSET',
          value: query.offset
        })
      }
    }

    // 验证 DISTINCT
    if (query.distinct) {
      for (const distinctField of query.distinct) {
        if (!entity.fields[distinctField]) {
          errors.push({
            field: 'distinct',
            message: `Field '${distinctField}' does not exist for distinct operation`,
            code: 'INVALID_DISTINCT_FIELD',
            value: distinctField
          })
        }
      }
    }

    return errors
  }

  /**
   * 验证单个字段
   */
  async validateField(field: FieldDefinition, value: unknown): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    try {
      // 使用 Zod schema 验证
      if (field.zodSchema) {
        field.zodSchema.parse(value)
      } else {
        // 基于字段类型的基础验证
        await this.validateFieldType(field, value, errors)
      }

      // 自定义验证规则
      if (field.validation) {
        const customErrors = await this.validateFieldCustomRules(field, value)
        errors.push(...customErrors)
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        // 转换 Zod 错误
        for (const issue of error.issues) {
          errors.push({
            field: field.name,
            message: issue.message,
            code: issue.code,
            value
          })
        }
      } else {
        errors.push({
          field: field.name,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          value
        })
      }
    }

    return errors
  }

  // 私有辅助方法

  /**
   * 验证 WHERE 条件
   */
  private async validateWhereClause(entity: Entity, whereClause: WhereClause): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    // 验证字段是否存在
    if (!entity.fields[whereClause.field]) {
      errors.push({
        field: 'where',
        message: `Field '${whereClause.field}' does not exist`,
        code: 'INVALID_WHERE_FIELD',
        value: whereClause.field
      })
      return errors
    }

    const field = entity.fields[whereClause.field]

    // 验证操作符
    const validOperators = ['=', '!=', '>', '>=', '<', '<=', 'like', 'in', 'not_in', 'is_null', 'is_not_null', 'between']
    if (!validOperators.includes(whereClause.operator)) {
      errors.push({
        field: 'where',
        message: `Invalid operator '${whereClause.operator}'`,
        code: 'INVALID_OPERATOR',
        value: whereClause.operator
      })
      return errors
    }

    // 验证操作符和字段类型的兼容性
    const numberOperators = ['>', '>=', '<', '<=', 'between']
    const arrayOperators = ['in', 'not_in']
    const nullOperators = ['is_null', 'is_not_null']

    if (numberOperators.includes(whereClause.operator) && 
        !['number', 'integer', 'float', 'date', 'datetime'].includes(field.type)) {
      errors.push({
        field: 'where',
        message: `Operator '${whereClause.operator}' is not compatible with field type '${field.type}'`,
        code: 'INCOMPATIBLE_OPERATOR',
        value: whereClause.operator
      })
    }

    if (arrayOperators.includes(whereClause.operator) && !Array.isArray(whereClause.value)) {
      errors.push({
        field: 'where',
        message: `Operator '${whereClause.operator}' requires an array value`,
        code: 'INVALID_ARRAY_VALUE',
        value: whereClause.value
      })
    }

    if (whereClause.operator === 'between') {
      if (!Array.isArray(whereClause.value) || whereClause.value.length !== 2) {
        errors.push({
          field: 'where',
          message: `Operator 'between' requires an array with exactly 2 values`,
          code: 'INVALID_BETWEEN_VALUE',
          value: whereClause.value
        })
      }
    }

    if (nullOperators.includes(whereClause.operator) && whereClause.value !== null && whereClause.value !== undefined) {
      errors.push({
        field: 'where',
        message: `Operator '${whereClause.operator}' should not have a value`,
        code: 'UNEXPECTED_VALUE',
        value: whereClause.value
      })
    }

    // 验证值的类型
    if (!nullOperators.includes(whereClause.operator)) {
      const valueErrors = await this.validateField(field, whereClause.value)
      errors.push(...valueErrors)
    }

    return errors
  }

  /**
   * 基于字段类型的验证
   */
  private async validateFieldType(
    field: FieldDefinition, 
    value: unknown, 
    errors: ValidationError[]
  ): Promise<void> {
    if (value === null || value === undefined) {
      if (field.required) {
        errors.push({
          field: field.name,
          message: `Field '${field.name}' is required`,
          code: 'REQUIRED',
          value
        })
      }
      return
    }

    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be a string`,
            code: 'INVALID_TYPE',
            value
          })
        } else {
          if (field.minLength && value.length < field.minLength) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must be at least ${field.minLength} characters`,
              code: 'TOO_SHORT',
              value
            })
          }
          if (field.maxLength && value.length > field.maxLength) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must be at most ${field.maxLength} characters`,
              code: 'TOO_LONG',
              value
            })
          }
          if (field.pattern && !new RegExp(field.pattern).test(value)) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' does not match required pattern`,
              code: 'INVALID_PATTERN',
              value
            })
          }
        }
        break

      case 'number':
      case 'integer':
      case 'float':
        if (typeof value !== 'number') {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be a number`,
            code: 'INVALID_TYPE',
            value
          })
        } else {
          if (field.type === 'integer' && !Number.isInteger(value)) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must be an integer`,
              code: 'INVALID_INTEGER',
              value
            })
          }
          if (field.min !== undefined && value < field.min) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must be at least ${field.min}`,
              code: 'TOO_SMALL',
              value
            })
          }
          if (field.max !== undefined && value > field.max) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must be at most ${field.max}`,
              code: 'TOO_LARGE',
              value
            })
          }
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be a boolean`,
            code: 'INVALID_TYPE',
            value
          })
        }
        break

      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && typeof value !== 'string') {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be a valid date`,
            code: 'INVALID_DATE',
            value
          })
        } else if (typeof value === 'string') {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must be a valid date string`,
              code: 'INVALID_DATE_FORMAT',
              value
            })
          }
        }
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be an array`,
            code: 'INVALID_TYPE',
            value
          })
        } else {
          if (field.minItems && value.length < field.minItems) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must have at least ${field.minItems} items`,
              code: 'TOO_FEW_ITEMS',
              value
            })
          }
          if (field.maxItems && value.length > field.maxItems) {
            errors.push({
              field: field.name,
              message: `Field '${field.name}' must have at most ${field.maxItems} items`,
              code: 'TOO_MANY_ITEMS',
              value
            })
          }
        }
        break

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be an object`,
            code: 'INVALID_TYPE',
            value
          })
        }
        break

      case 'enum':
        if (field.enumValues && !field.enumValues.includes(value as string)) {
          errors.push({
            field: field.name,
            message: `Field '${field.name}' must be one of: ${field.enumValues.join(', ')}`,
            code: 'INVALID_ENUM_VALUE',
            value
          })
        }
        break
    }
  }

  /**
   * 验证字段自定义规则
   */
  private async validateFieldCustomRules(
    field: FieldDefinition, 
    value: unknown
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    if (!field.validation) {
      return errors
    }

    for (const rule of field.validation) {
      try {
        if (typeof rule.validator === 'function') {
          const isValid = await rule.validator(value)
          if (!isValid) {
            errors.push({
              field: field.name,
              message: rule.message || 'Custom validation failed',
              code: rule.code || 'CUSTOM_VALIDATION_ERROR',
              value
            })
          }
        }
      } catch (error) {
        this.logger?.error('Custom validation error', {
          field: field.name,
          rule: rule.code,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        errors.push({
          field: field.name,
          message: 'Custom validation failed',
          code: 'CUSTOM_VALIDATION_ERROR',
          value
        })
      }
    }

    return errors
  }

  /**
   * 验证实体自定义规则
   */
  private async validateCustomRules(
    entity: Entity, 
    data: unknown, 
    operation: 'create' | 'update',
    id?: string
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    const customValidators = entity.options?.validation?.[operation]
    if (!customValidators) {
      return errors
    }

    for (const validator of customValidators) {
      try {
        if (typeof validator.validator === 'function') {
          const result = await validator.validator(data, id)
          if (result !== true) {
            errors.push({
              field: 'root',
              message: typeof result === 'string' ? result : validator.message || 'Entity validation failed',
              code: validator.code || 'ENTITY_VALIDATION_ERROR',
              value: data
            })
          }
        }
      } catch (error) {
        this.logger?.error('Entity custom validation error', {
          entity: entity.name,
          operation,
          validator: validator.code,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        errors.push({
          field: 'root',
          message: 'Entity validation failed',
          code: 'ENTITY_VALIDATION_ERROR',
          value: data
        })
      }
    }

    return errors
  }
}