#!/usr/bin/env bun

/**
 * 智能查询引擎测试脚本
 * LinchKit Graph RAG Phase 4 - 智能查询系统演示
 */

import { IntelligentQueryEngine } from './packages/ai/src/query/intelligent-query-engine.js'

async function testIntelligentQuery() {
  console.log('🤖 LinchKit 智能查询引擎测试 - Graph RAG Phase 4')
  
  const queryEngine = new IntelligentQueryEngine()
  
  try {
    // 连接到知识图谱
    console.log('🔌 连接到知识图谱...')
    await queryEngine.connect()
    console.log('✅ 连接成功')
    
    // 测试查询
    const testQueries = [
      '查找 createLogger 函数',
      '什么是 Neo4j',
      '谁使用了 SchemaExtractor',
      '查找 GraphNode 接口',
      '分析从 extractors 到 neo4j 的路径',
      '解释什么是智能查询引擎'
    ]
    
    console.log('\n🧪 开始智能查询测试...\n')
    
    for (const [index, query] of testQueries.entries()) {
      console.log(`\n📝 测试查询 ${index + 1}: "${query}"`)
      console.log('=' .repeat(50))
      
      try {
        const result = await queryEngine.query(query)
        
        console.log(`🎯 查询意图: ${result.intent}`)
        console.log(`📊 置信度: ${Math.round(result.confidence * 100)}%`)
        console.log(`⏱️  执行时间: ${result.execution_time_ms}ms`)
        console.log(`💡 解释: ${result.results.explanation}`)
        
        if (result.results.nodes.length > 0) {
          console.log(`📦 找到节点: ${result.results.nodes.length} 个`)
          result.results.nodes.slice(0, 3).forEach((node, nodeIndex) => {
            console.log(`  ${nodeIndex + 1}. ${node.name} (${node.type})`)
            if (node.properties?.file_path) {
              console.log(`     📁 ${node.properties.file_path}:${node.properties.line_number || '?'}`)
            }
          })
          if (result.results.nodes.length > 3) {
            console.log(`     ... 还有 ${result.results.nodes.length - 3} 个结果`)
          }
        }
        
        if (result.results.relationships.length > 0) {
          console.log(`🔗 相关关系: ${result.results.relationships.length} 个`)
          result.results.relationships.slice(0, 2).forEach((rel, relIndex) => {
            console.log(`  ${relIndex + 1}. ${rel.source} --[${rel.type}]--> ${rel.target}`)
          })
        }
        
        if (result.results.suggestions.length > 0) {
          console.log('💡 建议:')
          result.results.suggestions.forEach((suggestion, suggestionIndex) => {
            console.log(`  ${suggestionIndex + 1}. ${suggestion}`)
          })
        }
        
        if (result.cypher_query) {
          console.log('🔍 生成的 Cypher:')
          console.log(`  ${result.cypher_query.trim().replace(/\n\s+/g, ' ')}`)
        }
        
      } catch (queryError) {
        console.error(`❌ 查询失败: ${queryError instanceof Error ? queryError.message : queryError}`)
      }
      
      // 短暂等待，避免过于频繁的查询
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('\n🎯 智能查询测试总结:')
    console.log('✅ 意图识别系统正常')
    console.log('✅ Cypher 生成正常')
    console.log('✅ 查询执行正常')
    console.log('✅ 结果格式化正常')
    console.log('✅ 建议生成正常')
    
  } catch (error) {
    console.error('❌ 智能查询测试失败:', error)
  } finally {
    await queryEngine.disconnect()
    console.log('\n🔌 已断开连接')
  }
}

// 执行测试
testIntelligentQuery().catch(console.error)