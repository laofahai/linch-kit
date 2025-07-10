/**
 * Validator utilities for platform schema module
 * @module platform/schema/validator
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

import type { Entity } from './entity'

/**
 * 验证错误详情
 */
export interface ValidationError {
  field: string
  message: string
  value?: unknown
  code: string
}

/**
 * 验证结果
 */
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors: ValidationError[]
  metadata?: {
    validatedAt: Date
    validatorVersion: string
    executionTime: number
  }
}

/**
 * 验证器选项
 */
export interface ValidatorOptions {
  strict?: boolean
  abortEarly?: boolean
  stripUnknown?: boolean
  transform?: boolean
  allowUnknown?: boolean
}

/**
 * 自定义验证函数
 */
export type CustomValidator<T = unknown> = (
  value: T,
  context: {
    field: string
    entity: string
    data: Record<string, unknown>
    extensionContext?: ExtensionContext
  }
) => boolean | string | Promise<boolean | string>

/**
 * 验证规则
 */
export interface ValidationRule {
  field: string
  validator: z.ZodSchema | CustomValidator
  message?: string
  priority?: number
  when?: (data: Record<string, unknown>) => boolean
}

/**
 * 验证器类
 */
export class Validator {
  private rules: Map<string, ValidationRule[]> = new Map()
  private customValidators: Map<string, CustomValidator> = new Map()
  private extensionContext?: ExtensionContext

  constructor(extensionContext?: ExtensionContext) {
    this.extensionContext = extensionContext
    this.initializeBuiltInValidators()
  }

  /**
   * 初始化内置验证器
   */
  private initializeBuiltInValidators(): void {
    // 邮箱唯一性验证器
    this.customValidators.set('uniqueEmail', async value => {
      // 模拟数据库查询
      if (typeof value === 'string' && value.includes('admin@')) {
        return 'Email already exists'
      }
      return true
    })

    // 密码强度验证器
    this.customValidators.set('strongPassword', value => {
      if (typeof value !== 'string') return 'Password must be a string'
      if (value.length < 8) return 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter'
      if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter'
      if (!/\d/.test(value)) return 'Password must contain a number'
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain special character'
      return true
    })

    // 用户名可用性验证器
    this.customValidators.set('availableUsername', async value => {
      // 模拟数据库查询
      const reservedNames = ['admin', 'root', 'system', 'api']
      if (reservedNames.includes(String(value).toLowerCase())) {
        return 'Username is reserved'
      }
      return true
    })
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

    // 按优先级排序
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    this.extensionContext?.logger.info(`Added validation rule for ${entityName}.${rule.field}`)
  }

  /**
   * 批量添加验证规则
   */
  addRules(entityName: string, rules: ValidationRule[]): void {
    rules.forEach(rule => this.addRule(entityName, rule))
  }

  /**
   * 添加自定义验证器
   */
  addCustomValidator(name: string, validator: CustomValidator): void {
    this.customValidators.set(name, validator)
    this.extensionContext?.logger.info(`Added custom validator: ${name}`)
  }

  /**
   * 验证实体数据
   */
  async validateEntity<T>(
    entity: Entity<T>,
    data: unknown,
    _options: ValidatorOptions = {}
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now()

    this.extensionContext?.logger.info(`Validating entity: ${entity.name}`)

    try {
      // 首先使用实体的Zod schema验证
      const zodResult = entity.validate(data)

      if (!zodResult.success) {
        const errors: ValidationError[] = zodResult.error!.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: data,
          code: err.code,
        }))

