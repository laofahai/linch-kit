/**
 * Claude Code 统一API接口
 * 为Claude Code提供标准化的AI工作流集成接口
 * 简化调用方式，隐藏复杂的内部实现
 * 
 * @version 1.0.0 - Phase 1 核心API
 */

import { createLogger } from '@linch-kit/core'
import { ClaudeCodeScheduler, createClaudeCodeIntegration } from './claude-code-scheduler'
import type { ClaudeCodeRequest, ClaudeCodeResponse } from './claude-code-scheduler'
import { getGlobalAIProviderManager } from '../providers/ai-provider-manager'

const logger = createLogger('claude-code-api')

export interface SimpleWorkflowRequest {
  taskDescription: string
  sessionId?: string
  options?: {
    requireApproval?: boolean
    enableGraphRAG?: boolean
    complexityThreshold?: number
    automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
    priority?: 'low' | 'medium' | 'high'
  }
  projectInfo?: {
    name?: string
    version?: string
    branch?: string
  }
}

export interface SimpleWorkflowResponse {
  success: boolean
  sessionId: string
  recommendations?: {
    approach: string
    nextSteps: string[]
    confidence: number
    estimatedHours: number
    complexity: number
    risks: string[]
  }
  insights?: {
    existingImplementations: string[]
    relatedComponents: string[]
    suggestions: string[]
  }
  approval?: {
    required: boolean
    reason?: string
    autoApproveAfter?: string
  }
  error?: string
  metadata: {
    processingTime: number
    aiProvider?: string
    timestamp: string
  }
}

export interface APIStatus {
  available: boolean
  providers: string[]
  trustedEnvironment: boolean
  graphRAGConnected: boolean
  lastError?: string
}

/**
 * Claude Code API类
 * 提供简化的接口供Claude Code调用
 */
export class ClaudeCodeAPI {
  private scheduler: ClaudeCodeScheduler | null = null
  private initPromise: Promise<void> | null = null
  private initialized = false
  private lastError: string | null = null

  /**
   * 单例实例
   */
  private static instance: ClaudeCodeAPI | null = null

  /**
   * 获取单例实例
   */
  static getInstance(): ClaudeCodeAPI {
    if (!ClaudeCodeAPI.instance) {
      ClaudeCodeAPI.instance = new ClaudeCodeAPI()
    }
    return ClaudeCodeAPI.instance
  }

  private constructor() {
    // 私有构造函数，强制使用单例
  }

