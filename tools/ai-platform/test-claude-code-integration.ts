#!/usr/bin/env bun

/**
 * LinchKit AI工作流引擎 Phase 1 - 快速集成测试
 * 
 * 验证Claude Code集成的基本功能
 * 可以在开发过程中快速运行来验证功能
 * 
 * 运行方式: bun run test-claude-code-integration.ts
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('claude-code-test')

async function quickTest() {
  logger.info('🧪 Claude Code集成快速测试开始')
  
  try {
    // 1. 检查基本导入
    logger.info('📦 检查模块导入...')
    const { getAPIStatus, quickAnalyze } = await import('./src/workflow/claude-code-api')
    logger.info('✅ 模块导入成功')
    
    // 2. 检查API状态（不需要完整初始化）
    logger.info('🔍 检查API基本状态...')
    const status = await getAPIStatus()
    logger.info('API状态:', {
      available: status.available,
      providers: status.providers.length,
      error: status.lastError
    })
    
    // 3. 尝试快速分析（如果API可用）
    if (status.available) {
      logger.info('🚀 执行快速分析测试...')
      const result = await quickAnalyze('创建一个简单的TypeScript函数')
      logger.info('快速分析结果:', {
        success: result.success,
        hasRecommendations: !!result.recommendations,
        processingTime: result.metadata.processingTime
      })
    } else {
      logger.warn('⚠️ API不可用，跳过实际分析测试')
      logger.info('提示: 确保设置了GEMINI_API_KEY环境变量')
    }
    
    // 4. 测试错误处理
    logger.info('🛡️ 测试错误处理...')
    const errorResult = await quickAnalyze('')
    logger.info('空输入处理:', {
      success: errorResult.success,
      hasError: !!errorResult.error
    })
    
    logger.info('✅ 快速测试完成')
    
  } catch (error) {
    logger.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

async function validateComponents() {
  logger.info('🔧 验证核心组件...')
  
  const components = [
    './src/workflow/ai-workflow-manager',
    './src/workflow/workflow-state-machine', 
    './src/workflow/claude-code-scheduler',
    './src/workflow/claude-code-api',
    './src/providers/hybrid-ai-manager',
    './src/providers/gemini-sdk-provider',
    './src/query/intelligent-query-engine',
    './src/prompt/template-engine'
  ]
  
  for (const component of components) {
    try {
      await import(component)
      logger.info(`✅ ${component.split('/').pop()}`)
    } catch (error) {
      logger.error(`❌ ${component.split('/').pop()}: ${error}`)
    }
  }
}

async function main() {
  logger.info('🏁 开始LinchKit AI工作流引擎Phase 1集成测试')
  
  await validateComponents()
  await quickTest()
  
  logger.info('🎉 所有测试完成')
}

// 运行测试
main().catch(error => {
  console.error('未处理的错误:', error)
  process.exit(1)
})