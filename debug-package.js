#!/usr/bin/env bun

/**
 * 调试package字段
 */

import neo4j from 'neo4j-driver'

async function debugPackage() {
  const driver = neo4j.driver(
    'neo4j+s://d4a26556.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'UbY-DQI7y3TjkOw548Nm99Qpw43_DvAa2F6o8HRZBkY')
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    console.log('=== 查看LinchKit相关节点的package字段 ===')
    const result = await session.run(`
      MATCH (n) 
      WHERE n.name CONTAINS 'LinchKit' 
      RETURN n.id, n.name, n.metadata_package, keys(n) as all_keys
      LIMIT 5
    `)
    
    for (const record of result.records) {
      console.log('ID:', record.get('n.id'))
      console.log('Name:', record.get('n.name'))
      console.log('Package:', record.get('n.metadata_package'))
      console.log('All Keys:', record.get('all_keys'))
      console.log('---')
    }

  } finally {
    await session.close()
    await driver.close()
  }
}

debugPackage().catch(console.error)