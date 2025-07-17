/**
 * Extension 性能分析和报告系统
 * 提供生产环境性能监控和异常检测
 */

import { Logger } from '../logger'

import { ExtensionPerformanceMonitor } from './performance-optimizations'
import type { ExtensionManager, ExtensionInstance } from './types'

export interface PerformanceReport {
  extensionId: string
  timestamp: number
  metrics: {
    loadTime: number
    activationTime: number
    memoryUsage: number
    apiCalls: number
    errors: number
    cpuUsage: number
  }
  healthStatus: 'healthy' | 'warning' | 'critical'
  recommendations: string[]
}

export interface SystemPerformanceSnapshot {
  timestamp: number
  totalExtensions: number
  activeExtensions: number
  memoryUsage: {
    total: number
    used: number
    extensions: number
  }
  cpuUsage: number
  healthScore: number
  criticalIssues: string[]
}

export interface PerformanceMonitoringConfig {
  /** 性能监控间隔 (毫秒) */
  monitoringInterval: number
  /** 内存使用阈值 (MB) */
  memoryThreshold: number
  /** CPU使用阈值 (%) */
  cpuThreshold: number
  /** 响应时间阈值 (毫秒) */
  responseTimeThreshold: number
  /** 错误率阈值 (%) */
  errorRateThreshold: number
  /** 健康评分阈值 */
  healthThresholds: {
    healthy: number
    warning: number
    critical: number
  }
}

export const defaultPerformanceConfig: PerformanceMonitoringConfig = {
  monitoringInterval: 60000, // 1分钟
  memoryThreshold: 100, // 100MB
  cpuThreshold: 80, // 80%
  responseTimeThreshold: 1000, // 1秒
  errorRateThreshold: 5, // 5%
  healthThresholds: {
    healthy: 0.8, // 80%
    warning: 0.6, // 60%
    critical: 0.15, // 15%
  },
}

export class ExtensionPerformanceAnalyzer {
  private performanceMonitor: ExtensionPerformanceMonitor
  private config: PerformanceMonitoringConfig

  constructor(
    private extensionManager: ExtensionManager,
    config: Partial<PerformanceMonitoringConfig> = {}
  ) {
    this.config = { ...defaultPerformanceConfig, ...config }
    this.performanceMonitor = new ExtensionPerformanceMonitor()
  }

  /**
   * 生成 Extension 性能报告
   */
  async generateReport(extensionId: string): Promise<PerformanceReport> {
    const metrics = this.performanceMonitor.getMetrics(extensionId)
    const timestamp = Date.now()
    
    if (!metrics) {
      return {
        extensionId,
        timestamp,
        metrics: {
          loadTime: 0,
          activationTime: 0,
          memoryUsage: 0,
          apiCalls: 0,
          errors: 0,
          cpuUsage: 0,
        },
        healthStatus: 'critical',
        recommendations: ['Extension监控数据不可用'],
      }
    }

    const healthStatus = this.calculateHealth(metrics)
    const recommendations = this.generateRecommendations(metrics)

    return {
      extensionId,
      timestamp,
      metrics: {
        loadTime: metrics.loadTime,
        activationTime: metrics.activationTime,
        memoryUsage: metrics.memoryUsage,
        apiCalls: metrics.apiCalls,
        errors: metrics.errors,
        cpuUsage: 0, // CPU监控需要额外实现
      },
      healthStatus,
      recommendations,
    }
  }

  /**
   * 获取系统性能快照
   */
  async getSystemPerformanceSnapshot(): Promise<SystemPerformanceSnapshot> {
    const extensions = this.extensionManager.getAllExtensions()
    const activeExtensions = extensions.filter((ext) => ext.running)
    
    const totalMemory = this.getTotalMemoryUsage()
    const extensionsMemory = this.getExtensionsMemoryUsage()
    const cpuUsage = await this.getSystemCpuUsage()

    const healthScore = this.calculateSystemHealthScore()
    const criticalIssues = await this.detectSystemCriticalIssues()

    return {
      timestamp: Date.now(),
      totalExtensions: extensions.length,
      activeExtensions: activeExtensions.length,
      memoryUsage: {
        total: totalMemory,
        used: process.memoryUsage().heapUsed,
        extensions: extensionsMemory,
      },
      cpuUsage,
      healthScore,
      criticalIssues,
    }
  }

  /**
   * 计算 Extension 健康状态
   */
  private calculateHealth(metrics: { memoryUsage: number; errors: number; loadTime: number; }): 'healthy' | 'warning' | 'critical' {
    let score = 1.0

    // 根据内存使用降低评分
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      score -= 0.3
    }

