#!/usr/bin/env bun

/**
 * 优化的 Claude Code Hook 引擎
 * 
 * 性能优化特性：
 * - 智能缓存系统 (内存 + LRU)
 * - 文件类型感知的跳过策略
 * - 并行执行优化
 * - 增量检查机制
 * 
 * @version 2.0.0
 */

import { createLogger } from '@linch-kit/core'
import { existsSync, readFileSync, statSync } from 'fs'
import { join, extname, dirname, basename } from 'path'
import { TIMEOUTS, THRESHOLDS, PATHS } from '../core/constants'

const logger = createLogger('optimized-hook-engine')

// Hook执行上下文
interface HookContext {
  toolName: string
  filePath?: string
  operation: string
  workflowState?: string
  fileType?: string
  importance?: 'critical' | 'normal' | 'low'
}

// Hook执行结果
interface HookResult {
  success: boolean
  shouldBlock: boolean
  suggestions: string[]
  constraints: string[]
  executionTime: number
  cached: boolean
  skipped?: boolean
  skipReason?: string
}

// 智能缓存键
interface CacheKey {
  operation: string
  filePattern: string
  workflowState: string
  fileHash?: string
}

// 文件模式分类
enum FileImportance {
  CRITICAL = 'critical',  // 核心业务文件
  NORMAL = 'normal',      // 一般文件
  LOW = 'low'            // 测试、临时文件
}

// 优化的缓存实现
class SmartHookCache {
  private cache = new Map<string, { result: HookResult; timestamp: number; fileStats?: any }>()
  private readonly maxSize = 200
  private readonly ttl = TIMEOUTS.CACHE_TTL // 5分钟

  private generateKey(context: HookContext, fileHash?: string): string {
    const keyParts = [
      context.operation,
      this.getFilePattern(context.filePath),
      context.workflowState || 'unknown',
      fileHash || 'no-hash'
    ]
    return keyParts.join('|')
  }

  private getFilePattern(filePath?: string): string {
    if (!filePath) return 'no-file'
    
    const ext = extname(filePath)
    const dir = dirname(filePath)
    
    // 基于目录和扩展名生成模式
    if (dir.includes('/components/')) return `component${ext}`
    if (dir.includes('/api/')) return `api${ext}`
    if (dir.includes('/hooks/')) return `hook${ext}`
    if (dir.includes('/utils/')) return `util${ext}`
    if (dir.includes('/types/')) return `type${ext}`
    if (dir.includes('/__tests__/') || filePath.includes('.test.')) return `test${ext}`
    if (dir.includes('/docs/') || ext === '.md') return `doc${ext}`
    
    return `general${ext}`
  }

  get(context: HookContext): HookResult | null {
    const fileHash = this.getFileHash(context.filePath)
    const key = this.generateKey(context, fileHash)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // 检查TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // 检查文件是否被修改（对于存在的文件）
    if (context.filePath && existsSync(context.filePath)) {
      const currentStats = statSync(context.filePath)
      if (cached.fileStats && currentStats.mtime > cached.fileStats.mtime) {
        this.cache.delete(key)
        return null
      }
    }
    
    logger.debug(`⚡ 缓存命中: ${key}`)
    return { ...cached.result, cached: true }
  }

  set(context: HookContext, result: HookResult): void {
    const fileHash = this.getFileHash(context.filePath)
    const key = this.generateKey(context, fileHash)
    
    // LRU清理
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    const fileStats = context.filePath && existsSync(context.filePath) 
      ? statSync(context.filePath) 
      : null
    
    this.cache.set(key, {
      result: { ...result, cached: false },
      timestamp: Date.now(),
      fileStats
    })
    
    logger.debug(`💾 结果已缓存: ${key}`)
  }

  private getFileHash(filePath?: string): string {
    if (!filePath || !existsSync(filePath)) return 'no-file'
    
    try {
      const stats = statSync(filePath)
      // 使用文件大小和修改时间作为简单hash
      return `${stats.size}-${stats.mtime.getTime()}`
    } catch {
      return 'no-stats'
    }
  }

  clear(): void {
    this.cache.clear()
    logger.info('🗑️ Hook缓存已清理')
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    }
  }
}

/**
 * 优化的Hook引擎
 */
export class OptimizedHookEngine {
  private cache = new SmartHookCache()
  private workflowStateCache: { state: string; timestamp: number } | null = null
  private readonly stateCache TTL = 30000 // 30秒

