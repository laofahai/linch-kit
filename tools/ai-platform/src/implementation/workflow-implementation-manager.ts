/**
 * 工作流实施管理器
 * 连接AI工作流决策和实际代码实施的桥梁
 * 
 * @version 1.0.0 - Phase 2 工作流实施集成
 */

import { createLogger } from '@linch-kit/core'
import { ImplementationEngine, ImplementationPlan, ImplementationProgress, ImplementationOptions } from './implementation-engine'
import { AIWorkflowResult, WorkflowDecision } from '../workflow/ai-workflow-manager'
import { WorkflowStateMachine } from '../workflow/workflow-state-machine'

const logger = createLogger('workflow-implementation-manager')

export interface WorkflowImplementationConfig {
  projectRoot: string
  enableAutoImplementation?: boolean
  autoImplementationThreshold?: number // 复杂度阈值
  defaultOptions?: ImplementationOptions
  integrationHooks?: {
    beforeImplementation?: (plan: ImplementationPlan) => Promise<boolean>
    afterImplementation?: (progress: ImplementationProgress) => Promise<void>
    onImplementationError?: (sessionId: string, error: Error) => Promise<void>
  }
}

export interface WorkflowImplementationResult {
  sessionId: string
  implementationPlan: ImplementationPlan
  implementationProgress: ImplementationProgress
  workflowState: string
  success: boolean
  error?: string
  metadata: {
    startTime: string
    endTime?: string
    totalDuration?: number
    tasksCompleted: number
    tasksTotal: number
  }
}

/**
 * 工作流实施管理器
 * 负责将AI工作流决策转换为实际的代码实施
 */
export class WorkflowImplementationManager {
  private implementationEngine: ImplementationEngine
  private config: WorkflowImplementationConfig
  private activeImplementations: Map<string, ImplementationProgress> = new Map()

  constructor(config: WorkflowImplementationConfig) {
    this.config = config
    this.implementationEngine = new ImplementationEngine(config.projectRoot)
    logger.info(`Workflow implementation manager initialized for project: ${config.projectRoot}`)
  }

