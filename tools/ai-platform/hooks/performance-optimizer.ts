#!/usr/bin/env bun

/**
 * Claude Code Hooks 性能优化层
 * 
 * 提供缓存、并行执行、批处理等性能优化功能
 * 确保 Hooks 执行时间保持在可接受范围内
 */

import { createLogger } from '@linch-kit/core'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const logger = createLogger('hook-performance-optimizer')

// LRU Cache 实现
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private readonly maxSize: number
  private readonly ttl: number
  private timers = new Map<K, NodeJS.Timeout>()

  constructor(maxSize: number = 100, ttl: number = 15 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value) {
      // 刷新 TTL
      this.refreshTTL(key)
      // 移到末尾表示最近访问
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
      this.clearTimer(key)
    }

    // 如果缓存满了，删除最老的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      this.clearTimer(firstKey)
    }

    this.cache.set(key, value)
    this.setTimer(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    this.clearTimer(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  private setTimer(key: K): void {
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, this.ttl)
    this.timers.set(key, timer)
  }

  private clearTimer(key: K): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  private refreshTTL(key: K): void {
    this.clearTimer(key)
    this.setTimer(key)
  }
}

// Hook 执行结果
interface HookResult {
  success: boolean
  suggestions: string[]
  constraints: string[]
  metadata: Record<string, any>
  executionTime: number
  cached: boolean
}

// Hook 执行上下文
interface HookContext {
  toolName: string
  filePath?: string
  operation: string
  workflowState?: string
}

// 性能指标
interface PerformanceMetrics {
  totalExecutions: number
  cacheHits: number
  averageExecutionTime: number
  maxExecutionTime: number
  minExecutionTime: number
  errorCount: number
  lastReset: number
}

/**
 * Hook 性能优化器
 */
export class HookPerformanceOptimizer {
  private cache: LRUCache<string, HookResult>
  private batchQueue: Array<{ context: HookContext; resolver: (result: HookResult) => void }>
  private batchTimeout: NodeJS.Timeout | null = null
  private metrics: PerformanceMetrics
  private metricsPath: string

