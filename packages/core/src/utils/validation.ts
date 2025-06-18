/**
 * @ai-context 验证工具
 * @ai-purpose 提供通用的验证函数和工具
 * @ai-integration 与 Zod 深度集成，提供类型安全的验证
 */

import { z, ZodSchema, ZodError } from 'zod'
import { logger } from './logger'

/**
 * @ai-interface 验证结果
 * @ai-purpose 描述验证操作的结果
 */
export interface ValidationResult<T = any> {
  /** @ai-field 是否验证成功 */
  success: boolean
  
  /** @ai-field 验证后的数据（成功时） */
  data?: T
  
  /** @ai-field 错误信息（失败时） */
  errors?: ValidationError[]
  
  /** @ai-field 原始错误对象 */
  rawError?: ZodError
}

/**
 * @ai-interface 验证错误
 * @ai-purpose 描述单个验证错误
 */
export interface ValidationError {
  /** @ai-field 错误路径 */
  path: string
  
  /** @ai-field 错误消息 */
  message: string
  
  /** @ai-field 错误代码 */
  code: string
  
  /** @ai-field 接收到的值 */
  received?: any
  
  /** @ai-field 期望的值 */
  expected?: any
}

/**
 * @ai-function 验证数据
 * @ai-purpose 使用 Zod Schema 验证数据
 * @ai-parameter data: unknown - 要验证的数据
 * @ai-parameter schema: ZodSchema<T> - Zod Schema
 * @ai-return ValidationResult<T> - 验证结果
 * @ai-type-safety 提供完整的类型安全
 */
export function validateData<T>(data: unknown, schema: ZodSchema<T>): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    
    logger.debug('Data validation successful', {
      dataType: typeof data,
      schemaType: (schema as any)._def?.typeName || 'unknown'
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
        received: 'received' in err ? err.received : undefined,
        expected: 'expected' in err ? err.expected : undefined
      }))
      
      logger.warn('Data validation failed', { 
        errorCount: errors.length,
        errors: errors.map(e => ({ path: e.path, message: e.message }))
      })
      
      return {
        success: false,
        errors,
        rawError: error
      }
    }
    
    // AI: 处理非 Zod 错误
    logger.error('Unexpected validation error', {}, error as Error)
    
    return {
      success: false,
      errors: [{
        path: '',
        message: 'Unexpected validation error',
        code: 'unknown'
      }]
    }
  }
}

/**
 * @ai-function 安全验证数据
 * @ai-purpose 验证数据，失败时返回默认值
 * @ai-parameter data: unknown - 要验证的数据
 * @ai-parameter schema: ZodSchema<T> - Zod Schema
 * @ai-parameter defaultValue: T - 默认值
 * @ai-return T - 验证后的数据或默认值
 */
export function validateWithDefault<T>(
  data: unknown, 
  schema: ZodSchema<T>, 
  defaultValue: T
): T {
  const result = validateData(data, schema)
  return result.success ? result.data! : defaultValue
}

/**
 * @ai-function 验证并抛出错误
 * @ai-purpose 验证数据，失败时抛出错误
 * @ai-parameter data: unknown - 要验证的数据
 * @ai-parameter schema: ZodSchema<T> - Zod Schema
 * @ai-parameter errorMessage?: string - 自定义错误消息
 * @ai-return T - 验证后的数据
 * @ai-throws ValidationError - 验证失败时抛出
 */
export function validateOrThrow<T>(
  data: unknown, 
  schema: ZodSchema<T>, 
  errorMessage?: string
): T {
  const result = validateData(data, schema)
  
  if (!result.success) {
    const message = errorMessage || 'Validation failed'
    const error = new Error(message)
    ;(error as any).validationErrors = result.errors
    ;(error as any).rawError = result.rawError
    throw error
  }
  
  return result.data!
}

