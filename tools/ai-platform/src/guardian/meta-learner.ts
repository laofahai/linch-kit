/**
 * LinchKit Meta-Learner (元学习者)
 * 
 * AI系统自我学习机制，收集和分析开发过程中的成功/失败模式
 * 监控所有Claude Code工具使用，优化AI提示词和规则
 * 
 * 基于AI Code Quality Standards v8.0设计
 * 与现有Metadata基础设施深度集成
 * 
 * @version 1.0.0
 * @author LinchKit AI Guardian System
 */

// import { logger } from '@linch-kit/core'
import { createLogger } from '@linch-kit/core'

const logger = createLogger({ name: 'meta-learner' })
import { ExtensionMetadata } from '@linch-kit/core'
import { createLogger } from '@linch-kit/core'
import type { EntityMetadata } from '@linch-kit/platform'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * AI行为监控数据接口
 */
interface AIBehaviorRecord {
  timestamp: string
  sessionId: string
  action: string
  context: {
    task: string
    toolUsed: string
    inputPrompt: string
    codebaseContext: string[]
  }
  outcome: {
    success: boolean
    quality: number // 0-100分
    violations: string[]
    buildResult: 'success' | 'failed' | 'warnings'
    testResult: 'passed' | 'failed' | 'skipped'
  }
  metadata: {
    modelUsed: string
    aiGeneratedRatio: number
    humanReviewRequired: boolean
    contextPollution: boolean
  }
}

/**
 * 学习模式接口
 */
interface LearningPattern {
  id: string
  type: 'success' | 'failure' | 'anti-pattern'
  pattern: string
  description: string
  context: string[]
  frequency: number
  confidence: number
  recommendations: string[]
  createdAt: string
  lastUpdated: string
}

/**
 * AI提示词优化建议
 */
interface PromptOptimization {
  originalPrompt: string
  optimizedPrompt: string
  improvementReason: string
  successRate: number
  usage: string[]
}

/**
 * Meta-Learner 配置
 */
interface MetaLearnerConfig {
  dataRetentionDays: number
  minPatternFrequency: number
  confidenceThreshold: number
  analysisInterval: number // 小时
  reportingInterval: number // 天
}

export class MetaLearner {
  private config: MetaLearnerConfig
  private dataDir: string
  private patterns: Map<string, LearningPattern> = new Map()
  private behaviorRecords: AIBehaviorRecord[] = []

  constructor() {
    this.config = {
      dataRetentionDays: 30,
      minPatternFrequency: 3,
      confidenceThreshold: 0.7,
      analysisInterval: 24, // 每24小时分析一次
      reportingInterval: 7   // 每7天生成报告
    }
    
    // 基于现有项目结构设置数据目录
    const currentDir = dirname(fileURLToPath(import.meta.url))
    this.dataDir = join(currentDir, '../../../..', '.claude', 'meta-learning')
  }

