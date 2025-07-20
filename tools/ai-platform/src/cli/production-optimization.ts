/**
 * 生产就绪优化
 * 错误处理增强、性能优化、监控集成
 * 
 * @version 1.0.0 - Phase 2 生产优化
 */

import { createLogger } from '@linch-kit/core'
import type { StartCommandResult } from './start-command-handler'
import type { EnhancedStartResponse } from './enhanced-start-integration'

const logger = createLogger('production-optimization')

export interface ProductionConfig {
  // 错误处理配置
  errorHandling: {
    maxRetries: number
    retryDelayMs: number
    timeoutMs: number
    fallbackToBasicMode: boolean
  }
  
  // 性能配置
  performance: {
    enableCaching: boolean
    cacheTimeoutMs: number
    maxConcurrentOperations: number
    healthCheckIntervalMs: number
  }
  
  // 监控配置
  monitoring: {
    enableMetrics: boolean
    enableTracing: boolean
    metricsExportIntervalMs: number
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  
  // 降级配置
  fallback: {
    enableGraphRAGFallback: boolean
    enableAIFallback: boolean
    basicModeComponents: string[]
  }
}

export interface PerformanceMetrics {
  startTime: number
  endTime: number
  duration: number
  memoryUsage: {
    initial: number
    peak: number
    final: number
  }
  operationCounts: {
    graphRAGQueries: number
    aiCalls: number
    guardianValidations: number
    stateTransitions: number
  }
  errorCounts: {
    total: number
    byComponent: Record<string, number>
    byType: Record<string, number>
  }
  cacheStats?: {
    hits: number
    misses: number
    hitRate: number
  }
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    claudeCodeAPI: 'up' | 'down' | 'degraded'
    workflowStateMachine: 'up' | 'down' | 'degraded'
    graphRAG: 'up' | 'down' | 'degraded'
    aiGuardian: 'up' | 'down' | 'degraded'
    aiProviders: 'up' | 'down' | 'degraded'
  }
  lastCheck: string
  uptime: number
}

/**
 * 生产优化管理器
 */
export class ProductionOptimizationManager {
  private config: ProductionConfig
  private metrics: PerformanceMetrics
  private healthStatus: HealthStatus
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private startTime: number

  constructor(config?: Partial<ProductionConfig>) {
    this.startTime = Date.now()
    this.config = this.mergeConfig(config)
    this.metrics = this.initializeMetrics()
    this.healthStatus = this.initializeHealth()
    
    logger.info('Production optimization manager initialized', { config: this.config })
  }

