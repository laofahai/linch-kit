/**
 * @linch-kit/auth OpenTelemetry集成
 * 
 * 提供OpenTelemetry metrics、traces、logs的集成支持
 * 支持可选依赖，在OpenTelemetry不可用时优雅降级
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import type { ILogger } from '../core/core-jwt-auth.service'

import type { 
  AuthMetrics, 
  AuthPerformanceStats, 
  IAuthPerformanceMonitor, 
  AuthOperation, 
  AuthTimer 
} from './auth-metrics'

// ==================== OpenTelemetry类型定义 ====================

/**
 * OpenTelemetry配置
 */
export interface OpenTelemetryConfig {
  /** 服务名称 */
  serviceName: string
  /** 服务版本 */
  serviceVersion?: string
  /** 环境名称 */
  environment?: string
  /** 是否启用metrics */
  enableMetrics?: boolean
  /** 是否启用traces */
  enableTraces?: boolean
  /** 是否启用logs */
  enableLogs?: boolean
  /** 自定义属性 */
  attributes?: Record<string, string | number | boolean>
}

/**
 * OpenTelemetry指标名称
 */
export const AUTH_METRICS = {
  /** 认证操作总数 */
  AUTH_OPERATIONS_TOTAL: 'linchkit_auth_operations_total',
  /** 认证操作持续时间 */
  AUTH_OPERATION_DURATION: 'linchkit_auth_operation_duration_milliseconds',
  /** 认证成功率 */
  AUTH_SUCCESS_RATE: 'linchkit_auth_success_rate',
  /** 活跃会话数 */
  AUTH_ACTIVE_SESSIONS: 'linchkit_auth_active_sessions_total',
  /** 认证错误数 */
  AUTH_ERRORS_TOTAL: 'linchkit_auth_errors_total'
} as const

// ==================== OpenTelemetry监控器实现 ====================

/**
 * OpenTelemetry集成的认证性能监控器
 * 
 * 自动检测OpenTelemetry依赖可用性，不可用时降级到内存监控
 */
export class OpenTelemetryAuthPerformanceMonitor implements IAuthPerformanceMonitor {
  private otelAvailable = false
  private meter: unknown = null
  private counters: Map<string, unknown> = new Map()
  private histograms: Map<string, unknown> = new Map()
  private fallbackMonitor: IAuthPerformanceMonitor | null = null
  
  private readonly config: OpenTelemetryConfig
  private readonly logger?: ILogger

  constructor(config: OpenTelemetryConfig, logger?: ILogger) {
    this.config = {
      enableMetrics: true,
      enableTraces: true,
      enableLogs: true,
      ...config
    }
    this.logger = logger
    
    this.initializeOpenTelemetry()
  }

  private async initializeOpenTelemetry(): Promise<void> {
    try {
      // 动态导入OpenTelemetry (可选依赖)
      const { metrics } = await import('@opentelemetry/api')
      
      if (this.config.enableMetrics) {
        this.meter = metrics.getMeter(
          this.config.serviceName,
          this.config.serviceVersion
        )
        
        await this.createMetrics()
        this.otelAvailable = true
        
        this.logger?.info('OpenTelemetry metrics initialized successfully', {
          serviceName: this.config.serviceName,
          serviceVersion: this.config.serviceVersion,
          environment: this.config.environment
        })
      }
    } catch (error) {
      this.logger?.warn('OpenTelemetry not available, falling back to in-memory monitoring', {
        error: error instanceof Error ? error.message : String(error)
      })
      
      // 降级到内存监控
      const { InMemoryAuthPerformanceMonitor } = await import('./auth-metrics')
      this.fallbackMonitor = new InMemoryAuthPerformanceMonitor(this.logger)
    }
  }

