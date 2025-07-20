/**
 * LinchKit AI工作流管理器
 * 集成Graph RAG查询、AI分析和工作流决策的统一系统
 * 
 * @version 1.0.0 - Phase 1 AI工作流集成
 */

import { execSync } from 'child_process'
import { createLogger } from '@linch-kit/core'
import { HybridAIManager, AnalysisResult } from '../providers/hybrid-ai-manager'
import { WorkflowStateMachine, createWorkflowStateMachine, WorkflowState } from './workflow-state-machine'

const logger = createLogger('ai-workflow-manager')

export interface WorkflowContext {
  taskDescription: string
  projectContext?: {
    name?: string
    version?: string
    currentBranch?: string
    recentCommits?: string[]
  }
  userPreferences?: {
    preferredApproach?: 'conservative' | 'aggressive' | 'balanced'
    requireApproval?: boolean
    autoImplement?: boolean
  }
}

export interface GraphRAGQueryResult {
  success: boolean
  contextFound: boolean
  suggestions: {
    existingImplementations: string[]
    relatedComponents: string[]
    patterns: string[]
    recommendations: string[]
  }
  queryDetails: {
    executionTime: number
    confidence: number
    totalResults: number
  }
}

export interface WorkflowDecision {
  approach: 'extend_existing' | 'create_new' | 'refactor' | 'hybrid'
  confidence: number
  reasoning: string
  estimatedEffort: {
    hours: number
    complexity: 1 | 2 | 3 | 4 | 5
  }
  dependencies: string[]
  risks: string[]
  nextSteps: string[]
  requiresApproval: boolean
}

export interface AIWorkflowResult {
  context: WorkflowContext
  graphRAG: GraphRAGQueryResult
  aiAnalysis: AnalysisResult
  decision: WorkflowDecision
  workflowState: WorkflowState
  metadata: {
    sessionId: string
    timestamp: string
    processingTime: number
  }
}

/**
 * AI工作流管理器
 * 整合Graph RAG查询和AI分析的完整工作流决策系统
 */
export class AIWorkflowManager {
  private aiManager: HybridAIManager
  private sessionId: string
  private stateMachine: WorkflowStateMachine | null = null

  constructor(aiManager: HybridAIManager) {
    this.aiManager = aiManager
    this.sessionId = `workflow-${Date.now()}`
  }

