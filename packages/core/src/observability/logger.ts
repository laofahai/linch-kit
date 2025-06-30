/**
 * 基于 Pino 的日志系统适配器
 * @module observability/logger
 */

import pino, { Logger as PinoLogger } from 'pino'
import { hostname } from 'os'

import type { Logger, LogLevel } from '../types'

/**
 * LinchKit 日志管理器
 * 基于 Pino 提供高性能日志功能
 */
export class LinchKitLogger implements Logger {
  private pinoLogger: PinoLogger

  constructor(pinoLogger: PinoLogger) {
    this.pinoLogger = pinoLogger
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

  child(bindings: Record<string, unknown>): Logger {
    return new LinchKitLogger(this.pinoLogger.child(bindings))
  }

  setLevel(level: LogLevel): void {
    this.pinoLogger.level = level
  }

  getLevel(): LogLevel {
    return this.pinoLogger.level as LogLevel
  }
}

/**
 * 日志配置选项
 */
export interface LoggerConfig {
  level?: LogLevel
  name?: string
  prettyPrint?: boolean
  destination?: string
  redact?: string[]
  serializers?: Record<string, (value: unknown) => unknown>
  base?: Record<string, unknown>
}

/**
 * 创建日志器
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  const {
    level = 'info',
    name = 'linchkit',
    prettyPrint = process.env.NODE_ENV === 'development',
    destination,
    redact = ['password', 'token', 'secret', 'authorization'],
    serializers,
    base = { pid: process.pid, hostname: hostname() }
  } = config

  // 配置 Pino 选项
  const pinoOptions: pino.LoggerOptions = {
    level,
    name,
    redact,
    serializers,
    base,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      log: (object) => object
    }
  }

  // 开发环境启用美化输出
  const transport = prettyPrint ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined

  // 创建 Pino 实例
  const pinoLogger = destination 
    ? pino(pinoOptions, pino.destination(destination))
    : transport 
      ? pino(pinoOptions, pino.transport(transport))
      : pino(pinoOptions)

  return new LinchKitLogger(pinoLogger)
}

/**
 * 默认日志器实例
 */
export const logger = createLogger({
  name: 'linchkit-core'
})