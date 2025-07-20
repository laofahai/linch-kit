/**
 * LinchKit AI工作流模块统一导出
 * Phase 1: 核心工作流引擎集成
 * 
 * @version 1.0.0 - AI工作流引擎Phase 1完整实现
 */

// 核心工作流组件
export {
  AIWorkflowManager,
  WorkflowContext,
  WorkflowDecision,
  GraphRAGQueryResult,
  AIWorkflowResult,
  createAIWorkflowManager
} from './ai-workflow-manager'

export {
  WorkflowStateMachine,
  WorkflowState,
  WorkflowAction,
  WorkflowStateTransition,
  WorkflowContext as WorkflowStateMachineContext,
  WorkflowStatePersistence,
  FileBasedPersistence,
  createWorkflowStateMachine
} from './workflow-state-machine'

// Claude Code集成
export {
  ClaudeCodeScheduler,
  TrustedEnvironmentContext,
  createClaudeCodeScheduler,
  createClaudeCodeIntegration
} from './claude-code-scheduler'

export {
  ClaudeCodeAPI,
  SimpleWorkflowRequest,
  SimpleWorkflowResponse,
  APIStatus,
  claudeCodeAPI,
  processWorkflow,
  quickAnalyze,
  getAPIStatus,
  estimateComplexity,
  checkExistingImplementations,
  getProjectConstraints
} from './claude-code-api'

// 类型定义
export type {
  WorkflowContext,
  WorkflowDecision,
  GraphRAGQueryResult,
  AIWorkflowResult
} from './ai-workflow-manager'

export type {
  WorkflowState,
  WorkflowAction,
  WorkflowStateTransition
} from './workflow-state-machine'

export type {
  TrustedEnvironmentContext
} from './claude-code-scheduler'

export type {
  SimpleWorkflowRequest,
  SimpleWorkflowResponse,
  APIStatus
} from './claude-code-api'

/**
 * 快速初始化函数 - Claude Code一键集成
 */
export async function initializeClaudeCodeIntegration(options?: {
  geminiApiKey?: string
  enableGraphRAG?: boolean
  automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
}) {
  const { createClaudeCodeIntegration } = await import('./claude-code-scheduler')
  
  const scheduler = await createClaudeCodeIntegration(options?.geminiApiKey)
  
  return {
    scheduler,
    api: (await import('./claude-code-api')).claudeCodeAPI,
    // 便捷方法
    async processTask(taskDescription: string, sessionId?: string) {
      const { processWorkflow } = await import('./claude-code-api')
      return processWorkflow({
        taskDescription,
        sessionId,
        options: {
          enableGraphRAG: options?.enableGraphRAG !== false,
          automationLevel: options?.automationLevel || 'semi_auto'
        }
      })
    },
    async quickAnalyze(taskDescription: string) {
      const { quickAnalyze } = await import('./claude-code-api')
      return quickAnalyze(taskDescription)
    },
    async getStatus() {
      const { getAPIStatus } = await import('./claude-code-api')
      return getAPIStatus()
    }
  }
}

/**
 * 默认导出 - Claude Code API实例
 */
export default claudeCodeAPI