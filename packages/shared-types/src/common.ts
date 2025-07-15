/**
 * 共享基础类型
 * @module shared-types/common
 */

/**
 * 基础配置接口
 */
export interface BaseConfig {
  [key: string]: unknown
}

/**
 * 操作结果接口
 */
export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    stack?: string
  }
}

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * 日志器接口
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, error?: Error, data?: Record<string, unknown>): void
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
  child(meta: Record<string, unknown>): Logger
}

/**
 * 事件类型
 */
export interface BaseEvent {
  type: string
  timestamp: number
  [key: string]: unknown
}

/**
 * 事件发射器接口
 */
export interface EventEmitter {
  on(event: string, listener: (...args: unknown[]) => void): void
  off(event: string, listener: (...args: unknown[]) => void): void
  emit(event: string, ...args: unknown[]): void
}