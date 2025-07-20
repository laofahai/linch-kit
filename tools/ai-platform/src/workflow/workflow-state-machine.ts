/**
 * LinchKit AI工作流状态机
 * 基于Guardian系统的工作流状态管理和人机协作界面
 * 
 * @version 1.0.0 - Phase 1 状态管理集成
 */

import { createLogger } from '@linch-kit/core'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const logger = createLogger('workflow-state-machine')

export type WorkflowState = 
  | 'INITIALIZED'
  | 'ANALYZING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTING'
  | 'TESTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type WorkflowAction = 
  | 'START_ANALYSIS'
  | 'COMPLETE_ANALYSIS'
  | 'REQUEST_APPROVAL'
  | 'APPROVE'
  | 'REJECT'
  | 'START_IMPLEMENTATION'
  | 'COMPLETE_IMPLEMENTATION'
  | 'START_TESTING'
  | 'COMPLETE_TESTING'
  | 'FAIL'
  | 'CANCEL'

export interface WorkflowStateTransition {
  from: WorkflowState
  to: WorkflowState
  action: WorkflowAction
  condition?: (context: WorkflowContext) => boolean
  guard?: (context: WorkflowContext) => string | null // null if valid, error message if invalid
}

export interface WorkflowContext {
  sessionId: string
  taskDescription: string
  currentState: WorkflowState
  metadata: {
    startTime: string
    lastUpdated: string
    totalDuration?: number
    approver?: string
    implementer?: string
    automationLevel: 'manual' | 'semi_auto' | 'full_auto'
  }
  analysis?: {
    approach: string
    confidence: number
    estimatedHours: number
    complexity: number
    risks: string[]
    dependencies: string[]
  }
  approvalRequest?: {
    requestedAt: string
    requestedBy: string
    reason: string
    urgency: 'low' | 'medium' | 'high'
    autoApproveAfter?: string // ISO datetime
  }
  implementation?: {
    startedAt: string
    progress: number // 0-100
    currentStep: string
    completedSteps: string[]
    errors: Array<{
      timestamp: string
      error: string
      severity: 'warning' | 'error' | 'fatal'
    }>
  }
  stateHistory: Array<{
    state: WorkflowState
    timestamp: string
    action: WorkflowAction
    by: string
    metadata?: Record<string, unknown>
  }>
}

export interface WorkflowStatePersistence {
  save(context: WorkflowContext): Promise<void>
  load(sessionId: string): Promise<WorkflowContext | null>
  list(): Promise<WorkflowContext[]>
  cleanup(olderThan: Date): Promise<number>
}

/**
 * 工作流状态机
 * 管理AI工作流的完整生命周期状态
 */
export class WorkflowStateMachine {
  private transitions: WorkflowStateTransition[]
  private persistence: WorkflowStatePersistence
  private context: WorkflowContext

  constructor(
    sessionId: string,
    taskDescription: string,
    persistence?: WorkflowStatePersistence
  ) {
    this.persistence = persistence || new FileBasedPersistence()
    this.context = this.initializeContext(sessionId, taskDescription)
    this.transitions = this.defineTransitions()
  }

  /**
   * 初始化工作流上下文
   */
  private initializeContext(sessionId: string, taskDescription: string): WorkflowContext {
    const now = new Date().toISOString()
    
    return {
      sessionId,
      taskDescription,
      currentState: 'INITIALIZED',
      metadata: {
        startTime: now,
        lastUpdated: now,
        automationLevel: 'semi_auto'
      },
      stateHistory: [{
        state: 'INITIALIZED',
        timestamp: now,
        action: 'START_ANALYSIS',
        by: 'system'
      }]
    }
  }

  /**
   * 定义状态转换规则
   */
  private defineTransitions(): WorkflowStateTransition[] {
    return [
      // 开始分析
      {
        from: 'INITIALIZED',
        to: 'ANALYZING',
        action: 'START_ANALYSIS'
      },
      
      // 分析完成
      {
        from: 'ANALYZING',
        to: 'PENDING_APPROVAL',
        action: 'COMPLETE_ANALYSIS',
        condition: (ctx) => !!ctx.analysis && ctx.analysis.complexity >= 3
      },
      {
        from: 'ANALYZING',
        to: 'APPROVED',
        action: 'COMPLETE_ANALYSIS',
        condition: (ctx) => !!ctx.analysis && ctx.analysis.complexity < 3
      },
      
      // 审批流程
      {
        from: 'PENDING_APPROVAL',
        to: 'APPROVED',
        action: 'APPROVE'
      },
      {
        from: 'PENDING_APPROVAL',
        to: 'REJECTED',
        action: 'REJECT'
      },
      
      // 实施流程
      {
        from: 'APPROVED',
        to: 'IMPLEMENTING',
        action: 'START_IMPLEMENTATION'
      },
      {
        from: 'IMPLEMENTING',
        to: 'TESTING',
        action: 'COMPLETE_IMPLEMENTATION'
      },
      
      // 测试流程
      {
        from: 'TESTING',
        to: 'COMPLETED',
        action: 'COMPLETE_TESTING'
      },
      
      // 错误处理
      {
        from: 'ANALYZING',
        to: 'FAILED',
        action: 'FAIL'
      },
      {
        from: 'IMPLEMENTING',
        to: 'FAILED',
        action: 'FAIL'
      },
      {
        from: 'TESTING',
        to: 'FAILED',
        action: 'FAIL'
      },
      
      // 取消操作
      {
        from: 'INITIALIZED',
        to: 'CANCELLED',
        action: 'CANCEL'
      },
      {
        from: 'ANALYZING',
        to: 'CANCELLED',
        action: 'CANCEL'
      },
      {
        from: 'PENDING_APPROVAL',
        to: 'CANCELLED',
        action: 'CANCEL'
      }
    ]
  }

