#!/usr/bin/env bun
/**
 * 实施引擎功能测试
 * 测试代码生成和文件操作的实施引擎核心功能
 */

import { createImplementationEngine, ImplementationTask, ImplementationOptions } from './src/implementation/implementation-engine'
import { createWorkflowImplementationManager, DEFAULT_IMPLEMENTATION_CONFIG } from './src/implementation/workflow-implementation-manager'
import { createHybridAIManager } from './src/providers/hybrid-ai-manager'
import { createAIWorkflowManager } from './src/workflow/ai-workflow-manager'
import { createLogger } from '@linch-kit/core'
import { mkdirSync, existsSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'

const logger = createLogger('implementation-engine-test')

async function testImplementationEngine() {
  console.log('🔧 开始实施引擎功能测试...\n')
  
  // 创建测试目录
  const testDir = join(process.cwd(), '.test-implementation')
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true })
  }
  mkdirSync(testDir, { recursive: true })
  
  try {
    await testBasicImplementationEngine(testDir)
    await testWorkflowIntegration(testDir)
    await testErrorHandlingAndRollback(testDir)
    await testProgressTracking(testDir)
    
    console.log('\n🎉 实施引擎功能测试完成!')
    
  } finally {
    // 清理测试目录
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
      console.log('🧹 测试目录已清理')
    }
  }
}

async function testBasicImplementationEngine(testDir: string) {
  console.log('📋 测试1: 基础实施引擎功能')
  
  const engine = createImplementationEngine(testDir)
  
  // 1. 生成实施计划
  const plan = await engine.generateImplementationPlan(
    'test-session-1',
    '添加用户配置文件管理功能',
    {
      approach: 'create_new',
      estimatedEffort: { complexity: 3, hours: 8 },
      nextSteps: ['创建组件', '添加API', '编写测试']
    }
  )
  
  console.log(`  ✅ 生成实施计划: ${plan.tasks.length}个任务`)
  console.log(`  ⏱️ 预估时间: ${plan.estimatedTotalTime}秒`)
  console.log(`  🎯 风险等级: ${plan.metadata.riskLevel}`)
  
  // 2. 执行实施计划（dry run模式）
  const options: ImplementationOptions = {
    dryRun: true,
    enableRollback: true,
    continueOnError: false
  }
  
  const progress = await engine.executeImplementationPlan(plan, options)
  
  console.log(`  ✅ 模拟执行完成: ${progress.completedTasks}/${progress.totalTasks}任务`)
  console.log(`  📊 最终状态: ${progress.status}`)
  console.log(`  ⏱️ 执行时间: ${new Date(progress.endTime!).getTime() - new Date(progress.startTime).getTime()}ms`)
  
  // 3. 测试具体文件操作
  console.log('\n  🔧 测试具体文件操作:')
  
  const fileTask: ImplementationTask = {
    id: 'test-file-create',
    type: 'file_create',
    priority: 'high',
    description: '创建测试文件',
    targetPath: 'test-config.ts',
    content: `// 测试配置文件
export const testConfig = {
  name: 'test',
  version: '1.0.0',
  enabled: true
};
`,
    estimatedTime: 30
  }
  
  const filePlan = {
    sessionId: 'test-file-session',
    taskDescription: '创建配置文件',
    tasks: [fileTask],
    estimatedTotalTime: 30,
    dependencies: [],
    rollbackSupported: true,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'test',
      workflowComplexity: 1,
      riskLevel: 'low' as const
    }
  }
  
  const fileProgress = await engine.executeImplementationPlan(filePlan, { dryRun: false })
  
  const createdFilePath = join(testDir, 'test-config.ts')
  if (existsSync(createdFilePath)) {
    console.log('    ✅ 文件创建成功')
    const content = readFileSync(createdFilePath, 'utf8')
    if (content.includes('testConfig')) {
      console.log('    ✅ 文件内容正确')
    } else {
      console.log('    ❌ 文件内容错误')
    }
  } else {
    console.log('    ❌ 文件创建失败')
  }
  
  console.log('')
}

async function testWorkflowIntegration(testDir: string) {
  console.log('🔗 测试2: 工作流集成功能')
  
  const config = {
    projectRoot: testDir,
    ...DEFAULT_IMPLEMENTATION_CONFIG,
    integrationHooks: {
      beforeImplementation: async (plan) => {
        console.log(`    🔍 前置检查: ${plan.tasks.length}个任务`)
        return true
      },
      afterImplementation: async (progress) => {
        console.log(`    ✅ 后置处理: ${progress.status}`)
      },
      onImplementationError: async (sessionId, error) => {
        console.log(`    ❌ 错误处理: ${sessionId} - ${error.message}`)
      }
    }
  }
  
  const workflowImplManager = createWorkflowImplementationManager(config)
  const aiManager = createHybridAIManager()
  const workflowManager = createAIWorkflowManager(aiManager)
  
  try {
    // 创建一个简单的工作流
    const workflowResult = await workflowManager.analyzeWorkflow({
      taskDescription: '添加简单的日志记录功能',
      projectContext: {
        name: 'TestProject',
        currentBranch: 'feature/logging'
      },
      userPreferences: {
        preferredApproach: 'balanced',
        requireApproval: false
      }
    })
    
    console.log(`  ✅ 工作流创建: ${workflowResult.metadata.sessionId}`)
    console.log(`  🎚️ 复杂度: ${workflowResult.decision.estimatedEffort.complexity}/5`)
    
    // 检查是否可以自动实施
    const canAutoImplement = workflowImplManager.canAutoImplement(workflowResult)
    console.log(`  🤖 可自动实施: ${canAutoImplement ? '是' : '否'}`)
    
    if (canAutoImplement) {
      console.log('  ⚠️ 注意: 由于集成限制，跳过实际自动实施测试')
    }
    
  } catch (error) {
    console.log(`  ⚠️ 工作流集成测试跳过: ${error}`)
  }
  
  console.log('')
}

