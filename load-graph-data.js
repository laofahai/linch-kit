#!/usr/bin/env node

/**
 * 图数据加载脚本
 * 将本地 JSON 数据加载到 Neo4j Aura 数据库
 */

import { config } from 'dotenv'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import neo4j from 'neo4j-driver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
config({ path: join(__dirname, '.env') })

async function loadGraphData() {
  const driver = neo4j.driver(
    process.env.NEO4J_CONNECTION_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  )

  try {
    console.log('🔗 连接到 Neo4j Aura...')
    const session = driver.session()
    
    // 测试连接
    await session.run('RETURN 1 as test')
    console.log('✅ Neo4j 连接成功')

    // 清空现有数据
    console.log('🧹 清空现有数据...')
    await session.run('MATCH (n) DETACH DELETE n')
    
    // 加载节点数据
    console.log('📦 加载节点数据...')
    const nodesData = JSON.parse(await readFile(join(__dirname, 'graph-data', 'nodes.json'), 'utf8'))
    
    for (const node of nodesData) {
      const query = `
        CREATE (n:${node.type} {
          id: $id,
          name: $name,
          type: $type,
          path: $path,
          properties: $properties
        })
      `
      await session.run(query, {
        id: node.id,
        name: node.name,
        type: node.type,
        path: node.path || '',
        properties: JSON.stringify(node.properties || {})
      })
    }
    console.log(`✅ 加载了 ${nodesData.length} 个节点`)

    // 加载关系数据
    console.log('🔗 加载关系数据...')
    const relsData = JSON.parse(await readFile(join(__dirname, 'graph-data', 'relationships.json'), 'utf8'))
    
    for (const rel of relsData) {
      const query = `
        MATCH (a {id: $sourceId}), (b {id: $targetId})
        CREATE (a)-[r:${rel.type} {
          type: $type,
          properties: $properties
        }]->(b)
      `
      await session.run(query, {
        sourceId: rel.source,
        targetId: rel.target,
        type: rel.type,
        properties: JSON.stringify(rel.properties || {})
      })
    }
    console.log(`✅ 加载了 ${relsData.length} 个关系`)

    // 创建索引
    console.log('📇 创建索引...')
    await session.run('CREATE INDEX node_id_index IF NOT EXISTS FOR (n) ON (n.id)')
    await session.run('CREATE INDEX node_type_index IF NOT EXISTS FOR (n) ON (n.type)')
    await session.run('CREATE INDEX node_name_index IF NOT EXISTS FOR (n) ON (n.name)')
    
    // 验证数据
    console.log('🔍 验证数据...')
    const nodeCount = await session.run('MATCH (n) RETURN count(n) as count')
    const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count')
    
    console.log(`📊 数据库统计:`)
    console.log(`   节点: ${nodeCount.records[0].get('count').toNumber()}`)
    console.log(`   关系: ${relCount.records[0].get('count').toNumber()}`)
    
    await session.close()
    console.log('🎉 图数据加载完成！')
    
  } catch (error) {
    console.error('❌ 图数据加载失败:', error)
    throw error
  } finally {
    await driver.close()
  }
}

// 运行加载
loadGraphData().catch(console.error)