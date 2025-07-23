#!/usr/bin/env bun

/**
 * 状态感知的 Claude Code Hook 系统
 * 
 * 此脚本根据 AI Workflow 状态动态调整 Hook 行为
 * 实现真正的智能化开发体验
 */

import { createLogger } from '@linch-kit/core'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'

const logger = createLogger('state-aware-hook')

// Workflow 状态枚举
enum WorkflowState {
  INIT = 'INIT',
  ANALYZE = 'ANALYZE', 
  PLAN = 'PLAN',
  IMPLEMENT = 'IMPLEMENT',
  TEST = 'TEST',
  REVIEW = 'REVIEW',
  COMPLETE = 'COMPLETE',
  PAUSED = 'PAUSED',
  FAILED = 'FAILED'
}

// Hook 执行上下文
interface HookContext {
  toolName: string
  filePath?: string
  operation: string
  workflowState?: WorkflowState
  sessionId?: string
  taskType?: string
}

// Hook 策略接口
interface HookStrategy {
  name: string
  execute(context: HookContext): Promise<HookResult>
}

// Hook 结果
interface HookResult {
  success: boolean
  shouldBlock: boolean
  suggestions: string[]
  constraints: string[]
  metadata: Record<string, any>
  exitCode: number
}

/**
 * 状态感知 Hook 执行器
 */
export class StateAwareHook {
  private strategies: Map<WorkflowState, HookStrategy> = new Map()
  
  constructor() {
    this.initializeStrategies()
  }

  /**
   * 初始化各状态的执行策略
   */
  private initializeStrategies() {
    this.strategies.set(WorkflowState.INIT, new InitStrategy())
    this.strategies.set(WorkflowState.ANALYZE, new AnalyzeStrategy())
    this.strategies.set(WorkflowState.PLAN, new PlanStrategy())
    this.strategies.set(WorkflowState.IMPLEMENT, new ImplementStrategy())
    this.strategies.set(WorkflowState.TEST, new TestStrategy())
    this.strategies.set(WorkflowState.REVIEW, new ReviewStrategy())
    this.strategies.set(WorkflowState.COMPLETE, new CompleteStrategy())
  }

  /**
   * 获取当前 Workflow 状态
   */
  private async getCurrentWorkflowState(): Promise<WorkflowState> {
    try {
      // 查找当前活跃的 Workflow 状态文件
      const workflowStateDir = '.linchkit/workflow-states'
      
      if (!existsSync(workflowStateDir)) {
        return WorkflowState.INIT
      }

      // 读取最新的状态文件
      const indexPath = join(workflowStateDir, 'index.json')
      if (!existsSync(indexPath)) {
        return WorkflowState.INIT
      }

      const index = JSON.parse(readFileSync(indexPath, 'utf8'))
      const activeWorkflows = index.workflows?.filter((w: any) => 
        w.status === 'active' || w.status === 'running'
      ) || []

      if (activeWorkflows.length === 0) {
        return WorkflowState.INIT
      }

      // 获取最新的活跃 Workflow
      const latestWorkflow = activeWorkflows[0]
      const statePath = join(workflowStateDir, `${latestWorkflow.id}.json`)
      
      if (existsSync(statePath)) {
        const state = JSON.parse(readFileSync(statePath, 'utf8'))
        return state.currentState as WorkflowState || WorkflowState.INIT
      }

      return WorkflowState.INIT
    } catch (error) {
      logger.warn(`获取 Workflow 状态失败: ${error.message}`)
      return WorkflowState.INIT
    }
  }

  /**
   * 执行状态感知的 Hook
   */
  async execute(context: HookContext): Promise<HookResult> {
    try {
      // 获取当前 Workflow 状态
      const workflowState = await this.getCurrentWorkflowState()
      context.workflowState = workflowState

      logger.info(`🪝 状态感知 Hook 执行 - 状态: ${workflowState}, 文件: ${context.filePath}`)

      // 获取对应的策略
      const strategy = this.strategies.get(workflowState) || new DefaultStrategy()
      
      // 执行策略
      const result = await strategy.execute(context)
      
      // 记录执行结果
      logger.info(`✅ Hook 执行完成 - 阻塞: ${result.shouldBlock}, 建议数: ${result.suggestions.length}`)
      
      return result
    } catch (error) {
      logger.error(`❌ Hook 执行失败: ${error.message}`)
      return {
        success: false,
        shouldBlock: false,
        suggestions: [],
        constraints: [`Hook 执行错误: ${error.message}`],
        metadata: { error: error.message },
        exitCode: 1
      }
    }
  }
}

