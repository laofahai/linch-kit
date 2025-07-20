/**
 * LinchKit AI工作流状态机
 * 基于Guardian系统的工作流状态管理和人机协作界面
 * 
 * @version 1.0.0 - Phase 1 状态管理集成
 */

import { createLogger } from '@linch-kit/core'
import { writeFile, readFile, access, mkdir, readdir, unlink } from 'fs/promises'
import { constants } from 'fs'
import { join } from 'path'

const logger = createLogger('workflow-state-machine')

/**
 * Phase 3: 标准七状态工作流模型
 * 简化状态机，提高可预测性和可维护性
 */
export type WorkflowState = 
  | 'INIT'        // 初始化 - 工作流创建和环境准备
  | 'ANALYZE'     // 分析 - 需求分析、可行性评估、风险识别
  | 'PLAN'        // 规划 - 实施方案制定、资源分配、时间规划
  | 'IMPLEMENT'   // 实施 - 具体执行、代码编写、功能开发
  | 'TEST'        // 测试 - 质量验证、集成测试、性能评估
  | 'REVIEW'      // 审查 - 代码审查、合规检查、最终验证
  | 'COMPLETE'    // 完成 - 交付确认、文档更新、清理工作

/**
 * Phase 3: 扩展状态 - 用于异常和特殊情况处理
 */
export type ExtendedWorkflowState = WorkflowState 
  | 'PAUSED'      // 暂停 - 人工干预、等待资源、阻塞问题
  | 'FAILED'      // 失败 - 不可恢复错误、终止执行
  | 'CANCELLED'   // 取消 - 用户主动取消、优先级变更

/**
 * Phase 3: 七状态工作流动作
 * 明确的状态转换操作，确保工作流的可预测性
 */
export type WorkflowAction = 
  // 正向流程动作
  | 'INITIALIZE'           // INIT状态初始化
  | 'START_ANALYSIS'       // INIT → ANALYZE
  | 'COMPLETE_ANALYSIS'    // ANALYZE → PLAN
  | 'START_PLANNING'       // ANALYZE → PLAN
  | 'COMPLETE_PLANNING'    // PLAN → IMPLEMENT
  | 'START_IMPLEMENTATION' // PLAN → IMPLEMENT
  | 'COMPLETE_IMPLEMENTATION' // IMPLEMENT → TEST
  | 'START_TESTING'        // IMPLEMENT → TEST
  | 'COMPLETE_TESTING'     // TEST → REVIEW
  | 'START_REVIEW'         // TEST → REVIEW
  | 'COMPLETE_REVIEW'      // REVIEW → COMPLETE
  | 'FINALIZE'            // REVIEW → COMPLETE
  
  // 控制流程动作
  | 'PAUSE'               // 任何状态 → PAUSED
  | 'RESUME'              // PAUSED → 恢复到之前状态
  | 'RETRY'               // FAILED → 回到失败前状态
  | 'SKIP'                // 跳过当前状态到下一状态
  | 'ROLLBACK'            // 回滚到上一状态
  
  // 终止动作
  | 'FAIL'                // 任何状态 → FAILED
  | 'CANCEL'              // 任何状态 → CANCELLED

/**
 * Phase 3: 增强的状态转换定义
 * 支持扩展状态、条件检查、守卫规则和自动化控制
 */
export interface WorkflowStateTransition {
  from: WorkflowState | ExtendedWorkflowState
  to: WorkflowState | ExtendedWorkflowState
  action: WorkflowAction
  condition?: (context: WorkflowContext) => boolean
  guard?: (context: WorkflowContext) => string | null // null if valid, error message if invalid
  
  // Phase 3 新增字段
  automaticTrigger?: boolean  // 是否自动触发此转换
  timeout?: number           // 状态超时时间（毫秒）
  retryable?: boolean        // 是否可重试
  rollbackTo?: WorkflowState | ExtendedWorkflowState  // 失败时回滚目标状态
  metadata?: {
    priority?: 'low' | 'medium' | 'high' | 'critical'
    estimatedDuration?: number  // 预计持续时间（毫秒）
    requiredResources?: string[] // 所需资源
    riskLevel?: number          // 风险等级 1-5
  }
}

/**
 * Phase 3: 增强的工作流上下文
 * 支持状态快照、版本控制、自动化决策和完整审计跟踪
 */
export interface WorkflowContext {
  sessionId: string
  taskDescription: string
  currentState: WorkflowState | ExtendedWorkflowState
  
  // Phase 3: 增强的元数据
  metadata: {
    version: string           // 工作流版本
    startTime: string
    lastUpdated: string
    totalDuration?: number
    automationLevel: 'manual' | 'semi_auto' | 'full_auto'
    
    // 新增字段
    priority: 'low' | 'medium' | 'high' | 'critical'
    category?: string         // 任务分类
    tags?: string[]          // 标签
    assignee?: string        // 负责人
    reviewer?: string        // 审查者
    estimatedCompletion?: string  // 预计完成时间
    actualCompletion?: string     // 实际完成时间
  }
  
  // Phase 3: 状态快照和版本控制
  snapshots?: Array<{
    id: string
    timestamp: string
    state: WorkflowState | ExtendedWorkflowState
    context: Partial<WorkflowContext>  // 状态快照
    trigger: 'manual' | 'automatic' | 'error' | 'milestone'
    description?: string
  }>
  
  // Phase 3: 暂停/恢复支持
  pauseInfo?: {
    pausedAt: string
    pausedBy: string
    reason: string
    previousState: WorkflowState | ExtendedWorkflowState
    resumeConditions?: string[]
  }
  
