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
  health: 'healthy' | 'warning' | 'critical'
  issues: string[]
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
    config: Partial<PerformanceMonitoringConfig> = {},
    performanceMonitor?: ExtensionPerformanceMonitor
  ) {
    this.config = { ...defaultPerformanceConfig, ...config }
    this.performanceMonitor = performanceMonitor || 
      (extensionManager as any).getPerformanceMonitor?.() || 
      new ExtensionPerformanceMonitor()
  }

  /**
   * 生成 Extension 性能报告
   */
  async generateReport(extensionId: string): Promise<PerformanceReport> {
    const metrics = this.performanceMonitor.getMetrics(extensionId)
    const timestamp = Date.now()
    
    if (!metrics) {
      throw new Error(`Extension ${extensionId} metrics not found`)
    }

    const healthStatus = this.calculateHealth(metrics)
    const recommendations = this.generateRecommendations(metrics)
    const issues = this.generateIssues(metrics)

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
      health: healthStatus,
      issues,
      recommendations,
    }
  }

  /**
   * 生成Extension性能报告（别名方法）
   */
  async generatePerformanceReport(extensionId: string): Promise<PerformanceReport> {
    return this.generateReport(extensionId)
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
  private calculateHealth(metrics: { memoryUsage: number; errors: number; loadTime: number; apiCalls?: number; }): 'healthy' | 'warning' | 'critical' {
    let score = 1.0

    // 根据内存使用降低评分 (阈值单位为MB，需要转换)
    const memoryThresholdBytes = this.config.memoryThreshold * 1024 * 1024
    if (metrics.memoryUsage > memoryThresholdBytes) {
      score -= 0.3
    }

    // 根据错误率降低评分
    if (metrics.errors > 0) {
      const apiCalls = metrics.apiCalls || 1
      const errorRate = (metrics.errors / apiCalls) * 100
      
      if (errorRate > this.config.errorRateThreshold) {
        score -= 0.4 // 高错误率影响更大
      } else if (metrics.errors > 0) {
        score -= 0.1 // 有错误但错误率不高
      }
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
   * 生成性能问题列表
   */
  private generateIssues(metrics: { memoryUsage: number; loadTime: number; errors: number; apiCalls: number; }): string[] {
    const issues: string[] = []
    const memoryThresholdBytes = this.config.memoryThreshold * 1024 * 1024

    if (metrics.memoryUsage > memoryThresholdBytes) {
      issues.push(`内存使用过高: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`)
    }

    if (metrics.loadTime > this.config.responseTimeThreshold) {
      issues.push(`加载时间过长: ${metrics.loadTime}ms`)
    }

    if (metrics.errors > 0) {
      const apiCalls = metrics.apiCalls || 1
      const errorRate = (metrics.errors / apiCalls) * 100
      
      if (errorRate > this.config.errorRateThreshold) {
        issues.push(`错误率过高: ${errorRate.toFixed(1)}% (${metrics.errors}/${apiCalls})`)
      } else {
        issues.push(`存在错误: ${metrics.errors}个`)
      }
    }

    return issues
  }

  /**
   * 生成性能优化建议
   */
  private generateRecommendations(metrics: { memoryUsage: number; loadTime: number; errors: number; apiCalls: number; activationTime?: number; }): string[] {
    const recommendations: string[] = []
    const memoryThresholdBytes = this.config.memoryThreshold * 1024 * 1024

    if (metrics.memoryUsage > memoryThresholdBytes) {
      recommendations.push('检查内存泄漏并优化数据结构')
      recommendations.push('考虑实现对象池和缓存回收机制')
    }

    if (metrics.loadTime > this.config.responseTimeThreshold) {
      recommendations.push('建议使用延迟加载减少初始加载时间')
      recommendations.push('优化初始化逻辑，减少同步初始化操作')
    }

    // 处理激活时间（假设阈值为500ms）
    if (metrics.activationTime && metrics.activationTime > 500) {
      recommendations.push('使用异步激活策略提高响应性能')
      recommendations.push('考虑分阶段激活，减少阻塞时间')
    }

    if (metrics.errors > 0) {
      recommendations.push('完善错误处理逻辑，增加容错机制')
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
    try {
      // 简化的CPU监控实现 - 返回基于性能监控数据的估算
      const allMetrics = this.performanceMonitor.getAllMetrics()
      const activeExtensions = Object.keys(allMetrics)
      
      if (activeExtensions.length === 0) return 0
      
      // 基于Extension数量和性能指标估算CPU使用率
      let cpuEstimate = 0
      
      for (const extensionId of activeExtensions) {
        const metrics = allMetrics[extensionId]
        if (metrics) {
          // 基于API调用频率、错误率等估算CPU占用
          const apiCallsCpuWeight = (metrics.apiCalls || 0) * 0.1
          const errorsCpuWeight = (metrics.errors || 0) * 0.5
          const memoryWeight = (metrics.memoryUsage || 0) / (1024 * 1024) * 0.01
          
          cpuEstimate += apiCallsCpuWeight + errorsCpuWeight + memoryWeight
        }
      }
      
      // 限制在合理范围内
      return Math.min(Math.max(cpuEstimate, 0), 100)
    } catch (error) {
      return 0
    }
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