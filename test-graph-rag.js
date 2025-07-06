#!/usr/bin/env node

/**
 * Graph RAG 测试脚本
 * 直接调用 IntelligentQueryEngine 进行验证
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
config({ path: join(__dirname, '.env') })

async function testGraphRAG() {
  try {
    console.log('🚀 开始 Graph RAG 真实验证测试...')
    
    // 动态导入 IntelligentQueryEngine (从构建产物导入)
    const intelligentQueryModule = await import('./packages/ai/dist/index.js')
    console.log('可用的导出:', Object.keys(intelligentQueryModule))
    
    // 尝试不同的导入方式
    const { IntelligentQueryEngine } = intelligentQueryModule
    
    console.log('✅ IntelligentQueryEngine 加载成功')
    
    // 创建查询引擎实例并连接到 Neo4j
    const queryEngine = new IntelligentQueryEngine()
    
    console.log('🔗 连接到 Neo4j 知识图谱...')
    await queryEngine.connect()
    console.log('✅ 已连接到知识图谱')
    
    console.log('📊 执行 Stage 1: 项目概览查询...')
    
    // Stage 1: 项目统计查询
    const statsResult = await queryEngine.query('查询项目统计信息')
    console.log('Stats Query Result:', JSON.stringify(statsResult, null, 2))
    
    console.log('🔍 执行 Stage 2: User 组件查询...')
    
    // Stage 2: User 组件查询  
    const userResult = await queryEngine.query('查找 User 相关的组件和模型')
    console.log('User Query Result:', JSON.stringify(userResult, null, 2))
    
    console.log('🔗 执行 Stage 3: User 依赖关系查询...')
    
    // Stage 3: User 依赖关系查询
    const relationResult = await queryEngine.query('分析 User 模型的依赖关系和相关API')
    console.log('Relation Query Result:', JSON.stringify(relationResult, null, 2))
    
    console.log('🔌 断开知识图谱连接...')
    await queryEngine.disconnect()
    
    console.log('✨ Graph RAG 验证测试完成！')
    
  } catch (error) {
    console.error('❌ Graph RAG 测试失败:', error)
    console.error('错误详情:', error.stack)
  }
}

// 运行测试
testGraphRAG().catch(console.error)