  /**
   * Claude Code 适配接口
   * 为.claude/commands/使用设计的简化接口
   */
  async claudeAnalyze(options: {
    action?: 'monitor' | 'analyze' | 'report' | 'optimize'
    verbose?: boolean
    format?: 'text' | 'json'
  } = {}): Promise<{
    success: boolean
    data: unknown
    output: string
  }> {
    try {
      const action = options.action || 'analyze'
      
      switch (action) {
        case 'monitor':
          await this.startMonitoring()
          return {
            success: true,
            data: { monitoring: true },
            output: '🧠 Meta-Learner 监控已启动'
          }
          
        case 'analyze':
          const patterns = await this.analyzePatterns()
          const output = options.format === 'json' 
            ? JSON.stringify(patterns, null, 2)
            : this.formatPatternsForClaude(patterns, options)
          return {
            success: true,
            data: patterns,
            output
          }
          
        case 'report':
          const report = await this.generateReport()
          return {
            success: true,
            data: report,
            output: options.format === 'json' 
              ? JSON.stringify(report, null, 2)
              : this.formatReportForClaude(report, options)
          }
          
        case 'optimize':
          const optimizations = await this.generateOptimizations()
          return {
            success: true,
            data: optimizations,
            output: this.formatOptimizationsForClaude(optimizations, options)
          }
          
        default:
          throw new Error(`未知操作: ${action}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Meta-Learner执行失败', { error: errorMessage })
      
      return {
        success: false,
        data: null,
        output: `❌ Meta-Learner执行失败: ${errorMessage}`
      }
    }
  }

  /**
   * 记录AI行为
   */
  async recordBehavior(record: Omit<AIBehaviorRecord, 'timestamp'>): Promise<void> {
    const fullRecord: AIBehaviorRecord = {
      ...record,
      timestamp: new Date().toISOString()
    }

    this.behaviorRecords.push(fullRecord)
    
    // 持久化记录
    await this.persistBehaviorRecord(fullRecord)
    
    // 检查是否需要实时分析
    if (this.shouldTriggerAnalysis(fullRecord)) {
      await this.analyzePatterns()
    }

    logger.info('AI行为已记录', {
      action: fullRecord.action,
      success: fullRecord.outcome.success,
      quality: fullRecord.outcome.quality
    })
  }

  /**
   * 开始监控Claude Code工具使用
   */
  async startMonitoring(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true })
      
      // 加载历史数据
      await this.loadHistoricalData()
      
      // 启动定期分析
      this.scheduleAnalysis()
      
      logger.info('Meta-Learner监控已启动', { dataDir: this.dataDir })
    } catch (error) {
      logger.error('启动监控失败', { error })
      throw error
    }
  }

  /**
   * 分析学习模式
   */
  async analyzePatterns(): Promise<LearningPattern[]> {
    try {
      // 1. 分析成功模式
      const successPatterns = this.identifySuccessPatterns()
      
      // 2. 分析失败模式
      const failurePatterns = this.identifyFailurePatterns()
      
      // 3. 分析反模式
      const antiPatterns = this.identifyAntiPatterns()
      
      // 4. 合并和更新模式
      const allPatterns = [...successPatterns, ...failurePatterns, ...antiPatterns]
      
      for (const pattern of allPatterns) {
        this.patterns.set(pattern.id, pattern)
      }
      
      // 5. 持久化模式
      await this.persistPatterns()
      
      logger.info('模式分析完成', { 
        总数: allPatterns.length,
        成功模式: successPatterns.length,
        失败模式: failurePatterns.length,
        反模式: antiPatterns.length
      })
      
      return allPatterns
    } catch (error) {
      logger.error('模式分析失败', { error })
      throw error
    }
  }

  /**
   * 生成AI提示词优化建议
   */
  async generateOptimizations(): Promise<PromptOptimization[]> {
    const optimizations: PromptOptimization[] = []
    
    // 基于失败模式生成优化建议
    const failurePatterns = Array.from(this.patterns.values())
      .filter(p => p.type === 'failure')
      .sort((a, b) => b.frequency - a.frequency)
    
    for (const pattern of failurePatterns.slice(0, 5)) { // 处理前5个最频繁的失败模式
      const optimization = await this.generatePromptOptimization(pattern)
      if (optimization) {
        optimizations.push(optimization)
      }
    }
    
    return optimizations
  }

  /**
   * 生成学习报告
   */
  async generateReport(): Promise<{
    summary: {
      totalRecords: number
      successRate: number
      averageQuality: number
      topIssues: string[]
    }
    patterns: LearningPattern[]
    recommendations: string[]
    trends: {
      qualityTrend: 'improving' | 'declining' | 'stable'
      frequentViolations: string[]
      improvementAreas: string[]
    }
  }> {
    const totalRecords = this.behaviorRecords.length
    const successfulRecords = this.behaviorRecords.filter(r => r.outcome.success)
    const successRate = totalRecords > 0 ? (successfulRecords.length / totalRecords) * 100 : 0
    
    const qualityScores = this.behaviorRecords.map(r => r.outcome.quality)
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0
    
    // 分析违规趋势
    const allViolations = this.behaviorRecords.flatMap(r => r.outcome.violations)
    const violationCounts = new Map<string, number>()
    allViolations.forEach(v => violationCounts.set(v, (violationCounts.get(v) || 0) + 1))
    
    const topIssues = Array.from(violationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue)

    const patterns = Array.from(this.patterns.values())
    const recommendations = this.generateRecommendations()
    
    // 质量趋势分析
    const recentRecords = this.behaviorRecords.slice(-20) // 最近20条记录
    const qualityTrend = this.analyzeQualityTrend(recentRecords)
    
    return {
      summary: {
        totalRecords,
        successRate,
        averageQuality,
        topIssues
      },
      patterns,
      recommendations,
      trends: {
        qualityTrend,
        frequentViolations: topIssues,
        improvementAreas: this.identifyImprovementAreas()
      }
    }
  }

  /**
   * 识别成功模式
   */
  private identifySuccessPatterns(): LearningPattern[] {
    const successRecords = this.behaviorRecords.filter(r => 
      r.outcome.success && r.outcome.quality >= 80
    )
    
    return this.extractPatterns(successRecords, 'success')
  }

  /**
   * 识别失败模式
   */
  private identifyFailurePatterns(): LearningPattern[] {
    const failureRecords = this.behaviorRecords.filter(r => 
      !r.outcome.success || r.outcome.quality < 60
    )
    
    return this.extractPatterns(failureRecords, 'failure')
  }

  /**
   * 识别反模式
   */
  private identifyAntiPatterns(): LearningPattern[] {
    const antiPatternRecords = this.behaviorRecords.filter(r => 
      r.outcome.violations.length > 0 || r.metadata.contextPollution
    )
    
    return this.extractPatterns(antiPatternRecords, 'anti-pattern')
  }

  /**
   * 从记录中提取模式
   */
  private extractPatterns(records: AIBehaviorRecord[], type: LearningPattern['type']): LearningPattern[] {
    const patterns: LearningPattern[] = []
    const patternMap = new Map<string, { count: number; records: AIBehaviorRecord[] }>()
    
    // 按action和工具组合分组
    for (const record of records) {
      const key = `${record.action}:${record.context.toolUsed}`
      if (!patternMap.has(key)) {
        patternMap.set(key, { count: 0, records: [] })
      }
      const entry = patternMap.get(key)!
      entry.count++
      entry.records.push(record)
    }
    
    // 生成模式
    for (const [key, { count, records: patternRecords }] of patternMap) {
      if (count >= this.config.minPatternFrequency) {
        const [action, tool] = key.split(':')
        const confidence = Math.min(count / 10, 1) // 简单的置信度计算
        
        if (confidence >= this.config.confidenceThreshold) {
          patterns.push({
            id: `${type}_${key}_${Date.now()}`,
            type,
            pattern: key,
            description: this.generatePatternDescription(type, action, tool, patternRecords),
            context: Array.from(new Set(patternRecords.flatMap(r => r.context.codebaseContext))),
            frequency: count,
            confidence,
            recommendations: this.generatePatternRecommendations(type, patternRecords),
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          })
        }
      }
    }
    
    return patterns
  }

  /**
   * 生成模式描述
   */
  private generatePatternDescription(
    type: LearningPattern['type'], 
    action: string, 
    tool: string, 
    records: AIBehaviorRecord[]
  ): string {
    const avgQuality = records.reduce((sum, r) => sum + r.outcome.quality, 0) / records.length
    
    switch (type) {
      case 'success':
        return `成功模式: 使用${tool}执行${action}，平均质量${avgQuality.toFixed(1)}分`
      case 'failure':
        return `失败模式: 使用${tool}执行${action}时经常失败，平均质量${avgQuality.toFixed(1)}分`
      case 'anti-pattern':
        return `反模式: 使用${tool}执行${action}时容易产生违规，需要避免`
      default:
        return `模式: ${action} with ${tool}`
    }
  }

  /**
   * 生成模式建议
   */
  private generatePatternRecommendations(type: LearningPattern['type'], records: AIBehaviorRecord[]): string[] {
    const recommendations: string[] = []
    
    if (type === 'success') {
      recommendations.push('继续使用此模式')
      recommendations.push('可以作为模板推广给团队')
    } else if (type === 'failure') {
      const commonViolations = this.getCommonViolations(records)
      recommendations.push('避免在相似场景中使用此方法')
      if (commonViolations.length > 0) {
        recommendations.push(`注意避免: ${commonViolations.join(', ')}`)
      }
    } else if (type === 'anti-pattern') {
      recommendations.push('强烈建议避免此模式')
      recommendations.push('需要人工审查相关代码')
    }
    
    return recommendations
  }

  /**
   * 获取常见违规
   */
  private getCommonViolations(records: AIBehaviorRecord[]): string[] {
    const violations = records.flatMap(r => r.outcome.violations)
    const violationCounts = new Map<string, number>()
    
    violations.forEach(v => violationCounts.set(v, (violationCounts.get(v) || 0) + 1))
    
    return Array.from(violationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([violation]) => violation)
  }

  /**
   * 生成提示词优化
   */
  private async generatePromptOptimization(pattern: LearningPattern): Promise<PromptOptimization | null> {
    // 这里可以集成更复杂的AI模型来优化提示词
    // 目前使用基于规则的简单优化
    
    if (pattern.type !== 'failure') return null
    
    const failureRecords = this.behaviorRecords.filter(r => 
      `${r.action}:${r.context.toolUsed}` === pattern.pattern && !r.outcome.success
    )
    
    if (failureRecords.length === 0) return null
    
    const originalPrompt = failureRecords[0].context.inputPrompt
    const commonViolations = this.getCommonViolations(failureRecords)
    
    // 基于违规类型生成优化建议
    let optimizedPrompt = originalPrompt
    const improvements: string[] = []
    
    if (commonViolations.includes('TypeScript strict mode')) {
      optimizedPrompt += '\n\n确保严格遵循TypeScript严格模式，避免使用any类型。'
      improvements.push('添加TypeScript严格模式约束')
    }
    
    if (commonViolations.includes('ESLint violations')) {
      optimizedPrompt += '\n\n生成的代码必须通过ESLint检查，无任何警告。'
      improvements.push('强调ESLint合规性')
    }
    
    if (commonViolations.includes('Architecture violations')) {
      optimizedPrompt += '\n\n严格遵循LinchKit 4层架构原则，只依赖更低层级的包。'
      improvements.push('强调架构约束')
    }
    
    return {
      originalPrompt,
      optimizedPrompt,
      improvementReason: improvements.join(', '),
      successRate: 0, // 需要实际使用后统计
      usage: [pattern.pattern]
    }
  }

  /**
   * 格式化模式输出给Claude
   */
  private formatPatternsForClaude(patterns: LearningPattern[], options: { verbose?: boolean }): string {
    const lines: string[] = []
    
    lines.push('🧠 ===== Meta-Learner 模式分析报告 =====\n')
    
    const successPatterns = patterns.filter(p => p.type === 'success')
    const failurePatterns = patterns.filter(p => p.type === 'failure')
    const antiPatterns = patterns.filter(p => p.type === 'anti-pattern')
    
    lines.push('📊 模式概览:')
    lines.push(`   成功模式: ${successPatterns.length}`)
    lines.push(`   失败模式: ${failurePatterns.length}`)
    lines.push(`   反模式: ${antiPatterns.length}\n`)
    
    if (successPatterns.length > 0) {
      lines.push('✅ 成功模式 (推荐使用):')
      for (const pattern of successPatterns.slice(0, 5)) {
        lines.push(`   📈 ${pattern.description}`)
        lines.push(`      频率: ${pattern.frequency}次, 置信度: ${(pattern.confidence * 100).toFixed(1)}%`)
        if (options.verbose) {
          lines.push(`      建议: ${pattern.recommendations.join(', ')}`)
        }
        lines.push('')
      }
    }
    
    if (failurePatterns.length > 0) {
      lines.push('❌ 失败模式 (需要改进):')
      for (const pattern of failurePatterns.slice(0, 5)) {
        lines.push(`   📉 ${pattern.description}`)
        lines.push(`      频率: ${pattern.frequency}次, 置信度: ${(pattern.confidence * 100).toFixed(1)}%`)
        if (options.verbose) {
          lines.push(`      建议: ${pattern.recommendations.join(', ')}`)
        }
        lines.push('')
      }
    }
    
    if (antiPatterns.length > 0) {
      lines.push('🚫 反模式 (避免使用):')
      for (const pattern of antiPatterns.slice(0, 3)) {
        lines.push(`   ⚠️ ${pattern.description}`)
        lines.push(`      频率: ${pattern.frequency}次`)
        lines.push(`      建议: ${pattern.recommendations.join(', ')}`)
        lines.push('')
      }
    }
    
    lines.push('🧠 ===== 模式分析完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 格式化报告输出给Claude
   */
  private formatReportForClaude(report: ReturnType<MetaLearner['generateReport']> extends Promise<infer T> ? T : never, options: { verbose?: boolean }): string {
    const lines: string[] = []
    
    lines.push('📊 ===== Meta-Learner 学习报告 =====\n')
    
    lines.push('📈 整体表现:')
    lines.push(`   总记录数: ${report.summary.totalRecords}`)
    lines.push(`   成功率: ${report.summary.successRate.toFixed(1)}%`)
    lines.push(`   平均质量: ${report.summary.averageQuality.toFixed(1)}/100`)
    lines.push(`   质量趋势: ${this.getTrendEmoji(report.trends.qualityTrend)} ${report.trends.qualityTrend}\n`)
    
    if (report.summary.topIssues.length > 0) {
      lines.push('🔍 主要问题:')
      for (const issue of report.summary.topIssues) {
        lines.push(`   • ${issue}`)
      }
      lines.push('')
    }
    
    if (report.recommendations.length > 0) {
      lines.push('💡 改进建议:')
      for (const rec of report.recommendations) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }
    
    if (options.verbose && report.patterns.length > 0) {
      lines.push(`🧠 学习到的模式 (${report.patterns.length}个):`)
      const topPatterns = report.patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10)
      
      for (const pattern of topPatterns) {
        const icon = pattern.type === 'success' ? '✅' : pattern.type === 'failure' ? '❌' : '🚫'
        lines.push(`   ${icon} ${pattern.description}`)
      }
      lines.push('')
    }
    
    lines.push('📊 ===== 学习报告完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 格式化优化建议给Claude
   */
  private formatOptimizationsForClaude(optimizations: PromptOptimization[], options: { verbose?: boolean }): string {
    const lines: string[] = []
    
    lines.push('🔧 ===== Meta-Learner 优化建议 =====\n')
    
    if (optimizations.length === 0) {
      lines.push('✨ 当前没有发现需要优化的模式，继续保持！')
      lines.push('🔧 ===== 优化建议完成 =====')
      return lines.join('\n')
    }
    
    lines.push(`💡 发现 ${optimizations.length} 个优化机会:\n`)
    
    for (let i = 0; i < optimizations.length; i++) {
      const opt = optimizations[i]
      lines.push(`${i + 1}. 优化原因: ${opt.improvementReason}`)
      lines.push(`   应用场景: ${opt.usage.join(', ')}`)
      
      if (options.verbose) {
        lines.push(`   原始提示词: ${opt.originalPrompt.substring(0, 100)}...`)
        lines.push(`   优化提示词: ${opt.optimizedPrompt.substring(0, 100)}...`)
      }
      lines.push('')
    }
    
    lines.push('🔧 ===== 优化建议完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 获取趋势表情符号
   */
  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      case 'stable': return '➡️'
      default: return '❓'
    }
  }

  /**
   * 分析质量趋势
   */
  private analyzeQualityTrend(records: AIBehaviorRecord[]): 'improving' | 'declining' | 'stable' {
    if (records.length < 10) return 'stable'
    
    const halfPoint = Math.floor(records.length / 2)
    const firstHalf = records.slice(0, halfPoint)
    const secondHalf = records.slice(halfPoint)
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + r.outcome.quality, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.outcome.quality, 0) / secondHalf.length
    
    const improvement = secondAvg - firstAvg
    
    if (improvement > 5) return 'improving'
    if (improvement < -5) return 'declining'
    return 'stable'
  }

  /**
   * 生成通用建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    const successRate = this.behaviorRecords.filter(r => r.outcome.success).length / this.behaviorRecords.length
    
    if (successRate < 0.8) {
      recommendations.push('🎯 提高AI代码生成成功率，建议加强上下文验证')
    }
    
    const avgQuality = this.behaviorRecords.reduce((sum, r) => sum + r.outcome.quality, 0) / this.behaviorRecords.length
    
    if (avgQuality < 80) {
      recommendations.push('📈 提升代码质量，建议增加人工审查环节')
    }
    
    const contextPollutionRate = this.behaviorRecords.filter(r => r.metadata.contextPollution).length / this.behaviorRecords.length
    
    if (contextPollutionRate > 0.1) {
      recommendations.push('🧹 上下文污染较严重，建议定期清理AI上下文')
    }
    
    return recommendations
  }

  /**
   * 识别改进领域
   */
  private identifyImprovementAreas(): string[] {
    const areas: string[] = []
    
    // 分析工具使用频率
    const toolUsage = new Map<string, number>()
    this.behaviorRecords.forEach(r => {
      const tool = r.context.toolUsed
      toolUsage.set(tool, (toolUsage.get(tool) || 0) + 1)
    })
    
    // 找出使用频率高但成功率低的工具
    for (const [tool, count] of toolUsage) {
      const toolRecords = this.behaviorRecords.filter(r => r.context.toolUsed === tool)
      const successRate = toolRecords.filter(r => r.outcome.success).length / toolRecords.length
      
      if (count > 5 && successRate < 0.7) {
        areas.push(`${tool} 工具使用`)
      }
    }
    
    return areas
  }

  /**
   * 是否应该触发分析
   */
  private shouldTriggerAnalysis(record: AIBehaviorRecord): boolean {
    // 如果是失败且质量很低，立即分析
    if (!record.outcome.success && record.outcome.quality < 50) {
      return true
    }
    
    // 如果有上下文污染，立即分析
    if (record.metadata.contextPollution) {
      return true
    }
    
    return false
  }

  /**
   * 持久化行为记录
   */
  private async persistBehaviorRecord(record: AIBehaviorRecord): Promise<void> {
    try {
      const recordsFile = join(this.dataDir, 'behavior-records.json')
      
      let existingRecords: AIBehaviorRecord[] = []
      try {
        const content = await fs.readFile(recordsFile, 'utf-8')
        existingRecords = JSON.parse(content)
      } catch {
        // 文件不存在，创建新的
      }
      
      existingRecords.push(record)
      
      // 保留最近的记录，避免文件过大
      const maxRecords = 1000
      if (existingRecords.length > maxRecords) {
        existingRecords = existingRecords.slice(-maxRecords)
      }
      
      await fs.writeFile(recordsFile, JSON.stringify(existingRecords, null, 2))
    } catch (error) {
      logger.error('持久化行为记录失败', { error })
    }
  }

  /**
   * 持久化学习模式
   */
  private async persistPatterns(): Promise<void> {
    try {
      const patternsFile = join(this.dataDir, 'learning-patterns.json')
      const patterns = Array.from(this.patterns.values())
      await fs.writeFile(patternsFile, JSON.stringify(patterns, null, 2))
    } catch (error) {
      logger.error('持久化学习模式失败', { error })
    }
  }

  /**
   * 加载历史数据
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // 加载行为记录
      const recordsFile = join(this.dataDir, 'behavior-records.json')
      try {
        const content = await fs.readFile(recordsFile, 'utf-8')
        this.behaviorRecords = JSON.parse(content)
      } catch {
        // 文件不存在，保持空数组
      }
      
      // 加载学习模式
      const patternsFile = join(this.dataDir, 'learning-patterns.json')
      try {
        const content = await fs.readFile(patternsFile, 'utf-8')
        const patterns: LearningPattern[] = JSON.parse(content)
        for (const pattern of patterns) {
          this.patterns.set(pattern.id, pattern)
        }
      } catch {
        // 文件不存在，保持空Map
      }
      
      logger.info('历史数据加载完成', {
        行为记录: this.behaviorRecords.length,
        学习模式: this.patterns.size
      })
    } catch (error) {
      logger.error('加载历史数据失败', { error })
    }
  }

  /**
   * 安排定期分析
   */
  private scheduleAnalysis(): void {
    // 每24小时进行一次模式分析
    setInterval(async () => {
      try {
        await this.analyzePatterns()
        logger.info('定期模式分析完成')
      } catch (error) {
        logger.error('定期模式分析失败', { error })
      }
    }, this.config.analysisInterval * 60 * 60 * 1000)
    
    // 每7天生成一次报告
    setInterval(async () => {
      try {
        const report = await this.generateReport()
        logger.info('定期学习报告生成完成', { 
          总记录数: report.summary.totalRecords,
          成功率: report.summary.successRate 
        })
      } catch (error) {
        logger.error('定期学习报告生成失败', { error })
      }
    }, this.config.reportingInterval * 24 * 60 * 60 * 1000)
  }
}

export default MetaLearner