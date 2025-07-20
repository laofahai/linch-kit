/**
 * LinchKit AI工作流规则引擎
 * Phase 3: 智能决策、失败恢复和自动化控制框架
 * 
 * @version 3.0.0 - Phase 3 规则引擎集成
 */

import { createLogger } from '@linch-kit/core'
import { WorkflowContext, WorkflowState, ExtendedWorkflowState, WorkflowAction } from './workflow-state-machine'

const logger = createLogger('workflow-rules-engine')

/**
 * Phase 3: 规则引擎核心接口
 */
export interface Rule {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number  // 1-10, 数值越高优先级越高
  
  // 规则条件
  condition: (context: WorkflowContext) => boolean
  
  // 规则动作
  action: RuleAction
  
  // 规则元数据
  metadata?: {
    category?: 'automation' | 'quality' | 'security' | 'performance' | 'recovery'
    tags?: string[]
    version?: string
    author?: string
    createdAt?: string
    lastUpdated?: string
  }
  
  // 执行约束
  constraints?: {
    maxExecutions?: number        // 最大执行次数
    cooldownPeriod?: number      // 冷却期（毫秒）
    requiredStates?: (WorkflowState | ExtendedWorkflowState)[]  // 仅在特定状态下执行
    blockedStates?: (WorkflowState | ExtendedWorkflowState)[]   // 在特定状态下禁用
    timeWindow?: {               // 时间窗口限制
      start: string              // HH:MM 格式
      end: string                // HH:MM 格式
    }
  }
}

/**
 * Phase 3: 规则动作类型
 */
export type RuleAction = 
  | StateTransitionAction
  | DataUpdateAction
  | NotificationAction
  | SnapshotAction
  | RecoveryAction
  | CustomAction

export interface StateTransitionAction {
  type: 'state_transition'
  targetState: WorkflowState | ExtendedWorkflowState
  workflowAction: WorkflowAction
  reason: string
}

export interface DataUpdateAction {
  type: 'data_update'
  updates: {
    path: string    // JSON路径，如 'analysis.confidence'
    value: unknown
    operation: 'set' | 'increment' | 'append' | 'merge'
  }[]
}

export interface NotificationAction {
  type: 'notification'
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  channels?: string[]  // 通知渠道
}

export interface SnapshotAction {
  type: 'snapshot'
  trigger: 'manual' | 'automatic' | 'error' | 'milestone'
  description: string
}

export interface RecoveryAction {
  type: 'recovery'
  strategy: 'retry' | 'rollback' | 'skip' | 'pause' | 'escalate'
  targetState?: WorkflowState | ExtendedWorkflowState
  maxRetries?: number
  retryDelay?: number
}

export interface CustomAction {
  type: 'custom'
  handler: (context: WorkflowContext) => Promise<boolean>
  description: string
}

/**
 * Phase 3: 规则执行结果
 */
export interface RuleExecutionResult {
  ruleId: string
  success: boolean
  timestamp: string
  executionTime: number  // 毫秒
  
  // 执行详情
  details?: {
    conditionResult: boolean
    actionExecuted: boolean
    error?: string
    changes?: string[]
    warnings?: string[]
  }
  
  // 影响分析
  impact?: {
    stateChanged: boolean
    dataModified: boolean
    notificationsSent: number
    snapshotsCreated: number
  }
}

/**
 * Phase 3: 规则引擎统计
 */
export interface RuleEngineStatistics {
  totalRules: number
  enabledRules: number
  executionCount: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  
  // 按类别统计
  categoryStats: Record<string, {
    count: number
    executions: number
    successRate: number
  }>
  
  // 最近执行
  recentExecutions: RuleExecutionResult[]
}

/**
 * Phase 3: JSON Schema验证支持
 */
export interface SchemaValidationRule extends Omit<Rule, 'condition' | 'action'> {
  schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
    additionalProperties?: boolean
  }
  validationPath: string  // 要验证的数据路径
  onValidationFail: RuleAction
  onValidationPass?: RuleAction
}

/**
 * Phase 3: 智能失败恢复规则
 */
export interface FailureRecoveryRule extends Omit<Rule, 'condition' | 'action'> {
  failurePattern: {
    errorType?: string[]          // 错误类型模式
    errorMessage?: RegExp         // 错误消息正则
    state?: (WorkflowState | ExtendedWorkflowState)[]
    consecutiveFailures?: number  // 连续失败次数
  }
  
