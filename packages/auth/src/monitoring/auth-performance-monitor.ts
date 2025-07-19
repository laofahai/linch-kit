/**
 * @linch-kit/auth 认证性能监控
 * 
 * 基于@linch-kit/core的通用性能监控系统
 * 专门针对认证操作的性能监控和指标收集
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import {
  type IPerformanceMonitor,
  createPerformanceMonitor
} from '@linch-kit/core/server'

import type { ILogger } from '../core/core-jwt-auth.service'

// ==================== 认证专用类型定义 ====================

/**
 * 认证操作类型
 */
export type AuthOperation = 
  | 'login' 
  | 'logout' 
  | 'refresh_token' 
  | 'validate_token' 
  | 'permission_check'
  | 'mfa_verify'
  | 'password_reset'
  | 'session_create'
  | 'session_destroy'

/**
 * 认证性能指标 (扩展通用指标)
 */
export interface AuthPerformanceMetric {
  /** 认证操作类型 */
  operation: AuthOperation
  /** 执行状态 */
  status: 'success' | 'failure' | 'error'
  /** 响应时间(毫秒) */
  duration: number
  /** 用户ID (匿名化) */
  userId?: string
  /** 会话ID */
  sessionId?: string
  /** 客户端IP (匿名化) */
  clientIp?: string
  /** 用户代理 */
  userAgent?: string
  /** 错误代码 */
  errorCode?: string
  /** 错误消息 */
  errorMessage?: string
  /** 时间戳 */
  timestamp: Date
  /** 认证方法 (password, oauth, jwt, etc.) */
  authMethod?: string
  /** 权限级别 */
  permissionLevel?: string
  /** 附加元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 认证性能统计 (扩展通用统计)
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
  /** 按操作类型统计 */
  operationStats: Record<AuthOperation, {
    requests: number
    successRate: number
    avgDuration: number
  }>
  /** 按认证方法统计 */
  authMethodStats: Record<string, {
    requests: number
    successRate: number
  }>
}

// ==================== 认证性能监控器接口 ====================

/**
 * 认证性能监控器接口
 */
export interface IAuthPerformanceMonitor {
  /**
   * 记录认证指标
   */
  recordAuthMetric(metric: AuthPerformanceMetric): Promise<void>

  /**
   * 获取认证性能统计
   */
  getAuthPerformanceStats(windowMinutes?: number): Promise<AuthPerformanceStats>

  /**
   * 开始认证操作计时
   */
  startAuthTimer(operation: AuthOperation, metadata?: Record<string, unknown>): AuthPerformanceTimer

  /**
   * 清理过期数据
   */
  cleanup(retentionHours?: number): Promise<void>

  /**
   * 获取热门错误
   */
  getTopErrors(limit?: number): Promise<Array<{
    errorCode: string
    count: number
    operations: AuthOperation[]
  }>>

  /**
   * 获取慢查询
   */
  getSlowOperations(thresholdMs?: number, limit?: number): Promise<Array<{
    operation: AuthOperation
    avgDuration: number
    count: number
  }>>
}

/**
 * 认证性能操作计时器
 */
export interface AuthPerformanceTimer {
  /** 操作类型 */
  operation: AuthOperation
  /** 开始时间 */
  startTime: number
  /** 元数据 */
  metadata?: Record<string, unknown>
  
  /**
   * 结束计时并记录成功指标
   */
  success(options?: {
    userId?: string
    sessionId?: string
    authMethod?: string
    metadata?: Record<string, unknown>
  }): Promise<void>
  
  /**
   * 结束计时并记录失败指标
   */
  failure(options?: {
    errorCode?: string
    errorMessage?: string
    authMethod?: string
    metadata?: Record<string, unknown>
  }): Promise<void>
  
  /**
   * 结束计时并记录错误指标
   */
  error(error: Error, options?: {
    authMethod?: string
    metadata?: Record<string, unknown>
  }): Promise<void>
}

// ==================== 认证性能监控器实现 ====================

/**
 * 认证性能监控器实现
 * 基于core包的通用性能监控器
 */
export class AuthPerformanceMonitor implements IAuthPerformanceMonitor {
  private readonly coreMonitor: IPerformanceMonitor
  private readonly metricsBuffer: AuthPerformanceMetric[] = []
  private readonly logger?: ILogger

  constructor(logger?: ILogger) {
    this.logger = logger
    this.coreMonitor = createPerformanceMonitor('linchkit_auth')
  }

