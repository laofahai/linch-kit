/**
 * 透明工作流可视化器
 * 解决"黑盒运行"问题，提供实时可见的AI工作流状态展示
 * 
 * @version 1.0.0 - 透明度革命版本
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('transparent-visualizer')

export type WorkflowPhase = 
  | 'INIT' | 'ANALYZE' | 'PLAN' | 'IMPLEMENT' | 'TEST' | 'REVIEW' | 'COMPLETE'

export type ComponentStatus = 'connected' | 'disconnected' | 'degraded' | 'unknown'

export interface SystemComponent {
  name: string
  status: ComponentStatus
  details?: string
  fallbackAvailable?: boolean
}

export interface WorkflowState {
  currentPhase: WorkflowPhase
  progress: number // 0-100
  startTime: Date
  phases: Record<WorkflowPhase, {
    status: 'pending' | 'active' | 'completed' | 'failed'
    startTime?: Date
    endTime?: Date
    details?: string
  }>
}

export interface TransparentWorkflowStatus {
  sessionId: string
  taskDescription: string
  workflowState: WorkflowState
  systemComponents: SystemComponent[]
  aiDecisions: Array<{
    timestamp: Date
    decision: string
    reasoning: string
    confidence: number
    source: 'ai' | 'rules' | 'hybrid'
  }>
  executionLog: Array<{
    timestamp: Date
    phase: WorkflowPhase
    action: string
    result: 'success' | 'warning' | 'error'
    details: string
  }>
}

/**
 * 透明工作流可视化器
 */
export class TransparentWorkflowVisualizer {
  private status: TransparentWorkflowStatus

  constructor(sessionId: string, taskDescription: string) {
    this.status = {
      sessionId,
      taskDescription,
      workflowState: this.initializeWorkflowState(),
      systemComponents: this.initializeSystemComponents(),
      aiDecisions: [],
      executionLog: []
    }
  }

  /**
   * 初始化工作流状态
   */
  private initializeWorkflowState(): WorkflowState {
    const phases: WorkflowPhase[] = ['INIT', 'ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW', 'COMPLETE']
    
    return {
      currentPhase: 'INIT',
      progress: 0,
      startTime: new Date(),
      phases: phases.reduce((acc, phase) => {
        acc[phase] = { status: 'pending' }
        return acc
      }, {} as WorkflowState['phases'])
    }
  }

  /**
   * 初始化系统组件状态
   */
  private initializeSystemComponents(): SystemComponent[] {
    return [
      {
        name: 'Neo4j Graph RAG',
        status: 'unknown',
        details: '检查中...'
      },
      {
        name: 'Gemini AI Provider',
        status: 'unknown',
        details: '检查中...'
      },
      {
        name: 'AI Guardian',
        status: 'unknown',
        details: '检查中...'
      },
      {
        name: '规则引擎',
        status: 'connected',
        details: '本地规则引擎就绪',
        fallbackAvailable: true
      },
      {
        name: '七状态工作流引擎',
        status: 'connected',
        details: '工作流引擎已初始化'
      }
    ]
  }

  /**
   * 更新系统组件状态
   */
  updateComponentStatus(componentName: string, status: ComponentStatus, details?: string, fallbackAvailable?: boolean): void {
    const component = this.status.systemComponents.find(c => c.name === componentName)
    if (component) {
      component.status = status
      if (details) component.details = details
      if (fallbackAvailable !== undefined) component.fallbackAvailable = fallbackAvailable
      
      this.logExecution(this.status.workflowState.currentPhase, `组件状态更新: ${componentName}`, 
        status === 'connected' ? 'success' : status === 'degraded' ? 'warning' : 'error', 
        details || `状态: ${status}`)
    }
  }

  /**
   * 转换到下一个工作流阶段
   */
  transitionToPhase(phase: WorkflowPhase, details?: string): void {
    // 完成当前阶段
    const currentPhase = this.status.workflowState.currentPhase
    this.status.workflowState.phases[currentPhase].status = 'completed'
    this.status.workflowState.phases[currentPhase].endTime = new Date()

    // 开始新阶段
    this.status.workflowState.currentPhase = phase
    this.status.workflowState.phases[phase].status = 'active'
    this.status.workflowState.phases[phase].startTime = new Date()
    if (details) this.status.workflowState.phases[phase].details = details

    // 更新进度
    const phaseOrder: WorkflowPhase[] = ['INIT', 'ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW', 'COMPLETE']
    const currentIndex = phaseOrder.indexOf(phase)
    this.status.workflowState.progress = (currentIndex / (phaseOrder.length - 1)) * 100

    this.logExecution(phase, '阶段转换', 'success', details || `进入${phase}阶段`)
  }

  /**
   * 记录AI决策
   */
  logAIDecision(decision: string, reasoning: string, confidence: number, source: 'ai' | 'rules' | 'hybrid'): void {
    this.status.aiDecisions.push({
      timestamp: new Date(),
      decision,
      reasoning,
      confidence,
      source
    })

    this.logExecution(this.status.workflowState.currentPhase, 'AI决策', 'success', 
      `${decision} (置信度: ${confidence}%, 来源: ${source})`)
  }

