/**
 * LinchKit AI Platform - 统一导出
 * 重构后的清晰模块结构
 * @version v2.0.3
 */

// 核心基础设施
export * from './core/graph/index.js'
export * from './core/config/neo4j-config.js'
export * from './core/types/index.js'

// AI Provider管理
export * from './providers/hybrid-ai-manager.js'
export * from './providers/cli-based-provider.js'
export * from './providers/types.js'

// 数据提取器
export * from './extractors/index.js'

// 智能查询引擎
export * from './query/intelligent-query-engine.js'

// 上下文管理
export * from './context/index.js'

// Guardian智能体集群
export * from './guardian/index.js'

// Phase 1: AI工作流引擎 - Claude Code集成
export * from './workflow/index.js'

// Prompt模板引擎
export * from './prompt/template-engine.js'

// 用户反馈收集
export * from './feedback/user-feedback-collector.js'

// 实现引擎
export * from './implementation/index.js'

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