/**
 * 默认策略 - 基础约束检查
 */
class DefaultStrategy implements HookStrategy {
  name = 'default'

  async execute(context: HookContext): Promise<HookResult> {
    return {
      success: true,
      shouldBlock: false,
      suggestions: ['遵循项目代码规范'],
      constraints: ['确保代码质量'],
      metadata: { strategy: this.name },
      exitCode: 0
    }
  }
}

/**
 * 初始化阶段策略
 */
class InitStrategy implements HookStrategy {
  name = 'init'

  async execute(context: HookContext): Promise<HookResult> {
    return {
      success: true,
      shouldBlock: false,
      suggestions: [
        '项目初始化阶段',
        '建议先运行 /start 命令定义任务',
        '确保工作在正确的分支上'
      ],
      constraints: [
        '避免在 main 分支直接开发',
        '确保依赖已正确安装'
      ],
      metadata: { 
        strategy: this.name,
        phase: 'initialization'
      },
      exitCode: 0
    }
  }
}

/**
 * 分析阶段策略
 */
class AnalyzeStrategy implements HookStrategy {
  name = 'analyze'

  async execute(context: HookContext): Promise<HookResult> {
    const suggestions = [
      '当前处于分析阶段',
      '建议先完成需求分析再开始编码'
    ]

    // 如果是代码文件，给出分析期的特殊建议
    if (context.filePath?.endsWith('.ts') || context.filePath?.endsWith('.tsx')) {
      suggestions.push('建议先分析现有代码结构')
      suggestions.push('查找可复用的组件和模式')
    }

    return {
      success: true,
      shouldBlock: false,
      suggestions,
      constraints: [
        '分析阶段避免大量代码修改',
        '专注于理解和设计'
      ],
      metadata: { 
        strategy: this.name,
        phase: 'analysis'
      },
      exitCode: 0
    }
  }
}

/**
 * 规划阶段策略  
 */
class PlanStrategy implements HookStrategy {
  name = 'plan'

  async execute(context: HookContext): Promise<HookResult> {
    return {
      success: true,
      shouldBlock: false,
      suggestions: [
        '当前处于规划阶段',
        '建议完善实现计划后再开始编码',
        '考虑架构设计和模块分解'
      ],
      constraints: [
        '规划阶段避免细节实现',
        '专注于架构和接口设计'
      ],
      metadata: { 
        strategy: this.name,
        phase: 'planning'
      },
      exitCode: 0
    }
  }
}

/**
 * 实现阶段策略
 */
class ImplementStrategy implements HookStrategy {
  name = 'implement'

  async execute(context: HookContext): Promise<HookResult> {
    const suggestions = [
      '当前处于实现阶段',
      '确保遵循设计模式和代码规范'
    ]

    const constraints = [
      '实现过程中保持代码质量',
      '及时编写单元测试'
    ]

    // 根据文件类型给出具体建议
    if (context.filePath) {
      if (context.filePath.includes('/components/')) {
        suggestions.push('React 组件开发：确保 props 类型定义')
        constraints.push('组件必须有对应的测试文件')
      } else if (context.filePath.includes('/api/')) {
        suggestions.push('API 开发：确保输入验证和错误处理')
        constraints.push('API 必须有对应的集成测试')
      } else if (context.filePath.includes('/hooks/')) {
        suggestions.push('自定义 Hook 开发：确保可复用性')
        constraints.push('Hook 必须有使用示例和测试')
      }
    }

    return {
      success: true,
      shouldBlock: false,
      suggestions,
      constraints,
      metadata: { 
        strategy: this.name,
        phase: 'implementation',
        fileType: this.getFileType(context.filePath)
      },
      exitCode: 0
    }
  }

