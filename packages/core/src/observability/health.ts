/**
 * 基于 @godaddy/terminus 的健康检查系统适配器
 * @module observability/health
 */

import { Server } from 'http'

import { createTerminus, TerminusOptions, HealthCheckError } from '@godaddy/terminus'

import type { 
  HealthChecker, 
  HealthMonitor, 
  HealthStatus 
} from '../types'

import { logger } from './logger'

/**
 * LinchKit 健康监控器
 * 基于 @godaddy/terminus 提供优雅关闭和健康检查
 */
export class LinchKitHealthMonitor implements HealthMonitor {
  private checkers = new Map<string, HealthChecker>()
  private isStarted = false

  addChecker(checker: HealthChecker): void {
    if (this.isStarted) {
      logger.warn('Adding health checker after monitor started', { checkerName: checker.name })
    }
    this.checkers.set(checker.name, checker)
    logger.debug('Health checker added', { checkerName: checker.name })
  }

  removeChecker(name: string): void {
    const removed = this.checkers.delete(name)
    if (removed) {
      logger.debug('Health checker removed', { checkerName: name })
    }
  }

  async checkAll(): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {}
    
    const checkPromises = Array.from(this.checkers.entries()).map(async ([name, checker]) => {
      try {
        const timeoutPromise = checker.timeout 
          ? this.withTimeout(checker.check(), checker.timeout)
          : checker.check()
        
        const status = await timeoutPromise
        results[name] = status
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
      }
    })

    await Promise.allSettled(checkPromises)
    return results
  }

  async check(name: string): Promise<HealthStatus | undefined> {
    const checker = this.checkers.get(name)
    if (!checker) {
      return undefined
    }

    try {
      const timeoutPromise = checker.timeout 
        ? this.withTimeout(checker.check(), checker.timeout)
        : checker.check()
      
      return await timeoutPromise
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    }
  }

  async getOverallHealth(): Promise<HealthStatus> {
    const results = await this.checkAll()
    const statuses = Object.values(results)
    
    const hasUnhealthy = statuses.some(s => s.status === 'unhealthy')
    const hasDegraded = statuses.some(s => s.status === 'degraded')
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
    if (hasUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (hasDegraded) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }
    
    return {
      status: overallStatus,
      message: `${statuses.length} checks completed`,
      details: results,
      timestamp: Date.now()
    }
  }

  start(): void {
    this.isStarted = true
    logger.info('Health monitor started', { 
      checkersCount: this.checkers.size 
    })
  }

  stop(): void {
    this.isStarted = false
    logger.info('Health monitor stopped')
  }

  /**
   * 设置服务器的优雅关闭
   */
  setupGracefulShutdown(server: Server, options: Partial<TerminusOptions> = {}): void {
    const terminusOptions: TerminusOptions = {
      signal: 'SIGTERM',
      timeout: 5000,
      ...options,
      
      // 健康检查端点
      healthChecks: {
        '/health': async () => {
          const overall = await this.getOverallHealth()
          if (overall.status === 'unhealthy') {
            throw new HealthCheckError('Health check failed', overall.details)
          }
          return overall
        },
        '/ready': async () => {
          const results = await this.checkAll()
          const ready = Object.values(results).every(s => s.status !== 'unhealthy')
          if (!ready) {
            throw new HealthCheckError('Readiness check failed', results)
          }
          return { status: 'ready', timestamp: Date.now() }
        }
      },

      // 优雅关闭处理
      onSignal: async () => {
        logger.info('Server is starting cleanup')
        this.stop()
        if (options.onSignal) {
          await options.onSignal()
        }
      },

      onShutdown: async () => {
        logger.info('Cleanup finished, server is shutting down')
        if (options.onShutdown) {
          await options.onShutdown()
        }
      },

      // 错误处理
      onSendFailureDuringShutdown: async () => {
        logger.error('Failed to send response during shutdown')
        if (options.onSendFailureDuringShutdown) {
          await options.onSendFailureDuringShutdown()
        }
      }
    }

    createTerminus(server, terminusOptions)
    logger.info('Graceful shutdown configured')
  }

  /**
   * 获取所有检查器名称
   */
  getCheckerNames(): string[] {
    return Array.from(this.checkers.keys())
  }

  /**
   * 超时控制
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Health check timed out after ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  }
}

/**
 * 健康监控配置
 */
export interface HealthMonitorConfig {
  gracefulShutdown?: {
    enabled?: boolean
    timeout?: number
    signals?: string[]
  }
  endpoints?: {
    health?: string
    ready?: string
  }
}

/**
 * 创建健康监控器
 */
export function createHealthMonitor(_config: HealthMonitorConfig = {}): HealthMonitor {
  return new LinchKitHealthMonitor()
}

/**
 * 内置健康检查器
 */
export const builtinCheckers = {
  /**
   * 内存使用检查器
   */
  memory: (threshold = 0.9): HealthChecker => ({
    name: 'memory',
    timeout: 1000,
    async check(): Promise<HealthStatus> {
      const usage = process.memoryUsage()
      const usedRatio = usage.heapUsed / usage.heapTotal
      
      if (usedRatio > threshold) {
        return {
          status: 'unhealthy',
          message: `Memory usage too high: ${(usedRatio * 100).toFixed(1)}%`,
          details: { usage, threshold },
          timestamp: Date.now()
        }
      }
      
      if (usedRatio > threshold * 0.8) {
        return {
          status: 'degraded',
          message: `Memory usage elevated: ${(usedRatio * 100).toFixed(1)}%`,
          details: { usage, threshold },
          timestamp: Date.now()
        }
      }
      
      return {
        status: 'healthy',
        message: `Memory usage normal: ${(usedRatio * 100).toFixed(1)}%`,
        details: { usage, threshold },
        timestamp: Date.now()
      }
    }
  }),

  /**
   * 磁盘空间检查器
   */
  disk: (path = '/', threshold = 0.9): HealthChecker => ({
    name: 'disk',
    timeout: 2000,
    async check(): Promise<HealthStatus> {
      try {
        const fs = await import('fs')
        const stats = await fs.promises.statfs(path)
        const usedRatio = (stats.blocks - stats.bavail) / stats.blocks
        
        if (usedRatio > threshold) {
          return {
            status: 'unhealthy',
            message: `Disk usage too high: ${(usedRatio * 100).toFixed(1)}%`,
            details: { path, usedRatio, threshold },
            timestamp: Date.now()
          }
        }
        
        return {
          status: 'healthy',
          message: `Disk usage normal: ${(usedRatio * 100).toFixed(1)}%`,
          details: { path, usedRatio, threshold },
          timestamp: Date.now()
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          message: `Failed to check disk usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        }
      }
    }
  })
}

/**
 * 默认健康监控器实例
 */
export const health = createHealthMonitor()