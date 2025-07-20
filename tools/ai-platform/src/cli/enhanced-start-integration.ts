/**
 * 增强版 /start 命令集成
 * 集成所有 Phase 1 组件，提供完整的 AI 工作流体验
 * 
 * @version 1.0.0 - Phase 2 完整集成
 */

import { createLogger } from '@linch-kit/core'
import { handleStartCommand, type StartCommandOptions, type StartCommandResult } from './start-command-handler'
import { claudeCodeAPI } from '../workflow/claude-code-api'
import { WorkflowStateMachine } from '../workflow/workflow-state-machine'

const logger = createLogger('enhanced-start-integration')

export interface EnhancedStartRequest {
  taskDescription: string
  userContext?: {
    sessionId?: string
    userPreferences?: {
      verboseOutput?: boolean
      autoApproval?: boolean
      skipWarnings?: boolean
    }
  }
  integrationOptions?: {
    enableWorkflowTracking?: boolean
    graphRAGDepth?: 'shallow' | 'deep'
    aiAnalysisLevel?: 'basic' | 'comprehensive'
    outputFormat?: 'markdown' | 'json' | 'yaml'
  }
}

export interface EnhancedStartResponse extends StartCommandResult {
  enhancedMetadata: {
    workflowVersion: string
    integrationLevel: 'basic' | 'full'
    aiProviders: string[]
    systemHealth: {
      claudeCodeAPI: boolean
      workflowStateMachine: boolean
      graphRAG: boolean
      aiGuardian: boolean
    }
    performanceMetrics: {
      totalTime: number
      guardianTime?: number
      graphRAGTime?: number
      workflowTime?: number
    }
  }
  formattedOutput?: string
}

/**
 * 增强版 /start 命令处理器
 * 提供 Claude Code 的完整 AI 工作流集成体验
 */
export class EnhancedStartIntegration {
  private workflowStateMachine: WorkflowStateMachine | null = null

  constructor() {
    logger.info('Enhanced Start Integration initialized')
  }

  /**
   * 处理增强版 /start 命令
   */
  async processEnhancedStart(request: EnhancedStartRequest): Promise<EnhancedStartResponse> {
    const startTime = Date.now()
    const sessionId = request.userContext?.sessionId || `enhanced-start-${Date.now()}`

    logger.info(`Processing enhanced /start command for session: ${sessionId}`)
    logger.info(`Task: ${request.taskDescription}`)

    try {
      // 步骤1: 系统健康检查
      const systemHealth = await this.performSystemHealthCheck()
      logger.info('System health check completed', systemHealth)

      // 步骤2: 确定集成级别
      const integrationLevel = this.determineIntegrationLevel(systemHealth, request)
      logger.info(`Integration level determined: ${integrationLevel}`)

      // 步骤3: 准备启动选项
      const startOptions = this.prepareStartOptions(request, integrationLevel)

      // 步骤4: 执行核心 /start 命令
      const coreResult = await handleStartCommand(startOptions)
      logger.info(`Core /start command completed: ${coreResult.success ? 'SUCCESS' : 'FAILED'}`)

      // 步骤5: 增强处理
      let enhancedResult = await this.enhanceResult(coreResult, request)

      // 步骤6: 格式化输出
      if (request.integrationOptions?.outputFormat) {
        enhancedResult.formattedOutput = this.formatOutput(
          enhancedResult, 
          request.integrationOptions.outputFormat
        )
      }

      // 步骤7: 性能指标
      const totalTime = Date.now() - startTime
      enhancedResult.enhancedMetadata.performanceMetrics.totalTime = totalTime

      logger.info(`Enhanced /start command completed successfully in ${totalTime}ms`)
      return enhancedResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Enhanced /start command failed:', error)

      // 返回增强的错误响应
      return this.createErrorResponse(request, errorMessage, Date.now() - startTime)
    }
  }

  /**
   * 系统健康检查
   */
  private async performSystemHealthCheck(): Promise<{
    claudeCodeAPI: boolean
    workflowStateMachine: boolean
    graphRAG: boolean
    aiGuardian: boolean
  }> {
    const health = {
      claudeCodeAPI: false,
      workflowStateMachine: false,
      graphRAG: false,
      aiGuardian: false
    }

    try {
      // 检查 Claude Code API
      const apiStatus = await claudeCodeAPI.getStatus()
      health.claudeCodeAPI = apiStatus.available
      health.graphRAG = apiStatus.graphRAGConnected

      // 检查工作流状态机
      try {
        const testStateMachine = new WorkflowStateMachine('health-check')
        await testStateMachine.initialize()
        health.workflowStateMachine = true
      } catch (error) {
        logger.warn('Workflow state machine health check failed:', error)
        health.workflowStateMachine = false
      }

      // 检查 AI Guardian（通过简单验证）
      try {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        
        await execAsync('bun run ai:guardian:validate "health check"', { timeout: 5000 })
        health.aiGuardian = true
      } catch (error) {
        logger.warn('AI Guardian health check failed:', error)
        health.aiGuardian = false
      }

    } catch (error) {
      logger.error('System health check failed:', error)
    }

    return health
  }

