/**
 * LinchKit Context Verifier (语境校验者)
 * 
 * AI理解一致性验证系统，防止AI理解漂移，确保项目架构理解准确
 * 
 * 核心功能：
 * - 双向验证：代码→描述→代码一致性检查
 * - 核心概念语义稳定性监控
 * - 与Graph RAG的理解对比验证
 * - 异常理解自动告警和纠正
 * - 支持进化适应（架构变化时同步更新）
 * 
 * @version 1.0.0
 * @author LinchKit AI Guardian System
 */

// 临时使用console.log直到logger导出问题解决
const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args)
}

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * AI理解快照接口
 */
interface AIContextSnapshot {
  timestamp: string
  sessionId: string
  contextType: 'architecture' | 'schema' | 'api' | 'component' | 'business_logic'
  entityName: string
  understanding: {
    description: string
    properties: Record<string, unknown>
    relationships: {
      type: string
      target: string
      description: string
    }[]
    constraints: string[]
    patterns: string[]
  }
  confidence: number
  sourceFiles: string[]
  graphRAGResult?: unknown
}

/**
 * 理解漂移检测结果
 */
interface UnderstandingDrift {
  entityName: string
  driftType: 'semantic' | 'structural' | 'behavioral' | 'critical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  oldUnderstanding: string
  newUnderstanding: string
  driftScore: number // 0-100, 0表示完全一致，100表示完全不同
  evidence: {
    type: string
    description: string
    impact: string
  }[]
  recommendations: string[]
  autoFixAvailable: boolean
}

/**
 * 语境一致性报告
 */
interface ContextConsistencyReport {
  overallConsistency: number // 0-100分
  driftDetected: UnderstandingDrift[]
  stableEntities: string[]
  criticalInconsistencies: UnderstandingDrift[]
  recommendations: {
    immediate: string[]
    monitoring: string[]
    preventive: string[]
  }
  metadata: {
    snapshotsAnalyzed: number
    entitiesMonitored: number
    analysisTimeMs: number
    timestamp: string
  }
}

/**
 * Context Verifier 配置
 */
interface ContextVerifierConfig {
  driftThreshold: number
  criticalDriftThreshold: number
  snapshotRetentionDays: number
  verificationInterval: number // 小时
  maxSnapshotsPerEntity: number
  semanticSimilarityThreshold: number
}

export class ContextVerifier {
  private config: ContextVerifierConfig
  private dataDir: string
  private snapshots: Map<string, AIContextSnapshot[]> = new Map()

  constructor() {
    this.config = {
      driftThreshold: 15, // 15%以上变化认为有漂移
      criticalDriftThreshold: 40, // 40%以上变化认为是严重漂移
      snapshotRetentionDays: 30,
      verificationInterval: 6, // 每6小时验证一次
      maxSnapshotsPerEntity: 50, // 每个实体最多保存50个快照
      semanticSimilarityThreshold: 0.7 // 语义相似度阈值
    }
    
    const currentDir = dirname(fileURLToPath(import.meta.url))
    this.dataDir = join(currentDir, '../../../..', '.claude', 'context-verification')
  }