  // Phase 3: 失败恢复支持
  failureInfo?: {
    failedAt: string
    failureReason: string
    errorDetails: any
    recoveryAttempts: number
    lastRecoveryAt?: string
    recoveryStrategy?: 'retry' | 'rollback' | 'manual' | 'skip'
  }
  // Phase 3: 重构分析阶段数据结构
  analysis?: {
    approach: string
    confidence: number
    estimatedHours: number
    complexity: number
    risks: string[]
    dependencies: string[]
    
    // 新增分析字段
    feasibilityScore: number     // 可行性评分 0-100
    resourceRequirements: {
      cpu?: number              // CPU需求
      memory?: number           // 内存需求
      storage?: number          // 存储需求
      externalServices?: string[] // 外部服务依赖
    }
    alternativeApproaches?: Array<{
      name: string
      pros: string[]
      cons: string[]
      score: number
    }>
  }
  
  // Phase 3: 重构规划阶段数据结构
  planning?: {
    startedAt: string
    milestones: Array<{
      id: string
      name: string
      description: string
      estimatedDuration: number
      dependencies: string[]
      status: 'pending' | 'in_progress' | 'completed' | 'blocked'
    }>
    resourceAllocation: {
      timeSlots: Array<{
        start: string
        end: string
        assignee: string
        task: string
      }>
    }
    riskMitigation: Array<{
      risk: string
      likelihood: number  // 1-5
      impact: number      // 1-5
      mitigation: string
      contingency?: string
    }>
  }
  
  // Phase 3: 重构实施阶段数据结构
  implementation?: {
    startedAt: string
    progress: number // 0-100
    currentMilestone?: string
    completedMilestones: string[]
    
    // 增强错误处理
    errors: Array<{
      id: string
      timestamp: string
      milestone?: string
      error: string
      severity: 'info' | 'warning' | 'error' | 'fatal'
      resolved?: boolean
      resolution?: string
      resolvedAt?: string
    }>
    
    // 实时指标
    metrics?: {
      linesOfCode?: number
      testCoverage?: number
      performanceScore?: number
      qualityGate?: 'passed' | 'failed' | 'pending'
    }
  }
  
  // Phase 3: 新增测试阶段数据结构
  testing?: {
    startedAt: string
    testSuites: Array<{
      name: string
      type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
      status: 'pending' | 'running' | 'passed' | 'failed'
      results?: {
        passed: number
        failed: number
        skipped: number
        coverage?: number
      }
    }>
    qualityMetrics: {
      codeQuality: number      // 0-100
      performance: number      // 0-100
      security: number         // 0-100
      maintainability: number  // 0-100
    }
  }
  
  // Phase 3: 新增审查阶段数据结构
  review?: {
    startedAt: string
    reviewers: string[]
    checklistItems: Array<{
      category: 'code' | 'documentation' | 'testing' | 'security' | 'performance'
      item: string
      status: 'pending' | 'approved' | 'rejected'
      comment?: string
      reviewer?: string
    }>
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'conditional'
    finalComments?: string
  }
  
  // Phase 3: 增强状态历史
  stateHistory: Array<{
    state: WorkflowState | ExtendedWorkflowState
    timestamp: string
    action: WorkflowAction
    by: string
    metadata?: Record<string, unknown>
    
    // 新增字段
    duration?: number        // 在此状态的持续时间
    automaticTransition?: boolean  // 是否自动转换
    rollbackTarget?: WorkflowState | ExtendedWorkflowState
  }>
}

/**
 * Phase 3: 增强的状态持久化接口
 * 支持快照管理、版本控制、跨会话恢复和高级查询
 */
export interface WorkflowStatePersistence {
  // 基础持久化操作
  save(context: WorkflowContext): Promise<void>
  load(sessionId: string): Promise<WorkflowContext | null>
  list(): Promise<WorkflowContext[]>
  cleanup(olderThan: Date): Promise<number>
  
  // Phase 3: 快照管理
  saveSnapshot(sessionId: string, trigger: 'manual' | 'automatic' | 'error' | 'milestone', description?: string): Promise<string>
  loadSnapshot(sessionId: string, snapshotId: string): Promise<WorkflowContext | null>
  listSnapshots(sessionId: string): Promise<Array<{id: string, timestamp: string, trigger: string, description?: string}>>
  deleteSnapshot(sessionId: string, snapshotId: string): Promise<boolean>
  
  // Phase 3: 版本控制
  saveVersion(context: WorkflowContext, version: string): Promise<void>
  loadVersion(sessionId: string, version: string): Promise<WorkflowContext | null>
  listVersions(sessionId: string): Promise<string[]>
  
  // Phase 3: 跨会话恢复
  findActiveWorkflows(assignee?: string): Promise<WorkflowContext[]>
  findPausedWorkflows(): Promise<WorkflowContext[]>
  findFailedWorkflows(since?: Date): Promise<WorkflowContext[]>
  
  // Phase 3: 高级查询
  findByState(state: WorkflowState | ExtendedWorkflowState): Promise<WorkflowContext[]>
  findByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<WorkflowContext[]>
  findByCategory(category: string): Promise<WorkflowContext[]>
  findByTag(tag: string): Promise<WorkflowContext[]>
  
  // Phase 3: 统计分析
  getStatistics(timeRange?: {start: Date, end: Date}): Promise<{
    totalWorkflows: number
    completedWorkflows: number
    failedWorkflows: number
    averageDuration: number
    stateDistribution: Record<string, number>
    priorityDistribution: Record<string, number>
  }>
}

/**
 * Phase 3: 增强的工作流状态机
 * 管理AI工作流的完整生命周期状态，支持快照、恢复、自动化和规则引擎
 */
export class WorkflowStateMachine {
  private transitions: WorkflowStateTransition[]
  private persistence: WorkflowStatePersistence
  private context: WorkflowContext
  
