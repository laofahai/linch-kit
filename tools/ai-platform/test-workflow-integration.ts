#!/usr/bin/env bun
/**
 * 测试AI工作流完整集成
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'
import { createAIWorkflowManager } from './src/workflow/ai-workflow-manager'

async function testWorkflowIntegration() {
  console.log('🧪 测试AI工作流完整集成...\n')
  
  // 1. 初始化管理器
  const aiManager = createHybridAIManager()
  const workflowManager = createAIWorkflowManager(aiManager)
  
  console.log(`🆔 会话ID: ${workflowManager.getSessionId()}`)
  
  // 2. 测试简单工作流分析
  console.log('\n📊 测试简单工作流分析:')
  try {
    const simpleResult = await workflowManager.analyzeWorkflow({
      taskDescription: '添加用户登录功能',
      projectContext: {
        name: 'LinchKit',
        currentBranch: 'feature/user-auth'
      },
      userPreferences: {
        preferredApproach: 'balanced',
        requireApproval: false
      }
    })
    
    console.log(`  ✅ 分析完成 (${simpleResult.metadata.processingTime}ms)`)
    console.log(`  📈 Graph RAG: ${simpleResult.graphRAG.success ? '成功' : '失败'}`)
    console.log(`  🎯 上下文发现: ${simpleResult.graphRAG.contextFound ? '是' : '否'}`)
    console.log(`  🤖 AI分析: ${simpleResult.aiAnalysis.success ? '成功' : '失败'}`)
    console.log(`  📋 推荐方案: ${simpleResult.decision.approach}`)
    console.log(`  ⚖️ 置信度: ${(simpleResult.decision.confidence * 100).toFixed(1)}%`)
    console.log(`  ⏱️ 预估工时: ${simpleResult.decision.estimatedEffort.hours}小时`)
    console.log(`  🎚️ 复杂度: ${simpleResult.decision.estimatedEffort.complexity}/5`)
    console.log(`  ✋ 需要审批: ${simpleResult.decision.requiresApproval ? '是' : '否'}`)
    
    if (simpleResult.decision.nextSteps.length > 0) {
      console.log(`  📝 后续步骤:`)
      simpleResult.decision.nextSteps.forEach((step, index) => {
        console.log(`    ${index + 1}. ${step}`)
      })
    }
    
    if (simpleResult.graphRAG.suggestions.existingImplementations.length > 0) {
      console.log(`  🔍 发现现有实现:`)
      simpleResult.graphRAG.suggestions.existingImplementations.slice(0, 3).forEach(impl => {
        console.log(`    - ${impl}`)
      })
    }
    
    // 验证结果
    const isValid = workflowManager.validateWorkflowResult(simpleResult)
    console.log(`  ✅ 结果验证: ${isValid ? '通过' : '失败'}`)
    
  } catch (error) {
    console.log(`  ❌ 简单工作流测试失败: ${error}`)
  }
  
  // 3. 测试复杂工作流分析
  console.log('\n🏗️ 测试复杂工作流分析:')
  try {
    const complexResult = await workflowManager.analyzeWorkflow({
      taskDescription: '重构整个认证系统，支持多种认证方式（JWT、OAuth、SSO）并集成权限管理',
      projectContext: {
        name: 'LinchKit',
        version: '2.0.0',
        currentBranch: 'feature/auth-refactor',
        recentCommits: ['feat: 添加基础认证', 'fix: 修复权限检查']
      },
      userPreferences: {
        preferredApproach: 'conservative',
        requireApproval: true,
        autoImplement: false
      }
    })
    
    console.log(`  ✅ 复杂分析完成 (${complexResult.metadata.processingTime}ms)`)
    console.log(`  📊 推荐方案: ${complexResult.decision.approach}`)
    console.log(`  🎯 推理: ${complexResult.decision.reasoning}`)
    console.log(`  ⚠️ 风险识别: ${complexResult.decision.risks.length}个`)
    
    if (complexResult.decision.risks.length > 0) {
      complexResult.decision.risks.slice(0, 3).forEach(risk => {
        console.log(`    - ${risk}`)
      })
    }
    
  } catch (error) {
    console.log(`  ❌ 复杂工作流测试失败: ${error}`)
  }
  
  // 4. 测试提供者状态
  console.log('\n🔧 AI提供者状态:')
  const providerStatus = await aiManager.getProviderStatus()
  providerStatus.forEach(provider => {
    console.log(`  ${provider.name}: ${provider.available ? '✅' : '❌'} (${provider.command})`)
  })
  
  // 5. 测试模板系统
  console.log('\n📝 模板系统状态:')
  const categories = aiManager.getTemplateCategories()
  console.log(`  可用分类: ${categories.join(', ')}`)
  
  let totalTemplates = 0
  categories.forEach(category => {
    const templates = aiManager.getTemplatesByCategory(category)
    totalTemplates += templates.length
    console.log(`  ${category}: ${templates.length}个模板`)
  })
  console.log(`  总计: ${totalTemplates}个模板`)
  
  console.log('\n🎉 AI工作流集成测试完成!')
}

// 运行测试
if (import.meta.main) {
  testWorkflowIntegration().catch(console.error)
}