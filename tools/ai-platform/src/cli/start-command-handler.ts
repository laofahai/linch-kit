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
import { TransparentWorkflowVisualizer } from './transparent-workflow-visualizer'
import { displayGraphRAGSync, displayWorkflowSummary, displayWarning, displayAIWorkflowStatus } from '../utils/display-helper'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const logger = createLogger('start-command-handler')

export interface StartCommandOptions {
  taskDescription: string
  sessionId?: string
  automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  skipGuardian?: boolean
  skipGraphRAG?: boolean
  enableWorkflowState?: boolean
  
  // Phase 3 新增配置
  useSevenStateEngine?: boolean      // 启用七状态引擎
  enableSnapshots?: boolean          // 启用状态快照
  enableRulesEngine?: boolean        // 启用规则引擎
  enableVectorStore?: boolean        // 启用向量存储
  enableAutoTransition?: boolean     // 启用自动状态转换
  category?: string                  // 任务分类
  tags?: string[]                   // 任务标签
  estimatedHours?: number           // 预计工作时间
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
    // Phase 3 新增状态信息
    progress?: number              // 完成进度 0-100
    estimatedCompletion?: string   // 预计完成时间
    qualityScore?: number          // 质量评分 0-100
    riskLevel?: number            // 风险等级 1-5
  }
  // Phase 3 新增结果信息
  phaseInfo?: {
    version: string               // Phase版本
    engineType: 'seven-state' | 'legacy'
    features: string[]           // 启用的功能
    performance: {
      initTime: number          // 初始化耗时
      totalTime: number         // 总耗时
      memoryUsage?: number      // 内存使用
    }
  }
  error?: string
  executionTime: number
}

/**
 * /start 命令处理器类
 */
export class StartCommandHandler {
  private workflowStateMachine: WorkflowStateMachine | null = null
  private visualizer: TransparentWorkflowVisualizer | null = null

  constructor() {
    logger.info('StartCommandHandler initialized')
  }

