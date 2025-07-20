/**
 * /start 命令处理器
 * 集成 Phase 1 基础设施，实现完整的 AI 工作流
 * 
 * @version 1.0.0 - Phase 2 CLI集成
 */

import { createLogger } from '@linch-kit/core'
import { claudeCodeAPI, type SimpleWorkflowRequest } from '../workflow/claude-code-api'
import { WorkflowStateMachine } from '../workflow/workflow-state-machine'
import type { WorkflowAction, WorkflowTransition } from '../workflow/workflow-state-machine'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const logger = createLogger('start-command-handler')

export interface StartCommandOptions {
  taskDescription: string
  sessionId?: string
  automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
  priority?: 'low' | 'medium' | 'high'
  skipGuardian?: boolean
  skipGraphRAG?: boolean
  enableWorkflowState?: boolean
}

export interface ProjectInfo {
  name: string
  version: string
  branch: string
  hasUncommittedChanges: boolean
  recentCommits: Array<{
    hash: string
    message: string
    author: string
    date: string
  }>
  protectedBranch: boolean
}

export interface StartCommandResult {
  success: boolean
  sessionId: string
  projectInfo: ProjectInfo
  guardianValidation?: {
    passed: boolean
    warnings: string[]
    violations: string[]
  }
  workflowAnalysis?: {
    approach: string
    nextSteps: string[]
    confidence: number
    complexity: number
    risks: string[]
  }
  graphRAGInsights?: {
    existingImplementations: string[]
    relatedComponents: string[]
    suggestions: string[]
  }
  workflowState?: {
    currentState: string
    availableActions: string[]
    requiresApproval: boolean
  }
  error?: string
  executionTime: number
}

/**
 * /start 命令处理器类
 */
export class StartCommandHandler {
  private workflowStateMachine: WorkflowStateMachine | null = null

  constructor() {
    logger.info('StartCommandHandler initialized')
  }

