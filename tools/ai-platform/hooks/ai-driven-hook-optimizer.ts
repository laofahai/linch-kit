#!/usr/bin/env bun

/**
 * AI驱动的Claude Code Hook优化系统
 * 
 * 使用AI Provider智能评估是否需要执行检查，提供上下文感知的优化策略
 * 
 * 核心特性：
 * - AI智能评估检查必要性
 * - 上下文感知的建议生成
 * - 智能缓存和性能优化
 * - 多AI Provider支持 (Claude/Gemini)
 * - 渐进式降级策略
 * 
 * @version 2.0.0
 */

// 加载.env文件中的环境变量
import { config } from 'dotenv'
import { join } from 'path'

// 加载项目根目录的.env文件，强制覆盖现有环境变量
config({ path: join(process.cwd(), '.env'), override: true })

import { createLogger } from '@linch-kit/core'
import { existsSync, readFileSync, statSync } from 'fs'
import { join, extname, dirname, basename } from 'path'
import { TIMEOUTS, AI_PROVIDERS } from '../src/core/constants'

const logger = createLogger('ai-driven-hook-optimizer')

// Hook执行上下文
interface HookContext {
  toolName: string
  filePath?: string
  operation: string
  workflowState?: string
  fileContent?: string
  changeType?: 'create' | 'modify' | 'delete'
}

// AI评估结果
interface AIEvaluation {
  shouldSkip: boolean
  confidence: number
  reasoning: string
  suggestedChecks: string[]
  riskLevel: 'low' | 'medium' | 'high'
  estimatedImpact: 'minimal' | 'moderate' | 'significant'
  suggestions: string[]
  constraints: string[]
}

// Hook执行结果
interface HookResult {
  success: boolean
  shouldBlock: boolean
  suggestions: string[]
  constraints: string[]
  executionTime: number
  aiEvaluated: boolean
  skipped?: boolean
  skipReason?: string
  riskLevel?: string
  confidence?: number
}

// AI评估缓存项
interface CacheItem {
  evaluation: AIEvaluation
  timestamp: number
  fileHash: string
  contextHash: string
}

/**
 * AI驱动的Hook优化器
 */
export class AIDrivenHookOptimizer {
  private evaluationCache = new Map<string, CacheItem>()
  private readonly cacheMaxSize = 100
  private readonly cacheTTL = TIMEOUTS.CACHE_TTL
  private aiProvider: string
  
  constructor(aiProvider: string = AI_PROVIDERS.DEFAULT) {
    this.aiProvider = aiProvider
    logger.info(`🤖 AI驱动Hook优化器初始化 - Provider: ${aiProvider}`)
  }

  /**
   * 主要优化入口 - AI驱动的Hook执行
   */
  async executeWithAIOptimization(context: HookContext): Promise<HookResult> {
    const startTime = Date.now()
    
    try {
      // 1. 增强上下文信息
      await this.enrichContext(context)
      
      // 2. 检查缓存
      const cachedEvaluation = this.getCachedEvaluation(context)
      if (cachedEvaluation) {
        logger.debug(`⚡ AI评估缓存命中`)
        return this.buildResultFromEvaluation(cachedEvaluation, startTime, true)
      }
      
      // 3. AI智能评估
      const aiEvaluation = await this.performAIEvaluation(context)
      
      // 4. 缓存AI评估结果
      this.cacheEvaluation(context, aiEvaluation)
      
      // 5. 基于AI评估构建结果
      return this.buildResultFromEvaluation(aiEvaluation, startTime, false)
      
    } catch (error) {
      logger.warn(`AI评估失败，使用降级策略: ${error.message}`)
      return this.fallbackExecution(context, startTime)
    }
  }

  /**
   * 增强上下文信息
   */
  private async enrichContext(context: HookContext): Promise<void> {
    if (!context.filePath) return

    try {
      // 分析文件内容（限制大小以避免性能问题）
      if (existsSync(context.filePath)) {
        const stats = statSync(context.filePath)
        
        // 只读取小于100KB的文件内容
        if (stats.size < 100 * 1024) {
          context.fileContent = readFileSync(context.filePath, 'utf8')
        }
        
        // 确定变更类型
        context.changeType = 'modify' // 默认为修改，实际可以通过git diff等方式确定
      } else {
        context.changeType = 'create'
      }
      
      // 获取工作流状态
      if (!context.workflowState) {
        context.workflowState = await this.getCurrentWorkflowState()
      }
      
    } catch (error) {
      logger.warn(`上下文增强失败: ${error.message}`)
    }
  }

