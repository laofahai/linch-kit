/**
 * Claude Code 调度器
 * 实现 Claude Code → tools/ai-platform → Gemini 调用链
 * 提供标准化的AI工作流调度和Claude Code集成
 * 
 * @version 1.0.0 - Phase 1 Claude Code集成
 */

import { createLogger } from '@linch-kit/core'
import { HybridAIManager, AnalysisResult } from '../providers/hybrid-ai-manager'
import { AIWorkflowManager, WorkflowContext, AIWorkflowResult } from './ai-workflow-manager'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine'
import { UserFeedbackCollector } from '../feedback/user-feedback-collector'

const logger = createLogger('claude-code-scheduler')

export interface ClaudeCodeRequest {
  sessionId: string
  taskDescription: string
  context?: {
    projectInfo?: {
      name?: string
      version?: string
      branch?: string
      type?: string
    }
    userPreferences?: {
      requireApproval?: boolean
      automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
      complexityThreshold?: number
    }
    graphRAGContext?: {
      enableGraphRAG?: boolean
      queryKeywords?: string[]
      confidenceThreshold?: number
    }
  }
  metadata?: {
    requestedBy?: string
    priority?: 'low' | 'medium' | 'high'
    tags?: string[]
  }
}

export interface ClaudeCodeResponse {
  success: boolean
  sessionId: string
  result?: {
    workflow: AIWorkflowResult
    recommendations: {
      approach: string
      reasoning: string
      confidence: number
      nextSteps: string[]
      estimatedEffort: {
        hours: number
        complexity: 1 | 2 | 3 | 4 | 5
      }
    }
    graphRAGInsights?: {
      contextFound: boolean
      existingImplementations: string[]
      relatedComponents: string[]
      suggestions: string[]
    }
  }
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  metadata: {
    processingTime: number
    aiProvider?: string
    graphRAGUsed: boolean
    approvalRequired: boolean
    requestedAt: string
    completedAt: string
  }
}

export interface TrustedEnvironmentContext {
  projectConstraints: string[]
  codebaseKnowledge: {
    packages: string[]
    recentChanges: string[]
    dependencies: string[]
  }
  qualityStandards: {
    testCoverage: number
    typeScriptStrict: boolean
    lintRules: string[]
  }
  securityPolicies: {
    allowedOperations: string[]
    forbiddenPatterns: string[]
    dataHandlingRules: string[]
  }
}

/**
 * Claude Code 调度器
 * 为Claude Code提供统一的AI工作流调度接口
 */
export class ClaudeCodeScheduler {
  private hybridAI: HybridAIManager
  private queryEngine: IntelligentQueryEngine
  private workflowManager: AIWorkflowManager
  private feedbackCollector: UserFeedbackCollector
  private trustedContext: TrustedEnvironmentContext | null = null

  constructor(hybridAI: HybridAIManager) {
    this.hybridAI = hybridAI
    this.queryEngine = new IntelligentQueryEngine()
    this.workflowManager = new AIWorkflowManager(hybridAI)
    this.feedbackCollector = new UserFeedbackCollector()
    
    logger.info('Claude Code Scheduler initialized')
  }

  /**
   * 初始化连接
   */
  async initialize(): Promise<void> {
    try {
      await this.queryEngine.connect()
      await this.buildTrustedEnvironment()
      logger.info('Claude Code Scheduler fully initialized')
    } catch (error) {
      logger.error('Failed to initialize Claude Code Scheduler:', error)
      throw error
    }
  }

