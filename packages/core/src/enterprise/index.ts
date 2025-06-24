/**
 * @ai-context 企业级特性统一导出
 * @ai-purpose 统一导出所有企业级功能模块，提供一站式企业级解决方案
 * @ai-features 日志、监控、追踪、健康检查、基准测试、安全审计
 * @ai-integration 与第三方企业级服务集成的统一入口
 */

// 日志管理系统
export {
  EnterpriseLogger,
  LogLevel,
  AuditEventType,
  LoggerConfigSchema,
  logger,
  createLogger
} from './logger'
export type {
  LoggerConfig,
  AuditLog
} from './logger'

// 指标收集系统
export {
  EnterpriseMetrics,
  MetricsConfigSchema,
  metrics,
  createMetrics
} from './metrics'
export type {
  MetricsConfig
} from './metrics'

// 分布式追踪系统
export {
  EnterpriseTracing,
  TracingConfigSchema,
  tracing,
  createTracing
} from './tracing'
export type {
  Span,
  SpanKind,
  SpanStatusCode
} from './tracing'
export type {
  TracingConfig,
  SpanAttributes,
  TracingContext
} from './tracing'

// 健康检查系统
export {
  EnterpriseHealth,
  HealthStatus,
  HealthConfigSchema,
  health,
  createHealth
} from './health'
export type {
  HealthConfig,
  HealthCheckResult,
  HealthCheckFunction
} from './health'

// 基准测试框架
export {
  EnterpriseBenchmark,
  BenchmarkConfigSchema,
  benchmark,
  createBenchmark
} from './benchmark'
export type {
  BenchmarkConfig,
  BenchmarkResult,
  RegressionResult,
  BenchmarkSuite
} from './benchmark'

/**
 * 企业级特性配置接口
 */
export interface EnterpriseConfig {
  /** 日志配置 */
  logging?: Partial<LoggerConfig>
  /** 指标配置 */
  metrics?: Partial<MetricsConfig>
  /** 追踪配置 */
  tracing?: Partial<TracingConfig>
  /** 健康检查配置 */
  health?: Partial<HealthConfig>
  /** 基准测试配置 */
  benchmark?: Partial<BenchmarkConfig>
}

// 导入所有必要的类型
import { EnterpriseLogger, LoggerConfig } from './logger'
import { EnterpriseMetrics, MetricsConfig } from './metrics'
import { EnterpriseTracing, TracingConfig } from './tracing'
import { EnterpriseHealth, HealthConfig, HealthStatus } from './health'
import { EnterpriseBenchmark, BenchmarkConfig } from './benchmark'

/**
 * 企业级特性管理器
 * 统一管理所有企业级功能的生命周期
 */
export class EnterpriseManager {
  private logger: EnterpriseLogger
  private metrics: EnterpriseMetrics
  private tracing: EnterpriseTracing
  private health: EnterpriseHealth
  private benchmark: EnterpriseBenchmark

  constructor(config: EnterpriseConfig = {}) {
    // 初始化各个模块
    this.logger = new EnterpriseLogger(config.logging)
    this.metrics = new EnterpriseMetrics(config.metrics)
    this.tracing = new EnterpriseTracing(config.tracing)
    this.health = new EnterpriseHealth(config.health)
    this.benchmark = new EnterpriseBenchmark(config.benchmark)

    // 设置模块间的集成
    this.setupIntegrations()
  }

  /**
   * 设置模块间的集成
   */
  private setupIntegrations(): void {
    // 健康检查集成指标
    this.health.addHealthCheck('metrics', async () => {
      try {
        const metricsData = await this.metrics.getMetrics()
        return {
          status: HealthStatus.HEALTHY,
          message: 'Metrics system is operational',
          details: { metricsCount: metricsData.split('\n').length },
          timestamp: new Date(),
          duration: 0
        }
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: 'Metrics system failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          duration: 0
        }
      }
    })