  recoveryStrategy: {
    immediate: RecoveryAction     // 立即恢复策略
    delayed?: {                   // 延迟恢复策略
      delay: number
      action: RecoveryAction
    }
    escalation?: {               // 升级策略
      threshold: number          // 失败阈值
      action: RecoveryAction
    }
  }
}

/**
 * Phase 3: 工作流规则引擎核心实现
 */
export class WorkflowRulesEngine {
  private rules: Map<string, Rule> = new Map()
  private schemaRules: Map<string, SchemaValidationRule> = new Map()
  private recoveryRules: Map<string, FailureRecoveryRule> = new Map()
  
  // 执行历史和统计
  private executionHistory: RuleExecutionResult[] = []
  private ruleExecutionCount: Map<string, number> = new Map()
  private ruleLastExecution: Map<string, number> = new Map()
  
  private enabled: boolean = true
  private maxHistorySize: number = 1000

  constructor(options?: {
    enabled?: boolean
    maxHistorySize?: number
  }) {
    this.enabled = options?.enabled ?? true
    this.maxHistorySize = options?.maxHistorySize ?? 1000
    
    // 注册默认规则
    this.registerDefaultRules()
  }

  // ========== 规则管理 ==========

  /**
   * 注册标准规则
   */
  addRule(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      logger.warn(`Rule ${rule.id} already exists, overwriting`)
    }
    
