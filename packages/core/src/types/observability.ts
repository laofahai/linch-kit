/**
 * 可观测性适配器类型定义
 * @module types/observability
 */

import type { BaseConfig, HealthStatus, LogLevel } from './common'

/**
 * 指标类型
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

/**
 * 指标配置
 */
export interface MetricConfig {
  name: string
  type: MetricType
  help: string
  labels?: string[]
  buckets?: number[]
  quantiles?: number[]
}

/**
 * 指标收集器接口
 */
export interface MetricCollector {
  createCounter(name: string, help: string, labels?: string[]): Counter
  createGauge(name: string, help: string, labels?: string[]): Gauge
  createHistogram(name: string, help: string, buckets?: number[], labels?: string[]): Histogram
  createSummary(name: string, help: string, percentiles?: number[], labels?: string[]): Summary
  getMetrics(): Promise<string>
  getRegistry?(): any
}

/**
 * 计数器接口
 */
export interface Counter {
  inc(value?: number, labels?: Record<string, string>): void
  get(labels?: Record<string, string>): number
  reset(): void
}

/**
 * 仪表盘接口
 */
export interface Gauge {
  set(value: number, labels?: Record<string, string>): void
  inc(value?: number, labels?: Record<string, string>): void
  dec(value?: number, labels?: Record<string, string>): void
  get(labels?: Record<string, string>): number
  reset(): void
}

/**
 * 直方图接口
 */
export interface Histogram {
  observe(value: number, labels?: Record<string, string>): void
  get(labels?: Record<string, string>): number
  reset(): void
}

/**
 * 摘要接口
 */
export interface Summary {
  observe(value: number, labels?: Record<string, string>): void
  get(labels?: Record<string, string>): number
  reset(): void
}

/**
 * 追踪上下文
 */
export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  flags?: number
}

/**
 * Span 接口
 */
export interface Span {
  setAttribute(key: string, value: string | number | boolean): void
  setAttributes(attributes: Record<string, string | number | boolean>): void
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void
  recordException(exception: Error): void
  setStatus(status: { code: number; message?: string }): void
  end(): void
  getContext(): TraceContext
}

/**
 * 追踪器接口
 */
export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span
  withSpan<T>(name: string, fn: (span: Span) => Promise<T> | T): Promise<T>
  getActiveSpan(): Span | undefined
}

/**
 * Span 选项
 */
export interface SpanOptions {
  parent?: Span | TraceContext
  attributes?: Record<string, string | number | boolean>
  startTime?: number
  links?: Array<{ context: TraceContext; attributes?: Record<string, string | number | boolean> }>
}

/**
 * 日志器接口
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, error?: Error, data?: Record<string, unknown>): void
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void
  child(bindings: Record<string, unknown>): Logger
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
}

/**
 * 健康检查器接口
 */
export interface HealthChecker {
  name: string
  check(): Promise<HealthStatus>
  timeout?: number
  interval?: number
}

/**
 * 健康监控器接口
 */
export interface HealthMonitor {
  addChecker(checker: HealthChecker): void
  removeChecker(name: string): void
  checkAll(): Promise<Record<string, HealthStatus>>
  check(name: string): Promise<HealthStatus | undefined>
  getOverallHealth(): Promise<HealthStatus>
  start(): void
  stop(): void
}

/**
 * 可观测性配置
 */
export interface ObservabilityConfig extends BaseConfig {
  metrics?: {
    enabled?: boolean
    endpoint?: string
    port?: number
  }
  tracing?: {
    enabled?: boolean
    serviceName?: string
    endpoint?: string
    sampleRate?: number
  }
  logging?: {
    level?: LogLevel
    format?: 'json' | 'text'
    output?: 'console' | 'file' | 'both'
    filePath?: string
  }
  health?: {
    enabled?: boolean
    endpoint?: string
    port?: number
    interval?: number
  }
}

/**
 * 可观测性管理器接口
 */
export interface ObservabilityManager {
  getMetrics(): MetricCollector
  getTracer(name?: string): Tracer
  getLogger(name?: string): Logger
  getHealth(): HealthMonitor
  initialize(config: ObservabilityConfig): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  getConfig(): ObservabilityConfig
  updateConfig(config: Partial<ObservabilityConfig>): Promise<void>
}