  /**
   * 智能执行Hook - 带优化策略
   */
  async executeOptimized(context: HookContext): Promise<HookResult> {
    const startTime = Date.now()
    
    try {
      // 1. 文件类型分析和重要性评估
      this.analyzeFileContext(context)
      
      // 2. 智能跳过策略
      const skipResult = this.shouldSkipExecution(context)
      if (skipResult.should) {
        logger.info(`⏭️ 跳过执行: ${skipResult.reason}`)
        return {
          success: true,
          shouldBlock: false,
          suggestions: [],
          constraints: [],
          executionTime: Date.now() - startTime,
          cached: false,
          skipped: true,
          skipReason: skipResult.reason
        }
      }
      
      // 3. 缓存检查
      const cachedResult = this.cache.get(context)
      if (cachedResult) {
        return {
          ...cachedResult,
          executionTime: Date.now() - startTime
        }
      }
      
      // 4. 获取工作流状态（带缓存）
      context.workflowState = await this.getCachedWorkflowState()
      
      // 5. 执行实际的Hook逻辑
      const result = await this.executeHookLogic(context)
      
      // 6. 缓存结果（如果成功且值得缓存）
      if (result.success && this.shouldCacheResult(context, result)) {
        this.cache.set(context, result)
      }
      
      return {
        ...result,
        executionTime: Date.now() - startTime
      }
      
    } catch (error) {
      logger.error(`❌ Hook执行失败: ${error.message}`)
      return {
        success: false,
        shouldBlock: false,
        suggestions: [],
        constraints: [`Hook执行错误: ${error.message}`],
        executionTime: Date.now() - startTime,
        cached: false
      }
    }
  }

  /**
   * 分析文件上下文
   */
  private analyzeFileContext(context: HookContext): void {
    if (!context.filePath) {
      context.fileType = 'unknown'
      context.importance = 'normal'
      return
    }

    const filePath = context.filePath
    const ext = extname(filePath)
    const dir = dirname(filePath)
    const filename = basename(filePath)

    // 文件类型识别
    if (dir.includes('/components/')) context.fileType = 'component'
    else if (dir.includes('/api/')) context.fileType = 'api'
    else if (dir.includes('/hooks/')) context.fileType = 'hook'
    else if (dir.includes('/utils/')) context.fileType = 'utility'
    else if (dir.includes('/types/')) context.fileType = 'types'
    else if (dir.includes('/__tests__/') || filename.includes('.test.')) context.fileType = 'test'
    else if (ext === '.md' || dir.includes('/docs/')) context.fileType = 'documentation'
    else context.fileType = 'general'

    // 重要性评估
    if (context.fileType === 'test' || 
        filename.startsWith('temp') || 
        filename.includes('.tmp') ||
        ext === '.md') {
      context.importance = FileImportance.LOW
    } else if (context.fileType === 'api' || 
               context.fileType === 'component' || 
               filename.includes('index.')) {
      context.importance = FileImportance.CRITICAL
    } else {
      context.importance = FileImportance.NORMAL
    }
  }

  /**
   * 智能跳过策略
   */
  private shouldSkipExecution(context: HookContext): { should: boolean; reason?: string } {
    // 1. 低重要性文件的简化检查
    if (context.importance === FileImportance.LOW) {
      return { should: true, reason: '低重要性文件，跳过详细检查' }
    }

    // 2. 特定操作的跳过策略
    if (context.operation === 'Read' || context.operation === 'LS') {
      return { should: true, reason: '只读操作，无需约束检查' }
    }

    // 3. 临时文件或系统文件
    if (context.filePath) {
      const filename = basename(context.filePath)
      if (filename.startsWith('.') && !filename.startsWith('.claude') ||
          filename.includes('.tmp') ||
          filename.includes('.cache') ||
          context.filePath.includes('node_modules') ||
          context.filePath.includes('.git/')) {
        return { should: true, reason: '系统文件或临时文件' }
      }
    }

    // 4. 文档类文件的简化检查
    if (context.fileType === 'documentation') {
      return { should: true, reason: '文档文件，使用简化检查' }
    }

    return { should: false }
  }

  /**
   * 获取缓存的工作流状态
   */
  private async getCachedWorkflowState(): Promise<string> {
    const now = Date.now()
    
    // 检查缓存是否有效
    if (this.workflowStateCache && 
        (now - this.workflowStateCache.timestamp) < this.stateCacheTTL) {
      return this.workflowStateCache.state
    }

    // 读取新的状态
    try {
      const state = await this.readWorkflowState()
      this.workflowStateCache = {
        state,
        timestamp: now
      }
      return state
    } catch (error) {
      logger.warn(`读取工作流状态失败: ${error.message}`)
      return 'UNKNOWN'
    }
  }