  /**
   * 合并配置
   */
  private mergeConfig(userConfig?: Partial<ProductionConfig>): ProductionConfig {
    const defaultConfig: ProductionConfig = {
      errorHandling: {
        maxRetries: 3,
        retryDelayMs: 1000,
        timeoutMs: 30000,
        fallbackToBasicMode: true
      },
      performance: {
        enableCaching: true,
        cacheTimeoutMs: 300000, // 5分钟
        maxConcurrentOperations: 5,
        healthCheckIntervalMs: 60000 // 1分钟
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        metricsExportIntervalMs: 30000, // 30秒
        logLevel: 'info'
      },
      fallback: {
        enableGraphRAGFallback: true,
        enableAIFallback: true,
        basicModeComponents: ['claudeCodeAPI', 'workflowStateMachine']
      }
    }

    return this.deepMerge(defaultConfig, userConfig || {})
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target }
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      memoryUsage: {
        initial: this.getMemoryUsage(),
        peak: 0,
        final: 0
      },
      operationCounts: {
        graphRAGQueries: 0,
        aiCalls: 0,
        guardianValidations: 0,
        stateTransitions: 0
      },
      errorCounts: {
        total: 0,
        byComponent: {},
        byType: {}
      }
    }
  }

  /**
   * 初始化健康状态
   */
  private initializeHealth(): HealthStatus {
    return {
      overall: 'healthy',
      components: {
        claudeCodeAPI: 'up',
        workflowStateMachine: 'up',
        graphRAG: 'up',
        aiGuardian: 'up',
        aiProviders: 'up'
      },
      lastCheck: new Date().toISOString(),
      uptime: 0
    }
  }

  /**
   * 获取内存使用量（MB）
   */
  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage()
    return Math.round(memUsage.heapUsed / 1024 / 1024)
  }

  /**
   * 增强错误处理的执行器
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    component: string
  ): Promise<T> {
    let lastError: Error | null = null
    let attempts = 0

    while (attempts < this.config.errorHandling.maxRetries) {
      try {
        attempts++
        logger.debug(`Executing ${operationName} (attempt ${attempts})`)

        // 设置超时
        const result = await Promise.race([
          operation(),
          this.createTimeoutPromise(this.config.errorHandling.timeoutMs)
        ])

        logger.debug(`${operationName} completed successfully`)
        return result as T

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        this.recordError(component, lastError.message)
        
        logger.warn(`${operationName} failed (attempt ${attempts}):`, {
          error: lastError.message,
          component,
          attempts
        })

        // 如果不是最后一次尝试，等待后重试
        if (attempts < this.config.errorHandling.maxRetries) {
          await this.delay(this.config.errorHandling.retryDelayMs * attempts)
        }
      }
    }

    // 所有重试都失败了
    this.updateComponentHealth(component, 'down')
    
    if (this.config.errorHandling.fallbackToBasicMode) {
      logger.info(`Falling back to basic mode for ${component}`)
      throw new Error(`${operationName} failed after ${attempts} attempts, falling back to basic mode: ${lastError?.message}`)
    }

    throw lastError || new Error(`${operationName} failed after ${attempts} attempts`)
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 缓存操作
   */
  async getCachedOrExecute<T>(
    key: string,
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (!this.config.performance.enableCaching) {
      return operation()
    }

    // 检查缓存
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.config.performance.cacheTimeoutMs) {
      logger.debug(`Cache hit for ${operationName}`, { key })
      return cached.data as T
    }

    // 执行操作并缓存结果
    logger.debug(`Cache miss for ${operationName}, executing`, { key })
    const result = await operation()
    
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * 记录错误
   */
  recordError(component: string, errorType: string): void {
    this.metrics.errorCounts.total++
    this.metrics.errorCounts.byComponent[component] = 
      (this.metrics.errorCounts.byComponent[component] || 0) + 1
    this.metrics.errorCounts.byType[errorType] = 
      (this.metrics.errorCounts.byType[errorType] || 0) + 1
  }

  /**
   * 记录操作
   */
  recordOperation(type: keyof PerformanceMetrics['operationCounts']): void {
    this.metrics.operationCounts[type]++
    
    // 更新峰值内存使用
    const currentMemory = this.getMemoryUsage()
    if (currentMemory > this.metrics.memoryUsage.peak) {
      this.metrics.memoryUsage.peak = currentMemory
    }
  }

  /**
   * 更新组件健康状态
   */
  updateComponentHealth(component: keyof HealthStatus['components'], status: 'up' | 'down' | 'degraded'): void {
    this.healthStatus.components[component] = status
    this.healthStatus.lastCheck = new Date().toISOString()
    
    // 更新整体状态
    const componentStatuses = Object.values(this.healthStatus.components)
    if (componentStatuses.some(s => s === 'down')) {
      this.healthStatus.overall = 'unhealthy'
    } else if (componentStatuses.some(s => s === 'degraded')) {
      this.healthStatus.overall = 'degraded'
    } else {
      this.healthStatus.overall = 'healthy'
    }

    logger.info('Component health updated', {
      component,
      status,
      overallHealth: this.healthStatus.overall
    })
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics
    health: HealthStatus
    recommendations: string[]
  } {
    // 完成指标计算
    this.metrics.endTime = Date.now()
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime
    this.metrics.memoryUsage.final = this.getMemoryUsage()
    this.healthStatus.uptime = Date.now() - this.startTime

    // 生成建议
    const recommendations = this.generateRecommendations()

    return {
      metrics: this.metrics,
      health: this.healthStatus,
      recommendations
    }
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // 错误率检查
    const totalOps = Object.values(this.metrics.operationCounts).reduce((a, b) => a + b, 0)
    if (totalOps > 0) {
      const errorRate = this.metrics.errorCounts.total / totalOps
      if (errorRate > 0.1) {
        recommendations.push(`高错误率检测 (${Math.round(errorRate * 100)}%)，建议检查系统健康状态`)
      }
    }

    // 内存使用检查
    const memoryIncrease = this.metrics.memoryUsage.final - this.metrics.memoryUsage.initial
    if (memoryIncrease > 100) { // 100MB
      recommendations.push(`内存使用增长较大 (+${memoryIncrease}MB)，建议检查内存泄漏`)
    }

    // 执行时间检查
    if (this.metrics.duration > 30000) { // 30秒
      recommendations.push(`执行时间过长 (${this.metrics.duration}ms)，建议优化性能`)
    }

    // 组件健康检查
    const unhealthyComponents = Object.entries(this.healthStatus.components)
      .filter(([_, status]) => status !== 'up')
      .map(([component, _]) => component)
    
    if (unhealthyComponents.length > 0) {
      recommendations.push(`组件健康问题: ${unhealthyComponents.join(', ')}`)
    }

    return recommendations
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
    logger.info('Cache cleared')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.clearCache()
    logger.info('Production optimization manager cleaned up')
  }
}

/**
 * 增强结果处理
 */
export function enhanceResultWithProduction(
  result: StartCommandResult | EnhancedStartResponse,
  performanceReport: ReturnType<ProductionOptimizationManager['getPerformanceReport']>
): EnhancedStartResponse {
  const enhanced = result as EnhancedStartResponse

  // 如果没有enhancedMetadata，创建一个
  if (!enhanced.enhancedMetadata) {
    enhanced.enhancedMetadata = {
      workflowVersion: 'Phase 2 v1.0.0',
      integrationLevel: 'full',
      aiProviders: [],
      systemHealth: {
        claudeCodeAPI: true,
        workflowStateMachine: true,
        graphRAG: true,
        aiGuardian: true
      },
      performanceMetrics: {
        totalTime: result.executionTime
      }
    }
  }

  // 添加生产指标
  enhanced.enhancedMetadata.performanceMetrics = {
    ...enhanced.enhancedMetadata.performanceMetrics,
    ...performanceReport.metrics,
    totalTime: performanceReport.metrics.duration
  }

  // 添加健康状态
  enhanced.enhancedMetadata.systemHealth = {
    claudeCodeAPI: performanceReport.health.components.claudeCodeAPI === 'up',
    workflowStateMachine: performanceReport.health.components.workflowStateMachine === 'up',
    graphRAG: performanceReport.health.components.graphRAG === 'up',
    aiGuardian: performanceReport.health.components.aiGuardian === 'up'
  }

  // 添加建议到错误信息或新字段
  if (performanceReport.recommendations.length > 0) {
    ;(enhanced as any).productionRecommendations = performanceReport.recommendations
  }

  return enhanced
}

/**
 * 便捷函数：创建生产优化管理器
 */
export function createProductionManager(config?: Partial<ProductionConfig>): ProductionOptimizationManager {
  return new ProductionOptimizationManager(config)
}