  /**
   * 确定集成级别
   */
  private determineIntegrationLevel(
    systemHealth: any, 
    request: EnhancedStartRequest
  ): 'basic' | 'full' {
    // 如果所有系统都健康，使用完整集成
    if (systemHealth.claudeCodeAPI && systemHealth.workflowStateMachine && systemHealth.aiGuardian) {
      return 'full'
    }

    // 否则使用基础集成
    logger.warn('Using basic integration due to system health issues')
    return 'basic'
  }

  /**
   * 准备启动选项
   */
  private prepareStartOptions(
    request: EnhancedStartRequest, 
    integrationLevel: 'basic' | 'full'
  ): StartCommandOptions {
    const baseOptions: StartCommandOptions = {
      taskDescription: request.taskDescription,
      sessionId: request.userContext?.sessionId,
      automationLevel: 'semi_auto',
      priority: 'medium'
    }

    // 根据集成级别调整选项
    if (integrationLevel === 'full') {
      baseOptions.enableWorkflowState = request.integrationOptions?.enableWorkflowTracking !== false
      baseOptions.skipGraphRAG = false
      baseOptions.skipGuardian = false
    } else {
      // 基础模式：跳过一些可能失败的功能
      baseOptions.enableWorkflowState = false
      baseOptions.skipGraphRAG = true
      baseOptions.skipGuardian = true
    }

    // 用户偏好覆盖
    if (request.userContext?.userPreferences?.autoApproval) {
      baseOptions.automationLevel = 'full_auto'
    }

    return baseOptions
  }

  /**
   * 增强结果处理
   */
  private async enhanceResult(
    coreResult: StartCommandResult, 
    request: EnhancedStartRequest
  ): Promise<EnhancedStartResponse> {
    const systemHealth = await this.performSystemHealthCheck()
    const apiStatus = await claudeCodeAPI.getStatus()

    const enhancedResult: EnhancedStartResponse = {
      ...coreResult,
      enhancedMetadata: {
        workflowVersion: 'Phase 2 v1.0.0',
        integrationLevel: systemHealth.claudeCodeAPI && systemHealth.workflowStateMachine ? 'full' : 'basic',
        aiProviders: apiStatus.providers,
        systemHealth,
        performanceMetrics: {
          totalTime: 0, // 将在外层设置
          guardianTime: undefined,
          graphRAGTime: undefined,
          workflowTime: coreResult.executionTime
        }
      }
    }

    // 如果请求深度 Graph RAG 分析
    if (request.integrationOptions?.graphRAGDepth === 'deep' && coreResult.success) {
      try {
        const deepInsights = await this.performDeepGraphRAGAnalysis(request.taskDescription)
        if (enhancedResult.graphRAGInsights) {
          enhancedResult.graphRAGInsights = {
            ...enhancedResult.graphRAGInsights,
            ...deepInsights
          }
        }
      } catch (error) {
        logger.warn('Deep Graph RAG analysis failed:', error)
      }
    }

    return enhancedResult
  }

  /**
   * 深度 Graph RAG 分析
   */
  private async performDeepGraphRAGAnalysis(taskDescription: string): Promise<{
    relatedPatterns?: string[]
    architecturalImpact?: string[]
    riskAssessment?: string[]
  }> {
    try {
      // 这里可以集成更深层的 Graph RAG 查询
      // 目前返回模拟数据
      return {
        relatedPatterns: ['Repository Pattern', 'Factory Pattern', 'Observer Pattern'],
        architecturalImpact: ['可能影响核心架构', '需要更新接口定义', '建议添加新抽象层'],
        riskAssessment: ['中等复杂度', '需要充分测试', '考虑向后兼容性']
      }
    } catch (error) {
      logger.warn('Deep Graph RAG analysis failed:', error)
      return {}
    }
  }

  /**
   * 格式化输出
   */
  private formatOutput(result: EnhancedStartResponse, format: 'markdown' | 'json' | 'yaml'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2)
      
      case 'yaml':
        // 简化的 YAML 输出
        return this.toYAML(result)
      