  /**
   * 从工作流结果创建并执行实施计划
   */
  async implementWorkflowResult(
    workflowResult: AIWorkflowResult,
    stateMachine: WorkflowStateMachine,
    options?: ImplementationOptions
  ): Promise<WorkflowImplementationResult> {
    const sessionId = workflowResult.metadata.sessionId
    const startTime = new Date().toISOString()
    
    logger.info(`Starting workflow implementation for session: ${sessionId}`)

    try {
      // 1. 生成实施计划
      const implementationPlan = await this.generateImplementationPlan(workflowResult)
      
      // 2. 执行集成钩子 - 实施前检查
      if (this.config.integrationHooks?.beforeImplementation) {
        const shouldContinue = await this.config.integrationHooks.beforeImplementation(implementationPlan)
        if (!shouldContinue) {
          throw new Error('Implementation aborted by beforeImplementation hook')
        }
      }
      
      // 3. 合并配置选项
      const finalOptions: ImplementationOptions = {
        ...this.config.defaultOptions,
        ...options,
        enableRollback: true, // 始终启用回滚
        continueOnError: false // 工作流实施时不继续错误
      }
      
      // 4. 更新工作流状态机
      stateMachine.updateImplementationProgress(0, '准备实施计划')
      
      // 5. 执行实施计划
      const implementationProgress = await this.implementationEngine.executeImplementationPlan(
        implementationPlan,
        finalOptions
      )
      
      // 6. 跟踪实施进度并更新工作流状态
      await this.trackImplementationProgress(sessionId, stateMachine)
      
      // 7. 执行集成钩子 - 实施后处理
      if (this.config.integrationHooks?.afterImplementation) {
        await this.config.integrationHooks.afterImplementation(implementationProgress)
      }
      
      const endTime = new Date().toISOString()
      const result: WorkflowImplementationResult = {
        sessionId,
        implementationPlan,
        implementationProgress,
        workflowState: stateMachine.getCurrentState(),
        success: implementationProgress.status === 'completed',
        metadata: {
          startTime,
          endTime,
          totalDuration: new Date(endTime).getTime() - new Date(startTime).getTime(),
          tasksCompleted: implementationProgress.completedTasks,
          tasksTotal: implementationProgress.totalTasks
        }
      }
      
      logger.info(`Workflow implementation completed for session: ${sessionId}`)
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Workflow implementation failed for session ${sessionId}: ${errorMessage}`)
      
      // 执行错误处理钩子
      if (this.config.integrationHooks?.onImplementationError) {
        await this.config.integrationHooks.onImplementationError(sessionId, error as Error)
      }
      
      // 更新工作流状态为失败
      await stateMachine.transition('FAIL', { error: errorMessage })
      
      throw error
    }
  }

  /**
   * 检查是否可以自动实施
   */
  canAutoImplement(workflowResult: AIWorkflowResult): boolean {
    if (!this.config.enableAutoImplementation) {
      return false
    }
    
    const complexity = workflowResult.decision.estimatedEffort.complexity
    const threshold = this.config.autoImplementationThreshold || 2
    
    return complexity <= threshold && workflowResult.decision.confidence >= 0.8
  }

  /**
   * 回滚工作流实施
   */
  async rollbackImplementation(sessionId: string): Promise<boolean> {
    logger.info(`Starting rollback for workflow session: ${sessionId}`)
    
    try {
      const success = await this.implementationEngine.rollbackImplementation(sessionId)
      
      if (success) {
        logger.info(`Rollback completed for session: ${sessionId}`)
      } else {
        logger.error(`Rollback failed for session: ${sessionId}`)
      }
      
      return success
      
    } catch (error) {
      logger.error(`Rollback error for session ${sessionId}: ${error}`)
      return false
    }
  }

  /**
   * 获取实施进度
   */
  getImplementationProgress(sessionId: string): ImplementationProgress | null {
    return this.implementationEngine.getImplementationProgress(sessionId)
  }

  /**
   * 暂停实施
   */
  pauseImplementation(sessionId: string): boolean {
    return this.implementationEngine.pauseImplementation(sessionId)
  }

  /**
   * 恢复实施
   */
  resumeImplementation(sessionId: string): boolean {
    return this.implementationEngine.resumeImplementation(sessionId)
  }

  /**
   * 获取活跃的实施列表
   */
  getActiveImplementations(): string[] {
    return Array.from(this.activeImplementations.keys())
  }

  /**
   * 生成实施计划（基于工作流结果）
   */
  private async generateImplementationPlan(workflowResult: AIWorkflowResult): Promise<ImplementationPlan> {
    const { context, decision, metadata } = workflowResult
    
    // 增强决策信息以更好地生成实施计划
    const enhancedDecision = this.enhanceDecisionWithContext(decision, context, workflowResult.graphRAG)
    
    return await this.implementationEngine.generateImplementationPlan(
      metadata.sessionId,
      context.taskDescription,
      enhancedDecision
    )
  }

  /**
   * 跟踪实施进度并更新工作流状态机
   */
  private async trackImplementationProgress(
    sessionId: string,
    stateMachine: WorkflowStateMachine
  ): Promise<void> {
    const checkInterval = 1000 // 每秒检查一次
    
    return new Promise((resolve, reject) => {
      const progressChecker = setInterval(() => {
        const progress = this.implementationEngine.getImplementationProgress(sessionId)
        
        if (!progress) {
          clearInterval(progressChecker)
          reject(new Error('Implementation progress not found'))
          return
        }
        
        // 更新工作流状态机进度
        stateMachine.updateImplementationProgress(
          progress.progress,
          progress.currentTask?.description || '执行中'
        )
        
        // 检查是否完成
        if (progress.status === 'completed') {
          clearInterval(progressChecker)
          resolve()
        } else if (progress.status === 'failed') {
          clearInterval(progressChecker)
          reject(new Error(`Implementation failed: ${progress.errors[progress.errors.length - 1]?.error || 'Unknown error'}`))
        }
      }, checkInterval)
      
      // 设置超时（30分钟）
      setTimeout(() => {
        clearInterval(progressChecker)
        reject(new Error('Implementation timeout'))
      }, 30 * 60 * 1000)
    })
  }

  /**
   * 增强工作流决策信息
   */
  private enhanceDecisionWithContext(
    decision: WorkflowDecision,
    context: any,
    graphRAG: any
  ): WorkflowDecision & { enhancedContext: any } {
    return {
      ...decision,
      enhancedContext: {
        projectContext: context.projectContext,
        existingImplementations: graphRAG.suggestions.existingImplementations,
        relatedComponents: graphRAG.suggestions.relatedComponents,
        patterns: graphRAG.suggestions.patterns,
        userPreferences: context.userPreferences
      }
    }
  }
}

/**
 * 预定义的实施配置
 */
export const DEFAULT_IMPLEMENTATION_CONFIG: Partial<WorkflowImplementationConfig> = {
  enableAutoImplementation: true,
  autoImplementationThreshold: 2,
  defaultOptions: {
    dryRun: false,
    continueOnError: false,
    enableRollback: true,
    maxConcurrentTasks: 3,
    timeoutPerTask: 300, // 5分钟
    backupFiles: true
  }
}

/**
 * 工厂函数
 */
export function createWorkflowImplementationManager(
  config: WorkflowImplementationConfig
): WorkflowImplementationManager {
  return new WorkflowImplementationManager(config)
}