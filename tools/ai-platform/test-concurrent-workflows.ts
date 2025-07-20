#!/usr/bin/env bun
/**
 * 并发工作流状态管理和冲突处理测试
 * 测试多个工作流同时运行时的状态管理和资源冲突处理
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'
import { createAIWorkflowManager } from './src/workflow/ai-workflow-manager'
import { FileBasedPersistence } from './src/workflow/workflow-state-machine'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('concurrent-workflows-test')

async function testConcurrentWorkflows() {
  console.log('🔄 开始并发工作流状态管理测试...\n')
  
  const aiManager = createHybridAIManager()
  const persistence = new FileBasedPersistence()
  
  // 定义测试用例
  const concurrentTasks = [
    {
      id: 'task-1',
      description: '添加用户头像上传功能',
      complexity: 'medium',
      priority: 'normal'
    },
    {
      id: 'task-2', 
      description: '优化数据库查询性能',
      complexity: 'high',
      priority: 'urgent'
    },
    {
      id: 'task-3',
      description: '修复登录页面样式问题', 
      complexity: 'low',
      priority: 'normal'
    },
    {
      id: 'task-4',
      description: '重构用户权限验证系统',
      complexity: 'high',
      priority: 'critical'
    },
    {
      id: 'task-5',
      description: '添加API限流功能',
      complexity: 'medium', 
      priority: 'normal'
    }
  ]
  
  console.log(`📋 准备并发创建 ${concurrentTasks.length} 个工作流`)
  
  // 1. 并发创建多个工作流
  console.log('\n🚀 步骤1: 并发创建工作流')
  const startTime = Date.now()
  
  const workflowPromises = concurrentTasks.map(async (task, index) => {
    const workflowManager = createAIWorkflowManager(aiManager)
    
    try {
      console.log(`  ⏳ 启动工作流 ${task.id}: ${task.description}`)
      
      const result = await workflowManager.analyzeWorkflow({
        taskDescription: task.description,
        projectContext: {
          name: 'LinchKit',
          currentBranch: `feature/${task.id}`
        },
        userPreferences: {
          requireApproval: task.complexity === 'high',
          preferredApproach: 'balanced'
        }
      })
      
      return {
        taskId: task.id,
        sessionId: result.metadata.sessionId,
        workflowManager,
        result,
        success: true,
        error: null
      }
    } catch (error) {
      console.log(`  ❌ 工作流 ${task.id} 创建失败: ${error}`)
      return {
        taskId: task.id,
        sessionId: null,
        workflowManager,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
  
  const workflowResults = await Promise.allSettled(workflowPromises)
  const creationTime = Date.now() - startTime
  
  console.log(`\n📊 并发创建结果 (耗时: ${creationTime}ms):`)
  const successfulWorkflows: any[] = []
  
  workflowResults.forEach((result, index) => {
    const task = concurrentTasks[index]
    
    if (result.status === 'fulfilled' && result.value.success) {
      const workflow = result.value
      console.log(`  ✅ ${task.id}: 创建成功 (${workflow.sessionId})`)
      console.log(`     📊 状态: ${workflow.result.workflowState}`)
      console.log(`     🎚️ 复杂度: ${workflow.result.decision.estimatedEffort.complexity}/5`)
      successfulWorkflows.push(workflow)
    } else {
      const error = result.status === 'fulfilled' ? result.value.error : result.reason
      console.log(`  ❌ ${task.id}: 创建失败 - ${error}`)
    }
  })
  
  // 2. 检查状态持久化
  console.log('\n💾 步骤2: 检查状态持久化')
  try {
    const allContexts = await persistence.list()
    const newContexts = allContexts.filter(ctx => 
      successfulWorkflows.some(w => w.sessionId === ctx.sessionId)
    )
    
    console.log(`  📊 持久化工作流: ${newContexts.length}/${successfulWorkflows.length}`)
    
    // 检查状态一致性
    for (const workflow of successfulWorkflows) {
      const persistedContext = newContexts.find(ctx => ctx.sessionId === workflow.sessionId)
      if (persistedContext) {
        const stateMatch = persistedContext.currentState === workflow.result.workflowState
        console.log(`  ✅ ${workflow.taskId}: 状态一致性 ${stateMatch ? '通过' : '失败'}`)
        
        if (!stateMatch) {
          console.log(`     期望: ${workflow.result.workflowState}, 实际: ${persistedContext.currentState}`)
        }
      } else {
        console.log(`  ❌ ${workflow.taskId}: 持久化失败`)
      }
    }
  } catch (error) {
    console.error('  ❌ 状态持久化检查失败:', error)
  }
  
  // 3. 测试并发状态转换
  console.log('\n🔄 步骤3: 测试并发状态转换')
  const approvalPromises = successfulWorkflows
    .filter(w => w.result.workflowState === 'PENDING_APPROVAL')
    .map(async (workflow) => {
      try {
        console.log(`  ⏳ 并发审批工作流 ${workflow.taskId}`)
        const approved = await workflow.workflowManager.approveWorkflow(
          'test-approver',
          `并发测试审批 - ${workflow.taskId}`
        )
        return { taskId: workflow.taskId, approved, error: null }
      } catch (error) {
        return { 
          taskId: workflow.taskId, 
          approved: false, 
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })
  
  if (approvalPromises.length > 0) {
    const approvalResults = await Promise.allSettled(approvalPromises)
    
    console.log(`  📊 并发审批结果:`)
    approvalResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { taskId, approved, error } = result.value
        if (approved) {
          console.log(`    ✅ ${taskId}: 审批成功`)
        } else {
          console.log(`    ❌ ${taskId}: 审批失败 - ${error || '未知错误'}`)
        }
      } else {
        console.log(`    ❌ 审批操作异常: ${result.reason}`)
      }
    })
  } else {
    console.log('  ℹ️ 没有需要审批的工作流')
  }
  
  // 4. 测试资源冲突处理
  console.log('\n⚡ 步骤4: 测试资源冲突处理')
  
  // 尝试同时启动多个实施流程
  const implementationPromises = successfulWorkflows
    .filter(w => w.workflowManager.getCurrentWorkflowState() === 'APPROVED')
    .slice(0, 3) // 限制同时实施的数量
    .map(async (workflow) => {
      try {
        console.log(`  ⏳ 并发启动实施 ${workflow.taskId}`)
        const started = await workflow.workflowManager.startImplementation(`implementer-${workflow.taskId}`)
        return { taskId: workflow.taskId, started, error: null }
      } catch (error) {
        return {
          taskId: workflow.taskId,
          started: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })
  
  if (implementationPromises.length > 0) {
    const implementationResults = await Promise.allSettled(implementationPromises)
    
    console.log(`  📊 并发实施结果:`)
    implementationResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { taskId, started, error } = result.value
        if (started) {
          console.log(`    ✅ ${taskId}: 实施启动成功`)
        } else {
          console.log(`    ❌ ${taskId}: 实施启动失败 - ${error || '未知错误'}`)
        }
      } else {
        console.log(`    ❌ 实施启动异常: ${result.reason}`)
      }
    })
  } else {
    console.log('  ℹ️ 没有可启动实施的工作流')
  }
  
  // 5. 最终状态汇总
  console.log('\n📈 步骤5: 最终状态汇总')
  try {
    const finalContexts = await persistence.list()
    const testContexts = finalContexts.filter(ctx => 
      successfulWorkflows.some(w => w.sessionId === ctx.sessionId)
    )
    
    const stateGroups = testContexts.reduce((groups: Record<string, any[]>, ctx) => {
      const state = ctx.currentState
      if (!groups[state]) {
        groups[state] = []
      }
      groups[state].push(ctx)
      return groups
    }, {})
    
    console.log('  📊 工作流状态分布:')
    Object.entries(stateGroups).forEach(([state, workflows]) => {
      console.log(`    ${state}: ${workflows.length}个`)
      workflows.forEach(w => {
        const task = concurrentTasks.find(t => t.id === w.sessionId.split('-').pop())
        console.log(`      - ${w.sessionId} (${task?.description || 'Unknown'})`)
      })
    })
    
    // 检查状态转换历史
    console.log('\n  📚 状态转换历史统计:')
    testContexts.forEach(ctx => {
      const transitions = ctx.stateHistory.length
      const lastTransition = ctx.stateHistory[ctx.stateHistory.length - 1]
      console.log(`    ${ctx.sessionId}: ${transitions}次转换, 最后: ${lastTransition.state} (${lastTransition.timestamp})`)
    })
    
  } catch (error) {
    console.error('  ❌ 最终状态汇总失败:', error)
  }
  
  console.log('\n🎉 并发工作流状态管理测试完成!')
  
  // 6. 性能统计
  console.log('\n⚡ 性能统计:')
  console.log(`  ⏱️ 总测试时间: ${Date.now() - startTime}ms`)
  console.log(`  📊 成功工作流: ${successfulWorkflows.length}/${concurrentTasks.length}`)
  console.log(`  🎯 成功率: ${(successfulWorkflows.length / concurrentTasks.length * 100).toFixed(1)}%`)
}

// 辅助函数：清理测试数据
async function cleanupTestData() {
  console.log('\n🧹 清理测试数据...')
  try {
    const persistence = new FileBasedPersistence()
    const allContexts = await persistence.list()
    
    // 识别测试创建的工作流（可以通过时间戳或其他标识符）
    const recentWorkflows = allContexts.filter(ctx => {
      const createdTime = new Date(ctx.metadata.startTime).getTime()
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      return createdTime > fiveMinutesAgo
    })
    
    console.log(`  📊 发现 ${recentWorkflows.length} 个最近创建的工作流`)
    console.log('  ℹ️ 注意: 实际清理需要手动实现，这里仅显示统计信息')
    
  } catch (error) {
    console.error('  ❌ 清理失败:', error)
  }
}

// 运行测试
if (import.meta.main) {
  testConcurrentWorkflows()
    .then(() => cleanupTestData())
    .catch(error => {
      console.error('💥 并发测试失败:', error)
      process.exit(1)
    })
}