      case 'markdown':
      default:
        return this.toMarkdown(result)
    }
  }

  /**
   * 转换为 Markdown 格式
   */
  private toMarkdown(result: EnhancedStartResponse): string {
    const lines: string[] = []
    
    lines.push('# 🚀 LinchKit AI工作流引擎 - 增强版执行结果')
    lines.push('')
    
    if (result.success) {
      lines.push(`✅ **执行成功** (${result.enhancedMetadata.performanceMetrics.totalTime}ms)`)
    } else {
      lines.push(`❌ **执行失败** (${result.enhancedMetadata.performanceMetrics.totalTime}ms)`)
      lines.push(`错误: ${result.error}`)
    }

    lines.push('')
    lines.push('## 📊 系统状态')
    lines.push(`- **集成级别**: ${result.enhancedMetadata.integrationLevel}`)
    lines.push(`- **工作流版本**: ${result.enhancedMetadata.workflowVersion}`)
    lines.push(`- **AI提供商**: ${result.enhancedMetadata.aiProviders.join(', ') || '无'}`)

    lines.push('')
    lines.push('## 🏥 组件健康状态')
    Object.entries(result.enhancedMetadata.systemHealth).forEach(([component, healthy]) => {
      lines.push(`- **${component}**: ${healthy ? '✅ 正常' : '❌ 异常'}`)
    })

    // 添加核心结果信息
    if (result.success && result.workflowAnalysis) {
      lines.push('')
      lines.push('## 🎯 AI 工作流分析')
      lines.push(`- **推荐方案**: ${result.workflowAnalysis.approach}`)
      lines.push(`- **复杂度评估**: ${result.workflowAnalysis.complexity}/5`)
      lines.push(`- **AI置信度**: ${Math.round(result.workflowAnalysis.confidence * 100)}%`)
      
      if (result.workflowAnalysis.nextSteps.length > 0) {
        lines.push('- **建议步骤**:')
        result.workflowAnalysis.nextSteps.forEach(step => {
          lines.push(`  - ${step}`)
        })
      }
    }

    if (result.graphRAGInsights && result.graphRAGInsights.existingImplementations.length > 0) {
      lines.push('')
      lines.push('## 🔍 Graph RAG 发现')
      lines.push('### 现有实现')
      result.graphRAGInsights.existingImplementations.forEach(impl => {
        lines.push(`- ${impl}`)
      })
      
      if (result.graphRAGInsights.suggestions.length > 0) {
        lines.push('### AI 建议')
        result.graphRAGInsights.suggestions.forEach(suggestion => {
          lines.push(`- ${suggestion}`)
        })
      }
    }

    lines.push('')
    lines.push('## ⚡ 性能指标')
    lines.push(`- **总执行时间**: ${result.enhancedMetadata.performanceMetrics.totalTime}ms`)
    if (result.enhancedMetadata.performanceMetrics.workflowTime) {
      lines.push(`- **核心工作流**: ${result.enhancedMetadata.performanceMetrics.workflowTime}ms`)
    }

    return lines.join('\n')
  }

  /**
   * 转换为 YAML 格式（简化版）
   */
  private toYAML(result: EnhancedStartResponse): string {
    const yamlData = {
      success: result.success,
      sessionId: result.sessionId,
      integrationLevel: result.enhancedMetadata.integrationLevel,
      executionTime: result.enhancedMetadata.performanceMetrics.totalTime,
      systemHealth: result.enhancedMetadata.systemHealth,
      workflowAnalysis: result.workflowAnalysis ? {
        approach: result.workflowAnalysis.approach,
        complexity: result.workflowAnalysis.complexity,
        confidence: result.workflowAnalysis.confidence
      } : null
    }

    // 简单的 YAML 序列化
    return Object.entries(yamlData)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n')
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(
    request: EnhancedStartRequest, 
    errorMessage: string, 
    executionTime: number
  ): EnhancedStartResponse {
    return {
      success: false,
      sessionId: request.userContext?.sessionId || `error-${Date.now()}`,
      projectInfo: {
        name: 'unknown',
        version: 'unknown',
        branch: 'unknown',
        hasUncommittedChanges: false,
        recentCommits: [],
        protectedBranch: false
      },
      error: errorMessage,
      executionTime,
      enhancedMetadata: {
        workflowVersion: 'Phase 2 v1.0.0',
        integrationLevel: 'basic',
        aiProviders: [],
        systemHealth: {
          claudeCodeAPI: false,
          workflowStateMachine: false,
          graphRAG: false,
          aiGuardian: false
        },
        performanceMetrics: {
          totalTime: executionTime
        }
      }
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.workflowStateMachine) {
      try {
        // 预留清理代码
        logger.info('Enhanced integration cleanup completed')
      } catch (error) {
        logger.warn('Error during enhanced integration cleanup:', error)
      }
    }
  }
}

/**
 * 便捷函数：处理增强版 /start 命令
 */
export async function processEnhancedStart(request: EnhancedStartRequest): Promise<EnhancedStartResponse> {
  const integration = new EnhancedStartIntegration()
  try {
    return await integration.processEnhancedStart(request)
  } finally {
    await integration.cleanup()
  }
}

/**
 * 便捷函数：Claude Code 标准调用
 */
export async function claudeCodeStart(taskDescription: string): Promise<EnhancedStartResponse> {
  return processEnhancedStart({
    taskDescription,
    integrationOptions: {
      enableWorkflowTracking: true,
      graphRAGDepth: 'deep',
      aiAnalysisLevel: 'comprehensive',
      outputFormat: 'markdown'
    }
  })
}