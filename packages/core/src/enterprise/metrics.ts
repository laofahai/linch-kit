/**
 * @ai-context 企业级指标收集系统
 * @ai-purpose 基于 prom-client 的 Prometheus 指标收集，支持自定义指标和业务监控
 * @ai-features 计数器、直方图、仪表盘、摘要指标、自动收集、业务指标
 * @ai-integration 与监控系统集成，支持 Grafana 可视化
 */

import { z } from 'zod'
import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  Summary,
  Registry
} from 'prom-client'

/**
 * 指标配置 Schema
 */
export const MetricsConfigSchema = z.object({
  /** 是否启用指标收集 */
  enabled: z.boolean().default(true),
  /** 指标前缀 */
  prefix: z.string().default('linch_kit_'),
  /** 是否收集默认指标 */
  collectDefault: z.boolean().default(true),
  /** 默认指标收集间隔（毫秒） */
  defaultInterval: z.number().default(5000),
  /** 自定义标签 */
  defaultLabels: z.record(z.string()).default({}),
  /** HTTP 指标配置 */
  http: z.object({
    /** 是否启用 HTTP 指标 */
    enabled: z.boolean().default(true),
    /** 请求持续时间桶 */
    durationBuckets: z.array(z.number()).default([0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]),
    /** 响应大小桶 */
    sizeBuckets: z.array(z.number()).default([5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000])
  }).default({}),
  /** 数据库指标配置 */
  database: z.object({
    /** 是否启用数据库指标 */
    enabled: z.boolean().default(true),
    /** 查询持续时间桶 */
    queryDurationBuckets: z.array(z.number()).default([0.01, 0.05, 0.1, 0.5, 1, 2, 5])
  }).default({})
})

export type MetricsConfig = z.infer<typeof MetricsConfigSchema>

/**
 * 企业级指标管理器
 */
export class EnterpriseMetrics {
  private registry: Registry
  private config: MetricsConfig
  private metrics: Map<string, Counter | Histogram | Gauge | Summary> = new Map()

  // 内置指标
  private httpRequestsTotal?: Counter
  private httpRequestDuration?: Histogram
  private httpResponseSize?: Histogram
  private databaseQueryTotal?: Counter
  private databaseQueryDuration?: Histogram
  private databaseConnectionsActive?: Gauge
  private businessOperationsTotal?: Counter
  private businessOperationDuration?: Histogram
  private systemResourceUsage?: Gauge

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = MetricsConfigSchema.parse(config)
    this.registry = new Registry()
    
