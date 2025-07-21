/**
 * 工作流相关类型定义
 */

export interface WorkflowContext {
  sessionId: string
  taskDescription: string
  currentState: string
  metadata: {
    version: string
    startTime: string
    lastUpdated: string
    totalDuration?: number
    automationLevel: 'manual' | 'semi_auto' | 'full_auto'
    priority: 'low' | 'medium' | 'high' | 'critical'
    category?: string
    tags?: string[]
    assignee?: string
    reviewer?: string
    estimatedCompletion?: string
    actualCompletion?: string
    graphRagSynced?: boolean
    graphRagSyncTime?: string
    graphRagSyncError?: string
    graphRagSyncAttempted?: boolean
    graphRagSyncSource?: string
  }
  stateHistory: Array<{
    state: string
    timestamp: string
    action: string
    by: string
    metadata?: Record<string, unknown>
    duration?: number
    automaticTransition?: boolean
    rollbackTarget?: string
  }>
}

export interface StartCommandOptions {
  taskDescription: string
  sessionId?: string
  automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  skipGuardian?: boolean
  skipGraphRAG?: boolean
  enableWorkflowState?: boolean
  useSevenStateEngine?: boolean
  enableSnapshots?: boolean
  enableRulesEngine?: boolean
  enableVectorStore?: boolean
  enableAutoTransition?: boolean
  category?: string
  tags?: string[]
  estimatedHours?: number
}