    // 根据错误率降低评分
    if (metrics.errors > 0) {
      score -= 0.2
    }

    // 根据响应时间降低评分
    if (metrics.loadTime > this.config.responseTimeThreshold) {
      score -= 0.3
    }

    if (score >= this.config.healthThresholds.healthy) {
      return 'healthy'
    } else if (score >= this.config.healthThresholds.warning) {
      return 'warning'
    } else {
      return 'critical'
    }
  }

  /**
   * 生成性能优化建议
   */
  private generateRecommendations(metrics: { memoryUsage: number; loadTime: number; errors: number; apiCalls: number; }): string[] {
    const recommendations: string[] = []

    if (metrics.memoryUsage > this.config.memoryThreshold) {
      recommendations.push('内存使用过高，建议优化内存管理')
    }

    if (metrics.loadTime > this.config.responseTimeThreshold) {
      recommendations.push('加载时间过长，建议优化初始化逻辑')
    }

    if (metrics.errors > 0) {
      recommendations.push('存在错误，建议检查错误处理逻辑')
    }

    if (metrics.apiCalls > 1000) {
      recommendations.push('API调用频率过高，建议实现缓存机制')
    }

    return recommendations
  }

  /**
   * 获取总内存使用量
   */
  private getTotalMemoryUsage(): number {
    return process.memoryUsage().heapTotal
  }

  /**
   * 获取所有 Extension 内存使用总和
   */
  private getExtensionsMemoryUsage(): number {
    const allMetrics = this.performanceMonitor.getAllMetrics()
    
    return Object.values(allMetrics).reduce((total: number, metrics: { memoryUsage?: number }) => {
      return total + (metrics.memoryUsage || 0)
    }, 0)
  }

  /**
   * 获取系统 CPU 使用率
   */
  private async getSystemCpuUsage(): Promise<number> {
    // 简化的CPU监控实现
    return 0
  }

  /**
   * 计算系统健康评分
   */
  private calculateSystemHealthScore(): number {
    const extensions = this.extensionManager.getAllExtensions()
    if (extensions.length === 0) return 100

    const reports = extensions.map((ext: ExtensionInstance) => {
      try {
        const metrics = this.performanceMonitor.getMetrics(ext.metadata.id)
        return metrics ? this.calculateHealth(metrics) : 'healthy'
      } catch {
        return 'critical'
      }
    })

    const healthyCount = reports.filter((h: string) => h === 'healthy').length
    const warningCount = reports.filter((h: string) => h === 'warning').length
    const criticalCount = reports.filter((h: string) => h === 'critical').length

    return Math.round(
      (healthyCount * 100 + warningCount * 60 + criticalCount * 20) / extensions.length
    )
  }

  /**
   * 检测系统关键问题
   */
  private async detectSystemCriticalIssues(): Promise<string[]> {
    const issues: string[] = []

    // 检查内存使用
    const memoryUsage = process.memoryUsage()
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      issues.push('系统内存使用过高')
    }

    // 检查 Extension 失败率
    const extensions = this.extensionManager.getAllExtensions()
    const failedExtensions = extensions.filter((ext: ExtensionInstance) => {
      try {
        return !ext.running
      } catch {
        return true
      }
    })

    if (failedExtensions.length > extensions.length * 0.3) {
      issues.push('Extension失败率过高')
    }

    return issues
  }

  /**
   * 启动性能监控
   */
  startMonitoring(): void {
    setInterval(() => {
      this.performPerformanceCheck()
    }, this.config.monitoringInterval)

    Logger.info('Extension性能监控已启动', {
      interval: this.config.monitoringInterval,
      config: this.config,
    })
  }

  /**
   * 执行性能检查
   */
  private async performPerformanceCheck(): Promise<void> {
    try {
      const snapshot = await this.getSystemPerformanceSnapshot()
      
      if (snapshot.healthScore < this.config.healthThresholds.warning * 100) {
        Logger.warn('系统性能警告', {
          healthScore: snapshot.healthScore,
          criticalIssues: snapshot.criticalIssues,
          snapshot,
        })
      }

      if (snapshot.criticalIssues.length > 0) {
        Logger.error('发现系统关键问题', undefined, {
          criticalIssues: snapshot.criticalIssues,
          healthScore: snapshot.healthScore,
          timestamp: snapshot.timestamp,
        })
      }
    } catch (error) {
      Logger.error('性能检查失败', error instanceof Error ? error : undefined, {
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
}