  constructor(
    cacheSize: number = 100,
    cacheTTL: number = 15 * 60 * 1000,
    batchDelay: number = 100
  ) {
    this.cache = new LRUCache(cacheSize, cacheTTL)
    this.batchQueue = []
    this.metricsPath = join('.linchkit', 'hook-performance-metrics.json')
    this.metrics = this.loadMetrics()
    
    logger.info(`🚀 Hook 性能优化器初始化 - 缓存大小: ${cacheSize}, TTL: ${cacheTTL}ms`)
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(context: HookContext): string {
    const keyParts = [
      context.toolName,
      context.operation,
      context.workflowState || 'unknown',
      this.getFilePattern(context.filePath)
    ]
    
    return keyParts.join(':')
  }

  /**
   * 提取文件模式（用于缓存键生成）
   */
  private getFilePattern(filePath?: string): string {
    if (!filePath) return 'no-file'

    // 提取文件类型和目录模式
    const parts = filePath.split('/')
    const fileName = parts[parts.length - 1]
    const extension = fileName.split('.').pop() || 'unknown'
    
    // 检查是否是特殊目录
    if (filePath.includes('/components/')) return `component.${extension}`
    if (filePath.includes('/api/')) return `api.${extension}`
    if (filePath.includes('/hooks/')) return `hook.${extension}`
    if (filePath.includes('/utils/')) return `util.${extension}`
    if (filePath.includes('/types/')) return `type.${extension}`
    if (filePath.includes('/test/') || fileName.includes('.test.')) return `test.${extension}`
    
    return `general.${extension}`
  }

  /**
   * 优化的 Hook 执行器
   */
  async executeOptimized(
    context: HookContext,
    hookFunction: (context: HookContext) => Promise<HookResult>
  ): Promise<HookResult> {
    const startTime = Date.now()
    const cacheKey = this.getCacheKey(context)

    try {
      // 1. 检查缓存
      if (this.cache.has(cacheKey)) {
        const cachedResult = this.cache.get(cacheKey)!
        this.updateMetrics(Date.now() - startTime, true, false)
        
        logger.debug(`⚡ 缓存命中: ${cacheKey}`)
        return {
          ...cachedResult,
          cached: true,
          executionTime: Date.now() - startTime
        }
      }

      // 2. 执行 Hook 函数
      const result = await hookFunction(context)
      const executionTime = Date.now() - startTime

      // 3. 缓存结果（如果执行成功）
      if (result.success) {
        const cacheableResult = {
          ...result,
          executionTime,
          cached: false
        }
        this.cache.set(cacheKey, cacheableResult)
        logger.debug(`💾 结果已缓存: ${cacheKey}`)
      }

      // 4. 更新性能指标
      this.updateMetrics(executionTime, false, false)

      return {
        ...result,
        executionTime,
        cached: false
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.updateMetrics(executionTime, false, true)
      
      logger.error(`❌ Hook 执行失败: ${error.message}`)
      
      return {
        success: false,
        suggestions: [],
        constraints: [`执行错误: ${error.message}`],
        metadata: { error: error.message },
        executionTime,
        cached: false
      }
    }
  }

  /**
   * 批处理执行器（用于并发优化）
   */
  async executeBatched(
    context: HookContext,
    hookFunction: (context: HookContext) => Promise<HookResult>
  ): Promise<HookResult> {
    return new Promise((resolve) => {
      // 添加到批处理队列
      this.batchQueue.push({ context, resolver: resolve })

      // 如果是第一个请求，设置批处理延迟
      if (this.batchTimeout === null) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch(hookFunction)
        }, 100) // 100ms 批处理延迟
      }
    })
  }

  /**
   * 处理批处理队列
   */
  private async processBatch(hookFunction: (context: HookContext) => Promise<HookResult>) {
    const currentBatch = [...this.batchQueue]
    this.batchQueue.length = 0
    this.batchTimeout = null

    logger.debug(`🔄 处理批处理: ${currentBatch.length} 个请求`)

    // 并行执行所有请求
    const promises = currentBatch.map(async ({ context, resolver }) => {
      try {
        const result = await this.executeOptimized(context, hookFunction)
        resolver(result)
      } catch (error) {
        resolver({
          success: false,
          suggestions: [],
          constraints: [`批处理执行错误: ${error.message}`],
          metadata: { error: error.message },
          executionTime: 0,
          cached: false
        })
      }
    })

    await Promise.all(promises)
  }

  /**
   * 预热缓存
   */
  async warmupCache(commonContexts: HookContext[], hookFunction: (context: HookContext) => Promise<HookResult>) {
    logger.info(`🔥 预热缓存: ${commonContexts.length} 个常见上下文`)

    const promises = commonContexts.map(context => 
      this.executeOptimized(context, hookFunction).catch(error => {
        logger.warn(`预热失败: ${error.message}`)
        return null
      })
    )

    const results = await Promise.all(promises)
    const successCount = results.filter(r => r?.success).length

    logger.info(`✅ 缓存预热完成: ${successCount}/${commonContexts.length} 成功`)
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(executionTime: number, cacheHit: boolean, error: boolean) {
    this.metrics.totalExecutions++
    
    if (cacheHit) {
      this.metrics.cacheHits++
    }
    
    if (error) {
      this.metrics.errorCount++
    }

    // 更新执行时间统计
    if (!cacheHit && !error) {
      if (this.metrics.totalExecutions === 1) {
        this.metrics.averageExecutionTime = executionTime
        this.metrics.maxExecutionTime = executionTime
        this.metrics.minExecutionTime = executionTime
      } else {
        // 计算加权平均
        const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + executionTime
        this.metrics.averageExecutionTime = totalTime / this.metrics.totalExecutions
        
        this.metrics.maxExecutionTime = Math.max(this.metrics.maxExecutionTime, executionTime)
        this.metrics.minExecutionTime = Math.min(this.metrics.minExecutionTime, executionTime)
      }
    }

    // 定期保存指标
    if (this.metrics.totalExecutions % 10 === 0) {
      this.saveMetrics()
    }
  }

  /**
   * 加载性能指标
   */
  private loadMetrics(): PerformanceMetrics {
    try {
      if (existsSync(this.metricsPath)) {
        const data = JSON.parse(readFileSync(this.metricsPath, 'utf8'))
        return {
          ...data,
          lastReset: data.lastReset || Date.now()
        }
      }
    } catch (error) {
      logger.warn(`加载性能指标失败: ${error.message}`)
    }

    return {
      totalExecutions: 0,
      cacheHits: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      errorCount: 0,
      lastReset: Date.now()
    }
  }

  /**
   * 保存性能指标
   */
  private saveMetrics() {
    try {
      const dir = join('.linchkit')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2))
    } catch (error) {
      logger.warn(`保存性能指标失败: ${error.message}`)
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics
    cacheStats: {
      size: number
      hitRate: number
    }
    recommendations: string[]
  } {
    const hitRate = this.metrics.totalExecutions > 0 
      ? (this.metrics.cacheHits / this.metrics.totalExecutions) * 100 
      : 0

    const recommendations: string[] = []

    // 性能建议
    if (this.metrics.averageExecutionTime > 5000) {
      recommendations.push('平均执行时间过长，考虑优化 Hook 逻辑')
    }
    
    if (hitRate < 30) {
      recommendations.push('缓存命中率较低，考虑增加缓存大小或调整缓存策略')
    }
    
    if (this.metrics.errorCount > this.metrics.totalExecutions * 0.1) {
      recommendations.push('错误率较高，需要检查 Hook 实现的稳定性')
    }

    if (this.cache.size() > 80) {
      recommendations.push('缓存使用率较高，考虑增加缓存大小')
    }

    return {
      metrics: this.metrics,
      cacheStats: {
        size: this.cache.size(),
        hitRate
      },
      recommendations
    }
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear()
    logger.info('🗑️ 缓存已清理')
  }

  /**
   * 重置性能指标
   */
  resetMetrics() {
    this.metrics = {
      totalExecutions: 0,
      cacheHits: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      errorCount: 0,
      lastReset: Date.now()
    }
    this.saveMetrics()
    logger.info('📊 性能指标已重置')
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    
    this.cache.clear()
    this.saveMetrics()
  }
}