  /**
   * 处理Claude Code请求的主入口
   */
  async processClaudeCodeRequest(request: ClaudeCodeRequest): Promise<ClaudeCodeResponse> {
    const startTime = Date.now()
    const requestedAt = new Date().toISOString()
    
    logger.info(`Processing Claude Code request: ${request.taskDescription}`, {
      sessionId: request.sessionId,
      requestedBy: request.metadata?.requestedBy
    })

    try {
      // 1. 验证和预处理请求
      const validationResult = this.validateRequest(request)
      if (!validationResult.valid) {
        return this.buildErrorResponse(
          request.sessionId,
          'VALIDATION_ERROR',
          validationResult.error!,
          startTime,
          requestedAt
        )
      }

      // 2. 构建增强的工作流上下文
      const workflowContext = await this.buildWorkflowContext(request)
      
      // 3. 执行Graph RAG查询（如果启用）
      let graphRAGUsed = false
      if (request.context?.graphRAGContext?.enableGraphRAG !== false) {
        try {
          await this.executeGraphRAGPrequery(request.taskDescription)
          graphRAGUsed = true
        } catch (error) {
          logger.warn('Graph RAG prequery failed, continuing without it:', error)
        }
      }

      // 4. 执行AI工作流分析
      const workflowResult = await this.workflowManager.analyzeWorkflow(workflowContext)
      
      // 5. 构建推荐信息
      const recommendations = this.buildRecommendations(workflowResult)
      
      // 6. 提取Graph RAG洞察
      const graphRAGInsights = this.extractGraphRAGInsights(workflowResult)
      
      // 7. 检查审批需求
      const approvalRequired = this.checkApprovalRequired(workflowResult, request)
      
      // 8. 记录用户反馈用于持续改进
      await this.recordProcessingSession(request, workflowResult)

      const completedAt = new Date().toISOString()
      const processingTime = Date.now() - startTime

      const response: ClaudeCodeResponse = {
        success: true,
        sessionId: request.sessionId,
        result: {
          workflow: workflowResult,
          recommendations,
          graphRAGInsights
        },
        metadata: {
          processingTime,
          aiProvider: this.hybridAI.getAvailableProviders()[0] || 'gemini-sdk',
          graphRAGUsed,
          approvalRequired,
          requestedAt,
          completedAt
        }
      }

      logger.info(`Claude Code request completed in ${processingTime}ms`, {
        sessionId: request.sessionId,
        success: true,
        approvalRequired
      })

      return response

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Claude Code request failed:`, error)

      return this.buildErrorResponse(
        request.sessionId,
        'PROCESSING_ERROR',
        errorMessage,
        startTime,
        requestedAt,
        { originalError: error }
      )
    }
  }

  /**
   * 构建可信环境上下文
   */
  private async buildTrustedEnvironment(): Promise<void> {
    try {
      // 查询项目约束和规则
      const constraintsQuery = await this.queryEngine.query('project constraints rules')
      const packagesQuery = await this.queryEngine.query('packages dependencies')
      
      this.trustedContext = {
        projectConstraints: this.extractConstraints(constraintsQuery),
        codebaseKnowledge: {
          packages: this.extractPackages(packagesQuery),
          recentChanges: [],
          dependencies: []
        },
        qualityStandards: {
          testCoverage: 95, // 从项目配置读取
          typeScriptStrict: true,
          lintRules: ['no-any', 'prefer-unknown']
        },
        securityPolicies: {
          allowedOperations: ['read', 'create', 'update'],
          forbiddenPatterns: ['eval', 'innerHTML', 'document.write'],
          dataHandlingRules: ['validate-input', 'sanitize-output']
        }
      }
      
      logger.info('Trusted environment context built')
    } catch (error) {
      logger.warn('Failed to build trusted environment, using defaults:', error)
      this.trustedContext = this.getDefaultTrustedContext()
    }
  }

  /**
   * 验证请求
   */
  private validateRequest(request: ClaudeCodeRequest): { valid: boolean; error?: string } {
    if (!request.sessionId || !request.taskDescription) {
      return { valid: false, error: 'sessionId and taskDescription are required' }
    }

    if (request.taskDescription.length < 10) {
      return { valid: false, error: 'taskDescription too short (minimum 10 characters)' }
    }

    if (request.taskDescription.length > 2000) {
      return { valid: false, error: 'taskDescription too long (maximum 2000 characters)' }
    }

    // 安全检查：防止代码注入
    if (this.containsSuspiciousContent(request.taskDescription)) {
      return { valid: false, error: 'taskDescription contains potentially unsafe content' }
    }

    return { valid: true }
  }

  /**
   * 检查可疑内容
   */
  private containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /eval\(/i,
      /\$\([^)]*\)/,
      /exec\(/i,
      /system\(/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(content))
  }

  /**
   * 构建工作流上下文
   */
  private async buildWorkflowContext(request: ClaudeCodeRequest): Promise<WorkflowContext> {
    const projectInfo = request.context?.projectInfo
    
    return {
      taskDescription: request.taskDescription,
      projectContext: {
        name: projectInfo?.name || 'LinchKit',
        version: projectInfo?.version || '1.0.0',
        currentBranch: projectInfo?.branch,
        recentCommits: []
      },
      userPreferences: {
        preferredApproach: 'balanced',
        requireApproval: request.context?.userPreferences?.requireApproval || false,
        autoImplement: request.context?.userPreferences?.automationLevel === 'full_auto'
      }
    }
  }

  /**
   * 执行Graph RAG预查询
   */
  private async executeGraphRAGPrequery(taskDescription: string): Promise<void> {
    // 提取关键词进行预查询
    const keywords = this.extractKeywords(taskDescription)
    
    for (const keyword of keywords.slice(0, 3)) { // 限制查询数量
      try {
        await this.queryEngine.query(keyword)
      } catch (error) {
        logger.warn(`Graph RAG prequery failed for keyword '${keyword}':`, error)
      }
    }
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取，可以使用更复杂的NLP库
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length < 20)
      .slice(0, 5)

    return [...new Set(words)]
  }

  /**
   * 构建推荐信息
   */
  private buildRecommendations(workflowResult: AIWorkflowResult) {
    return {
      approach: workflowResult.decision.approach,
      reasoning: workflowResult.decision.reasoning,
      confidence: workflowResult.decision.confidence,
      nextSteps: workflowResult.decision.nextSteps,
      estimatedEffort: workflowResult.decision.estimatedEffort
    }
  }

  /**
   * 提取Graph RAG洞察
   */
  private extractGraphRAGInsights(workflowResult: AIWorkflowResult) {
    const graphRAG = workflowResult.graphRAG
    
    return {
      contextFound: graphRAG.contextFound,
      existingImplementations: graphRAG.suggestions.existingImplementations,
      relatedComponents: graphRAG.suggestions.relatedComponents,
      suggestions: graphRAG.suggestions.recommendations
    }
  }

  /**
   * 检查是否需要审批
   */
  private checkApprovalRequired(
    workflowResult: AIWorkflowResult, 
    request: ClaudeCodeRequest
  ): boolean {
    // 用户明确要求审批
    if (request.context?.userPreferences?.requireApproval) {
      return true
    }

    // 高复杂度任务需要审批
    if (workflowResult.decision.estimatedEffort.complexity >= 4) {
      return true
    }

    // 高风险任务需要审批
    if (workflowResult.decision.risks.some(risk => 
      risk.includes('安全') || risk.includes('数据') || risk.includes('架构')
    )) {
      return true
    }

    // 工作流状态机推荐审批
    if (workflowResult.decision.requiresApproval) {
      return true
    }

    return false
  }

  /**
   * 记录处理会话用于持续改进
   */
  private async recordProcessingSession(
    request: ClaudeCodeRequest, 
    result: AIWorkflowResult
  ): Promise<void> {
    try {
      await this.feedbackCollector.recordSession({
        sessionId: request.sessionId,
        taskDescription: request.taskDescription,
        result: {
          approach: result.decision.approach,
          confidence: result.decision.confidence,
          processingTime: result.metadata.processingTime
        },
        metadata: {
          requestedBy: request.metadata?.requestedBy || 'claude-code',
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      logger.warn('Failed to record session for feedback:', error)
    }
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(
    sessionId: string,
    errorCode: string,
    errorMessage: string,
    startTime: number,
    requestedAt: string,
    details?: Record<string, unknown>
  ): ClaudeCodeResponse {
    const completedAt = new Date().toISOString()
    const processingTime = Date.now() - startTime

    return {
      success: false,
      sessionId,
      error: {
        code: errorCode,
        message: errorMessage,
        details
      },
      metadata: {
        processingTime,
        graphRAGUsed: false,
        approvalRequired: false,
        requestedAt,
        completedAt
      }
    }
  }

  /**
   * 提取约束信息
   */
  private extractConstraints(queryResult: any): string[] {
    // 从Graph RAG查询结果中提取约束信息
    const constraints: string[] = []
    
    if (queryResult.results?.nodes) {
      queryResult.results.nodes.forEach((node: any) => {
        if (node.type === 'Constraint' || node.name.includes('constraint')) {
          constraints.push(node.name)
        }
      })
    }
    
    return constraints.length > 0 ? constraints : ['TypeScript strict mode', 'No any types', 'Test coverage > 95%']
  }

  /**
   * 提取包信息
   */
  private extractPackages(queryResult: any): string[] {
    const packages: string[] = []
    
    if (queryResult.results?.nodes) {
      queryResult.results.nodes.forEach((node: any) => {
        if (node.type === 'Package' || node.name.startsWith('@linch-kit/')) {
          packages.push(node.name)
        }
      })
    }
    
    return packages.length > 0 ? packages : ['@linch-kit/core', '@linch-kit/auth', '@linch-kit/ui']
  }

  /**
   * 获取默认可信环境配置
   */
  private getDefaultTrustedContext(): TrustedEnvironmentContext {
    return {
      projectConstraints: [
        'TypeScript strict mode',
        'No any types',
        'Test coverage > 95%',
        'ESLint zero warnings'
      ],
      codebaseKnowledge: {
        packages: ['@linch-kit/core', '@linch-kit/auth', '@linch-kit/ui', '@linch-kit/platform'],
        recentChanges: [],
        dependencies: []
      },
      qualityStandards: {
        testCoverage: 95,
        typeScriptStrict: true,
        lintRules: ['no-any', 'prefer-unknown', 'no-console-log']
      },
      securityPolicies: {
        allowedOperations: ['read', 'create', 'update'],
        forbiddenPatterns: ['eval', 'innerHTML', 'document.write'],
        dataHandlingRules: ['validate-input', 'sanitize-output', 'encrypt-sensitive-data']
      }
    }
  }

  /**
   * 断开连接和清理
   */
  async disconnect(): Promise<void> {
    try {
      await this.queryEngine.disconnect()
      logger.info('Claude Code Scheduler disconnected')
    } catch (error) {
      logger.error('Error during disconnect:', error)
    }
  }

  /**
   * 获取调度器状态
   */
  getSchedulerStatus() {
    return {
      initialized: this.trustedContext !== null,
      availableProviders: this.hybridAI.getAvailableProviders(),
      trustedEnvironment: !!this.trustedContext,
      queryEngineConnected: this.queryEngine !== null
    }
  }

  /**
   * 获取可信环境上下文（只读）
   */
  getTrustedContext(): TrustedEnvironmentContext | null {
    return this.trustedContext ? { ...this.trustedContext } : null
  }
}

/**
 * 工厂函数
 */
export function createClaudeCodeScheduler(hybridAI: HybridAIManager): ClaudeCodeScheduler {
  return new ClaudeCodeScheduler(hybridAI)
}

/**
 * 便捷函数：创建完整的Claude Code集成
 */
export async function createClaudeCodeIntegration(geminiApiKey?: string): Promise<ClaudeCodeScheduler> {
  const { createHybridAIManager } = await import('../providers/hybrid-ai-manager')
  
  const hybridAI = createHybridAIManager()
  const scheduler = createClaudeCodeScheduler(hybridAI)
  
  await scheduler.initialize()
  
  return scheduler
}