  async recordAuthMetric(metric: AuthPerformanceMetric): Promise<void> {
    // 记录到core监控器
    await this.coreMonitor.recordMetric({
      operation: metric.operation,
      status: metric.status,
      duration: metric.duration,
      userId: metric.userId,
      errorCode: metric.errorCode,
      errorMessage: metric.errorMessage,
      timestamp: metric.timestamp,
      metadata: {
        sessionId: metric.sessionId,
        clientIp: metric.clientIp,
        userAgent: metric.userAgent,
        authMethod: metric.authMethod,
        permissionLevel: metric.permissionLevel,
        ...metric.metadata
      }
    })

    // 本地缓存用于增强统计
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date()
    })

    // 记录日志
    this.logger?.info('Auth performance metric recorded', {
      operation: metric.operation,
      status: metric.status,
      duration: metric.duration,
      userId: metric.userId,
      sessionId: metric.sessionId,
      authMethod: metric.authMethod,
      errorCode: metric.errorCode
    })

    // 异步清理
    setImmediate(() => {
      this.cleanup(24).catch(error => {
        this.logger?.error('Failed to cleanup auth metrics', error instanceof Error ? error : undefined, { errorMessage: error instanceof Error ? error.message : 'Unknown error' })
      })
    })
  }

  async getAuthPerformanceStats(windowMinutes: number = 60): Promise<AuthPerformanceStats> {
    // 获取核心统计
    const coreStats = await this.coreMonitor.getPerformanceStats(windowMinutes)
    
    // 计算认证专用统计
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
    
    const windowMetrics = this.metricsBuffer.filter(
      metric => metric.timestamp >= windowStart && metric.timestamp <= now
    )

    // 按操作类型统计
    const operationStats: Record<string, { requests: number; successRate: number; avgDuration: number }> = {}
    
    // 按认证方法统计  
    const authMethodStats: Record<string, { requests: number; successRate: number }> = {}

    for (const metric of windowMetrics) {
      // 操作统计
      if (!operationStats[metric.operation]) {
        operationStats[metric.operation] = { requests: 0, successRate: 0, avgDuration: 0 }
      }
      operationStats[metric.operation].requests++

      // 认证方法统计
      if (metric.authMethod) {
        if (!authMethodStats[metric.authMethod]) {
          authMethodStats[metric.authMethod] = { requests: 0, successRate: 0 }
        }
        authMethodStats[metric.authMethod].requests++
      }
    }

    // 计算成功率和平均持续时间
    for (const [operation, stats] of Object.entries(operationStats)) {
      const operationMetrics = windowMetrics.filter(m => m.operation === operation)
      const successCount = operationMetrics.filter(m => m.status === 'success').length
      const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
      
      stats.successRate = stats.requests > 0 ? (successCount / stats.requests) * 100 : 0
      stats.avgDuration = stats.requests > 0 ? totalDuration / stats.requests : 0
    }

    for (const [method, stats] of Object.entries(authMethodStats)) {
      const methodMetrics = windowMetrics.filter(m => m.authMethod === method)
      const successCount = methodMetrics.filter(m => m.status === 'success').length
      
      stats.successRate = stats.requests > 0 ? (successCount / stats.requests) * 100 : 0
    }

    return {
      ...coreStats,
      operationStats: operationStats as Record<AuthOperation, any>,
      authMethodStats
    }
  }

  startAuthTimer(operation: AuthOperation, metadata?: Record<string, unknown>): AuthPerformanceTimer {
    return new AuthPerformanceTimerImpl(operation, this, metadata)
  }

  async cleanup(retentionHours: number = 24): Promise<void> {
    await this.coreMonitor.cleanup(retentionHours)
    
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000)
    const initialCount = this.metricsBuffer.length
    
    while (this.metricsBuffer.length > 0 && this.metricsBuffer[0].timestamp < cutoffTime) {
      this.metricsBuffer.shift()
    }
    
    const cleanedCount = initialCount - this.metricsBuffer.length
    if (cleanedCount > 0) {
      this.logger?.info('Cleaned up old auth metrics', {
        cleanedCount,
        remainingCount: this.metricsBuffer.length,
        cutoffTime: cutoffTime.toISOString()
      })
    }
  }

  async getTopErrors(limit: number = 10): Promise<Array<{
    errorCode: string
    count: number
    operations: AuthOperation[]
  }>> {
    const errorMap = new Map<string, { count: number; operations: Set<AuthOperation> }>()

    for (const metric of this.metricsBuffer) {
      if (metric.status === 'error' && metric.errorCode) {
        if (!errorMap.has(metric.errorCode)) {
          errorMap.set(metric.errorCode, { count: 0, operations: new Set() })
        }
        const error = errorMap.get(metric.errorCode)!
        error.count++
        error.operations.add(metric.operation)
      }
    }

    return Array.from(errorMap.entries())
      .map(([errorCode, data]) => ({
        errorCode,
        count: data.count,
        operations: Array.from(data.operations)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  async getSlowOperations(thresholdMs: number = 1000, limit: number = 10): Promise<Array<{
    operation: AuthOperation
    avgDuration: number
    count: number
  }>> {
    const operationMap = new Map<AuthOperation, { totalDuration: number; count: number }>()

    for (const metric of this.metricsBuffer) {
      if (metric.duration >= thresholdMs) {
        if (!operationMap.has(metric.operation)) {
          operationMap.set(metric.operation, { totalDuration: 0, count: 0 })
        }
        const op = operationMap.get(metric.operation)!
        op.totalDuration += metric.duration
        op.count++
      }
    }

    return Array.from(operationMap.entries())
      .map(([operation, data]) => ({
        operation,
        avgDuration: data.totalDuration / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit)
  }
}

/**
 * 认证性能计时器实现
 */
class AuthPerformanceTimerImpl implements AuthPerformanceTimer {
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

  async success(options?: {
    userId?: string
    sessionId?: string
    authMethod?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.monitor.recordAuthMetric({
      operation: this.operation,
      status: 'success',
      duration,
      userId: options?.userId,
      sessionId: options?.sessionId,
      authMethod: options?.authMethod,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...options?.metadata }
    })
  }

  async failure(options?: {
    errorCode?: string
    errorMessage?: string
    authMethod?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.monitor.recordAuthMetric({
      operation: this.operation,
      status: 'failure',
      duration,
      errorCode: options?.errorCode,
      errorMessage: options?.errorMessage,
      authMethod: options?.authMethod,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...options?.metadata }
    })
  }

  async error(error: Error, options?: {
    authMethod?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.monitor.recordAuthMetric({
      operation: this.operation,
      status: 'error',
      duration,
      errorCode: error.name,
      errorMessage: error.message,
      authMethod: options?.authMethod,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...options?.metadata }
    })
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建认证性能监控器
 */
export function createAuthPerformanceMonitor(logger?: ILogger): IAuthPerformanceMonitor {
  return new AuthPerformanceMonitor(logger)
}

/**
 * 默认认证性能监控器实例
 */
export const defaultAuthPerformanceMonitor = createAuthPerformanceMonitor()