/**
 * @linch-kit/core 通用性能监控系统
 * 
 * 提供可扩展的性能监控基础设施，支持认证、平台等各模块使用
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import type { MetricCollector, Counter, Histogram, Gauge } from '../types'

import { metrics as defaultMetrics } from './metrics'

// ==================== 通用性能监控类型定义 ====================

/**
 * 操作状态
 */
export type OperationStatus = 'success' | 'failure' | 'error'

/**
 * 性能指标
 */
export interface PerformanceMetric {
  /** 操作类型 */
  operation: string
  /** 执行状态 */
  status: OperationStatus
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
export interface PerformanceStats {
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

// ==================== 性能监控接口定义 ====================

/**
 * 性能监控器接口
 */
export interface IPerformanceMonitor {
  /**
   * 记录性能指标
   */
  recordMetric(metric: PerformanceMetric): Promise<void>

  /**
   * 获取性能统计
   */
  getPerformanceStats(windowMinutes?: number): Promise<PerformanceStats>

  /**
   * 开始操作计时
   */
  startTimer(operation: string, metadata?: Record<string, unknown>): PerformanceTimer

  /**
   * 清理过期数据
   */
  cleanup(retentionHours?: number): Promise<void>
}

/**
 * 性能操作计时器
 */
export interface PerformanceTimer {
  /** 操作类型 */
  operation: string
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

// ==================== Prometheus集成监控器实现 ====================

/**
 * 基于Prometheus metrics的性能监控器
 */
export class PrometheusPerformanceMonitor implements IPerformanceMonitor {
  private readonly operationsCounter: Counter
  private readonly durationHistogram: Histogram
  private readonly errorsCounter: Counter
  private readonly activeOperationsGauge: Gauge
  
  private readonly metricsBuffer: PerformanceMetric[] = []
  private readonly modulePrefix: string

  constructor(
    modulePrefix: string,
    private readonly metricCollector: MetricCollector = defaultMetrics
  ) {
    this.modulePrefix = modulePrefix
    
    // 创建Prometheus指标
    this.operationsCounter = metricCollector.createCounter(
      `${modulePrefix}_operations_total`,
      `Total number of ${modulePrefix} operations`,
      ['operation', 'status']
    )

    this.durationHistogram = metricCollector.createHistogram(
      `${modulePrefix}_operation_duration_milliseconds`,
      `${modulePrefix} operation duration in milliseconds`,
      [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      ['operation', 'status']
    )

    this.errorsCounter = metricCollector.createCounter(
      `${modulePrefix}_errors_total`,
      `Total number of ${modulePrefix} errors`,
      ['operation', 'error_code']
    )

    this.activeOperationsGauge = metricCollector.createGauge(
      `${modulePrefix}_active_operations`,
      `Number of active ${modulePrefix} operations`,
      ['operation']
    )
  }

  async recordMetric(metric: PerformanceMetric): Promise<void> {
    const labels = {
      operation: metric.operation,
      status: metric.status
    }

    // 记录操作计数
    this.operationsCounter.inc(1, labels)

    // 记录持续时间
    this.durationHistogram.observe(metric.duration, labels)

    // 记录错误
    if (metric.status === 'error' && metric.errorCode) {
      this.errorsCounter.inc(1, {
        operation: metric.operation,
        error_code: metric.errorCode
      })
    }

    // 缓存指标用于统计查询
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date()
    })

    // 异步清理缓存
    setImmediate(() => {
      this.cleanup(24).catch(() => {
        // 静默处理清理错误
      })
    })
  }

  async getPerformanceStats(windowMinutes: number = 60): Promise<PerformanceStats> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
    
    const windowMetrics = this.metricsBuffer.filter(
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

  startTimer(operation: string, metadata?: Record<string, unknown>): PerformanceTimer {
    // 增加活跃操作计数
    this.activeOperationsGauge.inc(1, { operation })
    
    return new PrometheusPerformanceTimer(operation, this, metadata)
  }

  async cleanup(retentionHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000)
    const _initialCount = this.metricsBuffer.length
    
    // 移除过期指标缓存
    while (this.metricsBuffer.length > 0 && this.metricsBuffer[0].timestamp < cutoffTime) {
      this.metricsBuffer.shift()
    }
    
    // 保持缓存大小合理
    const maxBufferSize = 10000
    if (this.metricsBuffer.length > maxBufferSize) {
      this.metricsBuffer.splice(0, this.metricsBuffer.length - maxBufferSize)
    }
  }

  /**
   * 减少活跃操作计数
   */
  private decrementActiveOperations(operation: string): void {
    this.activeOperationsGauge.dec(1, { operation })
  }
}

/**
 * Prometheus性能操作计时器
 */
class PrometheusPerformanceTimer implements PerformanceTimer {
  public readonly operation: string
  public readonly startTime: number
  public readonly metadata?: Record<string, unknown>

  constructor(
    operation: string,
    private readonly monitor: PrometheusPerformanceMonitor,
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
    
    // 减少活跃操作计数
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.monitor as any).decrementActiveOperations(this.operation)
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
    
    // 减少活跃操作计数
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.monitor as any).decrementActiveOperations(this.operation)
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
    
    // 减少活跃操作计数
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.monitor as any).decrementActiveOperations(this.operation)
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建性能监控器
 */
export function createPerformanceMonitor(
  modulePrefix: string,
  metricCollector?: MetricCollector
): IPerformanceMonitor {
  return new PrometheusPerformanceMonitor(modulePrefix, metricCollector)
}

/**
 * 性能监控器配置
 */
export interface PerformanceMonitorConfig {
  /** 模块前缀 */
  modulePrefix: string
  /** 指标收集器 */
  metricCollector?: MetricCollector
  /** 是否启用缓存统计 */
  enableBufferedStats?: boolean
  /** 缓存保留时间(小时) */
  retentionHours?: number
}

/**
 * 创建配置化的性能监控器
 */
export function createConfiguredPerformanceMonitor(
  config: PerformanceMonitorConfig
): IPerformanceMonitor {
  return new PrometheusPerformanceMonitor(
    config.modulePrefix,
    config.metricCollector
  )
}