/**
 * @ai-context 企业级健康检查系统
 * @ai-purpose 基于 @godaddy/terminus 的应用健康检查，支持优雅关闭和健康监控
 * @ai-features 健康检查、就绪检查、优雅关闭、信号处理、依赖检查
 * @ai-integration 与 Kubernetes、Docker、负载均衡器集成
 */

import { z } from 'zod'
import { createTerminus, TerminusOptions } from '@godaddy/terminus'
import { Server } from 'http'

/**
 * 健康检查状态
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded'
}

/**
 * 健康检查结果接口
 */
export interface HealthCheckResult {
  status: HealthStatus
  message?: string
  details?: Record<string, unknown>
  timestamp: Date
  duration: number
}

/**
 * 健康检查函数类型
 */
export type HealthCheckFunction = () => Promise<HealthCheckResult>

/**
 * 健康检查配置 Schema
 */
export const HealthConfigSchema = z.object({
  /** 是否启用健康检查 */
  enabled: z.boolean().default(true),
  /** 健康检查端点路径 */
  healthPath: z.string().default('/health'),
  /** 就绪检查端点路径 */
  readinessPath: z.string().default('/ready'),
  /** 存活检查端点路径 */
  livenessPath: z.string().default('/live'),
  /** 健康检查超时时间（毫秒） */
  timeout: z.number().default(5000),
  /** 优雅关闭超时时间（毫秒） */
  gracefulShutdownTimeout: z.number().default(30000),
  /** 是否在关闭时发送信号 */
  sendFailuresDuringShutdown: z.boolean().default(false),
  /** 自定义响应格式 */
  customResponse: z.boolean().default(false),
  /** 日志配置 */
  logging: z.object({
    /** 是否记录健康检查日志 */
    enabled: z.boolean().default(true),
    /** 是否记录成功的检查 */
    logSuccess: z.boolean().default(false),
    /** 是否记录失败的检查 */
    logFailure: z.boolean().default(true)
  }).default({})
})

export type HealthConfig = z.infer<typeof HealthConfigSchema>

/**
 * 企业级健康检查管理器
 */
export class EnterpriseHealth {
  private config: HealthConfig
  private healthChecks: Map<string, HealthCheckFunction> = new Map()
  private readinessChecks: Map<string, HealthCheckFunction> = new Map()
  private livenessChecks: Map<string, HealthCheckFunction> = new Map()
  private shutdownHandlers: Array<() => Promise<void>> = []
  private isShuttingDown = false

  constructor(config: Partial<HealthConfig> = {}) {
    this.config = HealthConfigSchema.parse(config)
    this.setupDefaultChecks()
  }