  /**
   * 执行AI评估
   */
  private async performAIEvaluation(context: HookContext): Promise<AIEvaluation> {
    const prompt = this.buildEvaluationPrompt(context)
    
    try {
      // 调用AI Provider进行评估
      const aiResponse = await this.callAIProvider(prompt)
      return this.parseAIResponse(aiResponse)
      
    } catch (error) {
      logger.warn(`AI Provider调用失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 构建AI评估提示词
   */
  private buildEvaluationPrompt(context: HookContext): string {
    const fileInfo = context.filePath ? {
      path: context.filePath,
      extension: extname(context.filePath),
      directory: dirname(context.filePath),
      name: basename(context.filePath)
    } : null

    return `
你是LinchKit项目的智能Hook优化顾问。请基于以下上下文信息，评估是否需要执行完整的代码质量检查：

## 操作上下文
- 操作类型: ${context.operation}
- 工具: ${context.toolName}
- 工作流状态: ${context.workflowState || 'unknown'}
- 变更类型: ${context.changeType || 'unknown'}

## 文件信息
${fileInfo ? `
- 文件路径: ${fileInfo.path}
- 文件扩展名: ${fileInfo.extension}
- 所在目录: ${fileInfo.directory}
- 文件名: ${fileInfo.name}
` : '- 无文件信息'}

## 文件内容预览
${context.fileContent ? `
\`\`\`
${context.fileContent.slice(0, 1000)}${context.fileContent.length > 1000 ? '...[截断]' : ''}
\`\`\`
` : '- 无法读取文件内容'}

## 评估要求
请提供JSON格式的评估结果，包含以下字段：

\`\`\`json
{
  "shouldSkip": boolean,           // 是否应该跳过详细检查
  "confidence": number,            // 评估信心度 (0-1)
  "reasoning": "string",           // 评估理由
  "suggestedChecks": ["array"],    // 建议执行的检查类型
  "riskLevel": "low|medium|high",  // 风险等级
  "estimatedImpact": "minimal|moderate|significant", // 预期影响
  "suggestions": ["array"],        // 智能建议
  "constraints": ["array"]         // 约束提醒
}
\`\`\`

## 评估策略
- 高风险文件（核心API、组件）= 执行完整检查
- 低风险文件（测试、文档、配置）= 可考虑跳过
- 考虑工作流状态（实现阶段需要更严格检查）
- 基于文件内容智能判断复杂度和重要性

请提供你的评估：`
  }

  /**
   * 调用AI Provider
   */
  private async callAIProvider(prompt: string): Promise<string> {
    // 这里需要根据实际的AI Provider实现来调用
    // 可以使用现有的HybridAIManager或直接调用AI服务
    
    if (this.aiProvider === 'gemini-sdk') {
      return this.callGeminiProvider(prompt)
    } else if (this.aiProvider === 'claude-cli') {
      return this.callClaudeProvider(prompt)
    } else {
      throw new Error(`不支持的AI Provider: ${this.aiProvider}`)
    }
  }

  /**
   * 调用Gemini Provider
   */
  private async callGeminiProvider(prompt: string): Promise<string> {
    try {
      // 动态导入Gemini SDK Provider
      const { GeminiSDKProvider } = await import('../src/providers/gemini-sdk-provider')
      
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini API key is required')
      }
      
      const provider = new GeminiSDKProvider({
        apiKey,
        timeout: 10000, // 10秒超时，快速响应
        model: 'gemini-1.5-flash' // 使用快速模型
      })
      
      const response = await provider.generate(prompt)
      return response.content
      
    } catch (error) {
      logger.error(`Gemini Provider调用失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 调用Claude Provider
   */
  private async callClaudeProvider(prompt: string): Promise<string> {
    try {
      // 使用现有的CLI Based Provider
      const { CLIBasedAIProvider } = await import('../src/providers/cli-based-provider')
      const provider = new CLIBasedAIProvider('claude-cli', {
        command: 'claude',
        promptFlag: '-p',
        timeoutMs: 10000 // 10秒超时
      })
      
      const response = await provider.generate(prompt)
      return response.content
      
    } catch (error) {
      logger.error(`Claude Provider调用失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): AIEvaluation {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/{[\s\S]*}/)
      
      if (!jsonMatch) {
        throw new Error('AI响应中未找到有效的JSON格式')
      }
      
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      
      // 验证必要字段
      const required = ['shouldSkip', 'confidence', 'reasoning', 'riskLevel']
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`AI响应缺少必要字段: ${field}`)
        }
      }
      
