#!/usr/bin/env bun
/**
 * 测试Gemini CLI集成和结构化Prompt系统
 */

import { createHybridAIManager } from './src/providers/hybrid-ai-manager'

async function testGeminiIntegration() {
  console.log('🧪 测试Gemini CLI集成和Prompt模板系统...\n')
  
  const aiManager = createHybridAIManager()
  
  // 1. 测试提供者状态
  console.log('📋 检查AI提供者状态:')
  const status = await aiManager.getProviderStatus()
  status.forEach(provider => {
    console.log(`  ${provider.name}: ${provider.available ? '✅ 可用' : '❌ 不可用'} (${provider.command})`)
  })
  console.log()
  
  // 2. 测试基础AI分析
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
  
  // 3. 测试结构化工作流分析
  console.log('📊 测试结构化工作流分析:')
  try {
    const workflowResult = await aiManager.analyzeWorkflow(
      '实现一个用户认证中间件，支持JWT token验证和权限检查',
      {
        project_name: 'LinchKit',
        current_branch: 'feature/auth-middleware'
      }
    )
    
    console.log(`  来源: ${workflowResult.source}`)
    console.log(`  模板: ${workflowResult.structured?.template_used}`)
    console.log(`  格式: ${workflowResult.structured?.format}`)
    console.log(`  Schema验证: ${workflowResult.structured?.schema_valid}`)
    
    if (workflowResult.structured?.parsed) {
      console.log(`  结构化数据:`, JSON.stringify(workflowResult.structured.parsed, null, 2))
    }
  } catch (error) {
    console.log(`  ❌ 工作流分析失败: ${error}`)
  }
  console.log()
  
  // 4. 测试架构分析
  console.log('🏗️ 测试架构分析:')
  const sampleCode = `
export class UserService {
  constructor(private db: Database) {}
  
  async getUser(id: string) {
    return this.db.users.findById(id)
  }
  
  async createUser(data: any) {
    return this.db.users.create(data)
  }
}
  `.trim()
  
  try {
    const archResult = await aiManager.analyzeArchitecture(
      sampleCode,
      'UserService类设计',
      ['SOLID原则', '依赖注入', '类型安全']
    )
    
    console.log(`  来源: ${archResult.source}`)
    console.log(`  模板: ${archResult.structured?.template_used}`)
    console.log(`  分析结果: ${archResult.content.substring(0, 300)}...`)
  } catch (error) {
    console.log(`  ❌ 架构分析失败: ${error}`)
  }
  console.log()
  
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
  
  console.log('\n✅ 测试完成')
}

// 运行测试
if (import.meta.main) {
  testGeminiIntegration().catch(console.error)
}