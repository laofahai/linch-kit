/**
 * @linch-kit/auth 简单审计日志适配器
 * 直接使用LinchKit Core的日志系统，避免重复实现
 */

import { logger } from '@linch-kit/core'

import type {
  AuditLog,
  IAuditLogger
} from '../types'

/**
 * 简单审计日志记录器
 * 
 * 设计原则：
 * - 完全基于@linch-kit/core的logger
 * - 不重复实现日志功能
 * - 专注于审计事件的结构化记录
 */
export class SimpleAuditLogger implements IAuditLogger {
  /**
   * 记录审计事件 - 直接使用core logger
   */
  public async log(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      ...event
    }

    // 使用core包的logger记录
    const logLevel = this.getLogLevel(auditLog.result)
    const message = `Audit: ${auditLog.eventType}`
    
    const logData = {
      auditId: auditLog.id,
      eventType: auditLog.eventType,
      userId: auditLog.userId,
      actorId: auditLog.actorId,
      result: auditLog.result,
      details: auditLog.details,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      tenantId: auditLog.tenantId,
      timestamp: auditLog.timestamp
    }

    if (logLevel === 'error') {
      logger.error(message, undefined, logData)
    } else {
      logger[logLevel](message, logData)
    }
  }

  /**
   * 查询审计日志 - 简化实现，仅返回空数组
   */
  public async query(
    filters: Partial<AuditLog>, 
    options?: { limit?: number; offset?: number }
  ): Promise<AuditLog[]> {
    // 简化实现 - 实际项目中应该查询数据库
    logger.info('Audit log query requested', { filters, options })
    return []
  }

  /**
   * 生成日志ID
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 根据结果确定日志级别
   */
  private getLogLevel(result: string): 'info' | 'warn' | 'error' {
    switch (result) {
      case 'success':
        return 'info'
      case 'warning':
        return 'warn'
      case 'failure':
        return 'error'
      default:
        return 'info'
    }
  }
}

/**
 * 创建简单审计日志记录器
 */
export function createSimpleAuditLogger(): IAuditLogger {
  return new SimpleAuditLogger()
}