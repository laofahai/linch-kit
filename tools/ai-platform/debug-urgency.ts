#!/usr/bin/env bun
/**
 * 调试紧急度分类逻辑
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'
import { createAIWorkflowManager } from './src/workflow/ai-workflow-manager'

async function debugUrgencyClassification() {
  console.log('🔍 调试紧急度分类逻辑...\n')
  
  const aiManager = createHybridAIManager()
  const workflowManager = createAIWorkflowManager(aiManager)
  
  const result = await workflowManager.analyzeWorkflow({
    taskDescription: '添加用户认证系统与权限管理',
    userPreferences: {
      requireApproval: true,
      preferredApproach: 'balanced'
    }
  })
  
  console.log('📊 工作流分析结果:')
  console.log(`  🎚️ 复杂度: ${result.decision.estimatedEffort.complexity}/5`)
  console.log(`  ⚠️ 风险列表:`)
  result.decision.risks.forEach((risk, index) => {
    console.log(`    ${index + 1}. ${risk}`)
    if (risk.includes('安全') || risk.includes('数据')) {
      console.log(`       🚨 包含关键词，会触发高紧急度`)
    }
  })
  
  const context = workflowManager.getWorkflowContext()
  if (context?.approvalRequest) {
    console.log(`  🚨 实际紧急程度: ${context.approvalRequest.urgency}`)
  }
  
  // 手动验证紧急度逻辑
  const { complexity, risks } = result.decision
  let expectedUrgency: 'low' | 'medium' | 'high'
  
  if (complexity >= 5 || risks.some(risk => risk.includes('安全') || risk.includes('数据'))) {
    expectedUrgency = 'high'
  } else if (complexity >= 3) {
    expectedUrgency = 'medium'
  } else {
    expectedUrgency = 'low'
  }
  
  console.log(`  🎯 预期紧急程度: ${expectedUrgency}`)
  console.log(`  ✅ 分类正确: ${context?.approvalRequest?.urgency === expectedUrgency ? '是' : '否'}`)
}

if (import.meta.main) {
  debugUrgencyClassification().catch(console.error)
}