  /**
   * 读取工作流状态
   */
  private async readWorkflowState(): Promise<string> {
    const workflowDir = PATHS.WORKFLOW_STATES
    
    if (!existsSync(workflowDir)) {
      return 'INIT'
    }

    const indexPath = join(workflowDir, 'index.json')
    if (!existsSync(indexPath)) {
      return 'INIT'
    }

    const index = JSON.parse(readFileSync(indexPath, 'utf8'))
    const activeWorkflows = index.workflows?.filter((w: any) => 
      w.status === 'active' || w.status === 'running'
    ) || []

    if (activeWorkflows.length === 0) {
      return 'INIT'
    }

    const latestWorkflow = activeWorkflows[0]
    const statePath = join(workflowDir, `${latestWorkflow.id}.json`)
    
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, 'utf8'))
      return state.currentState || 'INIT'
    }

    return 'INIT'
  }

  /**
   * 执行实际的Hook逻辑
   */
  private async executeHookLogic(context: HookContext): Promise<HookResult> {
    const suggestions: string[] = []
    const constraints: string[] = []

    // 基于文件类型和状态的智能建议
    if (context.fileType === 'component' && context.workflowState === 'IMPLEMENT') {
      suggestions.push('React组件开发：确保props类型定义')
      suggestions.push('考虑组件的可复用性和性能优化')
      constraints.push('组件必须有对应的测试文件')
    } else if (context.fileType === 'api' && context.workflowState === 'IMPLEMENT') {
      suggestions.push('API开发：确保输入验证和错误处理')
      constraints.push('API必须有对应的集成测试')
    } else if (context.importance === FileImportance.CRITICAL) {
      suggestions.push('核心文件修改：请特别注意向后兼容性')
      constraints.push('核心文件需要额外的测试覆盖')
    }

    // 通用约束
    constraints.push('遵循项目编码规范')
    constraints.push('确保代码质量和类型安全')

    return {
      success: true,
      shouldBlock: false,
      suggestions,
      constraints,
      executionTime: 0,
      cached: false
    }
  }

  /**
   * 判断是否应该缓存结果
   */
  private shouldCacheResult(context: HookContext, result: HookResult): boolean {
    // 不缓存失败的结果
    if (!result.success) return false
    
    // 不缓存阻塞性结果
    if (result.shouldBlock) return false
    
    // 只缓存稳定的文件类型结果
    const cacheableTypes = ['component', 'api', 'utility', 'types']
    return cacheableTypes.includes(context.fileType || '')
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      cache: this.cache.getStats(),
      workflowStateCache: {
        cached: !!this.workflowStateCache,
        age: this.workflowStateCache 
          ? Date.now() - this.workflowStateCache.timestamp 
          : 0
      }
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.workflowStateCache = null
    logger.info('🧹 Hook引擎缓存已清理')
  }
}

// CLI入口
if (import.meta.main) {
  const engine = new OptimizedHookEngine()
  
  // 解析命令行参数
  const args = process.argv.slice(2)
  const context: HookContext = {
    toolName: args.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'Unknown',
    filePath: args.find(arg => arg.startsWith('--file='))?.split('=')[1],
    operation: args.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'Unknown'
  }

  engine.executeOptimized(context).then(result => {
    console.log('🚀 优化Hook引擎执行结果:')
    console.log('──────────────────────────────────────')
    
    if (result.skipped) {
      console.log(`⏭️ 已跳过: ${result.skipReason}`)
    } else if (result.cached) {
      console.log(`⚡ 缓存命中 (${result.executionTime}ms)`)
    } else {
      console.log(`✅ 执行完成 (${result.executionTime}ms)`)
    }
    
    if (result.suggestions.length > 0) {
      console.log('\n💡 建议:')
      result.suggestions.forEach(s => console.log(`  • ${s}`))
    }
    
    if (result.constraints.length > 0) {
      console.log('\n🛡️ 约束:')
      result.constraints.forEach(c => console.log(`  • ${c}`))
    }
    
    console.log('──────────────────────────────────────')
    process.exit(result.shouldBlock ? 1 : 0)
  }).catch(error => {
    console.error(`❌ Hook引擎执行失败: ${error.message}`)
    process.exit(1)
  })
}