/**
 * @ai-function 验证对象的部分字段
 * @ai-purpose 验证对象的特定字段
 * @ai-parameter data: Record<string, unknown> - 要验证的对象
 * @ai-parameter fieldSchemas: Record<string, ZodSchema> - 字段 Schema 映射
 * @ai-return ValidationResult<Record<string, any>> - 验证结果
 */
export function validateFields(
  data: Record<string, unknown>,
  fieldSchemas: Record<string, ZodSchema>
): ValidationResult<Record<string, any>> {
  const errors: ValidationError[] = []
  const validatedData: Record<string, any> = {}
  
  for (const [fieldName, schema] of Object.entries(fieldSchemas)) {
    const fieldValue = data[fieldName]
    const result = validateData(fieldValue, schema)
    
    if (result.success) {
      validatedData[fieldName] = result.data
    } else {
      // AI: 添加字段前缀到错误路径
      const fieldErrors = result.errors!.map(error => ({
        ...error,
        path: error.path ? `${fieldName}.${error.path}` : fieldName
      }))
      errors.push(...fieldErrors)
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    }
  }
  
  return {
    success: true,
    data: validatedData
  }
}

/**
 * @ai-function 创建验证器函数
 * @ai-purpose 创建可重用的验证器函数
 * @ai-parameter schema: ZodSchema<T> - Zod Schema
 * @ai-return (data: unknown) => ValidationResult<T> - 验证器函数
 */
export function createValidator<T>(schema: ZodSchema<T>) {
  return (data: unknown): ValidationResult<T> => {
    return validateData(data, schema)
  }
}

/**
 * @ai-function 验证环境变量
 * @ai-purpose 验证和解析环境变量
 * @ai-parameter envSchema: ZodSchema<T> - 环境变量 Schema
 * @ai-parameter env?: Record<string, string | undefined> - 环境变量对象，默认 process.env
 * @ai-return T - 验证后的环境变量
 * @ai-throws Error - 验证失败时抛出
 */
export function validateEnv<T>(
  envSchema: ZodSchema<T>,
  env: Record<string, string | undefined> = process.env
): T {
  const result = validateData(env, envSchema)
  
  if (!result.success) {
    const errorMessages = result.errors!.map(
      error => `${error.path}: ${error.message}`
    ).join('\n')
    
    throw new Error(`Environment validation failed:\n${errorMessages}`)
  }
  
  return result.data!
}

/**
 * @ai-constant 常用验证 Schema
 * @ai-purpose 提供常用的验证 Schema
 */
export const CommonSchemas = {
  /** @ai-schema 非空字符串 */
  nonEmptyString: z.string().min(1, 'String cannot be empty'),
  
  /** @ai-schema 邮箱地址 */
  email: z.string().email('Invalid email address'),
  
  /** @ai-schema URL */
  url: z.string().url('Invalid URL'),
  
  /** @ai-schema 正整数 */
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  
  /** @ai-schema 端口号 */
  port: z.number().int().min(1).max(65535, 'Invalid port number'),
  
  /** @ai-schema 版本号 (semver) */
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'Invalid version format'),
  
  /** @ai-schema 包名 */
  packageName: z.string().regex(/^[@a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-._~]*$|^[a-z0-9-~][a-z0-9-._~]*$/, 'Invalid package name'),
  
  /** @ai-schema 文件路径 */
  filePath: z.string().min(1, 'File path cannot be empty'),
  
  /** @ai-schema 日志级别 */
  logLevel: z.enum(['debug', 'info', 'warn', 'error'])
} as const

/**
 * @ai-function 格式化验证错误
 * @ai-purpose 将验证错误格式化为用户友好的消息
 * @ai-parameter errors: ValidationError[] - 验证错误列表
 * @ai-return string - 格式化后的错误消息
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No validation errors'
  }
  
  if (errors.length === 1) {
    const error = errors[0]
    return error.path ? `${error.path}: ${error.message}` : error.message
  }
  
  return errors
    .map(error => error.path ? `  - ${error.path}: ${error.message}` : `  - ${error.message}`)
    .join('\n')
}
