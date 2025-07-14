/**
 * 统一错误处理 - 基于LinchKit Core
 * 标准化错误处理和日志记录
 */

import { Logger } from '@linch-kit/core/client'

/**
 * 应用错误类型
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 应用错误基类
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.type = type
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // 确保堆栈跟踪正确
    Error.captureStackTrace?.(this, this.constructor)
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, ErrorType.VALIDATION, 400)
    this.name = 'ValidationError'
    
    if (field) {
      Logger.warn('Validation Error', { field, message })
    }
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '需要登录') {
    super(message, ErrorType.AUTHENTICATION, 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, ErrorType.AUTHORIZATION, 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ErrorType.NOT_FOUND, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message: string = '网络连接失败') {
    super(message, ErrorType.NETWORK, 0)
    this.name = 'NetworkError'
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 处理异步操作错误
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<[T | null, AppError | null]> {
    try {
      const result = await operation()
      return [result, null]
    } catch (error) {
      const appError = this.normalizeError(error, context)
      Logger.error('Async operation failed', appError)
      return [null, appError]
    }
  }

  /**
   * 将任意错误转换为AppError
   */
  static normalizeError(error: unknown, context?: string): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      return new AppError(
        context ? `${context}: ${error.message}` : error.message,
        ErrorType.UNKNOWN,
        500
      )
    }

    return new AppError(
      context ? `${context}: ${String(error)}` : String(error),
      ErrorType.UNKNOWN,
      500
    )
  }

  /**
   * 记录错误日志
   */
  static logError(error: AppError | Error, context?: Record<string, unknown>) {
    if (error instanceof AppError) {
      Logger.error(`[${error.type}] ${error.message}`, {
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        isOperational: error.isOperational,
        stack: error.stack,
        ...context,
      })
    } else {
      Logger.error('Unexpected Error', {
        message: error.message,
        stack: error.stack,
        ...context,
      })
    }
  }

  /**
   * 获取错误的用户友好消息
   */
  static getUserMessage(error: AppError | Error): string {
    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorType.VALIDATION:
          return error.message
        case ErrorType.AUTHENTICATION:
          return '请先登录'
        case ErrorType.AUTHORIZATION:
          return '您没有执行此操作的权限'
        case ErrorType.NOT_FOUND:
          return '请求的资源不存在'
        case ErrorType.NETWORK:
          return '网络连接失败，请检查网络设置'
        case ErrorType.SERVER:
          return '服务器暂时无法处理请求，请稍后重试'
        default:
          return '操作失败，请稍后重试'
      }
    }

    return '操作失败，请稍后重试'
  }

  /**
   * 检查错误是否可重试
   */
  static isRetryable(error: AppError | Error): boolean {
    if (error instanceof AppError) {
      return error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER
    }
    return false
  }
}

/**
 * React Hook: 错误处理
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const appError = ErrorHandler.normalizeError(error, context)
    ErrorHandler.logError(appError)
    
    // 这里可以集成全局错误通知系统
    // toast.error(ErrorHandler.getUserMessage(appError))
    
    return appError
  }

  const handleAsyncError = async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<[T | null, AppError | null]> => {
    return ErrorHandler.handleAsync(operation, context)
  }

  return {
    handleError,
    handleAsyncError,
    getUserMessage: ErrorHandler.getUserMessage,
    isRetryable: ErrorHandler.isRetryable,
  }
}