  /**
   * 初始化API（懒加载）
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    try {
      logger.info('Initializing Claude Code API...')
      
      // 检查环境变量
      const geminiApiKey = process.env.GEMINI_API_KEY
      if (!geminiApiKey) {
        logger.warn('GEMINI_API_KEY not found, AI features may be limited')
      }

      // 创建调度器并初始化
      this.scheduler = await createClaudeCodeIntegration(geminiApiKey)
      this.initialized = true
      this.lastError = null
      
      logger.info('Claude Code API initialized successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.lastError = errorMessage
      logger.error('Failed to initialize Claude Code API:', error)
      throw new Error(`Claude Code API initialization failed: ${errorMessage}`)
    }
  }

  /**
   * 处理工作流请求（主要接口）
   */
  async processWorkflowRequest(request: SimpleWorkflowRequest): Promise<SimpleWorkflowResponse> {
    try {
      await this.ensureInitialized()
      
      if (!this.scheduler) {
        throw new Error('Scheduler not initialized')
      }

      // 转换为内部请求格式
      const internalRequest: ClaudeCodeRequest = {
        sessionId: request.sessionId || `claude-${Date.now()}`,
        taskDescription: request.taskDescription,
        context: {
          projectInfo: request.projectInfo,
          userPreferences: {
            requireApproval: request.options?.requireApproval,
            automationLevel: request.options?.automationLevel || 'semi_auto',
            complexityThreshold: request.options?.complexityThreshold || 3
          },
          graphRAGContext: {
            enableGraphRAG: request.options?.enableGraphRAG !== false
          }
        },
        metadata: {
          requestedBy: 'claude-code',
          priority: request.options?.priority || 'medium',
          tags: ['claude-code-api']
        }
      }

      // 执行工作流处理
      const internalResponse = await this.scheduler.processClaudeCodeRequest(internalRequest)
      
      // 转换为简化响应格式
      return this.convertToSimpleResponse(internalResponse)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Workflow request failed:', error)
      
      return {
        success: false,
        sessionId: request.sessionId || `error-${Date.now()}`,
        error: errorMessage,
        metadata: {
          processingTime: 0,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * 快速工作流分析（无需完整初始化）
   */
  async quickAnalyze(taskDescription: string): Promise<SimpleWorkflowResponse> {
    return this.processWorkflowRequest({
      taskDescription,
      options: {
        enableGraphRAG: false, // 快速模式不使用Graph RAG
        automationLevel: 'manual',
        priority: 'low'
      }
    })
  }

  /**
   * 获取API状态
   */
  async getStatus(): Promise<APIStatus> {
    try {
      if (!this.initialized) {
        return {
          available: false,
          providers: [],
          trustedEnvironment: false,
          graphRAGConnected: false,
          lastError: this.lastError || 'Not initialized'
        }
      }

      if (!this.scheduler) {
        return {
          available: false,
          providers: [],
          trustedEnvironment: false,
          graphRAGConnected: false,
          lastError: 'Scheduler not available'
        }
      }

      const schedulerStatus = this.scheduler.getSchedulerStatus()
      
      return {
        available: true,
        providers: schedulerStatus.availableProviders,
        trustedEnvironment: schedulerStatus.trustedEnvironment,
        graphRAGConnected: schedulerStatus.queryEngineConnected,
        lastError: this.lastError
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        available: false,
        providers: [],
        trustedEnvironment: false,
        graphRAGConnected: false,
        lastError: errorMessage
      }
    }
  }

  /**
   * 检查特定任务的预估复杂度
   */
  async estimateComplexity(taskDescription: string): Promise<{
    complexity: number
    hours: number
    confidence: number
    risks: string[]
  }> {
    try {
      const response = await this.quickAnalyze(taskDescription)
      
      if (response.success && response.recommendations) {
        return {
          complexity: response.recommendations.complexity,
          hours: response.recommendations.estimatedHours,
          confidence: response.recommendations.confidence,
          risks: response.recommendations.risks
        }
      }
      
      // 降级到简单估算
      return this.simpleComplexityEstimate(taskDescription)
    } catch (error) {
      logger.warn('Complexity estimation failed, using simple method:', error)
      return this.simpleComplexityEstimate(taskDescription)
    }
  }

  /**
   * 检查现有实现
   */
  async checkExistingImplementations(taskDescription: string): Promise<{
    found: boolean
    implementations: string[]
    suggestions: string[]
  }> {
    try {
      const response = await this.processWorkflowRequest({
        taskDescription,
        options: {
          enableGraphRAG: true,
          automationLevel: 'manual'
        }
      })
      
      if (response.success && response.insights) {
        return {
          found: response.insights.existingImplementations.length > 0,
          implementations: response.insights.existingImplementations,
          suggestions: response.insights.suggestions
        }
      }
      
      return {
        found: false,
        implementations: [],
        suggestions: ['建议手动检查现有代码库']
      }
    } catch (error) {
      logger.warn('Existing implementation check failed:', error)
      return {
        found: false,
        implementations: [],
        suggestions: ['检查失败，建议手动搜索']
      }
    }
  }

  /**
   * 获取项目约束信息
   */
  async getProjectConstraints(): Promise<string[]> {
    try {
      await this.ensureInitialized()
      
      if (!this.scheduler) {
        return this.getDefaultConstraints()
      }

      const trustedContext = this.scheduler.getTrustedContext()
      return trustedContext?.projectConstraints || this.getDefaultConstraints()
    } catch (error) {
      logger.warn('Failed to get project constraints:', error)
      return this.getDefaultConstraints()
    }
  }

  /**
   * 清理和重置
   */
  async reset(): Promise<void> {
    try {
      if (this.scheduler) {
        await this.scheduler.disconnect()
      }
    } catch (error) {
      logger.warn('Error during reset:', error)
    } finally {
      this.scheduler = null
      this.initPromise = null
      this.initialized = false
      this.lastError = null
    }
  }

  /**
   * 转换为简化响应格式
   */
  private convertToSimpleResponse(internalResponse: ClaudeCodeResponse): SimpleWorkflowResponse {
    if (!internalResponse.success) {
      return {
        success: false,
        sessionId: internalResponse.sessionId,
        error: internalResponse.error?.message || 'Unknown error',
        metadata: {
          processingTime: internalResponse.metadata.processingTime,
          timestamp: internalResponse.metadata.completedAt
        }
      }
    }

    const result = internalResponse.result!
    
    return {
      success: true,
      sessionId: internalResponse.sessionId,
      recommendations: {
        approach: result.recommendations.approach,
        nextSteps: result.recommendations.nextSteps,
        confidence: result.recommendations.confidence,
        estimatedHours: result.recommendations.estimatedEffort.hours,
        complexity: result.recommendations.estimatedEffort.complexity,
        risks: result.workflow.decision.risks
      },
      insights: result.graphRAGInsights ? {
        existingImplementations: result.graphRAGInsights.existingImplementations,
        relatedComponents: result.graphRAGInsights.relatedComponents,
        suggestions: result.graphRAGInsights.suggestions
      } : undefined,
      approval: internalResponse.metadata.approvalRequired ? {
        required: true,
        reason: '任务复杂度较高或存在风险，需要审批',
        autoApproveAfter: undefined // 可以从工作流状态机获取
      } : {
        required: false
      },
      metadata: {
        processingTime: internalResponse.metadata.processingTime,
        aiProvider: internalResponse.metadata.aiProvider,
        timestamp: internalResponse.metadata.completedAt
      }
    }
  }

  /**
   * 简单复杂度估算（降级方法）
   */
  private simpleComplexityEstimate(taskDescription: string): {
    complexity: number
    hours: number
    confidence: number
    risks: string[]
  } {
    const text = taskDescription.toLowerCase()
    let complexity = 2
    const risks: string[] = []
    
    // 简单的关键词分析
    if (text.includes('新') || text.includes('创建') || text.includes('new') || text.includes('create')) {
      complexity += 1
    }
    
    if (text.includes('重构') || text.includes('refactor') || text.includes('重新设计')) {
      complexity += 2
      risks.push('重构风险')
    }
    
    if (text.includes('数据库') || text.includes('database') || text.includes('sql')) {
      complexity += 1
      risks.push('数据一致性')
    }
    
    if (text.includes('认证') || text.includes('auth') || text.includes('权限')) {
      complexity += 1
      risks.push('安全风险')
    }
    
    if (text.includes('API') || text.includes('接口')) {
      complexity += 1
    }
    
    complexity = Math.min(5, Math.max(1, complexity))
    
    return {
      complexity,
      hours: complexity * 2,
      confidence: 0.6, // 简单估算的置信度较低
      risks: risks.length > 0 ? risks : ['实现复杂度']
    }
  }

  /**
   * 获取默认约束
   */
  private getDefaultConstraints(): string[] {
    return [
      'TypeScript strict mode',
      'No any types',
      'Test coverage > 95%',
      'ESLint zero warnings',
      'Use LinchKit packages when possible'
    ]
  }
}

// 导出便捷函数
export const claudeCodeAPI = ClaudeCodeAPI.getInstance()

/**
 * 便捷函数：处理工作流
 */
export async function processWorkflow(request: SimpleWorkflowRequest): Promise<SimpleWorkflowResponse> {
  return claudeCodeAPI.processWorkflowRequest(request)
}

/**
 * 便捷函数：快速分析
 */
export async function quickAnalyze(taskDescription: string): Promise<SimpleWorkflowResponse> {
  return claudeCodeAPI.quickAnalyze(taskDescription)
}

/**
 * 便捷函数：检查API状态
 */
export async function getAPIStatus(): Promise<APIStatus> {
  return claudeCodeAPI.getStatus()
}

/**
 * 便捷函数：估算复杂度
 */
export async function estimateComplexity(taskDescription: string) {
  return claudeCodeAPI.estimateComplexity(taskDescription)
}

/**
 * 便捷函数：检查现有实现
 */
export async function checkExistingImplementations(taskDescription: string) {
  return claudeCodeAPI.checkExistingImplementations(taskDescription)
}

/**
 * 便捷函数：获取项目约束
 */
export async function getProjectConstraints(): Promise<string[]> {
  return claudeCodeAPI.getProjectConstraints()
}