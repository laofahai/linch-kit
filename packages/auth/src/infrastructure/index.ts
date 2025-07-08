/**
 * @linch-kit/auth 基础设施集成
 * 集成 @linch-kit/core 的日志、国际化、配置管理功能
 */

import { createLogger } from '@linch-kit/core'

import { authI18n, useAuthTranslation } from '../i18n'

/**
 * Auth包专用日志器
 */
export const logger = createLogger({
  name: 'auth',
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
})

/**
 * 重新导出国际化功能（保持向后兼容）
 */
export { authI18n, useAuthTranslation }

/**
 * Auth包配置管理
 * 使用Core包的配置管理功能
 */
export interface AuthInfrastructureConfig {
  /** 是否启用审计日志 */
  enableAudit?: boolean
  /** 是否启用MFA */
  enableMFA?: boolean
  /** 是否启用OAuth提供商 */
  enableOAuth?: boolean
  /** 会话超时时间（分钟） */
  sessionTimeout?: number
  /** 密码策略 */
  passwordPolicy?: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSymbols?: boolean
  }
  /** 账户锁定策略 */
  lockoutPolicy?: {
    maxAttempts?: number
    lockoutDuration?: number
  }
}

/**
 * 默认Auth配置
 */
export const defaultAuthInfrastructureConfig: AuthInfrastructureConfig = {
  enableAudit: true,
  enableMFA: false,
  enableOAuth: true,
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
  },
  lockoutPolicy: {
    maxAttempts: 5,
    lockoutDuration: 15,
  },
}

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

/**
 * 审计日志记录辅助函数
 */
export const logAuditEvent = (
  eventType: string,
  userId?: string,
  details?: Record<string, unknown>
): void => {
  logInfo(`Audit: ${eventType}`, {
    eventType,
    userId,
    details,
    timestamp: new Date().toISOString(),
  })
}

/**
 * 安全事件日志记录
 */
export const logSecurityEvent = (
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: Record<string, unknown>
): void => {
  const message = `Security Event: ${eventType}`
  const logData = {
    eventType,
    severity,
    details,
    timestamp: new Date().toISOString(),
  }

  switch (severity) {
    case 'critical':
    case 'high':
      logError(message, undefined, logData)
      break
    case 'medium':
      logWarn(message, logData)
      break
    case 'low':
    default:
      logInfo(message, logData)
      break
  }
}