  /**
   * 设置默认健康检查
   */
  private setupDefaultChecks(): void {
    // 基础系统检查
    this.addHealthCheck('system', async () => {
      const startTime = Date.now()
      
      try {
        // 检查内存使用率
        const memUsage = process.memoryUsage()
        const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
        
        // 检查 CPU 使用率（简单检查）
        const cpuUsage = process.cpuUsage()
        
        const status = memUsagePercent > 90 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY
        
        return {
          status,
          message: status === HealthStatus.HEALTHY ? 'System is healthy' : 'High memory usage detected',
          details: {
            memory: {
              used: memUsage.heapUsed,
              total: memUsage.heapTotal,
              percentage: Math.round(memUsagePercent * 100) / 100
            },
            cpu: cpuUsage,
            uptime: process.uptime()
          },
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: 'System check failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      }
    })

    // 应用状态检查
    this.addReadinessCheck('application', async () => {
      const startTime = Date.now()
      
      return {
        status: this.isShuttingDown ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY,
        message: this.isShuttingDown ? 'Application is shutting down' : 'Application is ready',
        details: {
          shuttingDown: this.isShuttingDown,
          pid: process.pid,
          nodeVersion: process.version
        },
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    })
  }

  /**
   * 添加健康检查
   */
  addHealthCheck(name: string, checkFn: HealthCheckFunction): void {
    this.healthChecks.set(name, checkFn)
  }

  /**
   * 添加就绪检查
   */
  addReadinessCheck(name: string, checkFn: HealthCheckFunction): void {
    this.readinessChecks.set(name, checkFn)
  }

  /**
   * 添加存活检查
   */
  addLivenessCheck(name: string, checkFn: HealthCheckFunction): void {
    this.livenessChecks.set(name, checkFn)
  }

  /**
   * 添加数据库健康检查
   */
  addDatabaseCheck(name: string, checkConnection: () => Promise<boolean>): void {
    this.addHealthCheck(`database_${name}`, async () => {
      const startTime = Date.now()
      
      try {
        const isConnected = await Promise.race([
          checkConnection(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Database check timeout')), this.config.timeout)
          )
        ])
        
        return {
          status: isConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          message: isConnected ? `Database ${name} is connected` : `Database ${name} is not connected`,
          details: { database: name, connected: isConnected },
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: `Database ${name} check failed`,
          details: { 
            database: name, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      }
    })
  }

  /**
   * 添加外部服务健康检查
   */
  addExternalServiceCheck(name: string, url: string, timeout = 5000): void {
    this.addHealthCheck(`service_${name}`, async () => {
      const startTime = Date.now()
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(url, {
          signal: controller.signal,
          method: 'GET'
        })
        
        clearTimeout(timeoutId)
        
        const isHealthy = response.ok
        
        return {
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          message: isHealthy ? `Service ${name} is available` : `Service ${name} is not available`,
          details: { 
            service: name, 
            url, 
            statusCode: response.status,
            statusText: response.statusText
          },
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: `Service ${name} check failed`,
          details: { 
            service: name, 
            url,
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
          timestamp: new Date(),
          duration: Date.now() - startTime
        }
      }
    })
  }

  /**
   * 执行健康检查
   */
  async runHealthChecks(): Promise<{ status: HealthStatus; checks: Record<string, HealthCheckResult> }> {
    const checks: Record<string, HealthCheckResult> = {}
    let overallStatus = HealthStatus.HEALTHY

    for (const [name, checkFn] of this.healthChecks) {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
          )
        ])
        
        checks[name] = result
        
        if (result.status === HealthStatus.UNHEALTHY) {
          overallStatus = HealthStatus.UNHEALTHY
        } else if (result.status === HealthStatus.DEGRADED && overallStatus === HealthStatus.HEALTHY) {
          overallStatus = HealthStatus.DEGRADED
        }
      } catch (error) {
        checks[name] = {
          status: HealthStatus.UNHEALTHY,
          message: 'Health check failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          duration: this.config.timeout
        }
        overallStatus = HealthStatus.UNHEALTHY
      }
    }

    return { status: overallStatus, checks }
  }

  /**
   * 执行就绪检查
   */
  async runReadinessChecks(): Promise<{ status: HealthStatus; checks: Record<string, HealthCheckResult> }> {
    const checks: Record<string, HealthCheckResult> = {}
    let overallStatus = HealthStatus.HEALTHY

    for (const [name, checkFn] of this.readinessChecks) {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Readiness check timeout')), this.config.timeout)
          )
        ])
        
        checks[name] = result
        
        if (result.status !== HealthStatus.HEALTHY) {
          overallStatus = HealthStatus.UNHEALTHY
        }
      } catch (error) {
        checks[name] = {
          status: HealthStatus.UNHEALTHY,
          message: 'Readiness check failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          duration: this.config.timeout
        }
        overallStatus = HealthStatus.UNHEALTHY
      }
    }

    return { status: overallStatus, checks }
  }

  /**
   * 添加关闭处理器
   */
  addShutdownHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler)
  }

  /**
   * 配置 Terminus 健康检查
   */
  configureTerminus(server: Server): void {
    if (!this.config.enabled) return

    const terminusOptions: TerminusOptions = {
      timeout: this.config.gracefulShutdownTimeout,
      sendFailuresDuringShutdown: this.config.sendFailuresDuringShutdown,
      
      healthChecks: {
        [this.config.healthPath]: () => this.runHealthChecks(),
        [this.config.readinessPath]: () => this.runReadinessChecks(),
        [this.config.livenessPath]: () => this.runHealthChecks()
      },

      onSignal: async () => {
        this.isShuttingDown = true
        console.log('Server is starting cleanup')
        
        // 执行所有关闭处理器
        await Promise.all(this.shutdownHandlers.map(handler => handler()))
      },

      onShutdown: async () => {
        console.log('Cleanup finished, server is shutting down')
      },

      logger: this.config.logging.enabled ? console.log : undefined
    }

    createTerminus(server, terminusOptions)
  }

  /**
   * 获取健康检查摘要
   */
  async getHealthSummary(): Promise<{
    status: HealthStatus
    timestamp: Date
    uptime: number
    checks: {
      health: Record<string, HealthCheckResult>
      readiness: Record<string, HealthCheckResult>
    }
  }> {
    const [healthResult, readinessResult] = await Promise.all([
      this.runHealthChecks(),
      this.runReadinessChecks()
    ])

    const overallStatus = healthResult.status === HealthStatus.UNHEALTHY || 
                         readinessResult.status === HealthStatus.UNHEALTHY
                         ? HealthStatus.UNHEALTHY
                         : healthResult.status

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      checks: {
        health: healthResult.checks,
        readiness: readinessResult.checks
      }
    }
  }
}

/**
 * 默认健康检查实例
 */
export const health = new EnterpriseHealth({
  enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
  gracefulShutdownTimeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '30000')
})

/**
 * 创建健康检查实例
 */
export function createHealth(config?: Partial<HealthConfig>): EnterpriseHealth {
  return new EnterpriseHealth(config)
}