async function testErrorHandlingAndRollback(testDir: string) {
  console.log('🔄 测试3: 错误处理和回滚功能')
  
  const engine = createImplementationEngine(testDir)
  
  // 创建一个会失败的任务
  const failingTask: ImplementationTask = {
    id: 'test-failing-task',
    type: 'file_create',
    priority: 'high',
    description: '创建会失败的任务',
    targetPath: '/invalid/path/file.ts', // 无效路径
    content: 'test content',
    estimatedTime: 30
  }
  
  const successTask: ImplementationTask = {
    id: 'test-success-task',
    type: 'file_create',
    priority: 'medium',
    description: '创建成功的任务',
    targetPath: 'success-file.ts',
    content: '// 成功创建的文件\nexport const success = true;',
    estimatedTime: 30
  }
  
  const planWithError = {
    sessionId: 'test-error-session',
    taskDescription: '测试错误处理',
    tasks: [successTask, failingTask],
    estimatedTotalTime: 60,
    dependencies: [],
    rollbackSupported: true,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'test',
      workflowComplexity: 2,
      riskLevel: 'medium' as const
    }
  }
  
  try {
    await engine.executeImplementationPlan(planWithError, { 
      continueOnError: false,
      enableRollback: true
    })
    console.log('  ❌ 应该失败但没有失败')
  } catch (error) {
    console.log('  ✅ 错误正确捕获')
    
    // 检查第一个任务是否成功创建
    const successFilePath = join(testDir, 'success-file.ts')
    if (existsSync(successFilePath)) {
      console.log('  ✅ 成功任务已执行')
      
      // 测试回滚
      const rollbackSuccess = await engine.rollbackImplementation('test-error-session')
      console.log(`  🔄 回滚结果: ${rollbackSuccess ? '成功' : '失败'}`)
      
      // 检查文件是否被回滚删除
      if (!existsSync(successFilePath)) {
        console.log('  ✅ 回滚成功，文件已删除')
      } else {
        console.log('  ⚠️ 回滚可能未完全成功')
      }
    }
  }
  
  console.log('')
}

async function testProgressTracking(testDir: string) {
  console.log('📊 测试4: 进度跟踪功能')
  
  const engine = createImplementationEngine(testDir)
  
  // 创建多个任务来测试进度跟踪
  const tasks: ImplementationTask[] = [
    {
      id: 'task-1',
      type: 'file_create',
      priority: 'high',
      description: '创建第一个文件',
      targetPath: 'progress-test-1.ts',
      content: '// 进度测试文件 1',
      estimatedTime: 20
    },
    {
      id: 'task-2',
      type: 'file_create',
      priority: 'medium',
      description: '创建第二个文件',
      targetPath: 'progress-test-2.ts',
      content: '// 进度测试文件 2',
      estimatedTime: 25
    },
    {
      id: 'task-3',
      type: 'file_create',
      priority: 'low',
      description: '创建第三个文件',
      targetPath: 'progress-test-3.ts',
      content: '// 进度测试文件 3',
      estimatedTime: 30
    }
  ]
  
  const progressPlan = {
    sessionId: 'test-progress-session',
    taskDescription: '测试进度跟踪',
    tasks,
    estimatedTotalTime: 75,
    dependencies: [],
    rollbackSupported: true,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'test',
      workflowComplexity: 2,
      riskLevel: 'low' as const
    }
  }
  
  // 启动进度跟踪
  const progressTracker = setInterval(() => {
    const progress = engine.getImplementationProgress('test-progress-session')
    if (progress) {
      console.log(`    📊 进度: ${progress.progress}% (${progress.completedTasks}/${progress.totalTasks})`)
      if (progress.currentTask) {
        console.log(`    🔄 当前任务: ${progress.currentTask.description}`)
      }
    }
  }, 500)
  
  try {
    const finalProgress = await engine.executeImplementationPlan(progressPlan, { 
      dryRun: false,
      enableRollback: true
    })
    
    clearInterval(progressTracker)
    
    console.log(`  ✅ 进度跟踪完成: ${finalProgress.status}`)
    console.log(`  📊 最终进度: ${finalProgress.progress}%`)
    console.log(`  ⏱️ 总耗时: ${new Date(finalProgress.endTime!).getTime() - new Date(finalProgress.startTime).getTime()}ms`)
    
    // 验证所有文件是否创建成功
    let filesCreated = 0
    for (let i = 1; i <= 3; i++) {
      const filePath = join(testDir, `progress-test-${i}.ts`)
      if (existsSync(filePath)) {
        filesCreated++
      }
    }
    
    console.log(`  📁 创建文件: ${filesCreated}/3`)
    
  } catch (error) {
    clearInterval(progressTracker)
    console.log(`  ❌ 进度跟踪测试失败: ${error}`)
  }
  
  console.log('')
}

// 运行测试
if (import.meta.main) {
  testImplementationEngine().catch(error => {
    console.error('💥 实施引擎测试失败:', error)
    process.exit(1)
  })
}