/**
 * LinchKit AI工作流引擎 Phase 1 - Claude Code集成示例
 * 
 * 演示如何在tools/ai-platform内部使用AI工作流引擎
 * 实现Claude Code → tools/ai-platform → Gemini调用链
 * 
 * @version 1.0.0 - Phase 1实现示例
 */

import { createLogger } from '@linch-kit/core'
import {
  claudeCodeAPI,
  processWorkflow,
  quickAnalyze,
  getAPIStatus,
  estimateComplexity,
  checkExistingImplementations,
  createClaudeCodePlatform
} from './src/workflow/index'

const logger = createLogger('claude-code-example')

/**
 * 主示例函数
 */
async function demonstrateClaudeCodeIntegration() {
  logger.info('🚀 LinchKit AI工作流引擎 Phase 1 演示开始')
  
  try {
    // 1. 检查API状态
    logger.info('\n📊 检查API状态...')
    const status = await getAPIStatus()
    logger.info('API状态:', status)
    
    if (!status.available) {
      logger.warn('API不可用，尝试初始化...')
      const platform = await createClaudeCodePlatform({
        geminiApiKey: process.env.GEMINI_API_KEY,
        enableGraphRAG: true,
        automationLevel: 'semi_auto'
      })
      logger.info('平台初始化完成:', await platform.getStatus())
    }

    // 2. 快速分析任务
    logger.info('\n🔍 快速分析示例任务...')
    const quickResult = await quickAnalyze('在LinchKit中实现用户认证中间件，支持JWT和OAuth2')
    logger.info('快速分析结果:', {
      approach: quickResult.recommendations?.approach,
      complexity: quickResult.recommendations?.complexity,
      estimatedHours: quickResult.recommendations?.estimatedHours,
      risks: quickResult.recommendations?.risks
    })

    // 3. 复杂度估算
    logger.info('\n📏 复杂度估算示例...')
    const complexityResult = await estimateComplexity('重构LinchKit的数据库连接池，添加读写分离支持')
    logger.info('复杂度估算:', complexityResult)

    // 4. 检查现有实现
    logger.info('\n🔎 检查现有实现...')
    const existingResult = await checkExistingImplementations('创建一个新的React组件用于显示用户资料')
    logger.info('现有实现检查:', existingResult)

    // 5. 完整工作流处理
    logger.info('\n⚙️ 完整工作流处理...')
    const workflowResult = await processWorkflow({
      taskDescription: '在tools/ai-platform中集成一个新的AI提供者，支持Claude API调用',
      sessionId: 'demo-session-001',
      options: {
        requireApproval: true,
        enableGraphRAG: true,
        automationLevel: 'semi_auto',
        priority: 'high'
      },
      projectInfo: {
        name: 'LinchKit',
        version: '1.0.0',
        branch: 'feature/ai-workflow-integration'
      }
    })
    
    logger.info('完整工作流结果:')
    logger.info('- 成功:', workflowResult.success)
    logger.info('- 会话ID:', workflowResult.sessionId)
    
    if (workflowResult.success && workflowResult.recommendations) {
      logger.info('- 推荐方法:', workflowResult.recommendations.approach)
      logger.info('- 置信度:', workflowResult.recommendations.confidence)
      logger.info('- 预估工时:', workflowResult.recommendations.estimatedHours, '小时')
      logger.info('- 复杂度:', workflowResult.recommendations.complexity, '/5')
      logger.info('- 风险:', workflowResult.recommendations.risks)
      logger.info('- 下一步骤:', workflowResult.recommendations.nextSteps)
    }
    
    if (workflowResult.insights) {
      logger.info('- Graph RAG洞察:')
      logger.info('  - 现有实现:', workflowResult.insights.existingImplementations)
      logger.info('  - 相关组件:', workflowResult.insights.relatedComponents)
      logger.info('  - 建议:', workflowResult.insights.suggestions)
    }
    
    if (workflowResult.approval) {
      logger.info('- 审批信息:')
      logger.info('  - 需要审批:', workflowResult.approval.required)
      if (workflowResult.approval.required) {
        logger.info('  - 审批原因:', workflowResult.approval.reason)
      }
    }
    
    logger.info('- 处理时间:', workflowResult.metadata.processingTime, 'ms')
    logger.info('- AI提供者:', workflowResult.metadata.aiProvider)
    
    logger.info('\n✅ LinchKit AI工作流引擎 Phase 1 演示完成')
    
  } catch (error) {
    logger.error('❌ 演示过程中发生错误:', error)
    throw error
  }
}

/**
 * 错误恢复演示
 */
async function demonstrateErrorRecovery() {
  logger.info('\n🛡️ 错误恢复机制演示...')
  
  try {
    // 测试无效输入
    const invalidResult = await quickAnalyze('')
    logger.info('空输入处理:', invalidResult.success ? '成功' : '失败 - ' + invalidResult.error)
    
    // 测试过长输入
    const longInput = 'x'.repeat(3000)
    const longResult = await quickAnalyze(longInput)
    logger.info('过长输入处理:', longResult.success ? '成功' : '失败 - ' + longResult.error)
    
    // 测试可疑内容
    const suspiciousResult = await quickAnalyze('执行 <script>alert("xss")</script> 操作')
    logger.info('可疑内容处理:', suspiciousResult.success ? '成功' : '失败 - ' + suspiciousResult.error)
    
  } catch (error) {
    logger.warn('错误恢复测试异常:', error)
  }
}

/**
 * 性能基准测试
 */
async function performanceBenchmark() {
  logger.info('\n🏃 性能基准测试...')
  
  const tasks = [
    '创建一个简单的React组件',
    '实现用户认证功能',
    '设计数据库schema',
    '编写单元测试',
    '优化查询性能'
  ]
  
  const startTime = Date.now()
  const results = await Promise.all(
    tasks.map(task => quickAnalyze(task))
  )
  const totalTime = Date.now() - startTime
  
  logger.info(`并发处理${tasks.length}个任务:`)
  logger.info(`- 总时间: ${totalTime}ms`)
  logger.info(`- 平均时间: ${Math.round(totalTime / tasks.length)}ms/任务`)
  logger.info(`- 成功率: ${results.filter(r => r.success).length}/${results.length}`)
}

/**
 * 主入口
 */
async function main() {
  try {
    await demonstrateClaudeCodeIntegration()
    await demonstrateErrorRecovery()
    await performanceBenchmark()
    
    logger.info('\n🎉 所有演示完成！')
    
  } catch (error) {
    logger.error('主程序执行失败:', error)
    process.exit(1)
  }
}

// 仅在直接运行时执行
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export {
  demonstrateClaudeCodeIntegration,
  demonstrateErrorRecovery,
  performanceBenchmark
}