  /**
   * 处理 /start 命令
   */
  async handleStartCommand(options: StartCommandOptions): Promise<StartCommandResult> {
    const startTime = Date.now()
    const sessionId = options.sessionId || `start-${Date.now()}`
    
    logger.info(`Processing /start command for session: ${sessionId}`)
    logger.info(`Task: ${options.taskDescription}`)

    try {
      // 步骤1: 收集项目信息
      const projectInfo = await this.collectProjectInfo()
      logger.info(`Project info collected: ${projectInfo.name} (${projectInfo.branch})`)

      // 步骤2: 检查分支状态
      if (projectInfo.protectedBranch) {
        throw new Error(`❌ 违规: 禁止在保护分支 '${projectInfo.branch}' 工作。请切换到功能分支。`)
      }

      // 步骤3: 执行 AI Guardian 验证
      let guardianValidation
      if (!options.skipGuardian) {
        guardianValidation = await this.executeGuardianValidation(options.taskDescription)
        logger.info(`Guardian validation completed: ${guardianValidation.passed ? 'PASSED' : 'FAILED'}`)
        
        if (!guardianValidation.passed && guardianValidation.violations.length > 0) {
          throw new Error(`❌ AI Guardian 验证失败:\n${guardianValidation.violations.join('\n')}`)
        }
      }

      // 步骤4: 初始化工作流状态机（如果启用）
      if (options.enableWorkflowState) {
        this.workflowStateMachine = new WorkflowStateMachine(sessionId, options.taskDescription)
        await this.workflowStateMachine.transition('START_ANALYSIS', {
          taskDescription: options.taskDescription,
          projectInfo,
          timestamp: new Date().toISOString(),
          by: 'start-command'
        })
        logger.info('Workflow state machine initialized')
      }

      // 步骤5: 处理工作流请求
      const workflowRequest: SimpleWorkflowRequest = {
        taskDescription: options.taskDescription,
        sessionId,
        options: {
          requireApproval: options.automationLevel !== 'full_auto',
          enableGraphRAG: !options.skipGraphRAG,
          automationLevel: options.automationLevel || 'semi_auto',
          priority: options.priority || 'medium'
        },
        projectInfo: {
          name: projectInfo.name,
          version: projectInfo.version,
          branch: projectInfo.branch
        }
      }

      const workflowResponse = await claudeCodeAPI.processWorkflowRequest(workflowRequest)
      logger.info(`Workflow processing completed: ${workflowResponse.success ? 'SUCCESS' : 'FAILED'}`)

      if (!workflowResponse.success) {
        throw new Error(`工作流处理失败: ${workflowResponse.error}`)
      }

      // 步骤6: 更新工作流状态
      let workflowState
      if (this.workflowStateMachine) {
        const analysisAction = workflowResponse.approval?.required 
          ? 'REQUEST_APPROVAL' as WorkflowAction
          : 'COMPLETE_ANALYSIS' as WorkflowAction
          
        await this.workflowStateMachine.transition(analysisAction, {
          workflowAnalysis: workflowResponse.recommendations,
          insights: workflowResponse.insights,
          timestamp: new Date().toISOString(),
          by: 'ai-workflow'
        })

        const context = this.workflowStateMachine.getContext()
        workflowState = {
          currentState: context.currentState,
          availableActions: this.workflowStateMachine.getAvailableActions(),
          requiresApproval: workflowResponse.approval?.required || false
        }
      }

      // 构建成功响应
      const result: StartCommandResult = {
        success: true,
        sessionId,
        projectInfo,
        guardianValidation,
        workflowAnalysis: workflowResponse.recommendations,
        graphRAGInsights: workflowResponse.insights,
        workflowState,
        executionTime: Date.now() - startTime
      }

      logger.info(`/start command completed successfully in ${result.executionTime}ms`)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`/start command failed:`, error)

      // 清理工作流状态机
      if (this.workflowStateMachine) {
        try {
          await this.workflowStateMachine.transition('FAIL', {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            by: 'error-handler'
          })
        } catch (cleanupError) {
          logger.warn('Failed to update workflow state after error:', cleanupError)
        }
      }

      return {
        success: false,
        sessionId,
        projectInfo: await this.collectProjectInfo().catch(() => ({
          name: 'unknown',
          version: 'unknown',
          branch: 'unknown',
          hasUncommittedChanges: false,
          recentCommits: [],
          protectedBranch: false
        })),
        error: errorMessage,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * 收集项目信息
   */
  private async collectProjectInfo(): Promise<ProjectInfo> {
    try {
      // 获取包信息
      const packageInfo = await this.getPackageInfo()
      
      // 获取Git信息
      const [branchInfo, commitInfo, statusInfo] = await Promise.all([
        this.getCurrentBranch(),
        this.getRecentCommits(),
        this.getGitStatus()
      ])

      const protectedBranches = ['main', 'master', 'develop', 'release', 'production']
      const protectedBranch = protectedBranches.some(branch => 
        branchInfo.toLowerCase().includes(branch) || 
        branchInfo.startsWith('release/')
      )

      return {
        name: packageInfo.name,
        version: packageInfo.version,
        branch: branchInfo,
        hasUncommittedChanges: statusInfo.hasChanges,
        recentCommits: commitInfo,
        protectedBranch
      }
    } catch (error) {
      logger.warn('Failed to collect project info:', error)
      throw new Error(`项目信息收集失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取包信息
   */
  private async getPackageInfo(): Promise<{ name: string; version: string }> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      return {
        name: packageJson.name || 'linch-kit',
        version: packageJson.version || '1.0.0'
      }
    } catch (error) {
      logger.warn('Failed to read package.json:', error)
      return {
        name: 'linch-kit',
        version: '1.0.0'
      }
    }
  }

  /**
   * 获取当前分支
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current')
      return stdout.trim()
    } catch (error) {
      throw new Error(`获取Git分支失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取最近提交
   */
  private async getRecentCommits(): Promise<Array<{
    hash: string
    message: string
    author: string
    date: string
  }>> {
    try {
      const { stdout } = await execAsync('git log --oneline -5 --pretty=format:"%H|%s|%an|%ad" --date=iso')
      return stdout.trim().split('\n').map(line => {
        const [hash, message, author, date] = line.split('|')
        return { hash, message, author, date }
      })
    } catch (error) {
      logger.warn('Failed to get recent commits:', error)
      return []
    }
  }

  /**
   * 获取Git状态
   */
  private async getGitStatus(): Promise<{ hasChanges: boolean }> {
    try {
      const { stdout } = await execAsync('git status --porcelain')
      return { hasChanges: stdout.trim().length > 0 }
    } catch (error) {
      logger.warn('Failed to get git status:', error)
      return { hasChanges: false }
    }
  }

  /**
   * 执行AI Guardian验证
   */
  private async executeGuardianValidation(taskDescription: string): Promise<{
    passed: boolean
    warnings: string[]
    violations: string[]
  }> {
    try {
      const { stdout, stderr } = await execAsync(`bun run ai:guardian:validate "${taskDescription}"`)
      
      // 解析验证结果
      const output = stdout + stderr
      const warnings: string[] = []
      const violations: string[] = []
      
      // 提取警告和违规信息
      const lines = output.split('\n')
      let passed = true
      
      for (const line of lines) {
        if (line.includes('⚠️ 警告') || line.includes('⚠️ 注意')) {
          warnings.push(line.trim())
        }
        if (line.includes('❌') || line.includes('FAILED') || line.includes('违规')) {
          violations.push(line.trim())
          passed = false
        }
      }
      
      // 检查是否包含成功标识
      if (output.includes('✅ 所有强制验证已通过') || output.includes('AI Guardian已激活')) {
        passed = true
      }

      return { passed, warnings, violations }
    } catch (error) {
      logger.error('Guardian validation failed:', error)
      return {
        passed: false,
        warnings: [],
        violations: [`AI Guardian执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * 显示结果摘要
   */
  displayResultSummary(result: StartCommandResult): string {
    const lines: string[] = []
    
    lines.push('# 🚀 /start 命令执行结果')
    lines.push('')
    
    if (result.success) {
      lines.push(`✅ **执行成功** (${result.executionTime}ms)`)
    } else {
      lines.push(`❌ **执行失败** (${result.executionTime}ms)`)
      lines.push(`错误: ${result.error}`)
      return lines.join('\n')
    }

    lines.push('')
    lines.push('## 📋 项目信息')
    lines.push(`- **项目**: ${result.projectInfo.name} v${result.projectInfo.version}`)
    lines.push(`- **分支**: ${result.projectInfo.branch}`)
    lines.push(`- **状态**: ${result.projectInfo.hasUncommittedChanges ? '有未提交更改' : '工作目录干净'}`)

    if (result.guardianValidation) {
      lines.push('')
      lines.push('## 🛡️ AI Guardian 验证')
      lines.push(`- **状态**: ${result.guardianValidation.passed ? '✅ 通过' : '❌ 失败'}`)
      
      if (result.guardianValidation.warnings.length > 0) {
        lines.push('- **警告**:')
        result.guardianValidation.warnings.forEach(warning => {
          lines.push(`  - ${warning}`)
        })
      }
    }

    if (result.workflowAnalysis) {
      lines.push('')
      lines.push('## 🎯 工作流分析')
      lines.push(`- **方案**: ${result.workflowAnalysis.approach}`)
      lines.push(`- **复杂度**: ${result.workflowAnalysis.complexity}/5`)
      lines.push(`- **置信度**: ${Math.round(result.workflowAnalysis.confidence * 100)}%`)
      lines.push('- **下一步**:')
      result.workflowAnalysis.nextSteps.forEach(step => {
        lines.push(`  - ${step}`)
      })
    }

    if (result.graphRAGInsights && result.graphRAGInsights.existingImplementations.length > 0) {
      lines.push('')
      lines.push('## 🔍 现有实现发现')
      result.graphRAGInsights.existingImplementations.forEach(impl => {
        lines.push(`- ${impl}`)
      })
    }

    if (result.workflowState) {
      lines.push('')
      lines.push('## 🔄 工作流状态')
      lines.push(`- **当前状态**: ${result.workflowState.currentState}`)
      lines.push(`- **需要审批**: ${result.workflowState.requiresApproval ? '是' : '否'}`)
    }

    return lines.join('\n')
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.workflowStateMachine) {
      try {
        // 工作流状态机当前没有清理方法，这里预留
        logger.info('Workflow state machine cleanup completed')
      } catch (error) {
        logger.warn('Error during workflow state machine cleanup:', error)
      }
    }
  }
}

/**
 * 便捷函数：处理/start命令
 */
export async function handleStartCommand(options: StartCommandOptions): Promise<StartCommandResult> {
  const handler = new StartCommandHandler()
  try {
    return await handler.handleStartCommand(options)
  } finally {
    await handler.cleanup()
  }
}

/**
 * 便捷函数：快速启动（最小配置）
 */
export async function quickStart(taskDescription: string): Promise<StartCommandResult> {
  return handleStartCommand({
    taskDescription,
    automationLevel: 'semi_auto',
    priority: 'medium',
    enableWorkflowState: true
  })
}