#!/usr/bin/env bun
/**
 * AI CLI 测试脚本
 * 检查本地安装的AI CLI工具是否可用
 */

import { createHybridAIManager } from '../src/provider/hybrid-ai-manager'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('ai-cli-test')

async function main() {
  logger.info('🔍 检查AI CLI工具可用性...')
  
  const aiManager = createHybridAIManager()
  
  // 检查所有提供者状态
  const providerStatus = await aiManager.getProviderStatus()
  
  logger.info('\n📊 AI CLI 状态报告:')
  logger.info('=' * 50)
  
  let availableCount = 0
  
  for (const provider of providerStatus) {
    const status = provider.available ? '✅ 可用' : '❌ 不可用'
    logger.info(`  ${provider.name.padEnd(10)} | ${provider.command.padEnd(20)} | ${status}`)
    
    if (provider.available) {
      availableCount++
    }
  }
  
  logger.info('=' * 50)
  logger.info(`📈 可用提供者: ${availableCount}/${providerStatus.length}`)
  
  if (availableCount === 0) {
    logger.warn('\n⚠️ 没有可用的AI CLI工具!')
    logger.warn('请安装以下任一CLI工具:')
    logger.warn('  • gemini CLI: npm install -g @google/generative-ai-cli')
    logger.warn('  • claude CLI: https://github.com/anthropics/claude-cli')
    logger.warn('  • chatgpt CLI: npm install -g chatgpt-cli')
    logger.warn('  • ollama: https://ollama.ai/')
    process.exit(1)
  }
  
  // 测试AI分析
  logger.info('\n🧪 测试AI分析功能...')
  
  const testPrompt = '简单回答: 2+2等于多少?'
  
  try {
    const result = await aiManager.analyze({
      prompt: testPrompt,
      requiresAI: true,
      ruleBasedFallback: () => '4 (规则引擎回答)'
    })
    
    logger.info('\n✅ AI分析测试结果:')
    logger.info(`  内容: ${result.content}`)
    logger.info(`  来源: ${result.source}`)
    logger.info(`  提供者: ${result.provider || 'N/A'}`)
    logger.info(`  执行时间: ${result.executionTime}ms`)
    logger.info(`  置信度: ${result.confidence}`)
    
  } catch (error) {
    logger.error('❌ AI分析测试失败:', error)
    process.exit(1)
  }
  
  logger.info('\n🎉 AI CLI集成测试完成!')
}

if (import.meta.main) {
  main().catch(console.error)
}