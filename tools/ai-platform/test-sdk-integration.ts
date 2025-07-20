#!/usr/bin/env bun
/**
 * 测试新的Gemini SDK集成和异步优化
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'

async function testSDKIntegration() {
  console.log('🧪 测试Gemini SDK集成和异步优化...\n')
  
  // 检查环境变量
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  请设置 GEMINI_API_KEY 环境变量来测试真实的API集成')
    console.log('💡 您可以在 https://makersuite.google.com/app/apikey 获取API密钥')
    console.log('🔧 示例: export GEMINI_API_KEY="your-api-key-here"\n')
    
    // 继续测试其他功能
    console.log('📋 测试其他功能...')
  }
  
  const aiManager = createHybridAIManager()
  
  // 1. 测试提供者状态
  console.log('📋 检查AI提供者状态:')
  const status = await aiManager.getProviderStatus()
  status.forEach(provider => {
    console.log(`  ${provider.name}: ${provider.available ? '✅ 可用' : '❌ 不可用'} (${provider.command})`)
  })
  console.log()
  
  // 2. 测试基础AI分析（如果有API密钥）
  if (process.env.GEMINI_API_KEY) {
    console.log('🤖 测试基础AI分析:')
    try {
      const basicResult = await aiManager.analyze({
        prompt: '简单回答: TypeScript相比JavaScript的主要优势是什么？',
        requiresAI: true,
        expectedFormat: 'text'
      })
      
      console.log(`  来源: ${basicResult.source}`)
      console.log(`  提供者: ${basicResult.provider}`)
      console.log(`  成功: ${basicResult.success}`)
      console.log(`  执行时间: ${basicResult.executionTime}ms`)
      console.log(`  回复: ${basicResult.content.substring(0, 200)}...`)
    } catch (error) {
      console.log(`  ❌ 基础测试失败: ${error}`)
    }
    console.log()
    
    // 3. 测试结构化JSON输出
    console.log('📊 测试结构化JSON输出:')
    try {
      const jsonResult = await aiManager.analyze({
        prompt: '以JSON格式返回TypeScript的3个主要特性',
        requiresAI: true,
        expectedFormat: 'json',
        enforceSchema: true
      })
      
      console.log(`  来源: ${jsonResult.source}`)
      console.log(`  成功: ${jsonResult.success}`)
      console.log(`  Schema验证: ${jsonResult.structured?.schema_valid}`)
      if (jsonResult.structured?.parsed) {
        console.log(`  解析结果:`, JSON.stringify(jsonResult.structured.parsed, null, 2))
      }
    } catch (error) {
      console.log(`  ❌ JSON测试失败: ${error}`)
    }
    console.log()
    
    // 4. 测试流式响应
    console.log('🌊 测试流式响应:')
    try {
      const streamResult = await aiManager.analyze({
        prompt: '简要介绍AI在软件开发中的应用',
        requiresAI: true,
        expectedFormat: 'text',
        stream: true
      })
      
      console.log(`  来源: ${streamResult.source}`)
      console.log(`  成功: ${streamResult.success}`)
      console.log(`  执行时间: ${streamResult.executionTime}ms`)
      console.log(`  回复: ${streamResult.content.substring(0, 300)}...`)
    } catch (error) {
      console.log(`  ❌ 流式测试失败: ${error}`)
    }
    console.log()
  }
  
  // 5. 测试模板系统
  console.log('📝 测试模板系统:')
  const categories = aiManager.getTemplateCategories()
  console.log(`  可用模板分类: ${categories.join(', ')}`)
  
  categories.forEach(category => {
    const templates = aiManager.getTemplatesByCategory(category)
    console.log(`  ${category}: ${templates.length}个模板`)
    templates.forEach(template => {
      console.log(`    - ${template.name} (${template.id})`)
    })
  })
  console.log()
  
  // 6. 测试规则引擎降级
  console.log('🔧 测试规则引擎降级:')
  const fallbackResult = await aiManager.analyze({
    prompt: '这是一个测试',
    requiresAI: false,
    ruleBasedFallback: () => '规则引擎生成的响应: 这是一个简单的测试任务'
  })
  
  console.log(`  来源: ${fallbackResult.source}`)
  console.log(`  成功: ${fallbackResult.success}`)
  console.log(`  内容: ${fallbackResult.content}`)
  
  console.log('\n✅ SDK集成测试完成')
  
  // 性能和稳定性提示
  console.log('\n📈 性能优化说明:')
  console.log('  ✅ 使用异步文件操作，避免阻塞事件循环')
  console.log('  ✅ 使用官方Gemini SDK，提供更好的性能和功能')
  console.log('  ✅ 实现命令注入防护，提高安全性')
  console.log('  ✅ 支持流式响应和函数调用等高级特性')
  console.log('  ✅ 完整的错误处理和降级策略')
}

// 运行测试
if (import.meta.main) {
  testSDKIntegration().catch(console.error)
}