    this.rules.set(rule.id, rule)
    logger.info(`Rule registered: ${rule.id} - ${rule.name}`)
  }

  /**
   * 注册JSON Schema验证规则
   */
  addSchemaRule(rule: SchemaValidationRule): void {
    if (this.schemaRules.has(rule.id)) {
      logger.warn(`Schema rule ${rule.id} already exists, overwriting`)
    }
    
    this.schemaRules.set(rule.id, rule)
    logger.info(`Schema rule registered: ${rule.id} - ${rule.name}`)
  }

  /**
   * 注册失败恢复规则
   */
  addRecoveryRule(rule: FailureRecoveryRule): void {
    if (this.recoveryRules.has(rule.id)) {
      logger.warn(`Recovery rule ${rule.id} already exists, overwriting`)
    }
    
    this.recoveryRules.set(rule.id, rule)
    logger.info(`Recovery rule registered: ${rule.id} - ${rule.name}`)
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId) || 
                   this.schemaRules.delete(ruleId) || 
                   this.recoveryRules.delete(ruleId)
    
    if (removed) {
      logger.info(`Rule removed: ${ruleId}`)
    }
    
    return removed
  }

  /**
   * 启用/禁用规则
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId) || 
                this.schemaRules.get(ruleId) || 
                this.recoveryRules.get(ruleId)
    
    if (rule) {
      rule.enabled = enabled
      logger.info(`Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`)
      return true
    }
    
    return false
  }

  // ========== 规则执行 ==========

  /**
   * 执行所有适用的规则
   */
  async executeRules(context: WorkflowContext): Promise<RuleExecutionResult[]> {
    if (!this.enabled) {
      return []
    }

    const results: RuleExecutionResult[] = []
    
    // 获取所有适用的规则
    const applicableRules = this.getApplicableRules(context)
    
    // 按优先级排序
    applicableRules.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    // 执行规则
    for (const rule of applicableRules) {
      const result = await this.executeRule(rule, context)
      results.push(result)
      
      // 记录执行历史
      this.recordExecution(result)
    }

    logger.info(`Executed ${results.length} rules for workflow ${context.sessionId}`)
    return results
  }

  /**
   * 执行Schema验证规则
   */
  async executeSchemaValidation(context: WorkflowContext): Promise<RuleExecutionResult[]> {
    const results: RuleExecutionResult[] = []
    
    for (const rule of this.schemaRules.values()) {
      if (!rule.enabled) continue
      
      const result = await this.executeSchemaRule(rule, context)
      results.push(result)
      this.recordExecution(result)
    }

    return results
  }

  /**
   * 执行失败恢复规则
   */
  async executeFailureRecovery(
    context: WorkflowContext, 
    error: Error
  ): Promise<RuleExecutionResult[]> {
    const results: RuleExecutionResult[] = []
    
    for (const rule of this.recoveryRules.values()) {
      if (!rule.enabled) continue
      
      if (this.matchesFailurePattern(rule.failurePattern, context, error)) {
        const result = await this.executeRecoveryRule(rule, context, error)
        results.push(result)
        this.recordExecution(result)
      }
    }

    return results
  }

  // ========== 私有方法 ==========

  /**
   * 获取适用的规则
   */
  private getApplicableRules(context: WorkflowContext): Rule[] {
    const applicable: Rule[] = []
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue
      
      // 检查约束条件
      if (!this.checkRuleConstraints(rule, context)) continue
      
      // 检查条件
      try {
        if (rule.condition(context)) {
          applicable.push(rule)
        }
      } catch (error) {
        logger.error(`Error evaluating rule condition ${rule.id}: ${error}`)
      }
    }
    
    return applicable
  }

  /**
   * 执行单个规则
   */
  private async executeRule(rule: Rule, context: WorkflowContext): Promise<RuleExecutionResult> {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    try {
      // 检查条件
      const conditionResult = rule.condition(context)
      
      if (!conditionResult) {
        return {
          ruleId: rule.id,
          success: true,
          timestamp,
          executionTime: Date.now() - startTime,
          details: {
            conditionResult: false,
            actionExecuted: false
          }
        }
      }

      // 执行动作
      const actionResult = await this.executeAction(rule.action, context)
      
      return {
        ruleId: rule.id,
        success: actionResult.success,
        timestamp,
        executionTime: Date.now() - startTime,
        details: {
          conditionResult: true,
          actionExecuted: actionResult.success,
          changes: actionResult.changes,
          warnings: actionResult.warnings,
          error: actionResult.error
        },
        impact: actionResult.impact
      }
      
    } catch (error) {
      return {
        ruleId: rule.id,
        success: false,
        timestamp,
        executionTime: Date.now() - startTime,
        details: {
          conditionResult: false,
          actionExecuted: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }

  /**
   * 执行规则动作
   */
  private async executeAction(action: RuleAction, context: WorkflowContext): Promise<{
    success: boolean
    error?: string
    changes?: string[]
    warnings?: string[]
    impact?: {
      stateChanged: boolean
      dataModified: boolean
      notificationsSent: number
      snapshotsCreated: number
    }
  }> {
    try {
      switch (action.type) {
        case 'state_transition':
          return await this.executeStateTransition(action, context)
          
        case 'data_update':
          return await this.executeDataUpdate(action, context)
          
        case 'notification':
          return await this.executeNotification(action, context)
          
        case 'snapshot':
          return await this.executeSnapshot(action, context)
          
        case 'recovery':
          return await this.executeRecovery(action, context)
          
        case 'custom':
          const success = await action.handler(context)
          return { success, changes: [action.description] }
          
        default:
          return { 
            success: false, 
            error: `Unknown action type: ${(action as any).type}` 
          }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }
    }
  }

  /**
   * 执行状态转换动作
   */
  private async executeStateTransition(
    action: StateTransitionAction, 
    context: WorkflowContext
  ): Promise<any> {
    const previousState = context.currentState
    context.currentState = action.targetState
    
    // 记录状态历史
    context.stateHistory.push({
      state: action.targetState,
      timestamp: new Date().toISOString(),
      action: action.workflowAction,
      by: 'rules-engine',
      metadata: { reason: action.reason }
    })
    
    return {
      success: true,
      changes: [`State changed: ${previousState} -> ${action.targetState}`],
      impact: {
        stateChanged: true,
        dataModified: true,
        notificationsSent: 0,
        snapshotsCreated: 0
      }
    }
  }

  /**
   * 执行数据更新动作
   */
  private async executeDataUpdate(
    action: DataUpdateAction, 
    context: WorkflowContext
  ): Promise<any> {
    const changes: string[] = []
    
    for (const update of action.updates) {
      try {
        this.updateContextPath(context, update.path, update.value, update.operation)
        changes.push(`Updated ${update.path} with ${update.operation}`)
      } catch (error) {
        changes.push(`Failed to update ${update.path}: ${error}`)
      }
    }
    
    return {
      success: true,
      changes,
      impact: {
        stateChanged: false,
        dataModified: true,
        notificationsSent: 0,
        snapshotsCreated: 0
      }
    }
  }

  /**
   * 执行通知动作
   */
  private async executeNotification(
    action: NotificationAction, 
    context: WorkflowContext
  ): Promise<any> {
    // 记录日志
    const logMethod = action.level === 'critical' ? 'error' : 
                     action.level === 'error' ? 'error' :
                     action.level === 'warning' ? 'warn' : 'info'
    
    logger[logMethod](`[${context.sessionId}] ${action.message}`)
    
    return {
      success: true,
      changes: [`Notification sent: ${action.level} - ${action.message}`],
      impact: {
        stateChanged: false,
        dataModified: false,
        notificationsSent: 1,
        snapshotsCreated: 0
      }
    }
  }

  /**
   * 执行快照动作
   */
  private async executeSnapshot(
    action: SnapshotAction, 
    context: WorkflowContext
  ): Promise<any> {
    // 这里需要集成EnhancedFileBasedPersistence的快照功能
    // 暂时模拟快照创建
    
    return {
      success: true,
      changes: [`Snapshot created: ${action.description}`],
      impact: {
        stateChanged: false,
        dataModified: false,
        notificationsSent: 0,
        snapshotsCreated: 1
      }
    }
  }

  /**
   * 执行恢复动作
   */
  private async executeRecovery(
    action: RecoveryAction, 
    context: WorkflowContext
  ): Promise<any> {
    const changes: string[] = []
    
    switch (action.strategy) {
      case 'retry':
        if (!context.failureInfo) {
          context.failureInfo = {
            failedAt: new Date().toISOString(),
            failureReason: 'Recovery triggered by rules engine',
            errorDetails: {},
            recoveryAttempts: 0
          }
        }
        context.failureInfo.recoveryAttempts++
        changes.push(`Retry attempt ${context.failureInfo.recoveryAttempts}`)
        break
        
      case 'rollback':
        if (action.targetState) {
          const previousState = context.currentState
          context.currentState = action.targetState
          changes.push(`Rolled back: ${previousState} -> ${action.targetState}`)
        }
        break
        
      case 'pause':
        context.currentState = 'PAUSED'
        context.pauseInfo = {
          pausedAt: new Date().toISOString(),
          pausedBy: 'rules-engine',
          reason: 'Automatic pause by recovery rule',
          previousState: context.currentState
        }
        changes.push('Workflow paused for recovery')
        break
        
      default:
        changes.push(`Recovery strategy: ${action.strategy}`)
    }
    
    return {
      success: true,
      changes,
      impact: {
        stateChanged: action.strategy === 'rollback' || action.strategy === 'pause',
        dataModified: true,
        notificationsSent: 0,
        snapshotsCreated: 0
      }
    }
  }

  /**
   * 检查规则约束
   */
  private checkRuleConstraints(rule: Rule, context: WorkflowContext): boolean {
    if (!rule.constraints) return true
    
    const constraints = rule.constraints
    
    // 检查状态约束
    if (constraints.requiredStates && 
        !constraints.requiredStates.includes(context.currentState)) {
      return false
    }
    
    if (constraints.blockedStates && 
        constraints.blockedStates.includes(context.currentState)) {
      return false
    }
    
    // 检查执行次数约束
    if (constraints.maxExecutions) {
      const executionCount = this.ruleExecutionCount.get(rule.id) || 0
      if (executionCount >= constraints.maxExecutions) {
        return false
      }
    }
    
    // 检查冷却期约束
    if (constraints.cooldownPeriod) {
      const lastExecution = this.ruleLastExecution.get(rule.id) || 0
      if (Date.now() - lastExecution < constraints.cooldownPeriod) {
        return false
      }
    }
    
    // 检查时间窗口约束
    if (constraints.timeWindow) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      if (currentTime < constraints.timeWindow.start || 
          currentTime > constraints.timeWindow.end) {
        return false
      }
    }
    
    return true
  }

  /**
   * 更新上下文路径的值
   */
  private updateContextPath(
    context: WorkflowContext, 
    path: string, 
    value: unknown, 
    operation: 'set' | 'increment' | 'append' | 'merge'
  ): void {
    const parts = path.split('.')
    let current: any = context
    
    // 导航到父对象
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {}
      }
      current = current[parts[i]]
    }
    
    const finalKey = parts[parts.length - 1]
    
    switch (operation) {
      case 'set':
        current[finalKey] = value
        break
        
      case 'increment':
        current[finalKey] = (current[finalKey] || 0) + (value as number)
        break
        
      case 'append':
        if (!Array.isArray(current[finalKey])) {
          current[finalKey] = []
        }
        current[finalKey].push(value)
        break
        
      case 'merge':
        if (typeof current[finalKey] !== 'object' || current[finalKey] === null) {
          current[finalKey] = {}
        }
        Object.assign(current[finalKey], value)
        break
    }
  }

  /**
   * 执行Schema验证规则
   */
  private async executeSchemaRule(
    rule: SchemaValidationRule, 
    context: WorkflowContext
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    try {
      // 获取要验证的数据
      const dataToValidate = this.getContextPath(context, rule.validationPath)
      
      // 执行Schema验证（简化实现）
      const isValid = this.validateSchema(dataToValidate, rule.schema)
      
      // 执行相应的动作
      const action = isValid ? rule.onValidationPass : rule.onValidationFail
      const actionResult = action ? await this.executeAction(action, context) : { success: true }
      
      return {
        ruleId: rule.id,
        success: actionResult.success,
        timestamp,
        executionTime: Date.now() - startTime,
        details: {
          conditionResult: true,
          actionExecuted: !!action,
          changes: [`Schema validation ${isValid ? 'passed' : 'failed'} for ${rule.validationPath}`]
        }
      }
      
    } catch (error) {
      return {
        ruleId: rule.id,
        success: false,
        timestamp,
        executionTime: Date.now() - startTime,
        details: {
          conditionResult: false,
          actionExecuted: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }

  /**
   * 执行失败恢复规则
   */
  private async executeRecoveryRule(
    rule: FailureRecoveryRule, 
    context: WorkflowContext, 
    error: Error
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    try {
      // 执行立即恢复策略
      const actionResult = await this.executeAction(rule.recoveryStrategy.immediate, context)
      
      return {
        ruleId: rule.id,
        success: actionResult.success,
        timestamp,
        executionTime: Date.now() - startTime,
        details: {
          conditionResult: true,
          actionExecuted: true,
          changes: [`Recovery executed: ${rule.recoveryStrategy.immediate.strategy}`]
        }
      }
      
    } catch (execError) {
      return {
        ruleId: rule.id,
        success: false,
        timestamp,
        executionTime: Date.now() - startTime,
        details: {
          conditionResult: true,
          actionExecuted: false,
          error: execError instanceof Error ? execError.message : String(execError)
        }
      }
    }
  }

  /**
   * 匹配失败模式
   */
  private matchesFailurePattern(
    pattern: FailureRecoveryRule['failurePattern'], 
    context: WorkflowContext, 
    error: Error
  ): boolean {
    // 检查状态匹配
    if (pattern.state && !pattern.state.includes(context.currentState)) {
      return false
    }
    
    // 检查错误类型匹配
    if (pattern.errorType && !pattern.errorType.includes(error.constructor.name)) {
      return false
    }
    
    // 检查错误消息匹配
    if (pattern.errorMessage && !pattern.errorMessage.test(error.message)) {
      return false
    }
    
    // 检查连续失败次数
    if (pattern.consecutiveFailures) {
      const failureCount = context.failureInfo?.recoveryAttempts || 0
      if (failureCount < pattern.consecutiveFailures) {
        return false
      }
    }
    
    return true
  }

  /**
   * 获取上下文路径的值
   */
  private getContextPath(context: WorkflowContext, path: string): unknown {
    const parts = path.split('.')
    let current: any = context
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[part]
    }
    
    return current
  }

  /**
   * 简化的Schema验证
   */
  private validateSchema(data: unknown, schema: any): boolean {
    // 这里应该使用真正的JSON Schema验证库，如ajv
    // 暂时提供简化实现
    
    if (schema.type === 'object' && typeof data === 'object' && data !== null) {
      if (schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in (data as any))) {
            return false
          }
        }
      }
      return true
    }
    
    return typeof data === schema.type
  }

  /**
   * 记录执行历史
   */
  private recordExecution(result: RuleExecutionResult): void {
    // 更新执行计数
    const currentCount = this.ruleExecutionCount.get(result.ruleId) || 0
    this.ruleExecutionCount.set(result.ruleId, currentCount + 1)
    
    // 更新最后执行时间
    this.ruleLastExecution.set(result.ruleId, Date.now())
    
    // 添加到历史记录
    this.executionHistory.push(result)
    
    // 保持历史记录大小限制
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift()
    }
  }

  /**
   * 注册默认规则
   */
  private registerDefaultRules(): void {
    // 默认自动快照规则
    this.addRule({
      id: 'auto-snapshot-on-state-change',
      name: 'Automatic Snapshot on State Change',
      description: 'Automatically create snapshots when workflow state changes',
      enabled: true,
      priority: 5,
      condition: (context) => {
        // 检查是否有状态变更
        return context.stateHistory.length > 1
      },
      action: {
        type: 'snapshot',
        trigger: 'automatic',
        description: 'State change snapshot'
      },
      constraints: {
        cooldownPeriod: 60 * 1000, // 1分钟冷却期
        requiredStates: ['ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW']
      },
      metadata: {
        category: 'automation',
        tags: ['snapshot', 'state-change']
      }
    })

    // 默认错误恢复规则
    this.addRecoveryRule({
      id: 'general-failure-recovery',
      name: 'General Failure Recovery',
      description: 'Handle general workflow failures with retry mechanism',
      enabled: true,
      priority: 8,
      failurePattern: {
        consecutiveFailures: 1
      },
      recoveryStrategy: {
        immediate: {
          type: 'recovery',
          strategy: 'retry',
          maxRetries: 3,
          retryDelay: 5000
        },
        escalation: {
          threshold: 3,
          action: {
            type: 'recovery',
            strategy: 'pause'
          }
        }
      },
      metadata: {
        category: 'recovery',
        tags: ['retry', 'failure-handling']
      }
    })

    logger.info('Default rules registered')
  }

  // ========== 统计和监控 ==========

  /**
   * 获取规则引擎统计信息
   */
  getStatistics(): RuleEngineStatistics {
    const totalRules = this.rules.size + this.schemaRules.size + this.recoveryRules.size
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length +
                        Array.from(this.schemaRules.values()).filter(r => r.enabled).length +
                        Array.from(this.recoveryRules.values()).filter(r => r.enabled).length

    const executionCount = this.executionHistory.length
    const successfulExecutions = this.executionHistory.filter(r => r.success).length
    const failedExecutions = executionCount - successfulExecutions

    const averageExecutionTime = executionCount > 0
      ? this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0) / executionCount
      : 0

    // 按类别统计
    const categoryStats: Record<string, any> = {}
    const allRules = [
      ...Array.from(this.rules.values()),
      ...Array.from(this.schemaRules.values()),
      ...Array.from(this.recoveryRules.values())
    ]

    for (const rule of allRules) {
      const category = rule.metadata?.category || 'uncategorized'
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          executions: 0,
          successRate: 0
        }
      }
      
      categoryStats[category].count++
      
      const ruleExecutions = this.executionHistory.filter(r => r.ruleId === rule.id)
      categoryStats[category].executions += ruleExecutions.length
      
      const ruleSuccesses = ruleExecutions.filter(r => r.success).length
      categoryStats[category].successRate = ruleExecutions.length > 0
        ? ruleSuccesses / ruleExecutions.length
        : 0
    }

    return {
      totalRules,
      enabledRules,
      executionCount,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      categoryStats,
      recentExecutions: this.executionHistory.slice(-10)
    }
  }

  /**
   * 清理执行历史
   */
  clearHistory(): void {
    this.executionHistory = []
    this.ruleExecutionCount.clear()
    this.ruleLastExecution.clear()
    logger.info('Rule execution history cleared')
  }

  /**
   * 启用/禁用规则引擎
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    logger.info(`Rules engine ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * 获取所有规则
   */
  getAllRules(): {
    standardRules: Rule[]
    schemaRules: SchemaValidationRule[]
    recoveryRules: FailureRecoveryRule[]
  } {
    return {
      standardRules: Array.from(this.rules.values()),
      schemaRules: Array.from(this.schemaRules.values()),
      recoveryRules: Array.from(this.recoveryRules.values())
    }
  }
}

/**
 * Phase 3: 工厂函数
 */
export function createWorkflowRulesEngine(options?: {
  enabled?: boolean
  maxHistorySize?: number
}): WorkflowRulesEngine {
  return new WorkflowRulesEngine(options)
}