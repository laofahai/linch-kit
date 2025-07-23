#!/usr/bin/env bun

/**
 * Hooks 与 Workflow 双向元数据桥接系统
 * 
 * 实现 Claude Code Hooks 与 AI Workflow State Machine 之间的无缝数据交换
 * 让 Hooks 能够感知 Workflow 状态，Workflow 能够响应 Hooks 建议
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('metadata-bridge')
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

// Hook 执行结果
interface HookResult {
  success: boolean
  shouldBlock: boolean
  suggestions: string[]
  constraints: string[]
  reusableComponents: string[]
  qualityIssues: string[]
  metadata: Record<string, any>
  timestamp: number
}

// Workflow 上下文
interface WorkflowContext {
  state: string
  taskType?: string
  priority?: string
  sessionId?: string
  taskDescription?: string
  estimatedHours?: number
  category?: string
  tags?: string[]
  metadata?: Record<string, any>
}

// 元数据存储结构
interface MetadataStore {
  hooks: {
    lastExecution: number
    results: HookResult[]
    accumulated: {
      suggestions: string[]
      constraints: string[]
      components: string[]
      issues: string[]
    }
  }
  workflow: {
    current: WorkflowContext | null
    history: WorkflowContext[]
    transitions: Array<{
      from: string
      to: string
      timestamp: number
      trigger: string
    }>
  }
  bridge: {
    lastSync: number
    version: string
    status: 'active' | 'inactive' | 'error'
  }
}

/**
 * Hooks 与 Workflow 元数据桥接器
 */
export class HookWorkflowBridge {
  private metadataPath: string
  private store: MetadataStore

  constructor() {
    this.metadataPath = join('.linchkit', 'hooks-workflow-bridge.json')
    this.ensureDirectories()
    this.store = this.loadMetadata()
  }

