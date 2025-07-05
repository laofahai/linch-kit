/**
 * @linch-kit/schema 日志系统集成
 * 
 * 使用@linch-kit/core的日志系统
 * 
 * @module infrastructure/logger
 */

import { createLogger } from '@linch-kit/core'

/**
 * Schema包专用日志器
 * 使用Core包的日志系统
 */
export const logger = createLogger({
  name: 'schema'
}) as any

/**
 * 日志记录辅助函数
 */
export const logInfo = (message: string, data?: Record<string, unknown>): void => {
  logger.info(message, data)
}

export const logError = (message: string, error?: Error, data?: Record<string, unknown>): void => {
  logger.error(message, error, data)
}

export const logWarn = (message: string, data?: Record<string, unknown>): void => {
  logger.warn(message, data)
}

export const logDebug = (message: string, data?: Record<string, unknown>): void => {
  logger.debug(message, data)
}