  /**
   * 执行完整的AI工作流分析
   */
  async analyzeWorkflow(context: WorkflowContext): Promise<AIWorkflowResult> {
    const startTime = Date.now()
    logger.info(`Starting AI workflow analysis for: ${context.taskDescription}`)

    try {
      // 0. 初始化状态机
      this.stateMachine = createWorkflowStateMachine(this.sessionId, context.taskDescription)
      await this.stateMachine.transition('START_ANALYSIS')

      // 1. 执行Graph RAG查询获取项目上下文
      const graphRAGResult = await this.executeGraphRAGQuery(context.taskDescription)
      
      // 2. 构建增强的上下文
      const enhancedContext = this.buildEnhancedContext(context, graphRAGResult)
      
      // 3. 执行AI分析
      const aiAnalysis = await this.aiManager.analyzeWorkflow(
        context.taskDescription, 
        enhancedContext
      )
      
      // 4. 生成工作流决策
      const decision = this.generateWorkflowDecision(
        context, 
        graphRAGResult, 
        aiAnalysis
      )
      
      // 5. 更新状态机分析结果
      this.stateMachine.updateAnalysis({
        approach: decision.approach,
        confidence: decision.confidence,
        estimatedHours: decision.estimatedEffort.hours,
        complexity: decision.estimatedEffort.complexity,
        risks: decision.risks,
        dependencies: decision.dependencies
      })

      // 6. 完成分析并转换状态
      await this.stateMachine.transition('COMPLETE_ANALYSIS')
      
      // 7. 构建完整结果
      const result: AIWorkflowResult = {
        context,
        graphRAG: graphRAGResult,
        aiAnalysis,
        decision,
        workflowState: this.stateMachine.getCurrentState(),
        metadata: {
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      }

      logger.info(`AI workflow analysis completed in ${result.metadata.processingTime}ms, state: ${result.workflowState}`)
      return result

    } catch (error) {
      if (this.stateMachine) {
        await this.stateMachine.transition('FAIL', { error: error instanceof Error ? error.message : 'Unknown error' })
      }
      logger.error('AI workflow analysis failed:', error)
      throw new Error(`Workflow analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 执行Graph RAG查询
   */
  private async executeGraphRAGQuery(taskDescription: string): Promise<GraphRAGQueryResult> {
    try {
      logger.info('Executing Graph RAG query...')
      
      // 提取主要关键词用于查询 (session-tools只支持单个实体查询)
      const keywords = this.extractKeywords(taskDescription)
      const primaryKeyword = keywords[0] || taskDescription.split(' ')[0]
      const queryCommand = `bun run ai:session query "${primaryKeyword}"`
      
      const output = execSync(queryCommand, { 
        encoding: 'utf8',
        timeout: 30000,
        cwd: process.cwd().includes('tools/ai-platform') 
          ? process.cwd().replace('/tools/ai-platform', '') 
          : process.cwd()
      })

      // 解析查询结果
      const queryResult = this.parseGraphRAGOutput(output)
      
      return {
        success: true,
        contextFound: queryResult.totalResults > 0,
        suggestions: {
          existingImplementations: queryResult.existingImplementations || [],
          relatedComponents: queryResult.relatedComponents || [],
          patterns: queryResult.patterns || [],
          recommendations: queryResult.recommendations || []
        },
        queryDetails: {
          executionTime: queryResult.executionTime || 0,
          confidence: queryResult.confidence || 0.8,
          totalResults: queryResult.totalResults || 0
        }
      }
    } catch (error) {
      logger.warn('Graph RAG query failed:', error)
      return {
        success: false,
        contextFound: false,
        suggestions: {
          existingImplementations: [],
          relatedComponents: [],
          patterns: [],
          recommendations: ['请手动检查现有实现']
        },
        queryDetails: {
          executionTime: 0,
          confidence: 0,
          totalResults: 0
        }
      }
    }
  }

  /**
   * 提取任务描述中的关键词
   */
  private extractKeywords(taskDescription: string): string[] {
    // 简单的关键词提取逻辑，可以后续使用NLP库优化
    const stopWords = new Set(['的', '和', '与', '或', '但是', '然而', '因为', '所以', '一个', '这个', '那个'])
    const keywords = taskDescription
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中英文和数字
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 5) // 限制关键词数量

    return keywords.length > 0 ? keywords : [taskDescription.substring(0, 50)]
  }

  /**
   * 解析Graph RAG输出
   */
  private parseGraphRAGOutput(output: string): any {
    try {
      // 方法1: 从结构化日志中提取JSON (查找包含完整JSON的日志行)
      const lines = output.split('\n')
      for (const line of lines) {
        if (line.includes('"success":') && line.includes('"results":')) {
          try {
            // 尝试解析结构化日志中的JSON
            const logEntry = JSON.parse(line)
            if (logEntry.msg) {
              const result = JSON.parse(logEntry.msg)
              return this.extractGraphRAGData(result)
            }
          } catch {
            // 如果结构化日志解析失败，尝试提取msg字段中的JSON
            const msgMatch = line.match(/"msg":"(.*)"/)
            if (msgMatch) {
              try {
                const escapedJson = msgMatch[1]
                const unescapedJson = escapedJson.replace(/\\"/g, '"').replace(/\\n/g, '\n')
                const result = JSON.parse(unescapedJson)
                return this.extractGraphRAGData(result)
              } catch {
                continue
              }
            }
          }
        }
      }
      
      // 方法2: 查找独立的JSON块
      const jsonMatch = output.match(/\{\s*"success":\s*true[\s\S]*?"metadata"[\s\S]*?\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return this.extractGraphRAGData(result)
      }
    } catch (error) {
      logger.warn('Failed to parse Graph RAG output as JSON:', error)
    }

    // 降级到文本解析
    return {
      totalResults: output.includes('total_found') ? 1 : 0,
      executionTime: 0,
      confidence: 0.5,
      existingImplementations: [],
      relatedComponents: [],
      patterns: [],
      recommendations: output.includes('未找到') ? ['创建新实现'] : ['复用现有组件']
    }
  }

  /**
   * 提取Graph RAG数据的统一方法
   */
  private extractGraphRAGData(result: any): any {
    return {
      totalResults: result.metadata?.total_found || 0,
      executionTime: result.metadata?.execution_time_ms || 0,
      confidence: result.metadata?.confidence || 0.8,
      existingImplementations: this.extractImplementations(result),
      relatedComponents: this.extractComponents(result),
      patterns: this.extractPatterns(result),
      recommendations: this.extractRecommendations(result)
    }
  }

  /**
   * 从Graph RAG结果中提取现有实现
   */
  private extractImplementations(result: any): string[] {
    const implementations: string[] = []
    
    if (result.results?.related_entities) {
      result.results.related_entities.forEach((entity: any) => {
        if (entity.type === 'Function' || entity.type === 'Class') {
          implementations.push(`${entity.name} (${entity.file_path})`)
        }
      })
    }
    
    return implementations
  }

  /**
   * 从Graph RAG结果中提取相关组件
   */
  private extractComponents(result: any): string[] {
    const components: string[] = []
    
    if (result.results?.related_files) {
      Object.values(result.results.related_files).forEach((fileList: any) => {
        if (Array.isArray(fileList)) {
          components.push(...fileList)
        }
      })
    }
    
    return components
  }

  /**
   * 从Graph RAG结果中提取模式
   */
  private extractPatterns(result: any): string[] {
    if (result.results?.patterns) {
      return result.results.patterns
    }
    return []
  }

  /**
   * 从Graph RAG结果中提取建议
   */
  private extractRecommendations(result: any): string[] {
    const recommendations: string[] = []
    
    if (result.results?.suggestions) {
      if (result.results.suggestions.add_field) {
        recommendations.push('扩展现有实体')
      }
    }
    
    return recommendations
  }

  /**
   * 构建增强的分析上下文
   */
  private buildEnhancedContext(
    context: WorkflowContext, 
    graphRAG: GraphRAGQueryResult
  ): Record<string, any> {
    return {
      project_name: context.projectContext?.name || 'LinchKit',
      project_version: context.projectContext?.version || '1.0.0',
      current_branch: context.projectContext?.currentBranch,
      recent_commits: context.projectContext?.recentCommits || [],
      task_description: context.taskDescription,
      existing_implementations: graphRAG.suggestions.existingImplementations,
      related_components: graphRAG.suggestions.relatedComponents,
      context_confidence: graphRAG.queryDetails.confidence,
      user_preferences: context.userPreferences || {}
    }
  }

  /**
   * 生成工作流决策
   */
  private generateWorkflowDecision(
    context: WorkflowContext,
    graphRAG: GraphRAGQueryResult,
    aiAnalysis: AnalysisResult
  ): WorkflowDecision {
    // 解析AI分析结果中的结构化数据
    let parsedAnalysis: any = {}
    if (aiAnalysis.structured?.parsed) {
      parsedAnalysis = aiAnalysis.structured.parsed
    }

    // 决策逻辑
    let approach: WorkflowDecision['approach'] = 'create_new'
    let confidence = 0.7

    if (graphRAG.contextFound && graphRAG.suggestions.existingImplementations.length > 0) {
      approach = 'extend_existing'
      confidence = 0.8
    } else if (graphRAG.suggestions.relatedComponents.length > 2) {
      approach = 'hybrid'
      confidence = 0.75
    }

    // 从AI分析中提取信息
    const complexity = parsedAnalysis.complexity_level || 3
    const estimatedHours = parsedAnalysis.estimated_effort_hours || complexity * 2
    const risks = parsedAnalysis.risks || ['实现复杂度', '集成风险']
    const dependencies = parsedAnalysis.dependencies || []
    const workflowSteps = parsedAnalysis.workflow_steps || ['设计', '实现', '测试']

    return {
      approach,
      confidence,
      reasoning: this.generateReasoning(approach, graphRAG, aiAnalysis),
      estimatedEffort: {
        hours: estimatedHours,
        complexity: complexity as 1 | 2 | 3 | 4 | 5
      },
      dependencies,
      risks,
      nextSteps: workflowSteps,
      requiresApproval: context.userPreferences?.requireApproval || complexity >= 4
    }
  }

  /**
   * 生成决策推理
   */
  private generateReasoning(
    approach: WorkflowDecision['approach'],
    graphRAG: GraphRAGQueryResult,
    aiAnalysis: AnalysisResult
  ): string {
    const reasons: string[] = []

    switch (approach) {
      case 'extend_existing':
        reasons.push(`发现${graphRAG.suggestions.existingImplementations.length}个现有实现`)
        reasons.push('建议扩展现有功能以保持一致性')
        break
      case 'hybrid':
        reasons.push('存在相关组件可复用')
        reasons.push('建议混合新建和扩展的方式')
        break
      case 'create_new':
        reasons.push('未发现直接可复用的实现')
        reasons.push('建议创建新的独立实现')
        break
      case 'refactor':
        reasons.push('现有实现需要重构')
        reasons.push('建议重新设计架构')
        break
    }

    if (aiAnalysis.confidence && aiAnalysis.confidence > 0.8) {
      reasons.push('AI分析置信度高')
    }

    return reasons.join('；')
  }

  /**
   * 获取工作流状态
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 获取当前工作流状态
   */
  getCurrentWorkflowState(): WorkflowState | null {
    return this.stateMachine?.getCurrentState() || null
  }

  /**
   * 获取可用的工作流操作
   */
  getAvailableWorkflowActions(): string[] {
    return this.stateMachine?.getAvailableActions() || []
  }

  /**
   * 执行工作流操作
   */
  async executeWorkflowAction(action: string, metadata?: Record<string, unknown>): Promise<boolean> {
    if (!this.stateMachine) {
      logger.warn('No active state machine for workflow action')
      return false
    }

    return await this.stateMachine.transition(action as any, metadata)
  }

  /**
   * 获取完整的工作流上下文
   */
  getWorkflowContext(): any {
    return this.stateMachine?.getContext() || null
  }

  /**
   * 检查工作流是否需要审批
   */
  checkApprovalRequired(): boolean {
    const state = this.getCurrentWorkflowState()
    return state === 'PENDING_APPROVAL'
  }

  /**
   * 批准工作流
   */
  async approveWorkflow(approver: string, reason?: string): Promise<boolean> {
    if (!this.stateMachine) return false
    
    return await this.stateMachine.transition('APPROVE', {
      by: approver,
      reason: reason || '审批通过'
    })
  }

  /**
   * 拒绝工作流
   */
  async rejectWorkflow(rejector: string, reason: string): Promise<boolean> {
    if (!this.stateMachine) return false
    
    return await this.stateMachine.transition('REJECT', {
      by: rejector,
      reason
    })
  }

  /**
   * 开始实施
   */
  async startImplementation(implementer: string): Promise<boolean> {
    if (!this.stateMachine) return false
    
    return await this.stateMachine.transition('START_IMPLEMENTATION', {
      by: implementer
    })
  }

  /**
   * 更新实施进度
   */
  updateImplementationProgress(progress: number, currentStep: string): void {
    if (this.stateMachine) {
      this.stateMachine.updateImplementationProgress(progress, currentStep)
    }
  }

  /**
   * 检查自动审批
   */
  checkAutoApproval(): boolean {
    return this.stateMachine?.checkAutoApproval() || false
  }

  /**
   * 验证工作流结果
   */
  validateWorkflowResult(result: AIWorkflowResult): boolean {
    return (
      result.context &&
      result.graphRAG &&
      result.aiAnalysis &&
      result.decision &&
      result.metadata
    )
  }
}

/**
 * 工厂函数
 */
export function createAIWorkflowManager(aiManager: HybridAIManager): AIWorkflowManager {
  return new AIWorkflowManager(aiManager)
}