  /**
   * Claude Code 适配接口
   */
  async claudeVerify(options: {
    action?: 'verify' | 'snapshot' | 'report' | 'drift'
    entityName?: string
    verbose?: boolean
    format?: 'text' | 'json'
  } = {}): Promise<{
    success: boolean
    data: unknown
    output: string
  }> {
    try {
      const action = options.action || 'verify'
      
      switch (action) {
        case 'snapshot':
          if (!options.entityName) {
            throw new Error('实体名称是必需的')
          }
          await this.captureUnderstandingSnapshot(options.entityName)
          return {
            success: true,
            data: { snapshotCaptured: true },
            output: `📸 ${options.entityName} 理解快照已捕获`
          }
          
        case 'verify':
          const consistency = await this.verifyContextConsistency(options.entityName)
          const output = options.format === 'json' 
            ? JSON.stringify(consistency, null, 2)
            : this.formatConsistencyReportForClaude(consistency, options)
          return {
            success: consistency.overallConsistency > 70,
            data: consistency,
            output
          }
          
        case 'report':
          const report = await this.generateConsistencyReport()
          return {
            success: true,
            data: report,
            output: options.format === 'json' 
              ? JSON.stringify(report, null, 2)
              : this.formatReportForClaude(report, options)
          }
          
        case 'drift':
          const drifts = await this.detectUnderstandingDrift(options.entityName)
          return {
            success: drifts.length === 0,
            data: drifts,
            output: this.formatDriftForClaude(drifts, options)
          }
          
        default:
          throw new Error(`未知操作: ${action}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Context Verifier执行失败', { error: errorMessage })
      
      return {
        success: false,
        data: null,
        output: `❌ Context Verifier执行失败: ${errorMessage}`
      }
    }
  }

  /**
   * 捕获AI理解快照
   */
  async captureUnderstandingSnapshot(
    entityName: string,
    contextType: AIContextSnapshot['contextType'] = 'architecture',
    graphRAGResult?: unknown
  ): Promise<AIContextSnapshot> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true })

      // 从Graph RAG获取实体信息作为基准
      const understanding = await this.extractUnderstandingFromGraphRAG(entityName, graphRAGResult)
      
      const snapshot: AIContextSnapshot = {
        timestamp: new Date().toISOString(),
        sessionId: process.env.AI_SESSION_ID || 'default',
        contextType,
        entityName,
        understanding,
        confidence: this.calculateConfidence(understanding),
        sourceFiles: understanding.properties.sourceFiles as string[] || [],
        graphRAGResult
      }

      // 保存快照
      await this.persistSnapshot(snapshot)
      
      // 更新内存中的快照列表
      if (!this.snapshots.has(entityName)) {
        this.snapshots.set(entityName, [])
      }
      
      const entitySnapshots = this.snapshots.get(entityName)!
      entitySnapshots.push(snapshot)
      
      // 保持快照数量限制
      if (entitySnapshots.length > this.config.maxSnapshotsPerEntity) {
        entitySnapshots.shift()
      }

      logger.info('AI理解快照已捕获', {
        实体: entityName,
        置信度: snapshot.confidence,
        快照总数: entitySnapshots.length
      })

      return snapshot
    } catch (error) {
      logger.error('捕获理解快照失败', { error, entityName })
      throw error
    }
  }

  /**
   * 验证上下文一致性
   */
  async verifyContextConsistency(entityName?: string): Promise<ContextConsistencyReport> {
    try {
      const startTime = Date.now()
      
      // 加载历史快照
      await this.loadSnapshots()
      
      const entitiesToCheck = entityName 
        ? [entityName] 
        : Array.from(this.snapshots.keys())

      let totalDrifts: UnderstandingDrift[] = []
      let stableEntities: string[] = []
      let criticalInconsistencies: UnderstandingDrift[] = []

      for (const entity of entitiesToCheck) {
        const drifts = await this.detectUnderstandingDrift(entity)
        
        if (drifts.length === 0) {
          stableEntities.push(entity)
        } else {
          totalDrifts.push(...drifts)
          
          // 识别严重不一致
          const criticalDrifts = drifts.filter(d => d.severity === 'critical')
          criticalInconsistencies.push(...criticalDrifts)
        }
      }

      // 计算整体一致性分数
      const overallConsistency = this.calculateOverallConsistency(
        entitiesToCheck.length,
        totalDrifts
      )

      const report: ContextConsistencyReport = {
        overallConsistency,
        driftDetected: totalDrifts,
        stableEntities,
        criticalInconsistencies,
        recommendations: this.generateConsistencyRecommendations(totalDrifts),
        metadata: {
          snapshotsAnalyzed: this.getTotalSnapshotCount(),
          entitiesMonitored: entitiesToCheck.length,
          analysisTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }

      logger.info('上下文一致性验证完成', {
        整体一致性: overallConsistency,
        发现漂移: totalDrifts.length,
        稳定实体: stableEntities.length,
        严重不一致: criticalInconsistencies.length
      })

      return report
    } catch (error) {
      logger.error('验证上下文一致性失败', { error })
      throw error
    }
  }

  /**
   * 检测理解漂移
   */
  async detectUnderstandingDrift(entityName?: string): Promise<UnderstandingDrift[]> {
    const drifts: UnderstandingDrift[] = []
    
    const entitiesToCheck = entityName 
      ? [entityName] 
      : Array.from(this.snapshots.keys())

    for (const entity of entitiesToCheck) {
      const snapshots = this.snapshots.get(entity) || []
      
      if (snapshots.length < 2) {
        continue // 需要至少两个快照才能检测漂移
      }

      // 比较最新快照与历史快照
      const latestSnapshot = snapshots[snapshots.length - 1]
      const previousSnapshot = snapshots[snapshots.length - 2]

      const drift = await this.compareSnapshots(latestSnapshot, previousSnapshot)
      
      if (drift && drift.driftScore > this.config.driftThreshold) {
        drifts.push(drift)
      }
    }

    return drifts
  }

  /**
   * 比较两个理解快照
   */
  private async compareSnapshots(
    current: AIContextSnapshot,
    previous: AIContextSnapshot
  ): Promise<UnderstandingDrift | null> {
    try {
      // 1. 描述语义相似性检查
      const semanticDrift = this.calculateSemanticDrift(
        current.understanding.description,
        previous.understanding.description
      )

      // 2. 结构性变化检查
      const structuralDrift = this.calculateStructuralDrift(
        current.understanding,
        previous.understanding
      )

      // 3. 关系变化检查
      const relationshipDrift = this.calculateRelationshipDrift(
        current.understanding.relationships,
        previous.understanding.relationships
      )

      // 计算总体漂移分数
      const driftScore = Math.max(semanticDrift, structuralDrift, relationshipDrift)

      if (driftScore < this.config.driftThreshold) {
        return null // 没有显著漂移
      }

      // 确定漂移类型和严重程度
      const driftType = this.determineDriftType(semanticDrift, structuralDrift, relationshipDrift)
      const severity = this.determineDriftSeverity(driftScore)

      // 生成证据和建议
      const evidence = this.generateDriftEvidence(current, previous, {
        semanticDrift,
        structuralDrift,
        relationshipDrift
      })

      const recommendations = this.generateDriftRecommendations(driftType, severity)

      return {
        entityName: current.entityName,
        driftType,
        severity,
        oldUnderstanding: previous.understanding.description,
        newUnderstanding: current.understanding.description,
        driftScore,
        evidence,
        recommendations,
        autoFixAvailable: this.canAutoFix(driftType, severity)
      }
    } catch (error) {
      logger.error('比较快照失败', { error })
      return null
    }
  }

  /**
   * 从Graph RAG提取理解信息
   */
  private async extractUnderstandingFromGraphRAG(
    entityName: string,
    graphRAGResult?: unknown
  ): Promise<AIContextSnapshot['understanding']> {
    // 基于Graph RAG结果提取实体理解
    const understanding = {
      description: `${entityName} 实体的当前理解`,
      properties: {
        sourceFiles: [],
        fields: [],
        methods: [],
        ...((graphRAGResult as any)?.results?.primary_target || {})
      },
      relationships: [],
      constraints: [],
      patterns: []
    }

    // 如果有Graph RAG结果，从中提取详细信息
    if (graphRAGResult && typeof graphRAGResult === 'object') {
      const result = graphRAGResult as any
      
      if (result.results?.primary_target) {
        understanding.description = result.results.primary_target.description || understanding.description
        understanding.properties = { ...understanding.properties, ...result.results.primary_target }
      }

      if (result.results?.related_entities) {
        understanding.relationships = result.results.related_entities.map((entity: any) => ({
          type: 'related',
          target: entity.name,
          description: entity.description || ''
        }))
      }
    }

    return understanding
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(understanding: AIContextSnapshot['understanding']): number {
    let confidence = 50 // 基础置信度

    // 有描述 +20
    if (understanding.description && understanding.description.length > 10) {
      confidence += 20
    }

    // 有属性 +15
    if (Object.keys(understanding.properties).length > 0) {
      confidence += 15
    }

    // 有关系 +10
    if (understanding.relationships.length > 0) {
      confidence += 10
    }

    // 有约束 +5
    if (understanding.constraints.length > 0) {
      confidence += 5
    }

    return Math.min(100, confidence)
  }

  /**
   * 计算语义漂移
   */
  private calculateSemanticDrift(current: string, previous: string): number {
    // 简单的字符串相似度计算
    // 实际应用中可以使用更复杂的语义相似度算法
    const similarity = this.calculateStringSimilarity(current, previous)
    return (1 - similarity) * 100
  }

  /**
   * 计算结构性漂移
   */
  private calculateStructuralDrift(
    current: AIContextSnapshot['understanding'],
    previous: AIContextSnapshot['understanding']
  ): number {
    const currentKeys = new Set(Object.keys(current.properties))
    const previousKeys = new Set(Object.keys(previous.properties))
    
    const addedKeys = new Set([...currentKeys].filter(k => !previousKeys.has(k)))
    const removedKeys = new Set([...previousKeys].filter(k => !currentKeys.has(k)))
    
    const totalKeys = new Set([...currentKeys, ...previousKeys])
    const changedKeys = addedKeys.size + removedKeys.size
    
    return totalKeys.size > 0 ? (changedKeys / totalKeys.size) * 100 : 0
  }

  /**
   * 计算关系漂移
   */
  private calculateRelationshipDrift(
    current: AIContextSnapshot['understanding']['relationships'],
    previous: AIContextSnapshot['understanding']['relationships']
  ): number {
    const currentRels = new Set(current.map(r => `${r.type}:${r.target}`))
    const previousRels = new Set(previous.map(r => `${r.type}:${r.target}`))
    
    const addedRels = new Set([...currentRels].filter(r => !previousRels.has(r)))
    const removedRels = new Set([...previousRels].filter(r => !currentRels.has(r)))
    
    const totalRels = new Set([...currentRels, ...previousRels])
    const changedRels = addedRels.size + removedRels.size
    
    return totalRels.size > 0 ? (changedRels / totalRels.size) * 100 : 0
  }

  /**
   * 计算字符串相似度
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.calculateEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * 计算编辑距离
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = []
    const n = str2.length
    const m = str1.length

    if (n === 0) return m
    if (m === 0) return n

    for (let i = 0; i <= m; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= n; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[m][n]
  }

  /**
   * 确定漂移类型
   */
  private determineDriftType(
    semanticDrift: number,
    structuralDrift: number,
    relationshipDrift: number
  ): UnderstandingDrift['driftType'] {
    const maxDrift = Math.max(semanticDrift, structuralDrift, relationshipDrift)
    
    if (maxDrift > this.config.criticalDriftThreshold) {
      return 'critical'
    } else if (semanticDrift === maxDrift) {
      return 'semantic'
    } else if (structuralDrift === maxDrift) {
      return 'structural'
    } else {
      return 'behavioral'
    }
  }

  /**
   * 确定漂移严重程度
   */
  private determineDriftSeverity(driftScore: number): UnderstandingDrift['severity'] {
    if (driftScore >= this.config.criticalDriftThreshold) {
      return 'critical'
    } else if (driftScore >= 25) {
      return 'high'
    } else if (driftScore >= 15) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 生成漂移证据
   */
  private generateDriftEvidence(
    current: AIContextSnapshot,
    previous: AIContextSnapshot,
    driftMetrics: { semanticDrift: number; structuralDrift: number; relationshipDrift: number }
  ): UnderstandingDrift['evidence'] {
    const evidence: UnderstandingDrift['evidence'] = []

    if (driftMetrics.semanticDrift > this.config.driftThreshold) {
      evidence.push({
        type: 'semantic_change',
        description: `实体描述发生了${driftMetrics.semanticDrift.toFixed(1)}%的变化`,
        impact: '可能影响AI对该实体的理解和使用'
      })
    }

    if (driftMetrics.structuralDrift > this.config.driftThreshold) {
      evidence.push({
        type: 'structural_change',
        description: `实体结构发生了${driftMetrics.structuralDrift.toFixed(1)}%的变化`,
        impact: '可能影响相关代码的生成和维护'
      })
    }

    if (driftMetrics.relationshipDrift > this.config.driftThreshold) {
      evidence.push({
        type: 'relationship_change',
        description: `实体关系发生了${driftMetrics.relationshipDrift.toFixed(1)}%的变化`,
        impact: '可能影响系统架构理解和模块间交互'
      })
    }

    return evidence
  }

  /**
   * 生成漂移修复建议
   */
  private generateDriftRecommendations(
    driftType: UnderstandingDrift['driftType'],
    severity: UnderstandingDrift['severity']
  ): string[] {
    const recommendations: string[] = []

    switch (driftType) {
      case 'semantic':
        recommendations.push('重新验证实体的语义定义和描述')
        recommendations.push('检查是否有词汇表或术语定义的更新')
        break
      
      case 'structural':
        recommendations.push('确认实体结构变化是否为有意的架构演进')
        recommendations.push('更新相关的文档和Schema定义')
        break
      
      case 'behavioral':
        recommendations.push('验证实体行为的预期变化')
        recommendations.push('更新相关的测试用例和验证逻辑')
        break
      
      case 'critical':
        recommendations.push('立即停止相关AI操作，进行人工审查')
        recommendations.push('重新训练或校准AI模型的理解')
        break
    }

    if (severity === 'critical') {
      recommendations.unshift('🚨 严重漂移：需要立即人工干预')
    }

    return recommendations
  }

  /**
   * 判断是否可以自动修复
   */
  private canAutoFix(
    driftType: UnderstandingDrift['driftType'],
    severity: UnderstandingDrift['severity']
  ): boolean {
    // 只有低严重程度的语义漂移可以尝试自动修复
    return driftType === 'semantic' && severity === 'low'
  }

  /**
   * 计算整体一致性分数
   */
  private calculateOverallConsistency(
    totalEntities: number,
    drifts: UnderstandingDrift[]
  ): number {
    if (totalEntities === 0) return 100

    let consistencyScore = 100
    
    for (const drift of drifts) {
      let penalty = 0
      switch (drift.severity) {
        case 'critical': penalty = 50; break
        case 'high': penalty = 25; break
        case 'medium': penalty = 10; break
        case 'low': penalty = 5; break
      }
      
      consistencyScore -= penalty
    }

    return Math.max(0, consistencyScore)
  }

  /**
   * 生成一致性建议
   */
  private generateConsistencyRecommendations(
    drifts: UnderstandingDrift[]
  ): ContextConsistencyReport['recommendations'] {
    const immediate: string[] = []
    const monitoring: string[] = []
    const preventive: string[] = []

    const criticalDrifts = drifts.filter(d => d.severity === 'critical')
    const highDrifts = drifts.filter(d => d.severity === 'high')

    if (criticalDrifts.length > 0) {
      immediate.push('🚨 立即处理严重的理解漂移')
      immediate.push('暂停相关AI操作，进行人工审查')
    }

    if (highDrifts.length > 0) {
      immediate.push('优先修复高严重度的理解不一致')
    }

    monitoring.push('定期检查理解快照的一致性')
    monitoring.push('监控频繁变化的实体')

    preventive.push('增加关键实体的快照频率')
    preventive.push('建立实体理解的基准版本')
    preventive.push('实施更严格的架构变更审查')

    return { immediate, monitoring, preventive }
  }

  /**
   * 获取快照总数
   */
  private getTotalSnapshotCount(): number {
    let total = 0
    for (const snapshots of this.snapshots.values()) {
      total += snapshots.length
    }
    return total
  }

  /**
   * 格式化一致性报告给Claude
   */
  private formatConsistencyReportForClaude(
    report: ContextConsistencyReport,
    options: { verbose?: boolean }
  ): string {
    const lines: string[] = []
    
    lines.push('🔍 ===== Context Verifier 一致性报告 =====\n')
    
    // 总体状态
    const statusIcon = report.overallConsistency > 80 ? '✅' : 
                      report.overallConsistency > 60 ? '⚠️' : '❌'
    
    lines.push('📊 整体状态:')
    lines.push(`   ${statusIcon} 一致性分数: ${report.overallConsistency}/100`)
    lines.push(`   📈 稳定实体: ${report.stableEntities.length}`)
    lines.push(`   📉 发现漂移: ${report.driftDetected.length}`)
    lines.push(`   🚨 严重不一致: ${report.criticalInconsistencies.length}\n`)

    // 漂移详情
    if (report.driftDetected.length > 0) {
      lines.push('🔍 检测到的理解漂移:\n')
      
      for (const drift of report.driftDetected.slice(0, 5)) {
        const severityIcon = drift.severity === 'critical' ? '🚨' : 
                           drift.severity === 'high' ? '❌' : 
                           drift.severity === 'medium' ? '⚠️' : '🔶'
        
        lines.push(`${severityIcon} ${drift.entityName}`)
        lines.push(`   类型: ${drift.driftType}`)
        lines.push(`   漂移分数: ${drift.driftScore.toFixed(1)}`)
        
        if (options.verbose) {
          lines.push(`   原理解: ${drift.oldUnderstanding.substring(0, 80)}...`)
          lines.push(`   新理解: ${drift.newUnderstanding.substring(0, 80)}...`)
        }
        lines.push('')
      }
    }

    // 建议
    if (report.recommendations.immediate.length > 0) {
      lines.push('🚨 立即行动建议:')
      for (const rec of report.recommendations.immediate) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }

    if (options.verbose && report.recommendations.monitoring.length > 0) {
      lines.push('👁️ 监控建议:')
      for (const rec of report.recommendations.monitoring) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }

    lines.push('🔍 ===== 一致性验证完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 格式化漂移结果给Claude
   */
  private formatDriftForClaude(
    drifts: UnderstandingDrift[],
    options: { verbose?: boolean }
  ): string {
    const lines: string[] = []
    
    lines.push('📊 ===== Context Verifier 漂移检测 =====\n')
    
    if (drifts.length === 0) {
      lines.push('✅ 未检测到理解漂移，AI理解保持稳定')
      lines.push('📊 ===== 漂移检测完成 =====')
      return lines.join('\n')
    }

    lines.push(`🔍 检测到 ${drifts.length} 个理解漂移:\n`)
    
    for (const drift of drifts) {
      const severityIcon = drift.severity === 'critical' ? '🚨' : 
                         drift.severity === 'high' ? '❌' : 
                         drift.severity === 'medium' ? '⚠️' : '🔶'
      
      lines.push(`${severityIcon} ${drift.entityName} (${drift.driftType})`)
      lines.push(`   严重程度: ${drift.severity}`)
      lines.push(`   漂移分数: ${drift.driftScore.toFixed(1)}%`)
      lines.push(`   自动修复: ${drift.autoFixAvailable ? '✅' : '❌'}`)
      
      if (options.verbose && drift.evidence.length > 0) {
        lines.push('   证据:')
        for (const evidence of drift.evidence) {
          lines.push(`     • ${evidence.description}`)
        }
      }
      
      if (drift.recommendations.length > 0) {
        lines.push('   建议:')
        for (const rec of drift.recommendations.slice(0, 3)) {
          lines.push(`     ${rec}`)
        }
      }
      lines.push('')
    }
    
    lines.push('📊 ===== 漂移检测完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 格式化报告给Claude
   */
  private formatReportForClaude(
    report: ContextConsistencyReport,
    options: { verbose?: boolean }
  ): string {
    return this.formatConsistencyReportForClaude(report, options)
  }

  /**
   * 生成一致性报告
   */
  async generateConsistencyReport(): Promise<ContextConsistencyReport> {
    return await this.verifyContextConsistency()
  }

  /**
   * 持久化快照
   */
  private async persistSnapshot(snapshot: AIContextSnapshot): Promise<void> {
    try {
      const snapshotFile = join(this.dataDir, `${snapshot.entityName}-snapshots.json`)
      
      let existingSnapshots: AIContextSnapshot[] = []
      try {
        const content = await fs.readFile(snapshotFile, 'utf-8')
        existingSnapshots = JSON.parse(content)
      } catch {
        // 文件不存在，创建新的
      }
      
      existingSnapshots.push(snapshot)
      
      // 保留最近的快照
      if (existingSnapshots.length > this.config.maxSnapshotsPerEntity) {
        existingSnapshots = existingSnapshots.slice(-this.config.maxSnapshotsPerEntity)
      }
      
      await fs.writeFile(snapshotFile, JSON.stringify(existingSnapshots, null, 2))
    } catch (error) {
      logger.error('持久化快照失败', { error })
    }
  }

  /**
   * 加载快照
   */
  private async loadSnapshots(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
      
      const files = await fs.readdir(this.dataDir)
      const snapshotFiles = files.filter(f => f.endsWith('-snapshots.json'))
      
      for (const file of snapshotFiles) {
        try {
          const content = await fs.readFile(join(this.dataDir, file), 'utf-8')
          const snapshots: AIContextSnapshot[] = JSON.parse(content)
          
          if (snapshots.length > 0) {
            const entityName = snapshots[0].entityName
            this.snapshots.set(entityName, snapshots)
          }
        } catch (error) {
          logger.warn('加载快照文件失败', { file, error })
        }
      }
      
      logger.info('快照加载完成', {
        实体数量: this.snapshots.size,
        快照总数: this.getTotalSnapshotCount()
      })
    } catch (error) {
      logger.error('加载快照失败', { error })
    }
  }

  /**
   * 启动监控
   */
  async startMonitoring(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true })
      
      // 加载历史快照
      await this.loadSnapshots()
      
      // 启动定期验证
      this.scheduleVerification()
      
      logger.info('Context Verifier监控已启动', { dataDir: this.dataDir })
    } catch (error) {
      logger.error('启动监控失败', { error })
      throw error
    }
  }

  /**
   * 安排定期验证
   */
  private scheduleVerification(): void {
    // 每6小时进行一次一致性验证
    setInterval(async () => {
      try {
        const report = await this.verifyContextConsistency()
        logger.info('定期一致性验证完成', {
          整体一致性: report.overallConsistency,
          漂移数量: report.driftDetected.length
        })
        
        // 如果发现严重不一致，发出警告
        if (report.criticalInconsistencies.length > 0) {
          logger.error('🚨 发现严重的理解不一致', {
            严重不一致数量: report.criticalInconsistencies.length
          })
        }
      } catch (error) {
        logger.error('定期一致性验证失败', { error })
      }
    }, this.config.verificationInterval * 60 * 60 * 1000)
  }
}

export default ContextVerifier