  // Phase 3: 新增字段
  private autoSaveEnabled: boolean = true
  private snapshotInterval: number = 5 * 60 * 1000 // 5分钟
  private lastSnapshotTime: number = 0
  private stateTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    sessionId: string,
    taskDescription: string,
    options?: {
      persistence?: WorkflowStatePersistence
      autoSaveEnabled?: boolean
      snapshotInterval?: number
      priority?: 'low' | 'medium' | 'high' | 'critical'
      category?: string
      tags?: string[]
      assignee?: string
    }
  ) {
    this.persistence = options?.persistence || new EnhancedFileBasedPersistence()
    this.autoSaveEnabled = options?.autoSaveEnabled ?? true
    this.snapshotInterval = options?.snapshotInterval ?? 5 * 60 * 1000
    
    this.context = this.initializeContext(sessionId, taskDescription, options)
    this.transitions = this.defineTransitions()
    
    // Phase 3: 启动自动快照
    if (this.autoSaveEnabled) {
      this.startAutoSnapshot()
    }
  }

  /**
   * Phase 3: 增强的初始化工作流上下文
   */
  private initializeContext(
    sessionId: string, 
    taskDescription: string,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical'
      category?: string
      tags?: string[]
      assignee?: string
    }
  ): WorkflowContext {
    const now = new Date().toISOString()
    
    return {
      sessionId,
      taskDescription,
      currentState: 'INIT',
      
      metadata: {
        version: '3.0.0',
        startTime: now,
        lastUpdated: now,
        automationLevel: 'semi_auto',
        priority: options?.priority || 'medium',
        category: options?.category,
        tags: options?.tags,
        assignee: options?.assignee
      },
      
      snapshots: [],
      
      stateHistory: [{
        state: 'INIT',
        timestamp: now,
        action: 'INITIALIZE',
        by: 'system',
        automaticTransition: true
      }]
    }
  }

  /**
   * Phase 3: 定义七状态工作流转换规则
   * 支持自动化、超时、重试和回滚机制
   */
  private defineTransitions(): WorkflowStateTransition[] {
    return [
      // ========== 正向流程转换 ==========
      
      // INIT → ANALYZE
      {
        from: 'INIT',
        to: 'ANALYZE',
        action: 'START_ANALYSIS',
        automaticTrigger: true,
        timeout: 30 * 1000, // 30秒超时
        metadata: {
          priority: 'high',
          estimatedDuration: 2 * 60 * 1000, // 2分钟
          riskLevel: 1
        }
      },
      
      // ANALYZE → PLAN  
      {
        from: 'ANALYZE',
        to: 'PLAN',
        action: 'COMPLETE_ANALYSIS',
        condition: (ctx) => !!ctx.analysis && ctx.analysis.confidence >= 70,
        guard: (ctx) => {
          if (!ctx.analysis) return 'Analysis data is required'
          if (ctx.analysis.confidence < 50) return 'Analysis confidence too low'
          return null
        },
        automaticTrigger: true,
        timeout: 5 * 60 * 1000, // 5分钟超时
        metadata: {
          priority: 'high',
          estimatedDuration: 3 * 60 * 1000,
          riskLevel: 2
        }
      },
      
      // ANALYZE → PLAN (alternative path for low complexity)
      {
        from: 'ANALYZE',
        to: 'PLAN',
        action: 'START_PLANNING',
        condition: (ctx) => !!ctx.analysis && ctx.analysis.complexity <= 2,
        automaticTrigger: true,
        metadata: {
          priority: 'medium',
          estimatedDuration: 2 * 60 * 1000,
          riskLevel: 1
        }
      },
      
      // PLAN → IMPLEMENT
      {
        from: 'PLAN',
        to: 'IMPLEMENT',
        action: 'COMPLETE_PLANNING',
        condition: (ctx) => !!ctx.planning && ctx.planning.milestones.length > 0,
        guard: (ctx) => {
          if (!ctx.planning) return 'Planning data is required'
          if (!ctx.planning.milestones.length) return 'At least one milestone is required'
          return null
        },
        automaticTrigger: false, // 需要人工确认
        metadata: {
          priority: 'high',
          estimatedDuration: 10 * 60 * 1000,
          riskLevel: 3
        }
      },
      
      // PLAN → IMPLEMENT (direct implementation)
      {
        from: 'PLAN',
        to: 'IMPLEMENT',
        action: 'START_IMPLEMENTATION',
        condition: (ctx) => ctx.metadata.automationLevel === 'full_auto',
        automaticTrigger: true,
        metadata: {
          priority: 'high',
          estimatedDuration: 15 * 60 * 1000,
          riskLevel: 4
        }
      },
      
      // IMPLEMENT → TEST
      {
        from: 'IMPLEMENT',
        to: 'TEST',
        action: 'COMPLETE_IMPLEMENTATION',
        condition: (ctx) => !!ctx.implementation && ctx.implementation.progress >= 95,
        guard: (ctx) => {
          if (!ctx.implementation) return 'Implementation data is required'
          if (ctx.implementation.progress < 90) return 'Implementation not complete enough'
          if (ctx.implementation.errors.some(e => e.severity === 'fatal' && !e.resolved)) {
            return 'Unresolved fatal errors exist'
          }
          return null
        },
        automaticTrigger: true,
        timeout: 30 * 60 * 1000, // 30分钟超时
        retryable: true,
        rollbackTo: 'PLAN',
        metadata: {
          priority: 'critical',
          estimatedDuration: 20 * 60 * 1000,
          riskLevel: 4
        }
      },
      
      // IMPLEMENT → TEST (manual transition)
      {
        from: 'IMPLEMENT',
        to: 'TEST',
        action: 'START_TESTING',
        condition: (ctx) => !!ctx.implementation && ctx.implementation.progress >= 80,
        automaticTrigger: false,
        retryable: true,
        rollbackTo: 'IMPLEMENT',
        metadata: {
          priority: 'high',
          estimatedDuration: 10 * 60 * 1000,
          riskLevel: 3
        }
      },
      
      // TEST → REVIEW
      {
        from: 'TEST',
        to: 'REVIEW',
        action: 'COMPLETE_TESTING',
        condition: (ctx) => {
          if (!ctx.testing) return false
          const allPassed = ctx.testing.testSuites.every(suite => suite.status === 'passed')
          const qualityThreshold = ctx.testing.qualityMetrics.codeQuality >= 80 &&
                                  ctx.testing.qualityMetrics.security >= 90
          return allPassed && qualityThreshold
        },
        guard: (ctx) => {
          if (!ctx.testing) return 'Testing data is required'
          const failedSuites = ctx.testing.testSuites.filter(suite => suite.status === 'failed')
          if (failedSuites.length > 0) return `${failedSuites.length} test suites failed`
          if (ctx.testing.qualityMetrics.security < 80) return 'Security score too low'
          return null
        },
        automaticTrigger: true,
        timeout: 15 * 60 * 1000,
        retryable: true,
        rollbackTo: 'IMPLEMENT',
        metadata: {
          priority: 'critical',
          estimatedDuration: 8 * 60 * 1000,
          riskLevel: 3
        }
      },
      
      // TEST → REVIEW (manual transition)
      {
        from: 'TEST',
        to: 'REVIEW',
        action: 'START_REVIEW',
        automaticTrigger: false,
        metadata: {
          priority: 'medium',
          estimatedDuration: 5 * 60 * 1000,
          riskLevel: 2
        }
      },
      
      // REVIEW → COMPLETE
      {
        from: 'REVIEW',
        to: 'COMPLETE',
        action: 'COMPLETE_REVIEW',
        condition: (ctx) => {
          if (!ctx.review) return false
          return ctx.review.approvalStatus === 'approved' &&
                 ctx.review.checklistItems.every(item => item.status === 'approved')
        },
        guard: (ctx) => {
          if (!ctx.review) return 'Review data is required'
          if (ctx.review.approvalStatus === 'rejected') return 'Review was rejected'
          const rejectedItems = ctx.review.checklistItems.filter(item => item.status === 'rejected')
          if (rejectedItems.length > 0) return `${rejectedItems.length} checklist items rejected`
          return null
        },
        automaticTrigger: true,
        timeout: 10 * 60 * 1000,
        metadata: {
          priority: 'high',
          estimatedDuration: 3 * 60 * 1000,
          riskLevel: 1
        }
      },
      
      // REVIEW → COMPLETE (finalize)
      {
        from: 'REVIEW',
        to: 'COMPLETE',
        action: 'FINALIZE',
        condition: (ctx) => ctx.metadata.automationLevel === 'full_auto',
        automaticTrigger: true,
        metadata: {
          priority: 'medium',
          estimatedDuration: 2 * 60 * 1000,
          riskLevel: 1
        }
      },
      
      // ========== 控制流程转换 ==========
      
      // 暂停操作 - 从任何活跃状态
      ...(['ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW'] as const).map(state => ({
        from: state,
        to: 'PAUSED' as const,
        action: 'PAUSE' as const,
        automaticTrigger: false,
        metadata: {
          priority: 'medium' as const,
          riskLevel: 1
        }
      })),
      
      // 恢复操作 - 从暂停状态
      {
        from: 'PAUSED',
        to: 'ANALYZE', // 将在运行时动态确定目标状态
        action: 'RESUME',
        condition: (ctx) => !!ctx.pauseInfo,
        automaticTrigger: false,
        metadata: {
          priority: 'high',
          riskLevel: 2
        }
      },
      
      // 回滚操作 - 到上一个状态
      ...(['PLAN', 'IMPLEMENT', 'TEST', 'REVIEW'] as const).map((state, index) => {
        const previousStates = ['ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST'] as const
        return {
          from: state,
          to: previousStates[index],
          action: 'ROLLBACK' as const,
          automaticTrigger: false,
          retryable: true,
          metadata: {
            priority: 'medium' as const,
            riskLevel: 3
          }
        }
      }),
      
      // 跳过操作 - 跳过当前状态
      {
        from: 'TEST',
        to: 'REVIEW',
        action: 'SKIP',
        condition: (ctx) => ctx.metadata.priority === 'low',
        automaticTrigger: false,
        metadata: {
          priority: 'low',
          riskLevel: 4
        }
      },
      
      // 重试操作 - 从失败状态恢复
      {
        from: 'FAILED',
        to: 'ANALYZE', // 将在运行时动态确定目标状态
        action: 'RETRY',
        condition: (ctx) => {
          if (!ctx.failureInfo) return false
          return ctx.failureInfo.recoveryAttempts < 3 && // 最多重试3次
                 ctx.failureInfo.recoveryStrategy === 'retry'
        },
        automaticTrigger: false,
        retryable: true,
        metadata: {
          priority: 'high',
          riskLevel: 4
        }
      },
      
      // ========== 终止状态转换 ==========
      
      // 失败操作 - 从任何状态
      ...(['ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW'] as const).map(state => ({
        from: state,
        to: 'FAILED' as const,
        action: 'FAIL' as const,
        automaticTrigger: false,
        metadata: {
          priority: 'critical' as const,
          riskLevel: 5
        }
      })),
      
      // 取消操作 - 从任何非终止状态
      ...(['INIT', 'ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW', 'PAUSED'] as const).map(state => ({
        from: state,
        to: 'CANCELLED' as const,
        action: 'CANCEL' as const,
        automaticTrigger: false,
        metadata: {
          priority: 'low' as const,
          riskLevel: 1
        }
      }))
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
      metadata,
      automaticTransition: selectedTransition.automaticTrigger
    })

    logger.info(`State transition: ${previousState} -> ${selectedTransition.to} (${action})`)

    // 设置状态超时（如果定义了）
    if (selectedTransition.timeout) {
      this.setStateTimeout(selectedTransition.timeout)
    }

    // 执行状态特定的操作
    await this.onStateEnter(selectedTransition.to, metadata)

    // 持久化状态
    await this.persistence.save(this.context)

    return true
  }

  /**
   * 更新任务描述
   */
  updateTaskDescription(taskDescription: string): void {
    this.context.taskDescription = taskDescription
    this.context.metadata.lastUpdated = new Date().toISOString()
    logger.info(`Updated task description: ${taskDescription}`)
  }

  /**
   * 状态进入时的处理
   */
  private async onStateEnter(state: WorkflowState | ExtendedWorkflowState, metadata?: Record<string, unknown>): Promise<void> {
    switch (state) {
      case 'ANALYZE':
        await this.handleAnalysisStart()
        break
      case 'PLAN':
        await this.handlePlanningStart()
        break
      case 'IMPLEMENT':
        await this.handleImplementationStart()
        break
      case 'TEST':
        await this.handleTestingStart()
        break
      case 'REVIEW':
        await this.handleReviewStart()
        break
      case 'COMPLETE':
        await this.handleCompletion()
        break
      case 'FAILED':
        await this.handleFailure()
        break
      case 'PAUSED':
        await this.handlePause()
        break
    }
  }

  /**
   * 处理分析开始
   */
  private async handleAnalysisStart(): Promise<void> {
    logger.info('Analysis phase started')
    
    // 初始化分析数据结构
    if (!this.context.analysis) {
      this.context.analysis = {
        approach: '',
        confidence: 0,
        estimatedHours: 0,
        complexity: 1,
        risks: [],
        dependencies: [],
        feasibilityScore: 0,
        resourceRequirements: {}
      }
    }
  }

  /**
   * 处理规划开始
   */
  private async handlePlanningStart(): Promise<void> {
    logger.info('Planning phase started')
    
    if (!this.context.planning) {
      this.context.planning = {
        startedAt: new Date().toISOString(),
        milestones: [],
        resourceAllocation: {
          timeSlots: []
        },
        riskMitigation: []
      }
    }
  }

  /**
   * 处理实施开始
   */
  private async handleImplementationStart(): Promise<void> {
    this.context.implementation = {
      startedAt: new Date().toISOString(),
      progress: 0,
      currentMilestone: this.context.planning?.milestones[0]?.id,
      completedMilestones: [],
      errors: []
    }

    logger.info('Implementation phase started')
  }

  /**
   * 处理测试开始
   */
  private async handleTestingStart(): Promise<void> {
    logger.info('Testing phase started')
    
    if (!this.context.testing) {
      this.context.testing = {
        startedAt: new Date().toISOString(),
        testSuites: [],
        qualityMetrics: {
          codeQuality: 0,
          performance: 0,
          security: 0,
          maintainability: 0
        }
      }
    }
  }

  /**
   * 处理审查开始
   */
  private async handleReviewStart(): Promise<void> {
    logger.info('Review phase started')
    
    if (!this.context.review) {
      this.context.review = {
        startedAt: new Date().toISOString(),
        reviewers: [],
        checklistItems: [],
        approvalStatus: 'pending'
      }
    }
  }

  /**
   * 处理暂停状态
   */
  private async handlePause(): Promise<void> {
    logger.info('Workflow paused')
    
    if (!this.context.pauseInfo) {
      this.context.pauseInfo = {
        pausedAt: new Date().toISOString(),
        pausedBy: 'system',
        reason: 'Manual pause',
        previousState: this.context.stateHistory[this.context.stateHistory.length - 2]?.state || 'INIT'
      }
    }
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
  updateImplementationProgress(progress: number, currentMilestone?: string, errors?: Array<{
    id: string
    timestamp: string
    milestone?: string
    error: string
    severity: 'info' | 'warning' | 'error' | 'fatal'
    resolved?: boolean
  }>): void {
    if (this.context.implementation) {
      this.context.implementation.progress = Math.min(100, Math.max(0, progress))
      
      if (currentMilestone) {
        this.context.implementation.currentMilestone = currentMilestone
      }
      
      if (errors) {
        this.context.implementation.errors.push(...errors)
      }
      
      this.context.metadata.lastUpdated = new Date().toISOString()
    }
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
   * Phase 3: 启动自动快照
   */
  private startAutoSnapshot(): void {
    setInterval(async () => {
      if (Date.now() - this.lastSnapshotTime >= this.snapshotInterval) {
        try {
          await this.persistence.saveSnapshot(
            this.context.sessionId,
            'automatic',
            `Auto snapshot at ${new Date().toISOString()}`
          )
          this.lastSnapshotTime = Date.now()
          logger.debug(`Auto snapshot created for ${this.context.sessionId}`)
        } catch (error) {
          logger.warn(`Failed to create auto snapshot: ${error}`)
        }
      }
    }, 60 * 1000) // 每分钟检查一次
  }

  /**
   * Phase 3: 设置状态超时
   */
  private setStateTimeout(timeoutMs: number): void {
    this.clearStateTimeout()
    
    const timeoutId = setTimeout(async () => {
      logger.warn(`State timeout reached for ${this.context.currentState}`)
      
      // 触发超时处理
      await this.handleStateTimeout()
    }, timeoutMs)
    
    this.stateTimeouts.set(this.context.sessionId, timeoutId)
  }

  /**
   * Phase 3: 清除状态超时
   */
  private clearStateTimeout(): void {
    const timeoutId = this.stateTimeouts.get(this.context.sessionId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.stateTimeouts.delete(this.context.sessionId)
    }
  }

  /**
   * Phase 3: 处理状态超时
   */
  private async handleStateTimeout(): Promise<void> {
    logger.warn(`State ${this.context.currentState} timed out, initiating recovery`)
    
    // 创建快照
    await this.persistence.saveSnapshot(
      this.context.sessionId,
      'error',
      `State timeout: ${this.context.currentState}`
    )
    
    // 根据当前状态决定恢复策略
    switch (this.context.currentState) {
      case 'ANALYZE':
      case 'PLAN':
        // 对于分析和规划阶段，暂停等待人工干预
        await this.transition('PAUSE', { reason: 'State timeout' })
        break
        
      case 'IMPLEMENT':
      case 'TEST':
        // 对于实施和测试阶段，回滚到上一状态
        await this.transition('ROLLBACK', { reason: 'State timeout' })
        break
        
      default:
        // 其他情况下标记为失败
        await this.transition('FAIL', { reason: 'State timeout' })
    }
  }

  /**
   * Phase 3: 手动创建快照
   */
  async createSnapshot(description?: string): Promise<string | null> {
    try {
      const snapshotId = await this.persistence.saveSnapshot(
        this.context.sessionId,
        'manual',
        description || `Manual snapshot at ${new Date().toISOString()}`
      )
      
      logger.info(`Manual snapshot created: ${snapshotId}`)
      return snapshotId
    } catch (error) {
      logger.error(`Failed to create manual snapshot: ${error}`)
      return null
    }
  }

  /**
   * Phase 3: 从快照恢复
   */
  async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
    try {
      const snapshotContext = await this.persistence.loadSnapshot(
        this.context.sessionId,
        snapshotId
      )
      
      if (!snapshotContext) {
        logger.error(`Snapshot ${snapshotId} not found`)
        return false
      }
      
      // 保存当前状态作为备份
      await this.persistence.saveSnapshot(
        this.context.sessionId,
        'automatic',
        `Backup before restore from ${snapshotId}`
      )
      
      // 恢复上下文
      this.context = snapshotContext
      
      // 重新启动自动快照
      if (this.autoSaveEnabled) {
        this.startAutoSnapshot()
      }
      
      logger.info(`Restored from snapshot: ${snapshotId}`)
      return true
    } catch (error) {
      logger.error(`Failed to restore from snapshot ${snapshotId}: ${error}`)
      return false
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): WorkflowState | ExtendedWorkflowState {
    return this.context.currentState
  }

  /**
   * 获取完整上下文
   */
  getContext(): WorkflowContext {
    return { ...this.context }
  }
}

/**
 * 基于文件的状态持久化
 */
export class FileBasedPersistence implements WorkflowStatePersistence {
  private stateDir: string

  constructor(stateDir = '.linchkit/workflow-states') {
    this.stateDir = stateDir
    this.ensureDirectoryExists()
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await access(this.stateDir, constants.F_OK)
    } catch {
      await mkdir(this.stateDir, { recursive: true })
    }
  }

  async save(context: WorkflowContext): Promise<void> {
    await this.ensureDirectoryExists()
    const filePath = join(this.stateDir, `${context.sessionId}.json`)
    await writeFile(filePath, JSON.stringify(context, null, 2), 'utf8')
  }

  async load(sessionId: string): Promise<WorkflowContext | null> {
    const filePath = join(this.stateDir, `${sessionId}.json`)
    
    try {
      await access(filePath, constants.F_OK)
      const content = await readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      if (error instanceof Error && (error as any).code !== 'ENOENT') {
        logger.error(`Failed to load workflow state: ${error.message}`)
      }
      return null
    }
  }

  async list(): Promise<WorkflowContext[]> {
    try {
      const files = await readdir(this.stateDir)
      const jsonFiles = files.filter(f => f.endsWith('.json'))
      const contexts: WorkflowContext[] = []

      for (const file of jsonFiles) {
        const sessionId = file.replace('.json', '')
        const context = await this.load(sessionId)
        if (context) {
          contexts.push(context)
        }
      }

      return contexts
    } catch (error) {
      if (error instanceof Error && (error as any).code !== 'ENOENT') {
        logger.error(`Failed to list workflow states: ${error.message}`)
      }
      return []
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    const contexts = await this.list()
    let cleaned = 0

    for (const context of contexts) {
      const stateTime = new Date(context.metadata.lastUpdated)
      if (stateTime < olderThan) {
        try {
          const filePath = join(this.stateDir, `${context.sessionId}.json`)
          await unlink(filePath)
          cleaned++
        } catch (error) {
          logger.warn(`Failed to cleanup workflow state ${context.sessionId}: ${error}`)
        }
      }
    }

    return cleaned
  }

  // Phase 3: 这些方法的基础实现，EnhancedFileBasedPersistence将提供完整实现
  async saveSnapshot(): Promise<string> { throw new Error('Not implemented') }
  async loadSnapshot(): Promise<WorkflowContext | null> { throw new Error('Not implemented') }
  async listSnapshots(): Promise<Array<{id: string, timestamp: string, trigger: string, description?: string}>> { throw new Error('Not implemented') }
  async deleteSnapshot(): Promise<boolean> { throw new Error('Not implemented') }
  async saveVersion(): Promise<void> { throw new Error('Not implemented') }
  async loadVersion(): Promise<WorkflowContext | null> { throw new Error('Not implemented') }
  async listVersions(): Promise<string[]> { throw new Error('Not implemented') }
  async findActiveWorkflows(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async findPausedWorkflows(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async findFailedWorkflows(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async findByState(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async findByPriority(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async findByCategory(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async findByTag(): Promise<WorkflowContext[]> { throw new Error('Not implemented') }
  async getStatistics(): Promise<any> { throw new Error('Not implemented') }
}

/**
 * Phase 3: 增强的基于文件的状态持久化
 * 支持快照管理、版本控制、跨会话恢复和高级查询
 */
export class EnhancedFileBasedPersistence implements WorkflowStatePersistence {
  private stateDir: string
  private snapshotsDir: string
  private versionsDir: string
  private indexFile: string

  constructor(stateDir = '.linchkit/workflow-states') {
    this.stateDir = stateDir
    this.snapshotsDir = join(stateDir, 'snapshots')
    this.versionsDir = join(stateDir, 'versions')
    this.indexFile = join(stateDir, 'index.json')
    this.ensureDirectoryExists()
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await mkdir(this.stateDir, { recursive: true })
      await mkdir(this.snapshotsDir, { recursive: true })
      await mkdir(this.versionsDir, { recursive: true })
    } catch (error) {
      logger.warn(`Failed to create directories: ${error}`)
    }
  }

  // ========== 基础持久化操作 ==========

  async save(context: WorkflowContext): Promise<void> {
    await this.ensureDirectoryExists()
    const filePath = join(this.stateDir, `${context.sessionId}.json`)
    await writeFile(filePath, JSON.stringify(context, null, 2), 'utf8')
    await this.updateIndex(context)
  }

  async load(sessionId: string): Promise<WorkflowContext | null> {
    const filePath = join(this.stateDir, `${sessionId}.json`)
    
    try {
      await access(filePath, constants.F_OK)
      const content = await readFile(filePath, 'utf8')
      return JSON.parse(content) as WorkflowContext
    } catch (error) {
      if (error instanceof Error && (error as any).code !== 'ENOENT') {
        logger.error(`Failed to load workflow state: ${error.message}`)
      }
      return null
    }
  }

  async list(): Promise<WorkflowContext[]> {
    try {
      const files = await readdir(this.stateDir)
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json')
      const contexts: WorkflowContext[] = []

      for (const file of jsonFiles) {
        const sessionId = file.replace('.json', '')
        const context = await this.load(sessionId)
        if (context) {
          contexts.push(context)
        }
      }

      return contexts.sort((a, b) => 
        new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime()
      )
    } catch (error) {
      if (error instanceof Error && (error as any).code !== 'ENOENT') {
        logger.error(`Failed to list workflow states: ${error.message}`)
      }
      return []
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    const contexts = await this.list()
    let cleaned = 0

    for (const context of contexts) {
      const stateTime = new Date(context.metadata.lastUpdated)
      if (stateTime < olderThan) {
        try {
          const filePath = join(this.stateDir, `${context.sessionId}.json`)
          await unlink(filePath)
          
          // 清理相关快照和版本
          await this.cleanupSessionFiles(context.sessionId)
          cleaned++
        } catch (error) {
          logger.warn(`Failed to cleanup workflow state ${context.sessionId}: ${error}`)
        }
      }
    }

    // 更新索引
    await this.rebuildIndex()
    return cleaned
  }

  // ========== Phase 3: 快照管理 ==========

  async saveSnapshot(
    sessionId: string, 
    trigger: 'manual' | 'automatic' | 'error' | 'milestone', 
    description?: string
  ): Promise<string> {
    const context = await this.load(sessionId)
    if (!context) {
      throw new Error(`Workflow ${sessionId} not found`)
    }

    const snapshotId = `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    
    const snapshot = {
      id: snapshotId,
      timestamp,
      state: context.currentState,
      context: this.createSnapshotContext(context),
      trigger,
      description
    }

    // 添加到上下文的快照列表
    if (!context.snapshots) {
      context.snapshots = []
    }
    context.snapshots.push(snapshot)

    // 保存快照文件
    const snapshotPath = join(this.snapshotsDir, `${snapshotId}.json`)
    await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8')
    
    // 更新主上下文
    await this.save(context)
    
    logger.info(`Snapshot saved: ${snapshotId} (${trigger})`)
    return snapshotId
  }

  async loadSnapshot(sessionId: string, snapshotId: string): Promise<WorkflowContext | null> {
    try {
      const snapshotPath = join(this.snapshotsDir, `${snapshotId}.json`)
      const content = await readFile(snapshotPath, 'utf8')
      const snapshot = JSON.parse(content)
      
      if (snapshot.context.sessionId !== sessionId) {
        throw new Error('Snapshot does not belong to this session')
      }
      
      return snapshot.context as WorkflowContext
    } catch (error) {
      logger.error(`Failed to load snapshot ${snapshotId}: ${error}`)
      return null
    }
  }

  async listSnapshots(sessionId: string): Promise<Array<{id: string, timestamp: string, trigger: string, description?: string}>> {
    const context = await this.load(sessionId)
    if (!context || !context.snapshots) {
      return []
    }

    return context.snapshots.map(s => ({
      id: s.id,
      timestamp: s.timestamp,
      trigger: s.trigger,
      description: s.description
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async deleteSnapshot(sessionId: string, snapshotId: string): Promise<boolean> {
    try {
      const context = await this.load(sessionId)
      if (!context || !context.snapshots) {
        return false
      }

      // 从上下文中移除快照
      context.snapshots = context.snapshots.filter(s => s.id !== snapshotId)
      await this.save(context)

      // 删除快照文件
      const snapshotPath = join(this.snapshotsDir, `${snapshotId}.json`)
      await unlink(snapshotPath)
      
      logger.info(`Snapshot deleted: ${snapshotId}`)
      return true
    } catch (error) {
      logger.error(`Failed to delete snapshot ${snapshotId}: ${error}`)
      return false
    }
  }

  // ========== Phase 3: 版本控制 ==========

  async saveVersion(context: WorkflowContext, version: string): Promise<void> {
    const versionPath = join(this.versionsDir, `${context.sessionId}-${version}.json`)
    const versionData = {
      version,
      timestamp: new Date().toISOString(),
      context: this.createVersionContext(context)
    }
    
    await writeFile(versionPath, JSON.stringify(versionData, null, 2), 'utf8')
    logger.info(`Version saved: ${context.sessionId}@${version}`)
  }

  async loadVersion(sessionId: string, version: string): Promise<WorkflowContext | null> {
    try {
      const versionPath = join(this.versionsDir, `${sessionId}-${version}.json`)
      const content = await readFile(versionPath, 'utf8')
      const versionData = JSON.parse(content)
      return versionData.context as WorkflowContext
    } catch (error) {
      logger.error(`Failed to load version ${sessionId}@${version}: ${error}`)
      return null
    }
  }

  async listVersions(sessionId: string): Promise<string[]> {
    try {
      const files = await readdir(this.versionsDir)
      const versionFiles = files.filter(f => f.startsWith(`${sessionId}-`) && f.endsWith('.json'))
      
      return versionFiles
        .map(f => f.replace(`${sessionId}-`, '').replace('.json', ''))
        .sort()
    } catch (error) {
      logger.error(`Failed to list versions for ${sessionId}: ${error}`)
      return []
    }
  }

  // ========== Phase 3: 跨会话恢复 ==========

  async findActiveWorkflows(assignee?: string): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    
    return contexts.filter(ctx => {
      const isActive = !['COMPLETE', 'FAILED', 'CANCELLED'].includes(ctx.currentState)
      const matchesAssignee = !assignee || ctx.metadata.assignee === assignee
      return isActive && matchesAssignee
    })
  }

  async findPausedWorkflows(): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    return contexts.filter(ctx => ctx.currentState === 'PAUSED')
  }

  async findFailedWorkflows(since?: Date): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    
    return contexts.filter(ctx => {
      if (ctx.currentState !== 'FAILED') return false
      if (!since) return true
      
      const failureTime = ctx.failureInfo?.failedAt ? new Date(ctx.failureInfo.failedAt) : new Date(ctx.metadata.lastUpdated)
      return failureTime >= since
    })
  }

  // ========== Phase 3: 高级查询 ==========

  async findByState(state: WorkflowState | ExtendedWorkflowState): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    return contexts.filter(ctx => ctx.currentState === state)
  }

  async findByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    return contexts.filter(ctx => ctx.metadata.priority === priority)
  }

  async findByCategory(category: string): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    return contexts.filter(ctx => ctx.metadata.category === category)
  }

  async findByTag(tag: string): Promise<WorkflowContext[]> {
    const contexts = await this.list()
    return contexts.filter(ctx => ctx.metadata.tags?.includes(tag))
  }

  // ========== Phase 3: 统计分析 ==========

  async getStatistics(timeRange?: {start: Date, end: Date}): Promise<{
    totalWorkflows: number
    completedWorkflows: number
    failedWorkflows: number
    averageDuration: number
    stateDistribution: Record<string, number>
    priorityDistribution: Record<string, number>
  }> {
    const contexts = await this.list()
    
    const filteredContexts = timeRange 
      ? contexts.filter(ctx => {
          const startTime = new Date(ctx.metadata.startTime)
          return startTime >= timeRange.start && startTime <= timeRange.end
        })
      : contexts

    const totalWorkflows = filteredContexts.length
    const completedWorkflows = filteredContexts.filter(ctx => ctx.currentState === 'COMPLETE').length
    const failedWorkflows = filteredContexts.filter(ctx => ctx.currentState === 'FAILED').length

    // 计算平均持续时间
    const completedWithDuration = filteredContexts.filter(ctx => 
      ctx.currentState === 'COMPLETE' && ctx.metadata.totalDuration
    )
    const averageDuration = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, ctx) => sum + (ctx.metadata.totalDuration || 0), 0) / completedWithDuration.length
      : 0

    // 状态分布
    const stateDistribution: Record<string, number> = {}
    filteredContexts.forEach(ctx => {
      stateDistribution[ctx.currentState] = (stateDistribution[ctx.currentState] || 0) + 1
    })

    // 优先级分布
    const priorityDistribution: Record<string, number> = {}
    filteredContexts.forEach(ctx => {
      const priority = ctx.metadata.priority || 'medium'
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1
    })

    return {
      totalWorkflows,
      completedWorkflows,
      failedWorkflows,
      averageDuration,
      stateDistribution,
      priorityDistribution
    }
  }

  // ========== 辅助方法 ==========

  private createSnapshotContext(context: WorkflowContext): Partial<WorkflowContext> {
    // 创建快照时只保存必要的上下文信息
    return {
      sessionId: context.sessionId,
      taskDescription: context.taskDescription,
      currentState: context.currentState,
      metadata: { ...context.metadata },
      analysis: context.analysis ? { ...context.analysis } : undefined,
      planning: context.planning ? { ...context.planning } : undefined,
      implementation: context.implementation ? { ...context.implementation } : undefined,
      testing: context.testing ? { ...context.testing } : undefined,
      review: context.review ? { ...context.review } : undefined,
      stateHistory: [...context.stateHistory]
    }
  }

  private createVersionContext(context: WorkflowContext): WorkflowContext {
    // 版本控制时保存完整上下文
    return JSON.parse(JSON.stringify(context))
  }

  private async updateIndex(context: WorkflowContext): Promise<void> {
    try {
      let index: Record<string, any> = {}
      
      try {
        const indexContent = await readFile(this.indexFile, 'utf8')
        index = JSON.parse(indexContent)
      } catch {
        // 索引文件不存在，创建新的
      }

      index[context.sessionId] = {
        sessionId: context.sessionId,
        taskDescription: context.taskDescription,
        currentState: context.currentState,
        priority: context.metadata.priority,
        category: context.metadata.category,
        tags: context.metadata.tags,
        assignee: context.metadata.assignee,
        startTime: context.metadata.startTime,
        lastUpdated: context.metadata.lastUpdated,
        totalDuration: context.metadata.totalDuration
      }

      await writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf8')
    } catch (error) {
      logger.warn(`Failed to update index: ${error}`)
    }
  }

  private async rebuildIndex(): Promise<void> {
    try {
      const contexts = await this.list()
      const index: Record<string, any> = {}

      contexts.forEach(context => {
        index[context.sessionId] = {
          sessionId: context.sessionId,
          taskDescription: context.taskDescription,
          currentState: context.currentState,
          priority: context.metadata.priority,
          category: context.metadata.category,
          tags: context.metadata.tags,
          assignee: context.metadata.assignee,
          startTime: context.metadata.startTime,
          lastUpdated: context.metadata.lastUpdated,
          totalDuration: context.metadata.totalDuration
        }
      })

      await writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf8')
      logger.info('Index rebuilt successfully')
    } catch (error) {
      logger.error(`Failed to rebuild index: ${error}`)
    }
  }

  private async cleanupSessionFiles(sessionId: string): Promise<void> {
    try {
      // 清理快照文件
      const snapshotFiles = await readdir(this.snapshotsDir)
      for (const file of snapshotFiles) {
        if (file.startsWith(`${sessionId}-`)) {
          await unlink(join(this.snapshotsDir, file))
        }
      }

      // 清理版本文件
      const versionFiles = await readdir(this.versionsDir)
      for (const file of versionFiles) {
        if (file.startsWith(`${sessionId}-`)) {
          await unlink(join(this.versionsDir, file))
        }
      }
    } catch (error) {
      logger.warn(`Failed to cleanup files for session ${sessionId}: ${error}`)
    }
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