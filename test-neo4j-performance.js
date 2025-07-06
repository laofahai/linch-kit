#!/usr/bin/env bun

/**
 * Neo4j 性能测试脚本
 * 测试优化后的批量导入性能
 */

import { Neo4jService } from './packages/ai/src/graph/neo4j-service.js'
import { loadNeo4jConfig } from './packages/ai/src/config/neo4j-config.js'
import { FunctionExtractor } from './packages/ai/src/extractors/function-extractor.js'
import { ImportExtractor } from './packages/ai/src/extractors/import-extractor.js'

async function testPerformance() {
  console.log('🔥 开始 Neo4j 性能测试 - LinchKit Graph RAG Phase 4')
  
  try {
    // 加载配置
    const config = await loadNeo4jConfig()
    const neo4jService = new Neo4jService(config)
    
    // 连接到 Neo4j
    await neo4jService.connect()
    console.log('✅ Neo4j 连接成功')
    
    // 获取当前统计
    const beforeStats = await neo4jService.getStatsOGM()
    console.log('📊 当前数据库状态:', {
      nodes: beforeStats.node_count,
      relationships: beforeStats.relationship_count
    })
    
    // 清空数据库
    console.log('🗑️ 清空数据库...')
    await neo4jService.clearDatabase()
    
    // 测试 Function 提取器
    console.log('🔧 测试 Function 提取器...')
    const functionExtractor = new FunctionExtractor()
    const startTime1 = Date.now()
    const functionResult = await functionExtractor.extract()
    const extractTime1 = Date.now() - startTime1
    
    console.log(`📦 Function 提取完成 - ${extractTime1}ms`, {
      nodes: functionResult.nodes.length,
      relationships: functionResult.relationships.length
    })
    
    // 导入 Function 数据
    const startTime2 = Date.now()
    await neo4jService.importData(functionResult.nodes, functionResult.relationships)
    const importTime1 = Date.now() - startTime2
    
    console.log(`💾 Function 数据导入完成 - ${importTime1}ms`)
    
    // 测试 Import 提取器
    console.log('📥 测试 Import 提取器...')
    const importExtractor = new ImportExtractor()
    const startTime3 = Date.now()
    const importResult = await importExtractor.extract()
    const extractTime2 = Date.now() - startTime3
    
    console.log(`📦 Import 提取完成 - ${extractTime2}ms`, {
      nodes: importResult.nodes.length,
      relationships: importResult.relationships.length
    })
    
    // 导入 Import 数据
    const startTime4 = Date.now()
    await neo4jService.importData(importResult.nodes, importResult.relationships)
    const importTime2 = Date.now() - startTime4
    
    console.log(`💾 Import 数据导入完成 - ${importTime2}ms`)
    
    // 获取最终统计
    const afterStats = await neo4jService.getStatsOGM()
    console.log('📊 导入后数据库状态:', {
      nodes: afterStats.node_count,
      relationships: afterStats.relationship_count
    })
    
    // 性能总结
    const totalTime = extractTime1 + importTime1 + extractTime2 + importTime2
    console.log('🎯 性能测试总结:')
    console.log(`  Function 提取: ${extractTime1}ms`)
    console.log(`  Function 导入: ${importTime1}ms`)
    console.log(`  Import 提取: ${extractTime2}ms`)
    console.log(`  Import 导入: ${importTime2}ms`)
    console.log(`  总耗时: ${totalTime}ms`)
    console.log(`  平均导入速度: ${Math.round((functionResult.relationships.length + importResult.relationships.length) / (importTime1 + importTime2) * 1000)} 关系/秒`)
    
    await neo4jService.disconnect()
    console.log('✅ 性能测试完成')
    
  } catch (error) {
    console.error('❌ 性能测试失败:', error)
    process.exit(1)
  }
}

// 执行测试
testPerformance()