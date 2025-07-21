/**
 * LinchKit AI Platform - 统一导出
 * 重构后的清晰模块结构
 * @version v2.0.3
 */

// 核心基础设施
export * from './types/index.js'
export * from './core/index.js'

// AI Provider管理
export * from './providers/index.js'

// 数据提取器
export * from './extractors/index.js'

// 智能查询引擎  
export * from './query/index.js'

// 上下文管理
export * from './context/index.js'

// Guardian智能体集群
export * from './guardian/index.js'

// 工作流引擎
export * from './workflow/index.js'

// 实现引擎
export * from './implementation/index'

/**
 * 快速开始函数
 */
export async function createAIPlatform() {
  const { ContextManager } = await import('./context/context-manager.js')
  const { HybridAIManager } = await import('./providers/hybrid-ai-manager.js')
  
  return {
    context: new ContextManager(),
    ai: new HybridAIManager()
  }
}

/**
 * Claude Code集成快速启动
 */
export async function createClaudeCodePlatform(options?: {
  geminiApiKey?: string
  enableGraphRAG?: boolean
  automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
}) {
  const { initializeClaudeCodeIntegration } = await import('./workflow/index.js')
  return initializeClaudeCodeIntegration(options)
}