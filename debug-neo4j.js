#!/usr/bin/env bun

/**
 * 调试 Neo4j 数据结构
 */

import neo4j from 'neo4j-driver'

async function debugNeo4jData() {
  const driver = neo4j.driver(
    'neo4j+s://d4a26556.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'UbY-DQI7y3TjkOw548Nm99Qpw43_DvAa2F6o8HRZBkY')
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    console.log('=== 查看前5个节点的实际结构 ===')
    const result = await session.run('MATCH (n) RETURN n LIMIT 5')
    
    for (const record of result.records) {
      const node = record.get('n')
      console.log('节点ID:', node.identity.toString())
      console.log('节点标签:', node.labels)
      console.log('节点属性:', JSON.stringify(node.properties, null, 2))
      console.log('---')
    }

    console.log('\n=== 查看属性键的分布 ===')
    const propsResult = await session.run(`
      MATCH (n) 
      UNWIND keys(n) as key 
      RETURN key, count(*) as count 
      ORDER BY count DESC 
      LIMIT 20
    `)
    
    for (const record of propsResult.records) {
      console.log(`属性 "${record.get('key')}": ${record.get('count')} 次`)
    }

    console.log('\n=== 查看有test相关的节点 ===')
    const testResult = await session.run(`
      MATCH (n) 
      WHERE toLower(n.id) CONTAINS 'test' OR toLower(toString(n.name)) CONTAINS 'test'
      RETURN n 
      LIMIT 3
    `)
    
    for (const record of testResult.records) {
      const node = record.get('n')
      console.log('Test节点:', JSON.stringify(node.properties, null, 2))
    }

  } finally {
    await session.close()
    await driver.close()
  }
}

debugNeo4jData().catch(console.error)