      return {
        shouldSkip: parsed.shouldSkip,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        reasoning: parsed.reasoning,
        suggestedChecks: parsed.suggestedChecks || [],
        riskLevel: parsed.riskLevel,
        estimatedImpact: parsed.estimatedImpact || 'moderate',
        suggestions: parsed.suggestions || [],
        constraints: parsed.constraints || []
      }
      
    } catch (error) {
      logger.warn(`AI响应解析失败: ${error.message}`)
      
      // 返回保守的默认评估
      return {
        shouldSkip: false,
        confidence: 0.3,
        reasoning: `AI响应解析失败，采用保守策略: ${error.message}`,
        suggestedChecks: ['basic'],
        riskLevel: 'medium',
        estimatedImpact: 'moderate',
        suggestions: ['AI评估失败，建议手动review'],
        constraints: ['确保代码质量']
      }
    }
  }

  /**
   * 缓存相关方法
   */
  private generateCacheKey(context: HookContext): string {
    const contextItems = [
      context.operation,
      context.toolName,
      context.filePath || 'no-file',
      context.workflowState || 'unknown'
    ]
    return contextItems.join('|')
  }

  private generateFileHash(context: HookContext): string {
    if (!context.filePath || !existsSync(context.filePath)) {
      return 'no-file'
    }
    
    try {
      const stats = statSync(context.filePath)
      return `${stats.size}-${stats.mtime.getTime()}`
    } catch {
      return 'error'
    }
  }

  private generateContextHash(context: HookContext): string {
    const contextStr = JSON.stringify({
      operation: context.operation,
      toolName: context.toolName,
      workflowState: context.workflowState,
      changeType: context.changeType
    })
    
    // 简单hash
    let hash = 0
    for (let i = 0; i < contextStr.length; i++) {
      const char = contextStr.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString()
  }

  private getCachedEvaluation(context: HookContext): AIEvaluation | null {
    const cacheKey = this.generateCacheKey(context)
    const cached = this.evaluationCache.get(cacheKey)
    
    if (!cached) return null
    
    // 检查TTL
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.evaluationCache.delete(cacheKey)
      return null
    }
    
    // 检查文件是否变更
    const currentFileHash = this.generateFileHash(context)
    if (cached.fileHash !== currentFileHash) {
      this.evaluationCache.delete(cacheKey)
      return null
    }
    
    // 检查上下文是否变更
    const currentContextHash = this.generateContextHash(context)
    if (cached.contextHash !== currentContextHash) {
      this.evaluationCache.delete(cacheKey)
      return null
    }
    
    return cached.evaluation
  }

  private cacheEvaluation(context: HookContext, evaluation: AIEvaluation): void {
    const cacheKey = this.generateCacheKey(context)
    
    // LRU清理
    if (this.evaluationCache.size >= this.cacheMaxSize) {
      const firstKey = this.evaluationCache.keys().next().value
      this.evaluationCache.delete(firstKey)
    }
    
    this.evaluationCache.set(cacheKey, {
      evaluation,
      timestamp: Date.now(),
      fileHash: this.generateFileHash(context),
      contextHash: this.generateContextHash(context)
    })
  }

  /**
   * 基于AI评估构建Hook结果
   */
  private buildResultFromEvaluation(
    evaluation: AIEvaluation, 
    startTime: number, 
    fromCache: boolean
  ): HookResult {
    const executionTime = Date.now() - startTime
    
    if (evaluation.shouldSkip && evaluation.confidence > 0.7) {
      return {
        success: true,
        shouldBlock: false,
        suggestions: evaluation.suggestions,
        constraints: evaluation.constraints,
        executionTime,
        aiEvaluated: true,
        skipped: true,
        skipReason: `AI评估建议跳过 (${evaluation.reasoning})`,
        riskLevel: evaluation.riskLevel,
        confidence: evaluation.confidence
      }
    }
    
    // 执行建议的检查
    return {
      success: true,
      shouldBlock: evaluation.riskLevel === 'high' && evaluation.constraints.length > 0,
      suggestions: [
        ...evaluation.suggestions,
        `AI风险评估: ${evaluation.riskLevel}`,
        `建议检查: ${evaluation.suggestedChecks.join(', ')}`
      ],
      constraints: evaluation.constraints,
      executionTime,
      aiEvaluated: true,
      riskLevel: evaluation.riskLevel,
      confidence: evaluation.confidence
    }
  }

  /**
   * 降级执行策略（AI不可用时）
   */
  private fallbackExecution(context: HookContext, startTime: number): HookResult {
    const executionTime = Date.now() - startTime
    
    // 基于简单规则的降级策略
    const isLowRisk = context.filePath && (
      context.filePath.includes('.test.') ||
      context.filePath.includes('.md') ||
      context.filePath.includes('/docs/') ||
      context.filePath.startsWith('.')
    )
    
    if (isLowRisk) {
      return {
        success: true,
        shouldBlock: false,
        suggestions: ['AI不可用，使用基础规则评估为低风险文件'],
        constraints: ['确保基本代码质量'],
        executionTime,
        aiEvaluated: false,
        skipped: true,
        skipReason: 'AI不可用，基于规则判断为低风险'
      }
    }
    
    return {
      success: true,
      shouldBlock: false,
      suggestions: [
        'AI不可用，执行标准检查',
        '建议手动review关键变更'
      ],
      constraints: [
        '确保代码质量和类型安全',
        '遵循项目规范'
      ],
      executionTime,
      aiEvaluated: false
    }
  }

  /**
   * 获取当前工作流状态
   */
  private async getCurrentWorkflowState(): Promise<string> {
    try {
      const workflowDir = '.linchkit/workflow-states'
      
      if (!existsSync(workflowDir)) return 'INIT'
      
      const indexPath = join(workflowDir, 'index.json')
      if (!existsSync(indexPath)) return 'INIT'
      
      const index = JSON.parse(readFileSync(indexPath, 'utf8'))
      const activeWorkflows = index.workflows?.filter((w: any) => 
        w.status === 'active' || w.status === 'running'
      ) || []
      
      if (activeWorkflows.length === 0) return 'INIT'
      
      const latestWorkflow = activeWorkflows[0]
      const statePath = join(workflowDir, `${latestWorkflow.id}.json`)
      
      if (existsSync(statePath)) {
        const state = JSON.parse(readFileSync(statePath, 'utf8'))
        return state.currentState || 'INIT'
      }
      
      return 'INIT'
    } catch (error) {
      logger.warn(`获取工作流状态失败: ${error.message}`)
      return 'UNKNOWN'
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const cacheEntries = Array.from(this.evaluationCache.values())
    const avgConfidence = cacheEntries.length > 0 
      ? cacheEntries.reduce((sum, item) => sum + item.evaluation.confidence, 0) / cacheEntries.length
      : 0
    
    return {
      aiProvider: this.aiProvider,
      cache: {
        size: this.evaluationCache.size,
        maxSize: this.cacheMaxSize,
        hitRate: 0 // 需要在实际使用中统计
      },
      evaluations: {
        total: cacheEntries.length,
        averageConfidence: avgConfidence,
        riskDistribution: this.getRiskDistribution(cacheEntries)
      }
    }
  }

  private getRiskDistribution(entries: CacheItem[]) {
    const distribution = { low: 0, medium: 0, high: 0 }
    entries.forEach(entry => {
      distribution[entry.evaluation.riskLevel]++
    })
    return distribution
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.evaluationCache.clear()
    logger.info('🗑️ AI评估缓存已清理')
  }
}

