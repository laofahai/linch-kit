/**
 * @linch-kit/auth 认证性能监控系统
 * 
 * 集成OpenTelemetry指标收集，监控认证成功率、响应时间、错误率
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import type { ILogger } from '../core/core-jwt-auth.service'

// ==================== 监控指标类型定义 ====================

/**
 * 认证操作类型
 */
export type AuthOperation = 
  | 'login' 
  | 'logout' 
  | 'refresh_token' 
  | 'validate_token' 
  | 'permission_check'

/**
 * 认证结果状态
 */
export type AuthStatus = 'success' | 'failure' | 'error'

/**
 * 认证性能指标
 */
export interface AuthMetrics {
  /** 操作类型 */
  operation: AuthOperation
  /** 执行状态 */
  status: AuthStatus
  /** 响应时间(毫秒) */
  duration: number
  /** 用户ID (匿名化) */
  userId?: string
  /** 错误代码 */
  errorCode?: string
  /** 错误消息 */
  errorMessage?: string
  /** 时间戳 */
  timestamp: Date
  /** 附加元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 性能统计汇总
 */
export interface AuthPerformanceStats {
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successRequests: number
  /** 失败请求数 */
  failureRequests: number
  /** 错误请求数 */
  errorRequests: number
  /** 成功率 (%) */
  successRate: number
  /** 平均响应时间 (ms) */
  averageResponseTime: number
  /** 95分位响应时间 (ms) */
  p95ResponseTime: number
  /** 99分位响应时间 (ms) */
  p99ResponseTime: number
  /** 统计时间窗口开始 */
  windowStart: Date
  /** 统计时间窗口结束 */
  windowEnd: Date
}

// ==================== 监控接口定义 ====================

/**
 * 认证性能监控器接口
 */
export interface IAuthPerformanceMonitor {
  /**
   * 记录认证指标
   */
  recordMetric(metric: AuthMetrics): Promise<void>

  /**
   * 获取性能统计
   */
  getPerformanceStats(windowMinutes?: number): Promise<AuthPerformanceStats>

  /**
   * 开始操作计时
   */
  startTimer(operation: AuthOperation, metadata?: Record<string, unknown>): AuthTimer

  /**
   * 清理过期数据
   */
  cleanup(retentionHours?: number): Promise<void>
}

/**
 * 认证操作计时器
 */
export interface AuthTimer {
  /** 操作类型 */
  operation: AuthOperation
  /** 开始时间 */
  startTime: number
  /** 元数据 */
  metadata?: Record<string, unknown>
  
  /**
   * 结束计时并记录成功指标
   */
  success(userId?: string, metadata?: Record<string, unknown>): Promise<void>
  
  /**
   * 结束计时并记录失败指标
   */
  failure(errorCode?: string, errorMessage?: string, metadata?: Record<string, unknown>): Promise<void>
  
  /**
   * 结束计时并记录错误指标
   */
  error(error: Error, metadata?: Record<string, unknown>): Promise<void>
}

// ==================== 内存实现 ====================

/**
 * 内存版认证性能监控器
 * 生产环境应替换为Redis或时序数据库实现
 */
export class InMemoryAuthPerformanceMonitor implements IAuthPerformanceMonitor {
  private metrics: AuthMetrics[] = []
  private readonly logger?: ILogger

  constructor(logger?: ILogger) {
    this.logger = logger
  }

  async recordMetric(metric: AuthMetrics): Promise<void> {
    this.metrics.push({
      ...metric,
      timestamp: new Date()
    })

    // 记录日志
    this.logger?.info('Auth metric recorded', {
      operation: metric.operation,
      status: metric.status,
      duration: metric.duration,
      userId: metric.userId,
      errorCode: metric.errorCode
    })

    // 异步清理过期数据（避免阻塞）
    setImmediate(() => {
      this.cleanup(24).catch(error => {
        this.logger?.error('Failed to cleanup metrics', error instanceof Error ? error : undefined, { errorMessage: error instanceof Error ? error.message : 'Unknown error' })
      })
    })
  }

  async getPerformanceStats(windowMinutes: number = 60): Promise<AuthPerformanceStats> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
    
    const windowMetrics = this.metrics.filter(
      metric => metric.timestamp >= windowStart && metric.timestamp <= now
    )

    const totalRequests = windowMetrics.length
    const successRequests = windowMetrics.filter(m => m.status === 'success').length
    const failureRequests = windowMetrics.filter(m => m.status === 'failure').length
    const errorRequests = windowMetrics.filter(m => m.status === 'error').length

    const durations = windowMetrics.map(m => m.duration).sort((a, b) => a - b)
    const averageResponseTime = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0

    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    return {
      totalRequests,
      successRequests,
      failureRequests,
      errorRequests,
      successRate: totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      windowStart,
      windowEnd: now
    }
  }

  startTimer(operation: AuthOperation, metadata?: Record<string, unknown>): AuthTimer {
    return new InMemoryAuthTimer(operation, this, metadata)
  }

  async cleanup(retentionHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000)
    const initialCount = this.metrics.length
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime)
    
    const cleanedCount = initialCount - this.metrics.length
    if (cleanedCount > 0) {
      this.logger?.info('Cleaned up old metrics', {
        cleanedCount,
        remainingCount: this.metrics.length,
        cutoffTime: cutoffTime.toISOString()
      })
    }
  }
}

/**
 * 内存版认证操作计时器
 */
class InMemoryAuthTimer implements AuthTimer {
  public readonly operation: AuthOperation
  public readonly startTime: number
  public readonly metadata?: Record<string, unknown>

  constructor(
    operation: AuthOperation,
    private readonly monitor: IAuthPerformanceMonitor,
    metadata?: Record<string, unknown>
  ) {
    this.operation = operation
    this.startTime = Date.now()
    this.metadata = metadata
  }

  async success(userId?: string, metadata?: Record<string, unknown>): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.monitor.recordMetric({
      operation: this.operation,
      status: 'success',
      duration,
      userId,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...metadata }
    })
  }

  async failure(errorCode?: string, errorMessage?: string, metadata?: Record<string, unknown>): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.monitor.recordMetric({
      operation: this.operation,
      status: 'failure',
      duration,
      errorCode,
      errorMessage,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...metadata }
    })
  }

  async error(error: Error, metadata?: Record<string, unknown>): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.monitor.recordMetric({
      operation: this.operation,
      status: 'error',
      duration,
      errorCode: error.name,
      errorMessage: error.message,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...metadata }
    })
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建认证性能监控器
 */
export function createAuthPerformanceMonitor(logger?: ILogger): IAuthPerformanceMonitor {
  return new InMemoryAuthPerformanceMonitor(logger)
}

/**
 * 默认全局监控器实例
 */
export const defaultAuthPerformanceMonitor = createAuthPerformanceMonitor()