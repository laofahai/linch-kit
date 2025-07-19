/**
 * 认证监控服务
 * 
 * 集成JWT认证系统监控和OpenTelemetry追踪
 */

import { logger } from '@linch-kit/core/server'
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api'

// Auth entities are available but not used directly in this service

/**
 * 认证事件类型
 */
export enum AuthEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REVOKE = 'token_revoke',
  SESSION_EXPIRE = 'session_expire',
  MFA_CHALLENGE = 'mfa_challenge',
  PASSWORD_RESET = 'password_reset',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

/**
 * 认证监控指标
 */
export interface AuthMetrics {
  eventType: AuthEventType
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  location?: string
  success: boolean
  duration?: number
  errorCode?: string
  errorMessage?: string
  riskScore?: number
  metadata?: Record<string, unknown>
}

/**
 * 认证性能监控服务
 */
export class AuthMonitoringService {
  private tracer = trace.getTracer('auth-monitoring-service')

  /**
   * 记录认证事件
   */
  async recordAuthEvent(metrics: AuthMetrics): Promise<void> {
    const span = this.tracer.startSpan('record_auth_event', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'auth.event_type': metrics.eventType,
        'auth.success': metrics.success,
        'auth.user_id': metrics.userId || 'unknown',
        'auth.session_id': metrics.sessionId || 'unknown',
        'auth.ip_address': metrics.ipAddress || 'unknown',
        'auth.risk_score': metrics.riskScore || 0
      }
    })

    try {
      // 记录到日志
      logger.info('认证事件记录', {
        eventType: metrics.eventType,
        userId: metrics.userId,
        sessionId: metrics.sessionId,
        ipAddress: metrics.ipAddress,
        success: metrics.success,
        duration: metrics.duration,
        riskScore: metrics.riskScore,
        metadata: metrics.metadata
      })

      // 创建指标实体
      const metricEntity = {
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metricType: metrics.eventType,
        value: metrics.success ? 1 : 0,
        userId: metrics.userId,
        sessionId: metrics.sessionId,
        metadata: {
          ipAddress: metrics.ipAddress,
          userAgent: metrics.userAgent,
          location: metrics.location,
          duration: metrics.duration,
          errorCode: metrics.errorCode,
          errorMessage: metrics.errorMessage,
          riskScore: metrics.riskScore,
          ...metrics.metadata
        },
        timestamp: new Date(),
        hourlyBucket: this.getHourlyBucket(new Date()),
        dailyBucket: this.getDailyBucket(new Date())
      }

      // 保存到数据库（模拟）
      await this.saveMetric(metricEntity)

      // 检查是否需要触发安全警报
      if (metrics.riskScore && metrics.riskScore > 7) {
        await this.triggerSecurityAlert(metrics)
      }

      span.setStatus({ code: SpanStatusCode.OK })
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      
      logger.error('认证事件记录失败', {
        error: error instanceof Error ? error.message : String(error),
        eventType: metrics.eventType,
        userId: metrics.userId
      })
      
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 监控登录尝试
   */
  async monitorLoginAttempt(
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    location?: string
  ): Promise<{ allowed: boolean; riskScore: number }> {
    const span = this.tracer.startSpan('monitor_login_attempt', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'auth.user_email': userEmail,
        'auth.ip_address': ipAddress,
        'auth.user_agent': userAgent || 'unknown'
      }
    })

    try {
      // 计算风险评分
      const riskScore = await this.calculateRiskScore(userEmail, ipAddress, userAgent, location)
      
      // 检查是否允许登录
      const allowed = riskScore < 8 // 风险评分阈值

      // 记录登录尝试
      await this.recordAuthEvent({
        eventType: AuthEventType.LOGIN_ATTEMPT,
        userId: userEmail,
        ipAddress,
        userAgent,
        location,
        success: allowed,
        riskScore,
        metadata: {
          blocked: !allowed,
          reason: allowed ? null : 'high_risk_score'
        }
      })

      span.setAttributes({
        'auth.risk_score': riskScore,
        'auth.allowed': allowed
      })

      return { allowed, riskScore }
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 监控JWT令牌操作
   */
  async monitorTokenOperation(
    operation: 'issue' | 'refresh' | 'revoke' | 'validate',
    tokenId: string,
    userId?: string,
    sessionId?: string,
    success: boolean = true,
    duration?: number,
    errorCode?: string
  ): Promise<void> {
    const eventTypeMap = {
      issue: AuthEventType.LOGIN_SUCCESS,
      refresh: AuthEventType.TOKEN_REFRESH,
      revoke: AuthEventType.TOKEN_REVOKE,
      validate: AuthEventType.LOGIN_ATTEMPT
    }

    const span = this.tracer.startSpan(`token_${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'auth.token_id': tokenId,
        'auth.user_id': userId || 'unknown',
        'auth.session_id': sessionId || 'unknown',
        'auth.operation': operation,
        'auth.success': success,
        'auth.duration_ms': duration || 0
      }
    })

    try {
      await this.recordAuthEvent({
        eventType: eventTypeMap[operation],
        userId,
        sessionId,
        success,
        duration,
        errorCode,
        metadata: {
          tokenId,
          operation
        }
      })

      // 记录性能指标
      if (duration) {
        span.setAttributes({
          'auth.performance.duration_ms': duration
        })
      }

      span.setStatus({ code: SpanStatusCode.OK })
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 监控会话生命周期
   */
  async monitorSessionLifecycle(
    sessionId: string,
    userId: string,
    event: 'created' | 'accessed' | 'expired' | 'revoked',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const span = this.tracer.startSpan(`session_${event}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'auth.session_id': sessionId,
        'auth.user_id': userId,
        'auth.event': event,
        'auth.ip_address': ipAddress || 'unknown'
      }
    })

    try {
      const eventType = event === 'expired' ? AuthEventType.SESSION_EXPIRE : AuthEventType.LOGIN_SUCCESS

      await this.recordAuthEvent({
        eventType,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        success: event !== 'expired',
        metadata: {
          sessionEvent: event
        }
      })

      span.setStatus({ code: SpanStatusCode.OK })
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 获取认证统计数据
   */
  async getAuthStatistics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalAttempts: number
    successfulLogins: number
    failedLogins: number
    uniqueUsers: number
    suspiciousActivities: number
    averageResponseTime: number
    errorRate: number
  }> {
    const span = this.tracer.startSpan('get_auth_statistics', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'auth.time_range': timeRange
      }
    })

    try {
      // 模拟统计数据查询
      const mockStats = {
        totalAttempts: 1234,
        successfulLogins: 1156,
        failedLogins: 78,
        uniqueUsers: 456,
        suspiciousActivities: 23,
        averageResponseTime: 120,
        errorRate: 0.063
      }

      span.setAttributes({
        'auth.stats.total_attempts': mockStats.totalAttempts,
        'auth.stats.success_rate': mockStats.successfulLogins / mockStats.totalAttempts,
        'auth.stats.error_rate': mockStats.errorRate
      })

      return mockStats
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 计算风险评分
   */
  private async calculateRiskScore(
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    location?: string
  ): Promise<number> {
    let riskScore = 0

    // 基础风险评分
    riskScore += 1

    // IP地址风险评估
    if (this.isPrivateIP(ipAddress)) {
      riskScore += 1 // 内网IP风险较低
    } else {
      riskScore += 3 // 公网IP风险较高
    }

    // 地理位置风险评估
    if (location && location.includes('Unknown')) {
      riskScore += 4 // 未知位置风险高
    }

    // 用户代理风险评估
    if (userAgent) {
      if (userAgent.includes('curl') || userAgent.includes('wget')) {
        riskScore += 5 // 脚本工具风险高
      } else if (userAgent.includes('Mozilla')) {
        riskScore += 1 // 正常浏览器风险低
      }
    }

    // 历史行为风险评估（模拟）
    const recentFailures = await this.getRecentFailures(userEmail, ipAddress)
    if (recentFailures > 3) {
      riskScore += 3
    }

    return Math.min(riskScore, 10) // 最高风险评分为10
  }

  /**
   * 检查是否为私有IP
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^169\.254\./
    ]

    return privateRanges.some(range => range.test(ip))
  }

  /**
   * 获取最近失败次数
   */
  private async getRecentFailures(_userEmail: string, _ipAddress: string): Promise<number> {
    // 模拟查询最近失败次数
    return Math.floor(Math.random() * 5)
  }

  /**
   * 触发安全警报
   */
  private async triggerSecurityAlert(metrics: AuthMetrics): Promise<void> {
    const span = this.tracer.startSpan('trigger_security_alert', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'auth.alert.risk_score': metrics.riskScore || 0,
        'auth.alert.event_type': metrics.eventType,
        'auth.alert.user_id': metrics.userId || 'unknown'
      }
    })

    try {
      logger.warn('安全警报触发', {
        eventType: metrics.eventType,
        userId: metrics.userId,
        ipAddress: metrics.ipAddress,
        riskScore: metrics.riskScore,
        metadata: metrics.metadata
      })

      // 这里可以集成外部告警系统
      // 如：钉钉、Slack、邮件等

      span.setStatus({ code: SpanStatusCode.OK })
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 保存指标到数据库
   */
  private async saveMetric(metric: unknown): Promise<void> {
    // 模拟保存到数据库
    logger.debug('保存认证指标', { metric })
  }

  /**
   * 获取小时桶
   */
  private getHourlyBucket(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    
    return `${year}-${month}-${day}-${hour}`
  }

  /**
   * 获取日期桶
   */
  private getDailyBucket(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }
}

/**
 * 导出认证监控服务单例
 */
export const authMonitoringService = new AuthMonitoringService()

/**
 * 认证监控装饰器
 */
export function MonitorAuth(eventType: AuthEventType) {
  return function (_target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now()
      
      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime
        
        // 记录成功的操作
        await authMonitoringService.recordAuthEvent({
          eventType,
          success: true,
          duration,
          metadata: {
            method: propertyName,
            args: args.length
          }
        })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        
        // 记录失败的操作
        await authMonitoringService.recordAuthEvent({
          eventType,
          success: false,
          duration,
          errorCode: 'OPERATION_FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          metadata: {
            method: propertyName,
            args: args.length
          }
        })
        
        throw error
      }
    }
  }
}