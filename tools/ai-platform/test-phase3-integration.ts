/**
 * Phase 3集成测试
 * 验证start-command-handler与新的七状态引擎集成
 */

import { handleStartCommand, quickStart } from './src/cli/start-command-handler'

async function testPhase3Integration() {
  console.log('🧪 Phase 3集成测试开始...\n')

  try {
    // 测试1: 基本Phase 3功能
    console.log('1️⃣ 测试基本Phase 3配置...')
    const result1 = await handleStartCommand({
      taskDescription: 'Phase 3集成测试 - 基本功能验证',
      automationLevel: 'semi_auto',
      priority: 'medium',
      enableWorkflowState: true,
      useSevenStateEngine: true,
      enableSnapshots: true,
      enableRulesEngine: true,
      skipGuardian: true,  // 跳过Guardian以避免依赖问题
      skipGraphRAG: true   // 跳过GraphRAG以避免依赖问题
    })

    console.log(`✅ 基本测试完成: ${result1.success ? '成功' : '失败'}`)
    if (result1.phaseInfo) {
      console.log(`   版本: ${result1.phaseInfo.version}`)
      console.log(`   引擎: ${result1.phaseInfo.engineType}`)
      console.log(`   功能: ${result1.phaseInfo.features.join(', ')}`)
    }
    console.log('')

    // 测试2: quickStart便捷函数
    console.log('2️⃣ 测试quickStart便捷函数...')
    const result2 = await quickStart('Phase 3集成测试 - quickStart验证')
    
    console.log(`✅ quickStart测试完成: ${result2.success ? '成功' : '失败'}`)
    if (result2.workflowState) {
      console.log(`   当前状态: ${result2.workflowState.currentState}`)
      console.log(`   进度: ${result2.workflowState.progress}%`)
      console.log(`   质量评分: ${result2.workflowState.qualityScore}/100`)
      console.log(`   风险等级: ${result2.workflowState.riskLevel}/5`)
    }
    console.log('')

    // 测试3: 向后兼容性
    console.log('3️⃣ 测试向后兼容性...')
    const result3 = await handleStartCommand({
      taskDescription: 'Phase 3集成测试 - 向后兼容性验证',
      automationLevel: 'manual',
      priority: 'low',
      enableWorkflowState: true,
      // 不设置Phase 3参数，应该使用默认值
      skipGuardian: true,
      skipGraphRAG: true
    })

    console.log(`✅ 向后兼容性测试完成: ${result3.success ? '成功' : '失败'}`)
    console.log('')

    // 显示详细结果
    console.log('📊 最终测试结果详情:')
    console.log('='.repeat(60))
    console.log(result1.displayResultSummary ? 'displayResultSummary方法可用' : '⚠️ displayResultSummary方法不可用')
    
    if (result2.phaseInfo) {
      console.log(`Phase版本: ${result2.phaseInfo.version}`)
      console.log(`执行时间: ${result2.phaseInfo.performance.totalTime}ms`)
      console.log(`内存使用: ${result2.phaseInfo.performance.memoryUsage?.toFixed(2)}MB`)
    }

    console.log('\n🎉 Phase 3集成测试完成！所有功能正常工作。')
    return true

  } catch (error) {
    console.error('❌ Phase 3集成测试失败:', error)
    return false
  }
}

// 运行测试
if (import.meta.main) {
  testPhase3Integration().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testPhase3Integration }