    if (this.config.enabled) {
      this.initialize()
    }
  }

  /**
   * 初始化指标系统
   */
  private initialize(): void {
    // 设置默认标签
    this.registry.setDefaultLabels(this.config.defaultLabels)

    // 收集默认系统指标
    if (this.config.collectDefault) {
      collectDefaultMetrics({
        register: this.registry,
        prefix: this.config.prefix
      })
    }

    // 初始化 HTTP 指标
    if (this.config.http.enabled) {
      this.initializeHttpMetrics()
    }

    // 初始化数据库指标
    if (this.config.database.enabled) {
      this.initializeDatabaseMetrics()
    }

    // 初始化业务指标
    this.initializeBusinessMetrics()

    // 初始化系统资源指标
    this.initializeSystemMetrics()
  }

  /**
   * 初始化 HTTP 指标
   */
  private initializeHttpMetrics(): void {
    this.httpRequestsTotal = new Counter({
      name: `${this.config.prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    })

    this.httpRequestDuration = new Histogram({
      name: `${this.config.prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: this.config.http.durationBuckets,
      registers: [this.registry]
    })

    this.httpResponseSize = new Histogram({
      name: `${this.config.prefix}http_response_size_bytes`,
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: this.config.http.sizeBuckets,
      registers: [this.registry]
    })

    this.metrics.set('http_requests_total', this.httpRequestsTotal)
    this.metrics.set('http_request_duration', this.httpRequestDuration)
    this.metrics.set('http_response_size', this.httpResponseSize)
  }

  /**
   * 初始化数据库指标
   */
  private initializeDatabaseMetrics(): void {
    this.databaseQueryTotal = new Counter({
      name: `${this.config.prefix}database_queries_total`,
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.registry]
    })

    this.databaseQueryDuration = new Histogram({
      name: `${this.config.prefix}database_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: this.config.database.queryDurationBuckets,
      registers: [this.registry]
    })

    this.databaseConnectionsActive = new Gauge({
      name: `${this.config.prefix}database_connections_active`,
      help: 'Number of active database connections',
      labelNames: ['pool'],
      registers: [this.registry]
    })

    this.metrics.set('database_queries_total', this.databaseQueryTotal)
    this.metrics.set('database_query_duration', this.databaseQueryDuration)
    this.metrics.set('database_connections_active', this.databaseConnectionsActive)
  }

  /**
   * 初始化业务指标
   */
  private initializeBusinessMetrics(): void {
    this.businessOperationsTotal = new Counter({
      name: `${this.config.prefix}business_operations_total`,
      help: 'Total number of business operations',
      labelNames: ['operation', 'status', 'user_type'],
      registers: [this.registry]
    })

    this.businessOperationDuration = new Histogram({
      name: `${this.config.prefix}business_operation_duration_seconds`,
      help: 'Business operation duration in seconds',
      labelNames: ['operation', 'user_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry]
    })

    this.metrics.set('business_operations_total', this.businessOperationsTotal)
    this.metrics.set('business_operation_duration', this.businessOperationDuration)
  }

  /**
   * 初始化系统资源指标
   */
  private initializeSystemMetrics(): void {
    this.systemResourceUsage = new Gauge({
      name: `${this.config.prefix}system_resource_usage`,
      help: 'System resource usage percentage',
      labelNames: ['resource', 'type'],
      registers: [this.registry]
    })

    this.metrics.set('system_resource_usage', this.systemResourceUsage)
  }

  /**
   * 记录 HTTP 请求指标
   */
  recordHttpRequest(labels: {
    method: string
    route: string
    statusCode: number
    duration: number
    responseSize?: number
  }): void {
    if (!this.config.enabled || !this.config.http.enabled) return

    const labelValues = {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode.toString()
    }

    this.httpRequestsTotal?.inc(labelValues)
    this.httpRequestDuration?.observe(labelValues, labels.duration)
    
    if (labels.responseSize !== undefined) {
      this.httpResponseSize?.observe(labelValues, labels.responseSize)
    }
  }

  /**
   * 记录数据库查询指标
   */
  recordDatabaseQuery(labels: {
    operation: string
    table: string
    status: 'success' | 'error'
    duration: number
  }): void {
    if (!this.config.enabled || !this.config.database.enabled) return

    this.databaseQueryTotal?.inc({
      operation: labels.operation,
      table: labels.table,
      status: labels.status
    })

    this.databaseQueryDuration?.observe({
      operation: labels.operation,
      table: labels.table
    }, labels.duration)
  }

  /**
   * 记录业务操作指标
   */
  recordBusinessOperation(labels: {
    operation: string
    status: 'success' | 'error' | 'partial'
    userType?: string
    duration: number
  }): void {
    if (!this.config.enabled) return

    this.businessOperationsTotal?.inc({
      operation: labels.operation,
      status: labels.status,
      user_type: labels.userType || 'unknown'
    })

    this.businessOperationDuration?.observe({
      operation: labels.operation,
      user_type: labels.userType || 'unknown'
    }, labels.duration)
  }

  /**
   * 设置数据库连接数
   */
  setDatabaseConnections(pool: string, count: number): void {
    if (!this.config.enabled || !this.config.database.enabled) return
    this.databaseConnectionsActive?.set({ pool }, count)
  }

  /**
   * 设置系统资源使用率
   */
  setSystemResourceUsage(resource: string, type: string, percentage: number): void {
    if (!this.config.enabled) return
    this.systemResourceUsage?.set({ resource, type }, percentage)
  }

  /**
   * 创建自定义计数器
   */
  createCounter(name: string, help: string, labelNames?: string[]): Counter {
    const counter = new Counter({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames,
      registers: [this.registry]
    })
    this.metrics.set(name, counter)
    return counter
  }

  /**
   * 创建自定义直方图
   */
  createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram {
    const histogram = new Histogram({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames,
      buckets,
      registers: [this.registry]
    })
    this.metrics.set(name, histogram)
    return histogram
  }

  /**
   * 创建自定义仪表盘
   */
  createGauge(name: string, help: string, labelNames?: string[]): Gauge {
    const gauge = new Gauge({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames,
      registers: [this.registry]
    })
    this.metrics.set(name, gauge)
    return gauge
  }

  /**
   * 获取指标
   */
  getMetric(name: string): Counter | Histogram | Gauge | Summary | undefined {
    return this.metrics.get(name)
  }

  /**
   * 获取所有指标数据
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  /**
   * 获取注册表
   */
  getRegistry(): Registry {
    return this.registry
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.registry.clear()
    this.metrics.clear()
  }
}

/**
 * 默认指标实例
 */
export const metrics = new EnterpriseMetrics({
  enabled: process.env.METRICS_ENABLED !== 'false',
  prefix: process.env.METRICS_PREFIX || 'linch_kit_',
  defaultLabels: {
    service: 'linch-kit',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  }
})

/**
 * 创建指标实例
 */
export function createMetrics(config?: Partial<MetricsConfig>): EnterpriseMetrics {
  return new EnterpriseMetrics(config)
}
