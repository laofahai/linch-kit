#!/usr/bin/env node

/**
 * 分析当前 Neo4j 中的数据状态
 */

import neo4j from 'neo4j-driver'
import { config } from 'dotenv'

// 加载环境变量
config()

// 调试环境变量
console.log('🔧 环境变量检查:')
console.log('NEO4J_CONNECTION_URI:', process.env.NEO4J_CONNECTION_URI ? '已设置' : '未设置')
console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME ? '已设置' : '未设置')  
console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '已设置' : '未设置')

async function analyzeNeo4jData() {
  // 临时硬编码连接信息进行数据分析
  const driver = neo4j.driver(
    'neo4j+s://d4a26556.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'UbY-DQI7y3TjkOw548Nm99Qpw43_DvAa2F6o8HRZBkY')
  )

  try {
    console.log('🔗 连接到 Neo4j Aura...')
    const session = driver.session()

    // 1. 统计总节点数
    const nodeCountResult = await session.run('MATCH (n) RETURN count(n) as nodeCount')
    const nodeCount = nodeCountResult.records[0].get('nodeCount').toNumber()
    console.log(`📊 总节点数: ${nodeCount}`)

    // 2. 统计节点类型分布
    const nodeTypeResult = await session.run(
      'MATCH (n) RETURN labels(n) as labels, count(n) as count ORDER BY count DESC'
    )
    console.log('📋 节点类型分布:')
    nodeTypeResult.records.forEach(record => {
      const labels = record.get('labels')
      const count = record.get('count').toNumber()
      console.log(`  ${labels.join(',')}: ${count}`)
    })

    // 3. 统计关系数
    const relCountResult = await session.run('MATCH ()-[r]->() RETURN count(r) as relCount')
    const relCount = relCountResult.records[0].get('relCount').toNumber()
    console.log(`🔗 总关系数: ${relCount}`)

    // 4. 统计关系类型分布
    const relTypeResult = await session.run(
      'MATCH ()-[r]->() RETURN type(r) as relType, count(r) as count ORDER BY count DESC'
    )
    console.log('🔗 关系类型分布:')
    relTypeResult.records.forEach(record => {
      const relType = record.get('relType')
      const count = record.get('count').toNumber()
      console.log(`  ${relType}: ${count}`)
    })

    // 5. 查看包节点
    const packageResult = await session.run(
      'MATCH (p:Package) RETURN p.name as name, p.path as path LIMIT 10'
    )
    console.log('📦 包节点示例:')
    packageResult.records.forEach(record => {
      const name = record.get('name')
      const path = record.get('path')
      console.log(`  ${name} -> ${path}`)
    })

    // 6. 查看文件节点
    const fileResult = await session.run(
      'MATCH (f:File) RETURN f.name as name, f.path as path LIMIT 10'
    )
    console.log('📄 文件节点示例:')
    fileResult.records.forEach(record => {
      const name = record.get('name')
      const path = record.get('path')
      console.log(`  ${name} -> ${path}`)
    })

    // 7. 查看Graph节点
    const graphResult = await session.run(
      'MATCH (g:GraphNode) RETURN g.name as name, g.type as type LIMIT 10'
    )
    console.log('🔄 GraphNode示例:')
    graphResult.records.forEach(record => {
      const name = record.get('name')
      const type = record.get('type')
      console.log(`  ${name} (${type})`)
    })

    await session.close()
    console.log('✅ 分析完成')

  } catch (error) {
    console.error('❌ 分析失败:', error)
  } finally {
    await driver.close()
  }
}

analyzeNeo4jData()