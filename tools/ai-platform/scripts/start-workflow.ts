#!/usr/bin/env bun
/**
 * 简化版的 /start 命令处理器
 * 集成核心 AI Workflow 功能，去除复杂依赖
 * 
 * @version 1.0.0 - Simplified AI Workflow
 */

import { createLogger } from '@linch-kit/core'
import { AIProviderManager, getGlobalAIProviderManager } from '../src/providers/ai-provider-manager'
import { AIWorkflowManager } from '../src/workflow/ai-workflow-manager'
import type { WorkflowContext } from '../src/workflow/ai-workflow-manager'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const logger = createLogger('start-workflow')

interface StartWorkflowOptions {
  taskDescription: string
  automationLevel?: 'manual' | 'semi_auto' | 'full_auto'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  enableWorkflowState?: boolean
}

/**
 * 解析命令行参数
 */
function parseArguments(args: string[]): StartWorkflowOptions {
  const options: StartWorkflowOptions = {
    taskDescription: '',
    automationLevel: 'semi_auto',
    priority: 'medium',
    enableWorkflowState: true
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg.startsWith('--task=')) {
      options.taskDescription = arg.substring(7).replace(/"/g, '')
    } else if (arg.startsWith('--automation-level=')) {
      options.automationLevel = arg.substring(19) as any
    } else if (arg.startsWith('--priority=')) {
      options.priority = arg.substring(11) as any
    } else if (arg === '--enable-workflow-state=true') {
      options.enableWorkflowState = true
    } else if (arg === '--enable-workflow-state=false') {
      options.enableWorkflowState = false
    }
  }

  // 如果没有提供任务描述，使用默认值
  if (!options.taskDescription) {
    options.taskDescription = '通用开发任务'
  }

  return options
}

/**
 * 获取项目基本信息
 */
async function getProjectInfo() {
  try {
    const { stdout: branch } = await execAsync('git branch --show-current')
    const { stdout: status } = await execAsync('git status --porcelain')
    
    return {
      currentBranch: branch.trim(),
      hasUncommittedChanges: status.trim().length > 0,
      workingDirectory: process.cwd()
    }
  } catch (error) {
    logger.warn('获取项目信息失败，使用默认值')
    return {
      currentBranch: 'unknown',
      hasUncommittedChanges: false,
      workingDirectory: process.cwd()
    }
  }
}

/**
 * 主要的工作流处理函数
 */
async function executeStartWorkflow(options: StartWorkflowOptions) {
  const startTime = Date.now()
  
  logger.info('🚀 LinchKit AI Workflow 启动')
  logger.info(`📋 任务: ${options.taskDescription}`)
  logger.info(`⚙️  自动化级别: ${options.automationLevel}`)
  logger.info(`🎯 优先级: ${options.priority}`)
  
  // 1. 获取项目信息
  const projectInfo = await getProjectInfo()
  logger.info(`📁 当前分支: ${projectInfo.currentBranch}`)
  logger.info(`📊 未提交更改: ${projectInfo.hasUncommittedChanges ? '是' : '否'}`)
  
  // 2. 初始化 AI Provider Manager
  let aiManager: AIProviderManager
  try {
    aiManager = getGlobalAIProviderManager()
    logger.info('✅ AI Provider Manager 初始化成功')
  } catch (error) {
    logger.warn('⚠️  AI Provider Manager 初始化失败，使用模拟模式')
    aiManager = new AIProviderManager()
  }
  
  // 3. 创建工作流上下文
  const workflowContext: WorkflowContext = {
    taskDescription: options.taskDescription,
    projectContext: {
      name: 'LinchKit',
      version: '1.0.0',
      currentBranch: projectInfo.currentBranch
    },
    userPreferences: {
      preferredApproach: options.automationLevel === 'full_auto' ? 'aggressive' : 'balanced',
      requireApproval: options.automationLevel === 'manual',
      autoImplement: options.automationLevel === 'full_auto'
    }
  }
  
  // 4. 创建并执行 AI 工作流管理器
  const workflowManager = new AIWorkflowManager(aiManager, options.taskDescription)
  
  try {
    logger.info('🧠 执行 AI 工作流分析...')
    const workflowResult = await workflowManager.analyzeWorkflow(workflowContext)
    
    // 5. 显示分析结果
    logger.info('\n📊 === AI 工作流分析结果 ===')
    logger.info(`🎯 建议方法: ${workflowResult.decision.approach}`)
    logger.info(`📈 置信度: ${Math.round(workflowResult.decision.confidence * 100)}%`)
    logger.info(`⏱️  预估工作量: ${workflowResult.decision.estimatedEffort.hours} 小时`)
    logger.info(`🔥 复杂度: ${workflowResult.decision.estimatedEffort.complexity}/5`)
    logger.info(`📝 推理: ${workflowResult.decision.reasoning}`)
    
    // 6. 显示下一步行动
    if (workflowResult.decision.nextSteps.length > 0) {
      logger.info('\n🚀 建议的下一步行动:')
      workflowResult.decision.nextSteps.forEach((step, index) => {
        logger.info(`  ${index + 1}. ${step}`)
      })
    }
    
    // 7. 显示风险评估
    if (workflowResult.decision.risks.length > 0) {
      logger.info('\n⚠️  风险评估:')
      workflowResult.decision.risks.forEach((risk, index) => {
        logger.info(`  ⚠️  ${risk}`)
      })
    }
    
    // 8. 显示 Graph RAG 洞察
    if (workflowResult.graphRAG.suggestions.existingImplementations.length > 0) {
      logger.info('\n🔍 发现的现有实现:')
      workflowResult.graphRAG.suggestions.existingImplementations.forEach(impl => {
        logger.info(`  📦 ${impl}`)
      })
    }
    
    const processingTime = Date.now() - startTime
    logger.info(`\n✅ AI Workflow 分析完成 (${processingTime}ms)`)
    
    // 9. 如果需要审批
    if (workflowResult.decision.requiresApproval) {
      logger.info('\n⏳ 此任务需要人工审批才能继续')
      logger.info('📋 审批后可继续执行后续步骤')
    } else {
      logger.info('\n🚀 系统已准备就绪，可以开始开发')
    }
    
    return {
      success: true,
      sessionId: workflowResult.metadata.sessionId,
      result: workflowResult
    }
    
  } catch (error) {
    logger.error('❌ AI 工作流分析失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
LinchKit AI Workflow 启动器

用法:
  bun run start-workflow.ts --task="任务描述" [options]

选项:
  --task="描述"              任务描述 (必需)
  --automation-level=LEVEL   自动化级别: manual, semi_auto, full_auto (默认: semi_auto)
  --priority=LEVEL           优先级: low, medium, high, critical (默认: medium)
  --enable-workflow-state    启用工作流状态管理 (默认: true)
  --help, -h                 显示此帮助信息

示例:
  bun run start-workflow.ts --task="添加用户认证功能"
  bun run start-workflow.ts --task="修复登录bug" --priority=high --automation-level=manual
    `)
    process.exit(0)
  }
  
  try {
    const options = parseArguments(args)
    const result = await executeStartWorkflow(options)
    
    if (!result.success) {
      logger.error('工作流执行失败')
      process.exit(1)
    }
    
    logger.info('🎉 AI Workflow 启动完成')
    
  } catch (error) {
    logger.error('启动器执行失败:', error.message)
    process.exit(1)
  }
}

// 执行主函数
if (import.meta.main) {
  main().catch(error => {
    console.error('未捕获的错误:', error)
    process.exit(1)
  })
}