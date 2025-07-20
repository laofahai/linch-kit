#!/usr/bin/env bun

/**
 * 简化的集成测试
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('simple-test')

async function testBasicComponents() {
  logger.info('🧪 基础组件测试')
  
  try {
    // 测试各个组件能否正常导入
    const workflowManager = await import('./src/workflow/ai-workflow-manager')
    logger.info('✅ AI工作流管理器')
    
    const stateMachine = await import('./src/workflow/workflow-state-machine')
    logger.info('✅ 工作流状态机')
    
    const hybridAI = await import('./src/providers/hybrid-ai-manager')
    logger.info('✅ 混合AI管理器')
    
    const geminiProvider = await import('./src/providers/gemini-sdk-provider')
    logger.info('✅ Gemini SDK提供者')
    
    const promptEngine = await import('./src/prompt/template-engine')
    logger.info('✅ Prompt模板引擎')
    
    logger.info('🎉 所有核心组件导入成功')
    
    // 测试类型创建
    const { createWorkflowStateMachine } = stateMachine
    const testStateMachine = createWorkflowStateMachine('test-session', '测试任务')
    logger.info('✅ 状态机创建成功，当前状态:', testStateMachine.getCurrentState())
    
    logger.info('🎊 基础功能测试完成')
    
  } catch (error) {
    logger.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

async function main() {
  await testBasicComponents()
  logger.info('✅ 所有测试通过')
}

main().catch(console.error)