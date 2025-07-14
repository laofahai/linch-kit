/**
 * 统一的Logger系统
 * 根据环境自动选择服务器端或客户端实现
 * @module logger
 */

import type { Logger, LogLevel } from '../types'

/**
 * Logger配置
 */
export interface LoggerConfig {
  name?: string
  level?: LogLevel
  pretty?: boolean
  destination?: string
  bindings?: Record<string, unknown>
}

/**
 * 检查当前环境是否为服务器端
 */
function isServerEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node
}

/**
 * 服务器端Logger实现
 */
class ServerLogger implements Logger {
  private pinoLogger: any

  constructor(config: LoggerConfig = {}) {
    // 动态导入pino以避免客户端打包问题
    const pino = require('pino')
    const { hostname } = require('os')
    
    const pinoConfig = {
      name: config.name || 'linchkit',
      level: config.level || 'info',
      ...(config.pretty && { transport: { target: 'pino-pretty' } }),
      base: {
        hostname: hostname(),
        pid: process.pid,
        ...config.bindings,
      },
    }

    this.pinoLogger = config.destination ? pino(pinoConfig, pino.destination(config.destination)) : pino(pinoConfig)
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.pinoLogger.debug(data, message)
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.pinoLogger.info(data, message)
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.pinoLogger.warn(data, message)
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    const errorData = error
      ? { ...data, error: { message: error.message, stack: error.stack } }
      : data
    this.pinoLogger.error(errorData, message)
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    const errorData = error
      ? { ...data, error: { message: error.message, stack: error.stack } }
      : data
    this.pinoLogger.fatal(errorData, message)
  }

  setLevel(level: LogLevel): void {
    this.pinoLogger.level = level
  }

  getLevel(): LogLevel {
    return this.pinoLogger.level as LogLevel
  }

  child(bindings: Record<string, unknown>): Logger {
    return new ServerLogger({
      name: this.pinoLogger.bindings?.name,
      level: this.pinoLogger.level,
      bindings,
    })
  }
}

/**
 * 客户端Logger实现
 */
class ClientLogger implements Logger {
  private name?: string
  private level: LogLevel = 'info'
  private bindings: Record<string, unknown> = {}

  constructor(config: LoggerConfig = {}) {
    this.name = config.name
    this.level = config.level || 'info'
    this.bindings = config.bindings || {}
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private formatMessage(message: string, data?: Record<string, unknown>): string {
    const prefix = this.name ? `[${this.name}]` : ''
    const bindingsStr = Object.keys(this.bindings).length > 0 ? JSON.stringify(this.bindings) : ''
    const dataStr = data ? JSON.stringify(data) : ''
    
    return [prefix, message, bindingsStr, dataStr].filter(Boolean).join(' ')
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message, data))
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message, data))
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message, data))
    }
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const errorData = error ? { ...data, error: error.message, stack: error.stack } : data
      console.error(this.formatMessage(message, errorData))
    }
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog('fatal')) {
      const errorData = error ? { ...data, error: error.message, stack: error.stack } : data
      console.error(this.formatMessage(message, errorData))
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }

  child(bindings: Record<string, unknown>): Logger {
    return new ClientLogger({
      name: this.name,
      level: this.level,
      bindings: { ...this.bindings, ...bindings },
    })
  }
}

/**
 * 统一的Logger工厂函数
 * 根据环境自动选择合适的实现
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  if (isServerEnvironment()) {
    return new ServerLogger(config)
  } else {
    return new ClientLogger(config)
  }
}

/**
 * 默认Logger实例
 */
export const logger = createLogger({ name: 'linchkit' })

/**
 * 创建带命名空间的Logger
 */
export function createNamespacedLogger(namespace: string): Logger {
  return createLogger({ name: namespace })
}

/**
 * 向后兼容的导出
 */
export { logger as Logger }
export { createLogger as createDefaultLogger }