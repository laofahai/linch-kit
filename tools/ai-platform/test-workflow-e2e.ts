#!/usr/bin/env bun
/**
 * 端到端工作流测试
 * 测试完整的：分析 → 审批 → 实施 → 完成 流程
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'
import { createAIWorkflowManager } from './src/workflow/ai-workflow-manager'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('workflow-e2e-test')

async function testCompleteWorkflow() {
  console.log('🧪 开始端到端工作流测试...\n')
  
  const aiManager = createHybridAIManager()
  const workflowManager = createAIWorkflowManager(aiManager)
  
  try {
    // 1. 创建一个简单的工作流分析
    console.log('📊 步骤1: 创建工作流分析')
    const workflowResult = await workflowManager.analyzeWorkflow({
      taskDescription: '添加简单的用户注册功能',
      projectContext: {
        name: 'LinchKit',
        currentBranch: 'feature/e2e-test'
      },
      userPreferences: {
        preferredApproach: 'balanced',
        requireApproval: true,
        autoImplement: false
      }
    })

    console.log(`  ✅ 工作流创建成功: ${workflowResult.metadata.sessionId}`)
    console.log(`  🎚️ 复杂度: ${workflowResult.decision.estimatedEffort.complexity}/5`)
    console.log(`  ⏱️ 预估工时: ${workflowResult.decision.estimatedEffort.hours}小时`)
    console.log(`  📋 当前状态: ${workflowResult.workflowState}`)
    
    const sessionId = workflowResult.metadata.sessionId
    
    // 2. 检查工作流状态
    console.log('\n🔍 步骤2: 检查工作流状态')
    const currentState = workflowManager.getCurrentWorkflowState()
    const availableActions = workflowManager.getAvailableWorkflowActions()
    
    console.log(`  📊 当前状态: ${currentState}`)
    console.log(`  🎬 可用操作: ${availableActions.join(', ')}`)
    
    // 3. 测试审批流程
    console.log('\n✅ 步骤3: 测试审批流程')
    if (workflowManager.checkApprovalRequired()) {
      console.log('  🔔 工作流需要审批')
      
      // 测试批准
      const approvalSuccess = await workflowManager.approveWorkflow(
        'test-user', 
        '测试批准：功能简单，风险较低'
      )
      
      if (approvalSuccess) {
        console.log('  ✅ 工作流审批成功')
        console.log(`  📊 新状态: ${workflowManager.getCurrentWorkflowState()}`)
      } else {
        console.log('  ❌ 工作流审批失败')
        return
      }
    } else {
      console.log('  ℹ️ 工作流不需要审批')
    }
    
    // 4. 测试实施流程
    console.log('\n🚧 步骤4: 测试实施流程')
    const implementationSuccess = await workflowManager.startImplementation('test-implementer')
    
    if (implementationSuccess) {
      console.log('  ✅ 实施已开始')
      console.log(`  📊 新状态: ${workflowManager.getCurrentWorkflowState()}`)
      
      // 模拟实施进度更新
      const progressSteps = [
        { progress: 20, step: '创建用户注册表单' },
        { progress: 40, step: '实现后端注册API' },
        { progress: 60, step: '添加数据验证' },
        { progress: 80, step: '编写测试用例' },
        { progress: 100, step: '完成代码审查' }
      ]
      
      console.log('  📈 模拟实施进度:')
      for (const step of progressSteps) {
        workflowManager.updateImplementationProgress(step.progress, step.step)
        console.log(`    ${step.progress}% - ${step.step}`)
        
        // 模拟实施时间
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } else {
      console.log('  ❌ 实施启动失败')
      return
    }
    
    // 5. 完成实施
    console.log('\n🎯 步骤5: 完成实施')
    const completionSuccess = await workflowManager.executeWorkflowAction(
      'COMPLETE_IMPLEMENTATION',
      { completedBy: 'test-implementer', finalNotes: '所有功能已实现并通过测试' }
    )
    
    if (completionSuccess) {
      console.log('  ✅ 实施完成成功')
      console.log(`  📊 最终状态: ${workflowManager.getCurrentWorkflowState()}`)
    } else {
      console.log('  ❌ 实施完成失败')
    }
    
    // 6. 获取完整的工作流上下文
    console.log('\n📋 步骤6: 工作流总结')
    const finalContext = workflowManager.getWorkflowContext()
    console.log(`  🆔 会话ID: ${sessionId}`)
    console.log(`  📊 最终状态: ${finalContext?.currentState || 'unknown'}`)
    console.log(`  ⏱️ 总耗时: ${finalContext?.metadata?.totalDuration || 'N/A'}ms`)
    
    if (finalContext?.stateHistory) {
      console.log('  📚 状态历史:')
      finalContext.stateHistory.forEach((entry, index) => {
        console.log(`    ${index + 1}. ${entry.state} (${entry.action}) - ${entry.timestamp}`)
      })
    }
    
    console.log('\n🎉 端到端工作流测试完成!')
    
  } catch (error) {
    console.error('❌ 端到端测试失败:', error)
    throw error
  }
}

// 测试自动审批机制
async function testAutoApprovalMechanism() {
  console.log('\n🤖 测试自动审批机制...')
  
  const aiManager = createHybridAIManager()
  const workflowManager = createAIWorkflowManager(aiManager)
  
  try {
    // 创建一个低复杂度的工作流（应该触发自动审批）
    const simpleWorkflow = await workflowManager.analyzeWorkflow({
      taskDescription: '修复拼写错误',
      userPreferences: {
        preferredApproach: 'conservative',
        requireApproval: false, // 不强制要求审批
        autoImplement: true
      }
    })
    
    console.log(`  📊 工作流复杂度: ${simpleWorkflow.decision.estimatedEffort.complexity}/5`)
    console.log(`  ⚖️ 需要审批: ${simpleWorkflow.decision.requiresApproval ? '是' : '否'}`)
    
    if (simpleWorkflow.decision.requiresApproval) {
      const autoApprovalEnabled = workflowManager.checkAutoApproval()
      console.log(`  🤖 自动审批: ${autoApprovalEnabled ? '启用' : '禁用'}`)
    }
    
    console.log('  ✅ 自动审批机制测试完成')
    
  } catch (error) {
    console.error('  ❌ 自动审批测试失败:', error)
  }
}

// 运行所有测试
if (import.meta.main) {
  Promise.resolve()
    .then(() => testCompleteWorkflow())
    .then(() => testAutoApprovalMechanism())
    .catch(error => {
      console.error('💥 测试套件失败:', error)
      process.exit(1)
    })
}