  /**
   * 执行状态转换
   */
  async transition(action: WorkflowAction, metadata?: Record<string, unknown>): Promise<boolean> {
    const validTransitions = this.transitions.filter(
      t => t.from === this.context.currentState && t.action === action
    )

    if (validTransitions.length === 0) {
      logger.warn(`Invalid transition: ${action} from ${this.context.currentState}`)
      return false
    }

    // 找到符合条件的转换
    let selectedTransition: WorkflowStateTransition | null = null
    
    for (const transition of validTransitions) {
      if (!transition.condition || transition.condition(this.context)) {
        // 检查守卫条件
        if (transition.guard) {
          const guardError = transition.guard(this.context)
          if (guardError) {
            logger.warn(`Transition guard failed: ${guardError}`)
            continue
          }
        }
        selectedTransition = transition
        break
      }
    }

    if (!selectedTransition) {
      logger.warn(`No valid transition found for ${action} from ${this.context.currentState}`)
      return false
    }

    // 执行状态转换
    const previousState = this.context.currentState
    this.context.currentState = selectedTransition.to
    this.context.metadata.lastUpdated = new Date().toISOString()

    // 记录状态历史
    this.context.stateHistory.push({
      state: selectedTransition.to,
      timestamp: this.context.metadata.lastUpdated,
      action,
      by: metadata?.by as string || 'system',
      metadata
    })

    logger.info(`State transition: ${previousState} -> ${selectedTransition.to} (${action})`)

    // 执行状态特定的操作
    await this.onStateEnter(selectedTransition.to, metadata)

    // 持久化状态
    await this.persistence.save(this.context)

    return true
  }

  /**
   * 状态进入时的处理
   */
  private async onStateEnter(state: WorkflowState, metadata?: Record<string, unknown>): Promise<void> {
    switch (state) {
      case 'PENDING_APPROVAL':
        await this.handlePendingApproval()
        break
      case 'IMPLEMENTING':
        await this.handleImplementationStart()
        break
      case 'COMPLETED':
        await this.handleCompletion()
        break
      case 'FAILED':
        await this.handleFailure()
        break
    }
  }

  /**
   * 处理待审批状态
   */
  private async handlePendingApproval(): Promise<void> {
    const now = new Date().toISOString()
    
    this.context.approvalRequest = {
      requestedAt: now,
      requestedBy: 'ai-workflow-system',
      reason: '任务复杂度较高，需要人工审批',
      urgency: this.determineUrgency()
    }

    // 如果设置了自动审批时间
    if (this.context.metadata.automationLevel === 'semi_auto') {
      const autoApproveDelay = this.calculateAutoApproveDelay()
      const autoApproveTime = new Date(Date.now() + autoApproveDelay)
      this.context.approvalRequest.autoApproveAfter = autoApproveTime.toISOString()
      
      logger.info(`Auto-approval scheduled for: ${autoApproveTime.toISOString()}`)
    }

    logger.info('Workflow pending approval, notification sent')
  }

  /**
   * 处理实施开始
   */
  private async handleImplementationStart(): Promise<void> {
    this.context.implementation = {
      startedAt: new Date().toISOString(),
      progress: 0,
      currentStep: '准备实施环境',
      completedSteps: [],
      errors: []
    }

    logger.info('Implementation phase started')
  }

  /**
   * 处理完成状态
   */
  private async handleCompletion(): Promise<void> {
    this.context.metadata.totalDuration = Date.now() - new Date(this.context.metadata.startTime).getTime()
    logger.info(`Workflow completed in ${this.context.metadata.totalDuration}ms`)
  }

  /**
   * 处理失败状态
   */
  private async handleFailure(): Promise<void> {
    logger.error('Workflow failed, initiating cleanup')
  }