// CLI 入口用于管理和监控
if (import.meta.main) {
  const optimizer = new HookPerformanceOptimizer()
  const command = process.argv[2]

  switch (command) {
    case 'report':
      const report = optimizer.getPerformanceReport()
      console.log('📊 Hook 性能报告:')
      console.log(JSON.stringify(report, null, 2))
      break

    case 'clear-cache':
      optimizer.clearCache()
      console.log('✅ 缓存已清理')
      break

    case 'reset-metrics':
      optimizer.resetMetrics()
      console.log('✅ 性能指标已重置')
      break

    case 'warmup':
      // 预定义的常见上下文
      const commonContexts = [
        { toolName: 'Edit', operation: 'Edit', filePath: 'src/components/Button.tsx', workflowState: 'IMPLEMENT' },
        { toolName: 'Edit', operation: 'Edit', filePath: 'src/api/users.ts', workflowState: 'IMPLEMENT' },
        { toolName: 'Edit', operation: 'Edit', filePath: 'src/hooks/useAuth.ts', workflowState: 'IMPLEMENT' },
        { toolName: 'Edit', operation: 'Edit', filePath: 'src/utils/helpers.ts', workflowState: 'IMPLEMENT' }
      ]

      // 模拟 Hook 函数
      const mockHookFunction = async (context: HookContext) => ({
        success: true,
        suggestions: [`模拟建议 for ${context.filePath}`],
        constraints: [`模拟约束 for ${context.operation}`],
        metadata: { mock: true },
        executionTime: 0,
        cached: false
      })

      optimizer.warmupCache(commonContexts, mockHookFunction).then(() => {
        console.log('✅ 缓存预热完成')
      })
      break

    default:
      console.log('🚀 HookPerformanceOptimizer CLI')
      console.log('用法:')
      console.log('  bun performance-optimizer.ts report        - 查看性能报告')
      console.log('  bun performance-optimizer.ts clear-cache   - 清理缓存')
      console.log('  bun performance-optimizer.ts reset-metrics - 重置性能指标')
      console.log('  bun performance-optimizer.ts warmup        - 预热缓存')
  }
}