  private getFileType(filePath?: string): string {
    if (!filePath) return 'unknown'
    
    if (filePath.includes('/components/')) return 'component'
    if (filePath.includes('/api/')) return 'api'
    if (filePath.includes('/hooks/')) return 'hook'
    if (filePath.includes('/utils/')) return 'utility'
    if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) return 'test'
    
    return 'general'
  }
}

/**
 * 测试阶段策略
 */
class TestStrategy implements HookStrategy {
  name = 'test'

  async execute(context: HookContext): Promise<HookResult> {
    const suggestions = [
      '当前处于测试阶段',
      '确保测试覆盖率达到要求'
    ]

    const constraints = [
      '测试阶段优先修复测试失败',
      '确保所有测试通过后再进入下一阶段'
    ]

    // 测试文件特殊处理
    if (context.filePath?.includes('.test.')) {
      suggestions.push('编写有意义的测试用例')
      suggestions.push('确保测试的独立性和可重复性')
      constraints.push('测试文件必须遵循命名规范')
    } else {
      suggestions.push('如果修改了实现，记得更新相关测试')
      constraints.push('避免在测试阶段大幅修改业务逻辑')
    }

    return {
      success: true,
      shouldBlock: false,
      suggestions,
      constraints,
      metadata: { 
        strategy: this.name,
        phase: 'testing',
        isTestFile: context.filePath?.includes('.test.') || false
      },
      exitCode: 0
    }
  }
}

/**
 * 审查阶段策略
 */
class ReviewStrategy implements HookStrategy {
  name = 'review'

  async execute(context: HookContext): Promise<HookResult> {
    return {
      success: true,
      shouldBlock: false,
      suggestions: [
        '当前处于审查阶段',
        '专注于代码质量和文档完善',
        '准备提交和 PR 创建'
      ],
      constraints: [
        '审查阶段避免功能性修改',
        '专注于代码清理和优化',
        '确保所有 TODO 和 FIXME 已处理'
      ],
      metadata: { 
        strategy: this.name,
        phase: 'review'
      },
      exitCode: 0
    }
  }
}

/**
 * 完成阶段策略
 */
class CompleteStrategy implements HookStrategy {
  name = 'complete'

  async execute(context: HookContext): Promise<HookResult> {
    return {
      success: true,
      shouldBlock: false,
      suggestions: [
        '任务已完成',
        '建议运行最终的质量检查',
        '准备代码提交和部署'
      ],
      constraints: [
        '完成阶段避免不必要的修改',
        '确保所有文档已更新'
      ],
      metadata: { 
        strategy: this.name,
        phase: 'complete'
      },
      exitCode: 0
    }
  }
}

// CLI 入口
if (import.meta.main) {
  const hook = new StateAwareHook()
  
  // 解析命令行参数
  const args = process.argv.slice(2)
  const context: HookContext = {
    toolName: args.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'Unknown',
    filePath: args.find(arg => arg.startsWith('--file='))?.split('=')[1],
    operation: args.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'Unknown'
  }

  // 执行 Hook
  hook.execute(context).then(result => {
    console.log('🎯 状态感知 Hook 执行结果:')
    console.log('──────────────────────────────────────────────────')
    
    if (result.suggestions.length > 0) {
      console.log('💡 智能建议:')
      result.suggestions.forEach(suggestion => {
        console.log(`  • ${suggestion}`)
      })
      console.log()
    }

    if (result.constraints.length > 0) {
      console.log('🛡️ 约束检查:')
      result.constraints.forEach(constraint => {
        console.log(`  • ${constraint}`)
      })
      console.log()
    }

    if (result.shouldBlock) {
      console.log('🚫 操作被阻塞 - 请解决上述问题后重试')
    } else {
      console.log('✅ Hook 执行完成，可以继续操作')
    }
    
    console.log('──────────────────────────────────────────────────')
    
    process.exit(result.exitCode)
  }).catch(error => {
    console.error(`❌ Hook 执行失败: ${error.message}`)
    process.exit(1)
  })
}