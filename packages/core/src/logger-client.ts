/**
 * 客户端安全的日志器
 * 在浏览器环境中使用 console，避免加载服务器端依赖
 */

import type { Logger as ILogger, LogLevel } from './types'

class ClientLogger implements ILogger {
  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(message, meta)
  }

  error(message: string, error?: Error | undefined, data?: Record<string, unknown>): void {
    if (error instanceof Error) {
      console.error(message, error, data)
    } else {
      console.error(message, data)
    }
  }

  fatal(message: string, error?: Error | undefined, data?: Record<string, unknown>): void {
    this.error(message, error, data)
  }

  setLevel(_level: string): void {
    // No-op in browser
  }

  getLevel(): LogLevel {
    return 'info'
  }

  child(_meta: Record<string, unknown>): ILogger {
    return this
  }
}

/**
 * 客户端安全的 createLogger 函数
 */
export function createLogger(_config: { name?: string } = {}): ILogger {
  return new ClientLogger()
}

export const logger = new ClientLogger()
export const Logger = logger