  /**
   * 确定紧急程度
   */
  private determineUrgency(): 'low' | 'medium' | 'high' {
    if (!this.context.analysis) return 'medium'
    
    const { complexity, risks } = this.context.analysis
    
    if (complexity >= 5 || risks.some(risk => risk.includes('安全') || risk.includes('数据'))) {
      return 'high'
    } else if (complexity >= 3) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 计算自动审批延迟
   */
  private calculateAutoApproveDelay(): number {
    const urgency = this.context.approvalRequest?.urgency || 'medium'
    
    switch (urgency) {
      case 'high':
        return 2 * 60 * 60 * 1000 // 2小时
      case 'medium':
        return 4 * 60 * 60 * 1000 // 4小时
      case 'low':
        return 8 * 60 * 60 * 1000 // 8小时
      default:
        return 4 * 60 * 60 * 1000
    }
  }

  /**
   * 更新分析结果
   */
  updateAnalysis(analysis: Partial<WorkflowContext['analysis']>): void {
    this.context.analysis = {
      ...this.context.analysis,
      ...analysis
    } as WorkflowContext['analysis']
  }

  /**
   * 更新分析结果
   */
  updateAnalysis(analysis: {
    approach: string
    confidence: number
    estimatedHours: number
    complexity: number
    risks: string[]
    dependencies: string[]
  }): void {
    this.context.analysis = analysis
    this.context.metadata.lastUpdated = new Date().toISOString()
    logger.info(`Analysis updated: approach=${analysis.approach}, complexity=${analysis.complexity}/5`)
  }

  /**
   * 更新实施进度
   */
  updateImplementationProgress(progress: number, currentStep: string, errors?: Array<{timestamp: string, error: string, severity: 'warning' | 'error' | 'fatal'}>): void {
    if (this.context.implementation) {
      this.context.implementation.progress = Math.min(100, Math.max(0, progress))
      this.context.implementation.currentStep = currentStep
      
      if (errors) {
        this.context.implementation.errors.push(...errors)
      }
      
      this.context.metadata.lastUpdated = new Date().toISOString()
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): WorkflowState {
    return this.context.currentState
  }

  /**
   * 获取完整上下文
   */
  getContext(): WorkflowContext {
    return { ...this.context }
  }

  /**
   * 检查是否可以执行指定操作
   */
  canTransition(action: WorkflowAction): boolean {
    return this.transitions.some(
      t => t.from === this.context.currentState && 
           t.action === action &&
           (!t.condition || t.condition(this.context))
    )
  }

  /**
   * 获取可用的操作
   */
  getAvailableActions(): WorkflowAction[] {
    return this.transitions
      .filter(t => t.from === this.context.currentState)
      .filter(t => !t.condition || t.condition(this.context))
      .map(t => t.action)
  }

  /**
   * 检查自动审批
   */
  checkAutoApproval(): boolean {
    if (this.context.currentState !== 'PENDING_APPROVAL' || !this.context.approvalRequest?.autoApproveAfter) {
      return false
    }

    const autoApproveTime = new Date(this.context.approvalRequest.autoApproveAfter)
    return Date.now() >= autoApproveTime.getTime()
  }
}

/**
 * 基于文件的状态持久化
 */
export class FileBasedPersistence implements WorkflowStatePersistence {
  private stateDir: string

  constructor(stateDir = '.linchkit/workflow-states') {
    this.stateDir = stateDir
    if (!existsSync(this.stateDir)) {
      mkdirSync(this.stateDir, { recursive: true })
    }
  }

  async save(context: WorkflowContext): Promise<void> {
    const filePath = join(this.stateDir, `${context.sessionId}.json`)
    writeFileSync(filePath, JSON.stringify(context, null, 2))
  }

  async load(sessionId: string): Promise<WorkflowContext | null> {
    const filePath = join(this.stateDir, `${sessionId}.json`)
    
    if (!existsSync(filePath)) {
      return null
    }

    try {
      const content = readFileSync(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      logger.error(`Failed to load workflow state: ${error}`)
      return null
    }
  }

  async list(): Promise<WorkflowContext[]> {
    const files = require('fs').readdirSync(this.stateDir).filter((f: string) => f.endsWith('.json'))
    const contexts: WorkflowContext[] = []

    for (const file of files) {
      const sessionId = file.replace('.json', '')
      const context = await this.load(sessionId)
      if (context) {
        contexts.push(context)
      }
    }

    return contexts
  }

  async cleanup(olderThan: Date): Promise<number> {
    const contexts = await this.list()
    let cleaned = 0

    for (const context of contexts) {
      const stateTime = new Date(context.metadata.lastUpdated)
      if (stateTime < olderThan) {
        const filePath = join(this.stateDir, `${context.sessionId}.json`)
        require('fs').unlinkSync(filePath)
        cleaned++
      }
    }

    return cleaned
  }
}

/**
 * 工厂函数
 */
export function createWorkflowStateMachine(
  sessionId: string,
  taskDescription: string,
  persistence?: WorkflowStatePersistence
): WorkflowStateMachine {
  return new WorkflowStateMachine(sessionId, taskDescription, persistence)
}