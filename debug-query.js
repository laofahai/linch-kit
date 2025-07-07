#!/usr/bin/env bun

/**
 * 调试查询转换问题
 */

import { Neo4jService } from './packages/ai/src/graph/neo4j-service.js'
import { loadNeo4jConfig } from './packages/ai/src/config/neo4j-config.js'

async function debugQuery() {
  try {
    const config = await loadNeo4jConfig()
    const neo4jService = new Neo4jService(config)
    await neo4jService.connect()

    console.log('=== 测试简单查询 ===')
    const result = await neo4jService.query(
      'MATCH (n:GraphNode) WHERE n.name CONTAINS "test" RETURN n LIMIT 3'
    )

    console.log('查询结果:')
    console.log('- 节点数量:', result.nodes.length)
    console.log('- 关系数量:', result.relationships.length)
    
    for (const node of result.nodes) {
      console.log('\n节点:')
      console.log('  ID:', node.id)
      console.log('  Name:', node.name)
      console.log('  Type:', node.type)
      console.log('  Properties Keys:', Object.keys(node.properties))
      console.log('  Metadata Keys:', Object.keys(node.metadata))
    }

    await neo4jService.disconnect()
  } catch (error) {
    console.error('调试失败:', error)
  }
}

debugQuery()