    // 健康检查集成追踪
    this.health.addHealthCheck('tracing', async () => {
      const context = this.tracing.getCurrentContext()
      return {
        status: HealthStatus.HEALTHY,
        message: 'Tracing system is operational',
        details: { hasActiveTrace: !!context },
        timestamp: new Date(),
        duration: 0
      }
    })
  }

  /**
   * 获取日志器
   */
  getLogger(): EnterpriseLogger {
    return this.logger
  }

  /**
   * 获取指标收集器
   */
  getMetrics(): EnterpriseMetrics {
    return this.metrics
  }

  /**
   * 获取追踪器
   */
  getTracing(): EnterpriseTracing {
    return this.tracing
  }

  /**
   * 获取健康检查器
   */
  getHealth(): EnterpriseHealth {
    return this.health
  }

  /**
   * 获取基准测试器
   */
  getBenchmark(): EnterpriseBenchmark {
    return this.benchmark
  }

  /**
   * 启动所有企业级服务
   */
  async start(): Promise<void> {
    this.logger.info('Starting enterprise services...')

    try {
      // 记录启动指标
      this.metrics.recordBusinessOperation({
        operation: 'enterprise_start',
        status: 'success',
        duration: 0
      })

      this.logger.info('Enterprise services started successfully')
    } catch (error) {
      this.logger.error(error, 'Failed to start enterprise services')
      throw error
    }
  }

  /**
   * 停止所有企业级服务
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping enterprise services...')

    try {
      // 关闭追踪系统
      await this.tracing.shutdown()

      // 记录停止指标
      this.metrics.recordBusinessOperation({
        operation: 'enterprise_stop',
        status: 'success',
        duration: 0
      })

      this.logger.info('Enterprise services stopped successfully')
    } catch (error) {
      this.logger.error(error, 'Failed to stop enterprise services')
      throw error
    }
  }

  /**
   * 获取企业级服务状态
   */
  async getStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    services: {
      logging: boolean
      metrics: boolean
      tracing: boolean
      health: boolean
      benchmark: boolean
    }
    uptime: number
    timestamp: Date
  }> {
    const healthSummary = await this.health.getHealthSummary()

    return {
      status: healthSummary.status === HealthStatus.HEALTHY ? 'healthy' :
              healthSummary.status === HealthStatus.DEGRADED ? 'degraded' : 'unhealthy',
      services: {
        logging: true, // 日志系统总是可用
        metrics: true, // 指标系统总是可用
        tracing: !!this.tracing.getCurrentContext(),
        health: true, // 健康检查系统总是可用
        benchmark: true // 基准测试系统总是可用
      },
      uptime: process.uptime(),
      timestamp: new Date()
    }
  }

  /**
   * 执行企业级操作（带完整监控）
   */
  async executeOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: {
      userId?: string
      userType?: string
      resource?: string
      [key: string]: unknown
    }
  ): Promise<T> {
    const startTime = Date.now()

    return this.tracing.recordBusinessOperation(
      operationName,
      async (span: any) => {
        try {
          // 记录操作开始
          this.logger.info({
            operation: operationName,
            metadata,
            traceId: this.tracing.getCurrentContext()?.traceId
          }, `Starting operation: ${operationName}`)

          // 执行操作
          const result = await operation()

          // 记录成功指标
          const duration = (Date.now() - startTime) / 1000
          this.metrics.recordBusinessOperation({
            operation: operationName,
            status: 'success',
            userType: metadata?.userType,
            duration
          })

          // 记录操作完成
          this.logger.info({
            operation: operationName,
            duration,
            metadata,
            traceId: this.tracing.getCurrentContext()?.traceId
          }, `Operation completed: ${operationName}`)

          return result
        } catch (error) {
          // 记录失败指标
          const duration = (Date.now() - startTime) / 1000
          this.metrics.recordBusinessOperation({
            operation: operationName,
            status: 'error',
            userType: metadata?.userType,
            duration
          })

          // 记录错误
          this.logger.error({
            operation: operationName,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata,
            traceId: this.tracing.getCurrentContext()?.traceId
          }, `Operation failed: ${operationName}`)

          // 记录异常到追踪
          this.tracing.recordException(error as Error)

          throw error
        }
      },
      metadata
    )
  }
}

/**
 * 默认企业级管理器实例
 */
export const enterprise = new EnterpriseManager({
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    prettyPrint: process.env.NODE_ENV === 'development',
    audit: process.env.ENABLE_AUDIT_LOG === 'true'
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: process.env.METRICS_PREFIX || 'linch_kit_'
  },
  tracing: {
    enabled: process.env.TRACING_ENABLED !== 'false',
    serviceName: process.env.SERVICE_NAME || 'linch-kit'
  },
  health: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false'
  },
  benchmark: {
    enabled: process.env.BENCHMARK_ENABLED !== 'false',
    ci: process.env.CI === 'true'
  }
})

/**
 * 创建企业级管理器实例
 */
export function createEnterprise(config?: EnterpriseConfig): EnterpriseManager {
  return new EnterpriseManager(config)
}
