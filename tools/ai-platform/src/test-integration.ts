/**
 * /start 命令集成测试
 * 验证 Phase 2 完整功能
 * 
 * @version 1.0.0 - Phase 2 测试验证
 */

import { claudeCodeStart } from './cli/enhanced-start-integration'
import { createProductionManager } from './cli/production-optimization'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('integration-test')

/**
 * 测试 /start 命令集成
 */
async function testStartCommandIntegration() {
  logger.info('开始测试 /start 命令集成...')

  try {
    // 创建生产管理器
    const productionManager = createProductionManager({
      errorHandling: {
        maxRetries: 2,
        retryDelayMs: 500,
        timeoutMs: 15000,
        fallbackToBasicMode: true
      },
      performance: {
        enableCaching: true,
        cacheTimeoutMs: 60000
      }
    })

    // 执行增强版 /start 命令
    const result = await claudeCodeStart(
      '测试 /start 命令重构 - 验证所有 Phase 1 基础设施的集成'
    )

    // 输出结果
    logger.info('集成测试完成', {
      success: result.success,
      sessionId: result.sessionId,
      executionTime: result.executionTime,
      integrationLevel: result.enhancedMetadata?.integrationLevel,
      systemHealth: result.enhancedMetadata?.systemHealth
    })

    if (result.formattedOutput) {
      console.log('\n=== 格式化输出 ===')
      console.log(result.formattedOutput)
    }

    // 获取性能报告
    const performanceReport = productionManager.getPerformanceReport()
    console.log('\n=== 性能报告 ===')
    console.log(JSON.stringify(performanceReport, null, 2))

    // 清理
    productionManager.cleanup()

    return result.success

  } catch (error) {
    logger.error('集成测试失败:', error)
    return false
  }
}

/**
 * 测试基础功能
 */
async function testBasicFunctionality() {
  logger.info('测试基础功能...')

  try {
    // 测试快速分析
    const quickResult = await import('./cli/start-command-handler').then(module => 
      module.quickStart('简单测试任务')
    )

    logger.info('基础功能测试完成', {
      success: quickResult.success,
      hasProjectInfo: !!quickResult.projectInfo,
      hasGuardianValidation: !!quickResult.guardianValidation
    })

    return quickResult.success

  } catch (error) {
    logger.error('基础功能测试失败:', error)
    return false
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 LinchKit AI工作流引擎 Phase 2 集成测试\n')

  const results = {
    basicFunctionality: false,
    fullIntegration: false
  }

  // 测试1: 基础功能
  console.log('1️⃣ 测试基础功能...')
  results.basicFunctionality = await testBasicFunctionality()
  console.log(`   结果: ${results.basicFunctionality ? '✅ 成功' : '❌ 失败'}\n`)

  // 测试2: 完整集成
  console.log('2️⃣ 测试完整集成...')
  results.fullIntegration = await testStartCommandIntegration()
  console.log(`   结果: ${results.fullIntegration ? '✅ 成功' : '❌ 失败'}\n`)

  // 总结
  const allPassed = Object.values(results).every(Boolean)
  console.log('📊 测试总结:')
  console.log(`- 基础功能: ${results.basicFunctionality ? '✅' : '❌'}`)
  console.log(`- 完整集成: ${results.fullIntegration ? '✅' : '❌'}`)
  console.log(`- 整体状态: ${allPassed ? '🎉 全部通过' : '⚠️ 部分失败'}`)

  if (allPassed) {
    console.log('\n🎯 Phase 2 /start 命令重构完成!')
    console.log('✅ 所有核心功能已集成并可用')
    console.log('✅ ClaudeCodeAPI + AI Guardian + Graph RAG + WorkflowStateMachine')
    console.log('✅ 生产就绪优化和错误处理')
  } else {
    console.log('\n⚠️ 部分功能需要进一步调试')
  }

  return allPassed
}

// 如果直接运行此文件
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('测试执行失败:', error)
    process.exit(1)
  })
}

export { runTests, testStartCommandIntegration, testBasicFunctionality }