  private async createMetrics(): Promise<void> {
    if (!this.meter || typeof this.meter !== 'object') return

    try {
      // 类型安全的动态导入和调用
      const meterMethods = this.meter as Record<string, unknown>
      
      // 操作计数器
      if (typeof meterMethods.createCounter === 'function') {
        const operationsCounter = meterMethods.createCounter(AUTH_METRICS.AUTH_OPERATIONS_TOTAL, {
          description: 'Total number of authentication operations',
          unit: '1'
        })
        this.counters.set('operations', operationsCounter)

        const errorsCounter = meterMethods.createCounter(AUTH_METRICS.AUTH_ERRORS_TOTAL, {
          description: 'Total number of authentication errors',
          unit: '1'
        })
        this.counters.set('errors', errorsCounter)
      }

      // 操作持续时间直方图
      if (typeof meterMethods.createHistogram === 'function') {
        const durationHistogram = meterMethods.createHistogram(AUTH_METRICS.AUTH_OPERATION_DURATION, {
          description: 'Authentication operation duration in milliseconds',
          unit: 'ms',
          boundaries: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
        })
        this.histograms.set('duration', durationHistogram)
      }

      // 成功率量表
      if (typeof meterMethods.createUpDownCounter === 'function') {
        const activeSessionsGauge = meterMethods.createUpDownCounter(AUTH_METRICS.AUTH_ACTIVE_SESSIONS, {
          description: 'Number of active authentication sessions',
          unit: '1'
        })
        this.counters.set('activeSessions', activeSessionsGauge)
      }

    } catch (error) {
      this.logger?.error('Failed to create OpenTelemetry metrics', error instanceof Error ? error : undefined, {
        errorMessage: error instanceof Error ? error.message : String(error)
      })
    }
  }

  async recordMetric(metric: AuthMetrics): Promise<void> {
    // 如果OpenTelemetry不可用，使用fallback
    if (!this.otelAvailable && this.fallbackMonitor) {
      return this.fallbackMonitor.recordMetric(metric)
    }

    try {
      const attributes = {
        operation: metric.operation,
        status: metric.status,
        service_name: this.config.serviceName,
        environment: this.config.environment || 'unknown',
        ...this.config.attributes,
        ...(metric.errorCode && { error_code: metric.errorCode })
      }

      // 记录操作计数
      const operationsCounter = this.counters.get('operations')
      if (operationsCounter && typeof (operationsCounter as any).add === 'function') {
        (operationsCounter as any).add(1, attributes)
      }

      // 记录持续时间
      const durationHistogram = this.histograms.get('duration')
      if (durationHistogram && typeof (durationHistogram as any).record === 'function') {
        (durationHistogram as any).record(metric.duration, attributes)
      }

      // 记录错误
      if (metric.status === 'error') {
        const errorsCounter = this.counters.get('errors')
        if (errorsCounter && typeof (errorsCounter as any).add === 'function') {
          (errorsCounter as any).add(1, attributes)
        }
      }

    } catch (error) {
      this.logger?.error('Failed to record OpenTelemetry metric', error instanceof Error ? error : undefined, {
        metricTimestamp: metric.timestamp,
        errorMessage: error instanceof Error ? error.message : String(error)
      })
    }
  }

  async getPerformanceStats(windowMinutes?: number): Promise<AuthPerformanceStats> {
    // OpenTelemetry主要用于推送指标，统计查询通过fallback实现
    if (this.fallbackMonitor) {
      return this.fallbackMonitor.getPerformanceStats(windowMinutes)
    }

    // 如果没有fallback，返回空统计
    const now = new Date()
    const windowStart = new Date(now.getTime() - (windowMinutes || 60) * 60 * 1000)
    
    return {
      totalRequests: 0,
      successRequests: 0,
      failureRequests: 0,
      errorRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      windowStart,
      windowEnd: now
    }
  }

  startTimer(operation: AuthOperation, metadata?: Record<string, unknown>): AuthTimer {
    return new OpenTelemetryAuthTimer(operation, this, metadata)
  }

  async cleanup(retentionHours?: number): Promise<void> {
    // OpenTelemetry指标由外部系统管理，无需清理
    if (this.fallbackMonitor) {
      return this.fallbackMonitor.cleanup(retentionHours)
    }
  }
}

/**
 * OpenTelemetry认证操作计时器
 */
class OpenTelemetryAuthTimer implements AuthTimer {
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
 * 创建OpenTelemetry集成的认证性能监控器
 */
export function createOpenTelemetryAuthPerformanceMonitor(
  config: OpenTelemetryConfig,
  logger?: ILogger
): IAuthPerformanceMonitor {
  return new OpenTelemetryAuthPerformanceMonitor(config, logger)
}

/**
 * 默认OpenTelemetry配置
 */
export const defaultOpenTelemetryConfig: OpenTelemetryConfig = {
  serviceName: 'linchkit-auth',
  serviceVersion: '2.0.3',
  environment: process.env.NODE_ENV || 'development',
  enableMetrics: true,
  enableTraces: true,
  enableLogs: true
}