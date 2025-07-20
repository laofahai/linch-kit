#!/usr/bin/env bun
/**
 * 自动审批时间计算验证测试
 * 测试不同复杂度和紧急程度的自动审批时间计算
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'
import { createAIWorkflowManager } from './src/workflow/ai-workflow-manager'
import { FileBasedPersistence } from './src/workflow/workflow-state-machine'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('auto-approval-timing-test')

async function testAutoApprovalTiming() {
  console.log('⏰ 开始自动审批时间计算验证测试...\n')
  
  const aiManager = createHybridAIManager()
  const persistence = new FileBasedPersistence()
  
  const testCases = [
    {
      description: '高复杂度任务 - 期望高紧急度（2小时自动审批）',
      taskDescription: '重构整个微服务架构并升级数据库',
      expectedComplexity: 5,
      expectedUrgency: 'high',
      expectedDelay: 2 * 60 * 60 * 1000 // 2小时
    },
    {
      description: '中等复杂度任务 - 期望中等紧急度（4小时自动审批）',
      taskDescription: '添加用户认证系统与权限管理',
      expectedComplexity: 3,
      expectedUrgency: 'medium', 
      expectedDelay: 4 * 60 * 60 * 1000 // 4小时
    },
    {
      description: '低复杂度任务 - 应直接跳过审批',
      taskDescription: '修复按钮文本拼写错误',
      expectedComplexity: 1,
      shouldSkipApproval: true
    }
  ]
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`📋 测试用例 ${i + 1}: ${testCase.description}`)
    
    try {
      const workflowManager = createAIWorkflowManager(aiManager)
      const startTime = Date.now()
      
      // 创建工作流
      const result = await workflowManager.analyzeWorkflow({
        taskDescription: testCase.taskDescription,
        userPreferences: {
          requireApproval: true, // 强制需要审批以测试时间计算
          preferredApproach: 'balanced'
        }
      })
      
      const analysisTime = Date.now() - startTime
      console.log(`  ⏱️ 分析耗时: ${analysisTime}ms`)
      console.log(`  🎚️ 实际复杂度: ${result.decision.estimatedEffort.complexity}/5`)
      console.log(`  📊 工作流状态: ${result.workflowState}`)
      
      // 检查复杂度是否符合预期
      if (testCase.expectedComplexity) {
        const complexityMatch = Math.abs(result.decision.estimatedEffort.complexity - testCase.expectedComplexity) <= 1
        console.log(`  ✅ 复杂度符合预期: ${complexityMatch ? '是' : '否'} (期望:${testCase.expectedComplexity}, 实际:${result.decision.estimatedEffort.complexity})`)
      }
      
      // 检查是否应该跳过审批
      if (testCase.shouldSkipApproval) {
        if (result.workflowState === 'APPROVED') {
          console.log(`  ✅ 正确跳过审批，直接进入APPROVED状态`)
        } else {
          console.log(`  ❌ 应该跳过审批但当前状态为: ${result.workflowState}`)
        }
      } else {
        // 检查审批时间计算
        if (result.workflowState === 'PENDING_APPROVAL') {
          const context = workflowManager.getWorkflowContext()
          if (context?.approvalRequest?.autoApproveAfter) {
            const requestedTime = new Date(context.approvalRequest.requestedAt).getTime()
            const autoApproveTime = new Date(context.approvalRequest.autoApproveAfter).getTime()
            const actualDelay = autoApproveTime - requestedTime
            
            console.log(`  📅 审批请求时间: ${context.approvalRequest.requestedAt}`)
            console.log(`  ⏰ 自动审批时间: ${context.approvalRequest.autoApproveAfter}`)
            console.log(`  ⏳ 实际延迟: ${Math.round(actualDelay / 1000 / 60)}分钟`)
            console.log(`  🎯 期望延迟: ${Math.round(testCase.expectedDelay! / 1000 / 60)}分钟`)
            console.log(`  🚨 紧急程度: ${context.approvalRequest.urgency}`)
            
            // 验证延迟时间是否正确（允许1分钟误差）
            const delayMatch = Math.abs(actualDelay - testCase.expectedDelay!) < 60 * 1000
            console.log(`  ✅ 延迟时间正确: ${delayMatch ? '是' : '否'}`)
            
            // 验证紧急程度
            if (testCase.expectedUrgency) {
              const urgencyMatch = context.approvalRequest.urgency === testCase.expectedUrgency
              console.log(`  ✅ 紧急程度正确: ${urgencyMatch ? '是' : '否'} (期望:${testCase.expectedUrgency}, 实际:${context.approvalRequest.urgency})`)
            }
          } else {
            console.log(`  ❌ 未找到自动审批时间设置`)
          }
        } else {
          console.log(`  ⚠️ 工作流未进入PENDING_APPROVAL状态: ${result.workflowState}`)
        }
      }
      
      console.log(`  🆔 会话ID: ${result.metadata.sessionId}`)
      
    } catch (error) {
      console.error(`  ❌ 测试用例失败: ${error}`)
    }
    
    console.log('') // 空行分隔
  }
  
  // 测试自动审批触发机制
  console.log('🤖 测试自动审批触发机制...')
  
  try {
    // 获取所有工作流状态
    const contexts = await persistence.list()
    const pendingApprovalWorkflows = contexts.filter(ctx => ctx.currentState === 'PENDING_APPROVAL')
    
    console.log(`📊 当前待审批工作流: ${pendingApprovalWorkflows.length}个`)
    
    for (const workflow of pendingApprovalWorkflows) {
      if (workflow.approvalRequest?.autoApproveAfter) {
        const autoApproveTime = new Date(workflow.approvalRequest.autoApproveAfter).getTime()
        const currentTime = Date.now()
        const timeUntilAutoApprove = autoApproveTime - currentTime
        
        console.log(`  🆔 ${workflow.sessionId}:`)
        console.log(`    ⏰ 自动审批时间: ${workflow.approvalRequest.autoApproveAfter}`)
        console.log(`    ⏳ 距离自动审批: ${Math.round(timeUntilAutoApprove / 1000 / 60)}分钟`)
        
        if (timeUntilAutoApprove <= 0) {
          console.log(`    🎯 可以立即自动审批`)
        } else {
          console.log(`    ⏳ 需要等待 ${Math.round(timeUntilAutoApprove / 1000 / 60)} 分钟`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 自动审批触发机制测试失败:', error)
  }
  
  console.log('\n🎉 自动审批时间计算验证测试完成!')
}

// 辅助函数：格式化时间差
function formatTimeDiff(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 1000 / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours > 0) {
    return `${hours}小时${remainingMinutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// 运行测试
if (import.meta.main) {
  testAutoApprovalTiming().catch(error => {
    console.error('💥 测试失败:', error)
    process.exit(1)
  })
}