#!/usr/bin/env bun
/**
 * AI Provider状态检查工具
 */

import { createHybridAIManager } from '../src/providers/hybrid-ai-manager'

async function checkProviderStatus() {
  console.log('🔧 AI Provider状态检查\n')
  
  const aiManager = createHybridAIManager()
  const status = await aiManager.getProviderStatus()
  
  console.log('📊 提供者状态:')
  status.forEach(provider => {
    const statusIcon = provider.available ? '✅' : '❌'
    console.log(`  ${statusIcon} ${provider.name.padEnd(10)} (${provider.command})`)
  })
  
  const availableCount = status.filter(p => p.available).length
  console.log(`\n📈 总计: ${availableCount}/${status.length} 个提供者可用`)
  
  // 显示配置建议
  const unavailable = status.filter(p => !p.available)
  if (unavailable.length > 0) {
    console.log('\n💡 配置建议:')
    unavailable.forEach(provider => {
      switch (provider.name) {
        case 'gemini':
          console.log(`  - 安装Gemini CLI: npm install -g @google/gemini-cli`)
          break
        case 'claude':
          console.log(`  - 安装Claude CLI: npm install -g @anthropic/claude-cli`)
          break
        case 'chatgpt':
          console.log(`  - 安装ChatGPT CLI: npm install -g chatgpt-cli`)
          break
        case 'ollama':
          console.log(`  - 安装Ollama: https://ollama.ai/download`)
          break
      }
    })
  }
}

if (import.meta.main) {
  checkProviderStatus().catch(console.error)
}