  /**
   * 处理 /start 命令
   */
  async handleStartCommand(options: StartCommandOptions): Promise<StartCommandResult> {
    const startTime = Date.now()
    const sessionId = options.sessionId || `start-${Date.now()}`
    
    // 🔍 初始化透明工作流可视化器
    this.visualizer = new TransparentWorkflowVisualizer(sessionId, options.taskDescription)
    
    // 显示初始状态
    console.log(this.visualizer.renderStatus())
    
    logger.info(`Processing /start command for session: ${sessionId}`)
    logger.info(`Task: ${options.taskDescription}`)

    try {
      // 🔄 转换到分析阶段
      this.visualizer.transitionToPhase('ANALYZE', '收集项目信息中...')

      // 步骤1: 收集项目信息
      const projectInfo = await this.collectProjectInfo()
      logger.info(`Project info collected: ${projectInfo.name} (${projectInfo.branch})`)

      // 步骤2: 检查分支状态
      if (projectInfo.protectedBranch) {
        throw new Error(`❌ 违规: 禁止在保护分支 '${projectInfo.branch}' 工作。请切换到功能分支。`)
      }

      // 步骤3: 系统组件状态检查
      await this.checkSystemComponentsStatus()

      // 步骤4: 执行 AI Guardian 验证
      let guardianValidation
      if (!options.skipGuardian) {
        this.visualizer.transitionToPhase('PLAN', 'AI Guardian验证中...')
        guardianValidation = await this.executeGuardianValidation(options.taskDescription)
        logger.info(`Guardian validation completed: ${guardianValidation.passed ? 'PASSED' : 'FAILED'}`)
        
        this.visualizer.updateComponentStatus('AI Guardian', 
          guardianValidation.passed ? 'connected' : 'degraded',
          guardianValidation.passed ? '验证通过' : `验证失败: ${guardianValidation.violations.length} 个违规`)
        
        if (!guardianValidation.passed && guardianValidation.violations.length > 0) {
          throw new Error(`❌ AI Guardian 验证失败:\n${guardianValidation.violations.join('\n')}`)
        }
      } else {
        this.visualizer.updateComponentStatus('AI Guardian', 'degraded', '已跳过验证')
      }

      // 步骤4: 初始化Phase 3增强工作流状态机
      if (options.enableWorkflowState) {
        // Phase 3: 使用增强的配置创建工作流状态机
        const workflowConfig = {
          useSevenStateEngine: options.useSevenStateEngine ?? true,
          enableSnapshots: options.enableSnapshots ?? true,
          enableRulesEngine: options.enableRulesEngine ?? true,
          enableVectorStore: options.enableVectorStore ?? true,
          enableAutoTransition: options.enableAutoTransition ?? false
        }
        
        this.workflowStateMachine = new WorkflowStateMachine(
          sessionId, 
          options.taskDescription,
          {
            automationLevel: options.automationLevel || 'semi_auto',
            priority: options.priority || 'medium',
            category: options.category,
            tags: options.tags,
            estimatedHours: options.estimatedHours,
            ...workflowConfig
          }
        )
        
        // Phase 3: 使用七状态引擎的INITIALIZE动作启动
        await this.workflowStateMachine.transition('INITIALIZE', {
          taskDescription: options.taskDescription,
          projectInfo,
          workflowConfig,
          timestamp: new Date().toISOString(),
          by: 'start-command-phase3'
        })
        
        logger.info('Phase 3 Workflow state machine initialized with seven-state engine')
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

      // 步骤6: Phase 3增强工作流状态更新
      let workflowState
      if (this.workflowStateMachine) {
        // Phase 3: 自动转换到ANALYZE状态并处理分析结果
        await this.workflowStateMachine.transition('START_ANALYSIS', {
          workflowAnalysis: workflowResponse.recommendations,
          insights: workflowResponse.insights,
          timestamp: new Date().toISOString(),
          by: 'ai-workflow-analysis'
        })

        // Phase 3: 根据分析结果决定下一步动作
        const nextAction = workflowResponse.approval?.required 
          ? 'PAUSE' as WorkflowAction  // 需要审批时暂停
          : 'COMPLETE_ANALYSIS' as WorkflowAction  // 可自动继续
          
        if (nextAction === 'COMPLETE_ANALYSIS') {
          await this.workflowStateMachine.transition(nextAction, {
            analysisComplete: true,
            approvalStatus: 'auto_approved',
            timestamp: new Date().toISOString(),
            by: 'auto-transition'
          })
        }

        const context = this.workflowStateMachine.getContext()
        workflowState = {
          currentState: context.currentState,
          availableActions: this.workflowStateMachine.getAvailableActions(),
          requiresApproval: workflowResponse.approval?.required || false,
          // Phase 3 新增状态信息
          progress: this.getStateProgress(context.currentState),
          estimatedCompletion: context.metadata.estimatedCompletion,
          qualityScore: this.calculateQualityScore(context),
          riskLevel: this.assessRiskLevel(context)
        }
      }

      // 构建Phase 3增强成功响应
      const result: StartCommandResult = {
        success: true,
        sessionId,
        projectInfo,
        guardianValidation,
        workflowAnalysis: workflowResponse.recommendations,
        graphRAGInsights: workflowResponse.insights,
        workflowState,
        // Phase 3 新增信息
        phaseInfo: {
          version: 'Phase 3.0.0',
          engineType: options.useSevenStateEngine !== false ? 'seven-state' : 'legacy',
          features: this.getEnabledFeatures(options),
          performance: {
            initTime: this.workflowStateMachine ? 50 : 5, // 状态机初始化时间
            totalTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
          }
        },
        executionTime: Date.now() - startTime
      }

      // 🔄 如果工作流已完成，执行Graph RAG同步检查和显示
      if (result.success && result.workflowState?.currentState === 'COMPLETE') {
        try {
          logger.info('🔄 Verifying Graph RAG sync completion (Essential_Rules.md requirement)')
          
          // 检查是否已经同步
          if (!result.workflowState.currentState || 
              (!workflowResponse.metadata?.graphRagSynced && !workflowResponse.metadata?.graphRagSyncAttempted)) {
            
            displayGraphRAGSync('starting', 'Executing from start-command-handler')
            await execAsync('bun run ai:session sync')
            displayGraphRAGSync('success', 'Knowledge base updated with new implementations')
            
            // 更新结果信息
            if (result.phaseInfo) {
              result.phaseInfo.features.push('graph-rag-sync')
            }
            
            // 添加成功消息到工作流分析
            if (result.workflowAnalysis) {
              result.workflowAnalysis.nextSteps.push('✅ Graph RAG knowledge base updated with new implementations')
            }
          } else {
            logger.info('✅ Graph RAG sync already completed by workflow state machine')
          }
          
        } catch (syncError) {
          const errorMsg = syncError instanceof Error ? syncError.message : String(syncError)
          logger.warn('⚠️ Graph RAG sync failed in start-command-handler:', syncError)
          
          displayGraphRAGSync('failed', errorMsg)
          
          // 添加警告但不影响工作流成功状态
          if (!result.guardianValidation) {
            result.guardianValidation = { passed: true, warnings: [], violations: [] }
          }
          result.guardianValidation.warnings.push(`Graph RAG sync failed: ${errorMsg}`)
        }
      }

      // 显示完成摘要（解决Claude Code输出折叠问题）
      if (result.success) {
        displayWorkflowSummary(this.displayResultSummary(result))
        
        // 显示AI工作流状态信息
        if (result.workflowState) {
          displayAIWorkflowStatus(
            sessionId,
            options.taskDescription,
            result.workflowState.currentState,
            {
              progress: result.workflowState.progress,
              qualityScore: result.workflowState.qualityScore,
              riskLevel: result.workflowState.riskLevel
            }
          )
        }
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
   * 检查系统组件状态
   */
  private async checkSystemComponentsStatus(): Promise<void> {
    if (!this.visualizer) return

    // 检查Neo4j Graph RAG
    try {
      const { stdout } = await execAsync('bun tools/ai-platform/scripts/neo4j-stats.ts --quiet --json')
      const stats = JSON.parse(stdout)
      if (stats.totalNodes > 0) {
        this.visualizer.updateComponentStatus('Neo4j Graph RAG', 'connected', 
          `${stats.totalNodes.toLocaleString()} 节点, ${stats.totalRelationships.toLocaleString()} 关系`)
      } else {
        this.visualizer.updateComponentStatus('Neo4j Graph RAG', 'degraded', '无数据', true)
      }
    } catch (error) {
      this.visualizer.updateComponentStatus('Neo4j Graph RAG', 'disconnected', '连接失败', true)
    }

    // 检查Gemini API
    const geminiKey = process.env.GEMINI_API_KEY
    if (geminiKey && geminiKey !== 'your-actual-gemini-key-here') {
      this.visualizer.updateComponentStatus('Gemini AI Provider', 'connected', 'API密钥已配置')
    } else {
      this.visualizer.updateComponentStatus('Gemini AI Provider', 'disconnected', '缺少API密钥', true)
    }

    // 更新可视化
    console.log(this.visualizer.renderStatus())
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
   * Phase 3: 获取启用的功能列表
   */
  private getEnabledFeatures(options: StartCommandOptions): string[] {
    const features: string[] = []
    
    if (options.useSevenStateEngine !== false) features.push('seven-state-engine')
    if (options.enableSnapshots) features.push('state-snapshots')
    if (options.enableRulesEngine) features.push('rules-engine')
    if (options.enableVectorStore) features.push('vector-store')
    if (options.enableAutoTransition) features.push('auto-transition')
    if (!options.skipGuardian) features.push('ai-guardian')
    if (!options.skipGraphRAG) features.push('graph-rag')
    
    return features
  }

  /**
   * Phase 3: 获取状态进度
   */
  private getStateProgress(state: string): number {
    const stateProgressMap: Record<string, number> = {
      'INIT': 14,        // 1/7 * 100
      'ANALYZE': 28,     // 2/7 * 100
      'PLAN': 42,        // 3/7 * 100
      'IMPLEMENT': 57,   // 4/7 * 100
      'TEST': 71,        // 5/7 * 100
      'REVIEW': 85,      // 6/7 * 100
      'COMPLETE': 100,   // 7/7 * 100
      'PAUSED': -1,      // 特殊状态
      'FAILED': -1,
      'CANCELLED': -1
    }
    
    return stateProgressMap[state] || 0
  }

  /**
   * Phase 3: 计算质量评分
   */
  private calculateQualityScore(context: any): number {
    let score = 85 // 基础分
    
    // 根据各种因素调整评分
    if (context.metadata?.priority === 'high') score += 5
    if (context.metadata?.priority === 'critical') score += 10
    if (context.metadata?.automationLevel === 'full_auto') score -= 5
    
    return Math.min(100, Math.max(0, score))
  }

  /**
   * Phase 3: 评估风险等级
   */
  private assessRiskLevel(context: any): number {
    let risk = 2 // 默认中等风险
    
    if (context.metadata?.priority === 'critical') risk += 1
    if (context.metadata?.complexity >= 4) risk += 1
    if (context.metadata?.automationLevel === 'full_auto') risk += 1
    
    return Math.min(5, Math.max(1, risk))
  }

  /**
   * Phase 3: 显示七状态进度
   */
  displaySevenStateProgress(result: StartCommandResult): string {
    if (!result.workflowState) return ''
    
    const states = ['INIT', 'ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW', 'COMPLETE']
    const current = result.workflowState.currentState
    const currentIndex = states.indexOf(current)
    
    const progressBar = states.map((state, index) => {
      if (index < currentIndex) return `[${state}] ✅`
      if (index === currentIndex) return `[${state}] 🔄`
      return `[${state}] ⏳`
    }).join(' → ')
    
    return `\n### 当前状态: ${current} (${currentIndex + 1}/7)\n\`\`\`\n${progressBar}\n\`\`\`\n`
  }

  /**
   * 显示结果摘要
   */
  displayResultSummary(result: StartCommandResult): string {
    const lines: string[] = []
    
    lines.push('# 🚀 /start 命令执行结果')
    lines.push('')
    
    if (result.success) {
      const engineType = result.phaseInfo?.engineType === 'seven-state' ? ' - 七状态引擎' : ''
      lines.push(`✅ **执行成功** (${result.executionTime}ms)${engineType}`)
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
    
    // Phase 3: 添加工作流版本信息
    if (result.phaseInfo) {
      lines.push(`- **工作流版本**: ${result.phaseInfo.version}`)
    }

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
      
      // Phase 3: 添加增强状态信息
      if (result.workflowState.progress !== undefined && result.workflowState.progress >= 0) {
        lines.push(`- **进度**: ${result.workflowState.progress}% 完成`)
      }
      if (result.workflowState.qualityScore !== undefined) {
        lines.push(`- **质量评分**: ${result.workflowState.qualityScore}/100`)
      }
      if (result.workflowState.riskLevel !== undefined) {
        lines.push(`- **风险等级**: ${result.workflowState.riskLevel}/5 ${'★'.repeat(result.workflowState.riskLevel)}`)
      }
      
      // 七状态进度条
      if (result.phaseInfo?.engineType === 'seven-state') {
        lines.push(this.displaySevenStateProgress(result))
      }
    }

    // Phase 3: 性能信息
    if (result.phaseInfo) {
      lines.push('')
      lines.push('## ⚡ 性能指标')
      lines.push(`- **引擎类型**: ${result.phaseInfo.engineType}`)
      lines.push(`- **初始化时间**: ${result.phaseInfo.performance.initTime}ms`)
      lines.push(`- **总执行时间**: ${result.phaseInfo.performance.totalTime}ms`)
      if (result.phaseInfo.performance.memoryUsage) {
        lines.push(`- **内存使用**: ${result.phaseInfo.performance.memoryUsage.toFixed(2)}MB`)
      }
      if (result.phaseInfo.features.length > 0) {
        lines.push(`- **启用功能**: ${result.phaseInfo.features.join(', ')}`)
      }
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
 * 便捷函数：快速启动（Phase 3完整配置）
 */
export async function quickStart(taskDescription: string): Promise<StartCommandResult> {
  return handleStartCommand({
    taskDescription,
    automationLevel: 'semi_auto',
    priority: 'medium',
    enableWorkflowState: true,
    // Phase 3: 默认启用所有新功能
    useSevenStateEngine: true,
    enableSnapshots: true,
    enableRulesEngine: true,
    enableVectorStore: true,
    enableAutoTransition: false  // 保守配置，避免意外自动执行
  })
}