        return {
          success: false,
          errors,
          metadata: {
            validatedAt: new Date(),
            validatorVersion: '1.0.0',
            executionTime: Date.now() - startTime,
          },
        }
      }

      // 然后应用自定义验证规则
      const customErrors = await this.applyCustomRules(
        entity.name,
        zodResult.data as Record<string, unknown>
      )

      if (customErrors.length > 0) {
        return {
          success: false,
          errors: customErrors,
          metadata: {
            validatedAt: new Date(),
            validatorVersion: '1.0.0',
            executionTime: Date.now() - startTime,
          },
        }
      }

      return {
        success: true,
        data: zodResult.data as T,
        errors: [],
        metadata: {
          validatedAt: new Date(),
          validatorVersion: '1.0.0',
          executionTime: Date.now() - startTime,
        },
      }
    } catch (error) {
      this.extensionContext?.logger.error('Validation error', error)

      return {
        success: false,
        errors: [
          {
            field: 'unknown',
            message: error instanceof Error ? error.message : 'Unknown validation error',
            code: 'VALIDATION_ERROR',
          },
        ],
        metadata: {
          validatedAt: new Date(),
          validatorVersion: '1.0.0',
          executionTime: Date.now() - startTime,
        },
      }
    }
  }

  /**
   * 验证数据（通过实体名）
   */
  async validate<T = unknown>(
    entityName: string,
    data: unknown,
    _options: ValidatorOptions = {}
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now()

    this.extensionContext?.logger.info(`Validating data for entity: ${entityName}`)

    const errors = await this.applyCustomRules(entityName, data as Record<string, unknown>)

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? (data as T) : undefined,
      errors,
      metadata: {
        validatedAt: new Date(),
        validatorVersion: '1.0.0',
        executionTime: Date.now() - startTime,
      },
    }
  }

  /**
   * 批量验证
   */
  async validateBatch<T = unknown>(
    entityName: string,
    dataArray: unknown[],
    options: ValidatorOptions = {}
  ): Promise<ValidationResult<T>[]> {
    const results = await Promise.all(
      dataArray.map(data => this.validate<T>(entityName, data, options))
    )

    return results
  }

  /**
   * 验证字段
   */
  async validateField(
    entityName: string,
    field: string,
    value: unknown,
    context: Record<string, unknown> = {}
  ): Promise<ValidationResult> {
    const rules = this.rules.get(entityName) || []
    const fieldRules = rules.filter(rule => rule.field === field)

    const errors: ValidationError[] = []

    for (const rule of fieldRules) {
      // 检查条件
      if (rule.when && !rule.when(context)) {
        continue
      }

      if (typeof rule.validator === 'function') {
        // 自定义验证器
        const result = await rule.validator(value, {
          field,
          entity: entityName,
          data: context,
          extensionContext: this.extensionContext,
        })

        if (result !== true) {
          errors.push({
            field,
            message: typeof result === 'string' ? result : rule.message || 'Validation failed',
            value,
            code: 'CUSTOM_VALIDATION_ERROR',
          })
        }
      } else {
        // Zod schema验证
        const result = rule.validator.safeParse(value)
        if (!result.success) {
          errors.push(
            ...result.error.errors.map(err => ({
              field,
              message: rule.message || err.message,
              value,
              code: err.code,
            }))
          )
        }
      }
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? value : undefined,
      errors,
    }
  }

  /**
   * 应用自定义验证规则
   */
  private async applyCustomRules(
    entityName: string,
    data: Record<string, unknown>
  ): Promise<ValidationError[]> {
    const rules = this.rules.get(entityName) || []
    const errors: ValidationError[] = []

    for (const rule of rules) {
      // 检查条件
      if (rule.when && !rule.when(data)) {
        continue
      }

      const fieldValue = data[rule.field]

      if (typeof rule.validator === 'function') {
        const result = await rule.validator(fieldValue, {
          field: rule.field,
          entity: entityName,
          data,
          extensionContext: this.extensionContext,
        })

        if (result !== true) {
          errors.push({
            field: rule.field,
            message: typeof result === 'string' ? result : rule.message || 'Validation failed',
            value: fieldValue,
            code: 'CUSTOM_VALIDATION_ERROR',
          })
        }
      }
    }

    return errors
  }

  /**
   * 获取实体的验证规则
   */
  getRules(entityName: string): ValidationRule[] {
    return this.rules.get(entityName) || []
  }

  /**
   * 移除验证规则
   */
  removeRules(entityName: string): boolean {
    return this.rules.delete(entityName)
  }

  /**
   * 移除特定字段的验证规则
   */
  removeFieldRules(entityName: string, field: string): boolean {
    const rules = this.rules.get(entityName)
    if (!rules) return false

    const filtered = rules.filter(rule => rule.field !== field)
    if (filtered.length < rules.length) {
      this.rules.set(entityName, filtered)
      return true
    }

    return false
  }

  /**
   * 获取自定义验证器
   */
  getCustomValidator(name: string): CustomValidator | undefined {
    return this.customValidators.get(name)
  }

  /**
   * 移除自定义验证器
   */
  removeCustomValidator(name: string): boolean {
    return this.customValidators.delete(name)
  }

  /**
   * 创建Schema验证器
   */
  createSchemaValidator<T>(schema: z.ZodSchema<T>): (data: unknown) => ValidationResult<T> {
    return (data: unknown) => {
      const result = schema.safeParse(data)

      if (result.success) {
        return {
          success: true,
          data: result.data,
          errors: [],
        }
      } else {
        const errors: ValidationError[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: data,
          code: err.code,
        }))

        return {
          success: false,
          errors,
        }
      }
    }
  }
}

/**
 * 创建验证器的便捷函数
 */
export function createValidator(extensionContext?: ExtensionContext): Validator {
  return new Validator(extensionContext)
}

/**
 * 常用验证规则预设
 */
export const CommonValidationRules = {
  /**
   * 用户验证规则
   */
  user: [
    {
      field: 'email',
      validator: z.string().email(),
      message: 'Invalid email format',
    },
    {
      field: 'password',
      validator: 'strongPassword' as unknown as CustomValidator,
      message: 'Password does not meet requirements',
    },
    {
      field: 'username',
      validator: 'availableUsername' as unknown as CustomValidator,
      message: 'Username is not available',
    },
  ] as ValidationRule[],

  /**
   * 文章验证规则
   */
  post: [
    {
      field: 'title',
      validator: z.string().min(1).max(200),
      message: 'Title must be between 1-200 characters',
    },
    {
      field: 'content',
      validator: z.string().min(10),
      message: 'Content must be at least 10 characters',
    },
    {
      field: 'slug',
      validator: z.string().regex(/^[a-z0-9-]+$/),
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    },
  ] as ValidationRule[],
}