  /**
   * 记录执行日志
   */
  logExecution(phase: WorkflowPhase, action: string, result: 'success' | 'warning' | 'error', details: string): void {
    this.status.executionLog.push({
      timestamp: new Date(),
      phase,
      action,
      result,
      details
    })
  }

  /**
   * 渲染实时状态可视化
   */
  renderStatus(): string {
    const lines: string[] = []

    // 标题
    lines.push('┌─────────────────────────────────────────────────────────────────────────────┐')
    lines.push('│                    🔍 LinchKit 透明AI工作流 - 实时状态                     │')
    lines.push('├─────────────────────────────────────────────────────────────────────────────┤')
    lines.push(`│ 会话ID: ${this.status.sessionId}`)
    lines.push(`│ 任务: ${this.status.taskDescription.slice(0, 60)}${this.status.taskDescription.length > 60 ? '...' : ''}`)
    lines.push('└─────────────────────────────────────────────────────────────────────────────┘')
    lines.push('')

    // 工作流进度可视化
    lines.push('🚀 七状态工作流进度:')
    lines.push(this.renderPhaseProgress())
    lines.push('')

    // 系统组件状态
    lines.push('🔧 系统组件状态:')
    this.status.systemComponents.forEach(component => {
      const statusIcon = this.getStatusIcon(component.status)
      const fallbackInfo = component.fallbackAvailable ? ' (支持降级)' : ''
      lines.push(`  ${statusIcon} ${component.name}: ${component.details}${fallbackInfo}`)
    })
    lines.push('')

    // 最近AI决策
    if (this.status.aiDecisions.length > 0) {
      lines.push('🧠 最近AI决策:')
      const recentDecisions = this.status.aiDecisions.slice(-3)
      recentDecisions.forEach(decision => {
        const time = decision.timestamp.toLocaleTimeString()
        const sourceIcon = this.getSourceIcon(decision.source)
        lines.push(`  ${sourceIcon} [${time}] ${decision.decision}`)
        lines.push(`     理由: ${decision.reasoning}`)
        lines.push(`     置信度: ${decision.confidence}%`)
      })
      lines.push('')
    }

    // 执行摘要
    const errorCount = this.status.executionLog.filter(log => log.result === 'error').length
    const warningCount = this.status.executionLog.filter(log => log.result === 'warning').length
    const successCount = this.status.executionLog.filter(log => log.result === 'success').length

    lines.push('📊 执行摘要:')
    lines.push(`  ✅ 成功: ${successCount}  ⚠️  警告: ${warningCount}  ❌ 错误: ${errorCount}`)
    lines.push(`  ⏱️  运行时间: ${this.getElapsedTime()}`)
    lines.push('')

    return lines.join('\n')
  }

  /**
   * 渲染阶段进度条
   */
  private renderPhaseProgress(): string {
    const phases: WorkflowPhase[] = ['INIT', 'ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW', 'COMPLETE']
    const progressBar: string[] = []

    phases.forEach((phase, index) => {
      const phaseState = this.status.workflowState.phases[phase]
      let icon: string

      switch (phaseState.status) {
        case 'completed':
          icon = '✅'
          break
        case 'active':
          icon = '🔄'
          break
        case 'failed':
          icon = '❌'
          break
        default:
          icon = '⏳'
      }

      progressBar.push(`[${phase}] ${icon}`)
      if (index < phases.length - 1) {
        progressBar.push(' → ')
      }
    })

    const progressPercent = Math.round(this.status.workflowState.progress)
    const progressLine = `进度: ${progressPercent}% [${'█'.repeat(Math.floor(progressPercent / 5))}${'░'.repeat(20 - Math.floor(progressPercent / 5))}]`

    return progressBar.join('') + '\n' + progressLine
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: ComponentStatus): string {
    switch (status) {
      case 'connected': return '✅'
      case 'disconnected': return '❌'
      case 'degraded': return '⚠️'
      default: return '❓'
    }
  }

  /**
   * 获取来源图标
   */
  private getSourceIcon(source: 'ai' | 'rules' | 'hybrid'): string {
    switch (source) {
      case 'ai': return '🤖'
      case 'rules': return '📋'
      case 'hybrid': return '🔀'
    }
  }

  /**
   * 获取运行时间
   */
  private getElapsedTime(): string {
    const elapsed = Date.now() - this.status.workflowState.startTime.getTime()
    const seconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  /**
   * 获取当前状态快照
   */
  getStatusSnapshot(): TransparentWorkflowStatus {
    return JSON.parse(JSON.stringify(this.status))
  }

  /**
   * 渲染简化状态（用于/start命令输出）
   */
  renderCompactStatus(): string {
    const currentPhase = this.status.workflowState.currentPhase
    const progress = Math.round(this.status.workflowState.progress)
    const componentStatuses = this.status.systemComponents.map(c => `${c.name}: ${this.getStatusIcon(c.status)}`).join(' | ')
    
    return [
      `🔄 当前阶段: ${currentPhase} (${progress}%)`,
      `🔧 组件状态: ${componentStatuses}`,
      `📊 执行状态: ${this.status.executionLog.length} 个操作完成`
    ].join('\n')
  }
}