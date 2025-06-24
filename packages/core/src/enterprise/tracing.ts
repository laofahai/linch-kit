/**
 * @ai-context 企业级分布式追踪系统
 * @ai-purpose 基于 OpenTelemetry 的分布式追踪，支持链路追踪和性能监控
 * @ai-features 自动埋点、手动埋点、链路追踪、性能分析、错误追踪
 * @ai-integration 支持 Jaeger、Zipkin 等追踪后端
 */

import { z } from 'zod'
import { NodeSDK } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { trace, context, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api'

/**
 * 追踪配置 Schema
 */
export const TracingConfigSchema = z.object({
  /** 是否启用追踪 */
  enabled: z.boolean().default(true),
  /** 服务名称 */
  serviceName: z.string().default('linch-kit'),
  /** 服务版本 */
  serviceVersion: z.string().default('0.1.0'),
  /** 环境标识 */
  environment: z.string().default('development'),
  /** 采样率 (0-1) */
  sampleRate: z.number().min(0).max(1).default(1.0),
  /** Jaeger 配置 */
  jaeger: z.object({
    /** 是否启用 Jaeger 导出 */
    enabled: z.boolean().default(false),
    /** Jaeger 端点 */
    endpoint: z.string().default('http://localhost:14268/api/traces'),
    /** 用户名 */
    username: z.string().optional(),
    /** 密码 */
    password: z.string().optional()
  }).default({}),
  /** Prometheus 指标导出 */
  prometheus: z.object({
    /** 是否启用 Prometheus 导出 */
    enabled: z.boolean().default(false),
    /** 端口 */
    port: z.number().default(9090),
    /** 端点路径 */
    endpoint: z.string().default('/metrics')
  }).default({}),
  /** 自动埋点配置 */
  instrumentations: z.object({
    /** HTTP 埋点 */
    http: z.boolean().default(true),
    /** Express 埋点 */
    express: z.boolean().default(true),
    /** 文件系统埋点 */
    fs: z.boolean().default(false),
    /** 数据库埋点 */
    database: z.boolean().default(true)
  }).default({})
})

export type TracingConfig = z.infer<typeof TracingConfigSchema>

/**
 * Span 属性接口
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined
}

/**
 * 追踪上下文接口
 */
export interface TracingContext {
  traceId: string
  spanId: string
  parentSpanId?: string
}

/**
 * 企业级分布式追踪管理器
 */
export class EnterpriseTracing {
  private sdk?: NodeSDK
  private config: TracingConfig
  private tracer: any

  constructor(config: Partial<TracingConfig> = {}) {
    this.config = TracingConfigSchema.parse(config)
    
    if (this.config.enabled) {
      this.initialize()
    }
  }

  /**
   * 初始化追踪系统
   */
  private initialize(): void {
    // 创建资源
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: this.config.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: this.config.serviceVersion,
      environment: this.config.environment
    })

    // 配置导出器
    const exporters = []

    // Jaeger 导出器
    if (this.config.jaeger.enabled) {
      const jaegerExporter = new JaegerExporter({
        endpoint: this.config.jaeger.endpoint,
        username: this.config.jaeger.username,
        password: this.config.jaeger.password
      })
      exporters.push(jaegerExporter)
    }

    // Prometheus 导出器
    if (this.config.prometheus.enabled) {
      const prometheusExporter = new PrometheusExporter({
        port: this.config.prometheus.port,
        endpoint: this.config.prometheus.endpoint
      })
      exporters.push(prometheusExporter)
    }

    // 创建 SDK
    this.sdk = new NodeSDK({
      resource,
      traceExporter: exporters.length > 0 ? exporters[0] : undefined,
      metricReader: exporters.find(e => e instanceof PrometheusExporter),
      instrumentations: this.getInstrumentations()
    })

    // 启动 SDK
    this.sdk.start()

    // 获取 tracer
    this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion)
  }

  /**
   * 获取自动埋点配置
   */
  private getInstrumentations(): any[] {
    const instrumentations = []

    if (this.config.instrumentations.http) {
      const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
      instrumentations.push(new HttpInstrumentation())
    }

    if (this.config.instrumentations.express) {
      const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
      instrumentations.push(new ExpressInstrumentation())
    }

    if (this.config.instrumentations.fs) {
      const { FsInstrumentation } = require('@opentelemetry/instrumentation-fs')
      instrumentations.push(new FsInstrumentation())
    }

    return instrumentations
  }

  /**
   * 创建 Span
   */
  createSpan(name: string, options?: {
    kind?: SpanKind
    attributes?: SpanAttributes
    parent?: Span
  }): Span {
    if (!this.config.enabled || !this.tracer) {
      // 返回 NoOp Span
      return trace.getActiveSpan() || trace.getTracer('noop').startSpan('noop')
    }

    const spanOptions: any = {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes
    }

    if (options?.parent) {
      return this.tracer.startSpan(name, spanOptions, trace.setSpan(context.active(), options.parent))
    }

    return this.tracer.startSpan(name, spanOptions)
  }

  /**
   * 在 Span 上下文中执行函数
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T> | T,
    options?: {
      kind?: SpanKind
      attributes?: SpanAttributes
    }
  ): Promise<T> {
    const span = this.createSpan(name, options)

    try {
      const result = await context.with(trace.setSpan(context.active(), span), () => fn(span))
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * 记录业务操作
   */
  async recordBusinessOperation<T>(
    operation: string,
    fn: (span: Span) => Promise<T> | T,
    metadata?: {
      userId?: string
      userType?: string
      resource?: string
      [key: string]: unknown
    }
  ): Promise<T> {
    const attributes: SpanAttributes = {
      'business.operation': operation,
      'business.user_id': metadata?.userId,
      'business.user_type': metadata?.userType,
      'business.resource': metadata?.resource
    }

    // 添加其他元数据
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (key !== 'userId' && key !== 'userType' && key !== 'resource') {
          attributes[`business.${key}`] = String(value)
        }
      })
    }

    return this.withSpan(`business.${operation}`, fn, {
      kind: SpanKind.INTERNAL,
      attributes
    })
  }

  /**
   * 记录数据库操作
   */
  async recordDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: (span: Span) => Promise<T> | T,
    query?: string
  ): Promise<T> {
    const attributes: SpanAttributes = {
      'db.operation': operation,
      'db.table': table,
      'db.system': 'postgresql', // 可以配置化
      'db.statement': query
    }

    return this.withSpan(`db.${operation}`, fn, {
      kind: SpanKind.CLIENT,
      attributes
    })
  }

  /**
   * 记录 HTTP 请求
   */
  async recordHttpRequest<T>(
    method: string,
    url: string,
    fn: (span: Span) => Promise<T> | T,
    metadata?: {
      statusCode?: number
      userAgent?: string
      userId?: string
    }
  ): Promise<T> {
    const attributes: SpanAttributes = {
      'http.method': method,
      'http.url': url,
      'http.status_code': metadata?.statusCode,
      'http.user_agent': metadata?.userAgent,
      'user.id': metadata?.userId
    }

    return this.withSpan(`http.${method.toLowerCase()}`, fn, {
      kind: SpanKind.SERVER,
      attributes
    })
  }

  /**
   * 获取当前追踪上下文
   */
  getCurrentContext(): TracingContext | null {
    if (!this.config.enabled) return null

    const span = trace.getActiveSpan()
    if (!span) return null

    const spanContext = span.spanContext()
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId
    }
  }

  /**
   * 添加 Span 属性
   */
  addSpanAttributes(attributes: SpanAttributes): void {
    if (!this.config.enabled) return

    const span = trace.getActiveSpan()
    if (span) {
      span.setAttributes(attributes)
    }
  }

  /**
   * 记录 Span 事件
   */
  addSpanEvent(name: string, attributes?: SpanAttributes): void {
    if (!this.config.enabled) return

    const span = trace.getActiveSpan()
    if (span) {
      span.addEvent(name, attributes)
    }
  }

  /**
   * 记录异常
   */
  recordException(error: Error, attributes?: SpanAttributes): void {
    if (!this.config.enabled) return

    const span = trace.getActiveSpan()
    if (span) {
      span.recordException(error)
      if (attributes) {
        span.setAttributes(attributes)
      }
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      })
    }
  }

  /**
   * 关闭追踪系统
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown()
    }
  }
}

/**
 * 默认追踪实例
 */
export const tracing = new EnterpriseTracing({
  enabled: process.env.TRACING_ENABLED !== 'false',
  serviceName: process.env.SERVICE_NAME || 'linch-kit',
  serviceVersion: process.env.npm_package_version || '0.1.0',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '1.0'),
  jaeger: {
    enabled: process.env.JAEGER_ENABLED === 'true',
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
  }
})

/**
 * 创建追踪实例
 */
export function createTracing(config?: Partial<TracingConfig>): EnterpriseTracing {
  return new EnterpriseTracing(config)
}

// 导出 OpenTelemetry 类型
export { Span, SpanKind, SpanStatusCode } from '@opentelemetry/api'
