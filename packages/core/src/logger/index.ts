/**
 * 统一的Logger系统
 * 根据环境自动选择服务器端或客户端实现
 * @module logger
 */

import type { Logger, LogLevel } from '../types'

/**
 * Pino Logger 接口定义
 */
interface PinoLogger {
  debug(data: Record<string, unknown> | undefined, message: string): void
  info(data: Record<string, unknown> | undefined, message: string): void
  warn(data: Record<string, unknown> | undefined, message: string): void
  error(data: Record<string, unknown> | undefined, message: string): void
  fatal(data: Record<string, unknown> | undefined, message: string): void
  level: LogLevel
  bindings?: { name?: string } & Record<string, unknown>
}

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
  return typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.node)
}

/**
 * 服务器端Logger实现
 */
class ServerLogger implements Logger {
  private pinoLogger: PinoLogger
  private initializationPromise: Promise<void>

  constructor(config: LoggerConfig = {}) {
    // 确保仅在服务器环境中使用pino
    if (typeof window !== 'undefined') {
      throw new Error('ServerLogger can only be used in server environment')
    }
    
    // 创建fallback logger作为默认值
    this.pinoLogger = this.createFallbackLogger(config)
    
    // 异步初始化真正的pino logger
    this.initializationPromise = this.initializePinoLogger(config)
  }

  private async initializePinoLogger(config: LoggerConfig): Promise<void> {
    try {
      // 使用标准的动态导入
      const [pinoModule, osModule] = await Promise.all([
        import('pino'),
        import('os')
      ])
      
      const pino = pinoModule.default
      const { hostname } = osModule
      
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

      const logger = config.destination ? pino(pinoConfig, pino.destination(config.destination)) : pino(pinoConfig)
      
      // 类型守卫验证
      if (!this.isPinoLogger(logger)) {
        throw new Error('Failed to create valid pino logger')
      }
      
      this.pinoLogger = logger
    } catch (error) {
      console.error('Failed to initialize pino logger:', error)
      // 保持使用fallback logger
    }
  }

  private createFallbackLogger(config: LoggerConfig): PinoLogger {
    const level = config.level || 'info'
    const name = config.name || 'linchkit'
    
    return {
      debug: (data: Record<string, unknown> | undefined, message: string) => {
        if (this.shouldLog('debug', level)) {
          if (data) console.debug(`[${name}] ${message}`, data)
          else console.debug(`[${name}] ${message}`)
        }
      },
      info: (data: Record<string, unknown> | undefined, message: string) => {
        if (this.shouldLog('info', level)) {
          if (data) console.info(`[${name}] ${message}`, data)
          else console.info(`[${name}] ${message}`)
        }
      },
      warn: (data: Record<string, unknown> | undefined, message: string) => {
        if (this.shouldLog('warn', level)) {
          if (data) console.warn(`[${name}] ${message}`, data)
          else console.warn(`[${name}] ${message}`)
        }
      },
      error: (data: Record<string, unknown> | undefined, message: string) => {
        if (this.shouldLog('error', level)) {
          if (data) console.error(`[${name}] ${message}`, data)
          else console.error(`[${name}] ${message}`)
        }
      },
      fatal: (data: Record<string, unknown> | undefined, message: string) => {
        if (this.shouldLog('fatal', level)) {
          if (data) console.error(`[${name}] FATAL: ${message}`, data)
          else console.error(`[${name}] FATAL: ${message}`)
        }
      },
      level: level as LogLevel,
      bindings: { name }
    }
  }

  private shouldLog(messageLevel: string, currentLevel: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal']
    return levels.indexOf(messageLevel) >= levels.indexOf(currentLevel)
  }

  private isPinoLogger(logger: unknown): logger is PinoLogger {
    return typeof logger === 'object' && 
           logger !== null && 
           'debug' in logger &&
           'info' in logger &&
           'warn' in logger &&
           'error' in logger &&
           'fatal' in logger &&
           'level' in logger
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