// CLI入口
if (import.meta.main) {
  const optimizer = new AIDrivenHookOptimizer()
  
  // 解析命令行参数
  const args = process.argv.slice(2)
  const context: HookContext = {
    toolName: args.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'Unknown',
    filePath: args.find(arg => arg.startsWith('--file='))?.split('=')[1],
    operation: args.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'Unknown'
  }

  optimizer.executeWithAIOptimization(context).then(result => {
    logger.info('🤖 AI驱动Hook优化器执行结果:')
    logger.info('════════════════════════════════════════')
    
    if (result.aiEvaluated) {
      logger.info(`🎯 AI评估完成 - 风险等级: ${result.riskLevel}, 信心度: ${result.confidence?.toFixed(2)}`)
    } else {
      logger.info('⚠️ AI不可用，使用降级策略')
    }
    
    if (result.skipped) {
      logger.info(`⏭️ 已跳过: ${result.skipReason}`)
    } else {
      logger.info(`✅ 执行完成 (${result.executionTime}ms)`)
    }
    
    if (result.suggestions.length > 0) {
      logger.info('\n💡 AI智能建议:')
      result.suggestions.forEach(s => logger.info(`  • ${s}`))
    }
    
    if (result.constraints.length > 0) {
      logger.info('\n🛡️ 约束检查:')
      result.constraints.forEach(c => logger.info(`  • ${c}`))
    }
    
    logger.info('════════════════════════════════════════')
    process.exit(result.shouldBlock ? 1 : 0)
  }).catch(error => {
    logger.error(`❌ AI驱动Hook优化器执行失败: ${error.message}`)
    process.exit(1)
  })
}