  /**
   * 确保必要的目录存在
   */
  private ensureDirectories() {
    const dir = join('.linchkit')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  /**
   * 加载元数据存储
   */
  private loadMetadata(): MetadataStore {
    if (existsSync(this.metadataPath)) {
      try {
        return JSON.parse(readFileSync(this.metadataPath, 'utf8'))
      } catch (error) {
        logger.warn(`元数据文件损坏，重新初始化: ${error.message}`)
      }
    }

    return this.createEmptyStore()
  }

  /**
   * 创建空的元数据存储
   */
  private createEmptyStore(): MetadataStore {
    return {
      hooks: {
        lastExecution: 0,
        results: [],
        accumulated: {
          suggestions: [],
          constraints: [],
          components: [],
          issues: []
        }
      },
      workflow: {
        current: null,
        history: [],
        transitions: []
      },
      bridge: {
        lastSync: Date.now(),
        version: '1.0.0',
        status: 'active'
      }
    }
  }

  /**
   * 保存元数据存储
   */
  private saveMetadata() {
    try {
      writeFileSync(this.metadataPath, JSON.stringify(this.store, null, 2))
      this.store.bridge.lastSync = Date.now()
    } catch (error) {
      logger.error(`保存元数据失败: ${error.message}`)
    }
  }

  /**
   * Hook → Workflow: 注入 Hook 执行结果到 Workflow
   */
  async injectHookResult(hookResult: HookResult): Promise<void> {
    try {
      logger.info('🔄 注入 Hook 结果到 Workflow')

      // 记录 Hook 结果
      this.store.hooks.results.push(hookResult)
      this.store.hooks.lastExecution = hookResult.timestamp

      // 累积建议和约束
      this.store.hooks.accumulated.suggestions.push(...hookResult.suggestions)
      this.store.hooks.accumulated.constraints.push(...hookResult.constraints)
      this.store.hooks.accumulated.components.push(...hookResult.reusableComponents)
      this.store.hooks.accumulated.issues.push(...hookResult.qualityIssues)

      // 去重累积数据
      this.deduplicateAccumulated()

      // 尝试更新 Workflow 元数据
      await this.updateWorkflowMetadata(hookResult)

      // 保存状态
      this.saveMetadata()

      logger.info(`✅ Hook 结果已注入，累积建议数: ${this.store.hooks.accumulated.suggestions.length}`)
    } catch (error) {
      logger.error(`❌ 注入 Hook 结果失败: ${error.message}`)
      this.store.bridge.status = 'error'
    }
  }

  /**
   * Workflow → Hook: 获取 Workflow 上下文供 Hook 使用
   */
  async getWorkflowContext(): Promise<WorkflowContext | null> {
    try {
      // 尝试从 Workflow 状态文件读取最新状态
      const workflowContext = await this.loadCurrentWorkflowState()
      
      if (workflowContext) {
        // 更新存储中的当前状态
        this.store.workflow.current = workflowContext
        this.saveMetadata()
        
        logger.info(`📥 获取 Workflow 上下文: ${workflowContext.state}`)
        return workflowContext
      }

      // 如果没有活跃的 Workflow，返回存储中的上一个状态
      return this.store.workflow.current
    } catch (error) {
      logger.warn(`获取 Workflow 上下文失败: ${error.message}`)
      return null
    }
  }

  /**
   * 从 Workflow 状态文件加载当前状态
   */
  private async loadCurrentWorkflowState(): Promise<WorkflowContext | null> {
    try {
      const workflowStateDir = '.linchkit/workflow-states'
      
      if (!existsSync(workflowStateDir)) {
        return null
      }

      // 读取活跃 Workflow 索引
      const indexPath = join(workflowStateDir, 'index.json')
      if (!existsSync(indexPath)) {
        return null
      }

      const index = JSON.parse(readFileSync(indexPath, 'utf8'))
      const activeWorkflows = index.workflows?.filter((w: any) => 
        w.status === 'active' || w.status === 'running'
      ) || []

      if (activeWorkflows.length === 0) {
        return null
      }

      // 获取最新的活跃 Workflow
      const latestWorkflow = activeWorkflows[0]
      const statePath = join(workflowStateDir, `${latestWorkflow.id}.json`)
      
      if (existsSync(statePath)) {
        const workflowState = JSON.parse(readFileSync(statePath, 'utf8'))
        
        return {
          state: workflowState.currentState,
          taskType: workflowState.metadata?.taskType,
          priority: workflowState.metadata?.priority,
          sessionId: workflowState.sessionId,
          taskDescription: workflowState.metadata?.taskDescription,
          estimatedHours: workflowState.metadata?.estimatedHours,
          category: workflowState.metadata?.category,
          tags: workflowState.metadata?.tags,
          metadata: workflowState.metadata
        }
      }

      return null
    } catch (error) {
      logger.warn(`加载 Workflow 状态失败: ${error.message}`)
      return null
    }
  }

  /**
   * 更新 Workflow 元数据（如果可能）
   */
  private async updateWorkflowMetadata(hookResult: HookResult): Promise<void> {
    try {
      const workflowStateDir = '.linchkit/workflow-states'
      
      if (!existsSync(workflowStateDir)) {
        return
      }

      const indexPath = join(workflowStateDir, 'index.json')
      if (!existsSync(indexPath)) {
        return
      }

      const index = JSON.parse(readFileSync(indexPath, 'utf8'))
      const activeWorkflows = index.workflows?.filter((w: any) => 
        w.status === 'active' || w.status === 'running'
      ) || []

      if (activeWorkflows.length === 0) {
        return
      }

      // 更新最新的活跃 Workflow
      const latestWorkflow = activeWorkflows[0]
      const statePath = join(workflowStateDir, `${latestWorkflow.id}.json`)
      
      if (existsSync(statePath)) {
        const workflowState = JSON.parse(readFileSync(statePath, 'utf8'))
        
        // 在元数据中添加 Hook 建议
        if (!workflowState.metadata) {
          workflowState.metadata = {}
        }
        
        if (!workflowState.metadata.hookSuggestions) {
          workflowState.metadata.hookSuggestions = []
        }
        
        if (!workflowState.metadata.hookConstraints) {
          workflowState.metadata.hookConstraints = []
        }

        // 添加新的建议和约束
        workflowState.metadata.hookSuggestions.push(...hookResult.suggestions)
        workflowState.metadata.hookConstraints.push(...hookResult.constraints)
        
        // 添加可复用组件信息
        if (hookResult.reusableComponents.length > 0) {
          if (!workflowState.metadata.reusableComponents) {
            workflowState.metadata.reusableComponents = []
          }
          workflowState.metadata.reusableComponents.push(...hookResult.reusableComponents)
        }

        // 记录 Hook 执行历史
        if (!workflowState.metadata.hookHistory) {
          workflowState.metadata.hookHistory = []
        }
        
        workflowState.metadata.hookHistory.push({
          timestamp: hookResult.timestamp,
          success: hookResult.success,
          suggestionsCount: hookResult.suggestions.length,
          constraintsCount: hookResult.constraints.length
        })

        // 保存更新的状态
        writeFileSync(statePath, JSON.stringify(workflowState, null, 2))
        
        logger.info('📝 Workflow 元数据已更新')
      }
    } catch (error) {
      logger.warn(`更新 Workflow 元数据失败: ${error.message}`)
    }
  }

  /**
   * 去重累积数据
   */
  private deduplicateAccumulated() {
    this.store.hooks.accumulated.suggestions = [...new Set(this.store.hooks.accumulated.suggestions)]
    this.store.hooks.accumulated.constraints = [...new Set(this.store.hooks.accumulated.constraints)]
    this.store.hooks.accumulated.components = [...new Set(this.store.hooks.accumulated.components)]
    this.store.hooks.accumulated.issues = [...new Set(this.store.hooks.accumulated.issues)]
  }

  /**
   * 获取累积的 Hook 建议
   */
  getAccumulatedSuggestions(): string[] {
    return [...this.store.hooks.accumulated.suggestions]
  }

  /**
   * 获取累积的约束信息
   */
  getAccumulatedConstraints(): string[] {
    return [...this.store.hooks.accumulated.constraints]
  }

  /**
   * 获取发现的可复用组件
   */
  getReusableComponents(): string[] {
    return [...this.store.hooks.accumulated.components]
  }

  /**
   * 获取质量问题列表
   */
  getQualityIssues(): string[] {
    return [...this.store.hooks.accumulated.issues]
  }

  /**
   * 清理过期的 Hook 结果（保留最近 50 条）
   */
  cleanupOldResults() {
    const maxResults = 50
    if (this.store.hooks.results.length > maxResults) {
      this.store.hooks.results = this.store.hooks.results.slice(-maxResults)
      this.saveMetadata()
      logger.info(`🧹 已清理过期的 Hook 结果，保留最近 ${maxResults} 条`)
    }
  }

  /**
   * 获取桥接状态信息
   */
  getBridgeStatus() {
    return {
      status: this.store.bridge.status,
      lastSync: new Date(this.store.bridge.lastSync).toISOString(),
      version: this.store.bridge.version,
      hookResultsCount: this.store.hooks.results.length,
      currentWorkflow: this.store.workflow.current?.state || 'none',
      accumulatedSuggestions: this.store.hooks.accumulated.suggestions.length,
      accumulatedConstraints: this.store.hooks.accumulated.constraints.length
    }
  }

  /**
   * 重置桥接状态
   */
  resetBridge() {
    this.store = this.createEmptyStore()
    this.saveMetadata()
    logger.info('🔄 桥接状态已重置')
  }
}

// CLI 入口用于测试和管理
if (import.meta.main) {
  const bridge = new HookWorkflowBridge()
  const command = process.argv[2]

  switch (command) {
    case 'status':
      console.log('🌉 Hooks-Workflow 桥接状态:')
      console.log(JSON.stringify(bridge.getBridgeStatus(), null, 2))
      break

    case 'context':
      bridge.getWorkflowContext().then(context => {
        console.log('📋 当前 Workflow 上下文:')
        console.log(JSON.stringify(context, null, 2))
      })
      break

    case 'suggestions':
      console.log('💡 累积建议:')
      bridge.getAccumulatedSuggestions().forEach(s => console.log(`  • ${s}`))
      break

    case 'constraints':
      console.log('🛡️ 累积约束:')
      bridge.getAccumulatedConstraints().forEach(c => console.log(`  • ${c}`))
      break

    case 'components':
      console.log('📦 可复用组件:')
      bridge.getReusableComponents().forEach(c => console.log(`  • ${c}`))
      break

    case 'cleanup':
      bridge.cleanupOldResults()
      console.log('✅ 清理完成')
      break

    case 'reset':
      bridge.resetBridge()
      console.log('✅ 桥接状态已重置')
      break

    default:
      console.log('🌉 HookWorkflowBridge CLI')
      console.log('用法:')
      console.log('  bun metadata-bridge.ts status      - 查看桥接状态')
      console.log('  bun metadata-bridge.ts context     - 查看 Workflow 上下文')
      console.log('  bun metadata-bridge.ts suggestions - 查看累积建议')
      console.log('  bun metadata-bridge.ts constraints - 查看累积约束')
      console.log('  bun metadata-bridge.ts components  - 查看可复用组件')
      console.log('  bun metadata-bridge.ts cleanup     - 清理过期结果')
      console.log('  bun metadata-bridge.ts reset       - 重置桥接状态')
  }
}