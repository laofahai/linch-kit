/**
 * @ai-context 企业级日志管理系统
 * @ai-purpose 基于 Pino 的高性能结构化日志系统，支持多种输出格式和日志级别
 * @ai-features 结构化日志、性能优化、多环境支持、安全脱敏、审计日志
 * @ai-integration 与 OpenTelemetry 集成，支持分布式追踪
 */

import pino, { Logger, LoggerOptions } from 'pino'
import { z } from 'zod'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * 日志配置 Schema
 */
export const LoggerConfigSchema = z.object({
  /** 日志级别 */
  level: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  /** 是否启用美化输出（开发环境） */
  prettyPrint: z.boolean().default(false),
  /** 日志文件路径 */
  file: z.string().optional(),
  /** 是否启用安全脱敏 */
  redaction: z.boolean().default(true),
  /** 脱敏字段列表 */
  redactFields: z.array(z.string()).default([
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'credit_card', 'ssn', 'email'
  ]),
  /** 是否启用审计日志 */
  audit: z.boolean().default(false),
  /** 审计日志文件路径 */
  auditFile: z.string().optional(),
  /** 自定义序列化器 */
  serializers: z.record(z.unknown()).optional(),
  /** 环境标识 */
  environment: z.enum(['development', 'staging', 'production']).default('development')
})

export type LoggerConfig = z.infer<typeof LoggerConfigSchema>

/**
 * 审计事件类型
 */
export enum AuditEventType {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  DATA_ACCESS = 'data.access',
  DATA_MODIFY = 'data.modify',
  DATA_DELETE = 'data.delete',
  PERMISSION_GRANT = 'permission.grant',
  PERMISSION_REVOKE = 'permission.revoke',
  SYSTEM_CONFIG = 'system.config',
  SECURITY_VIOLATION = 'security.violation'
}

/**
 * 审计日志接口
 */
export interface AuditLog {
  /** 事件类型 */
  eventType: AuditEventType
  /** 用户ID */
  userId?: string
  /** 用户IP */
  userIp?: string
  /** 资源标识 */
  resource?: string
  /** 操作详情 */
  action: string
  /** 操作结果 */
  result: 'success' | 'failure' | 'partial'
  /** 错误信息 */
  error?: string
  /** 附加数据 */
  metadata?: Record<string, unknown>
  /** 时间戳 */
  timestamp: Date
}

/**
 * 企业级日志管理器
 */
export class EnterpriseLogger {
  private logger: Logger
  private auditLogger?: Logger
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = LoggerConfigSchema.parse(config)
    this.logger = this.createMainLogger()
    
    if (this.config.audit) {
      this.auditLogger = this.createAuditLogger()
    }
  }

  /**
   * 创建主日志器
   */
  private createMainLogger(): Logger {
    const options: LoggerOptions = {
      level: this.config.level,
      redact: this.config.redaction ? {
        paths: this.config.redactFields,
        censor: '[REDACTED]'
      } : undefined,
      serializers: {
        error: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        ...this.config.serializers
      },
      base: {
        environment: this.config.environment,
        service: 'linch-kit',
        version: process.env.npm_package_version || '0.1.0'
      }
    }

    // 开发环境美化输出
    if (this.config.prettyPrint && this.config.environment === 'development') {
      return pino({
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      })
    }

    // 生产环境文件输出
    if (this.config.file) {
      return pino(options, pino.destination(this.config.file))
    }

    return pino(options)
  }

  /**
   * 创建审计日志器
   */
  private createAuditLogger(): Logger {
    const auditOptions: LoggerOptions = {
      level: 'info',
      base: {
        type: 'audit',
        service: 'linch-kit',
        environment: this.config.environment
      }
    }

    if (this.config.auditFile) {
      return pino(auditOptions, pino.destination(this.config.auditFile))
    }

    return pino(auditOptions)
  }

  /**
   * 记录审计日志
   */
  audit(auditLog: Omit<AuditLog, 'timestamp'>): void {
    if (!this.auditLogger) {
      this.logger.warn('Audit logging is disabled')
      return
    }

    const fullAuditLog: AuditLog = {
      ...auditLog,
      timestamp: new Date()
    }

    this.auditLogger.info(fullAuditLog, 'Audit event')
  }

  /**
   * 记录安全违规事件
   */
  securityViolation(details: {
    userId?: string
    userIp?: string
    violation: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    metadata?: Record<string, unknown>
  }): void {
    this.audit({
      eventType: AuditEventType.SECURITY_VIOLATION,
      userId: details.userId,
      userIp: details.userIp,
      action: details.violation,
      result: 'failure',
      metadata: {
        severity: details.severity,
        ...details.metadata
      }
    })

    this.logger.error({
      type: 'security_violation',
      ...details
    }, 'Security violation detected')
  }

  /**
   * 创建子日志器
   */
  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings)
  }

  /**
   * 获取原始 Pino 日志器实例
   */
  getPinoLogger(): Logger {
    return this.logger
  }

  // 标准日志方法
  trace(obj: unknown, msg?: string): void
  trace(msg: string): void
  trace(obj: unknown, msg?: string): void {
    if (typeof obj === 'string') {
      this.logger.trace(obj)
    } else {
      this.logger.trace(obj, msg)
    }
  }

  debug(obj: unknown, msg?: string): void
  debug(msg: string): void
  debug(obj: unknown, msg?: string): void {
    if (typeof obj === 'string') {
      this.logger.debug(obj)
    } else {
      this.logger.debug(obj, msg)
    }
  }

  info(obj: unknown, msg?: string): void
  info(msg: string): void
  info(obj: unknown, msg?: string): void {
    if (typeof obj === 'string') {
      this.logger.info(obj)
    } else {
      this.logger.info(obj, msg)
    }
  }

  warn(obj: unknown, msg?: string): void
  warn(msg: string): void
  warn(obj: unknown, msg?: string): void {
    if (typeof obj === 'string') {
      this.logger.warn(obj)
    } else {
      this.logger.warn(obj, msg)
    }
  }

  error(obj: unknown, msg?: string): void
  error(msg: string): void
  error(obj: unknown, msg?: string): void {
    if (typeof obj === 'string') {
      this.logger.error(obj)
    } else {
      this.logger.error(obj, msg)
    }
  }

  fatal(obj: unknown, msg?: string): void
  fatal(msg: string): void
  fatal(obj: unknown, msg?: string): void {
    if (typeof obj === 'string') {
      this.logger.fatal(obj)
    } else {
      this.logger.fatal(obj, msg)
    }
  }
}

/**
 * 默认日志器实例
 */
export const logger = new EnterpriseLogger({
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  prettyPrint: process.env.NODE_ENV === 'development',
  environment: (process.env.NODE_ENV as any) || 'development',
  audit: process.env.ENABLE_AUDIT_LOG === 'true',
  file: process.env.LOG_FILE,
  auditFile: process.env.AUDIT_LOG_FILE
})

/**
 * 创建日志器实例
 */
export function createLogger(config?: Partial<LoggerConfig>): EnterpriseLogger {
  return new EnterpriseLogger(config)
}

// 导出类型
export type { Logger } from 'pino'
