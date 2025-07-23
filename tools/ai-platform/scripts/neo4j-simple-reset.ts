#!/usr/bin/env bun

/**
 * Neo4j 简单重置脚本 - 直接使用 neo4j-driver
 * 
 * 🎯 避免复杂的 Neo4jService，直接操作数据库
 * 
 * 用法：
 *   bun tools/ai-platform/scripts/neo4j-simple-reset.ts
 */

import neo4j from 'neo4j-driver'
import { loadNeo4jConfig } from '../src/core/config/neo4j-config'
import { createLogger } from '@linch-kit/core/server'

const logger = createLogger({ name: 'simple-reset' })

async function confirmReset(): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write('⚠️  确认要重置数据库吗？这将删除所有数据！(y/N): ')
    
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase()
      resolve(input === 'y' || input === 'yes')
    })
  })
}

async function simpleReset() {
  try {
    console.log('🔄 Simple Neo4j Database Reset\n')
    
    // 确认操作
    const confirmed = await confirmReset()
    if (!confirmed) {
      console.log('❌ 操作已取消')
      return
    }

    // 加载配置
    console.log('📋 加载 Neo4j 配置...')
    const config = await loadNeo4jConfig()
    
    // 创建驱动连接
    console.log('🔗 连接到 Neo4j...')
    const driver = neo4j.driver(
      config.connectionUri,
      neo4j.auth.basic(config.username, config.password),
      { database: config.database }
    )

    // 获取当前统计
    console.log('📊 检查当前数据规模...')
    let session = driver.session()
    
    try {
      const statsResult = await session.run(`
        CALL {
          MATCH (n) RETURN count(n) as nodes
        }
        CALL {
          MATCH ()-[r]-() RETURN count(r) as rels
        }
        RETURN nodes, rels
      `)
      
      const record = statsResult.records[0]
      const nodeCount = record.get('nodes').toNumber()
      const relCount = record.get('rels').toNumber()
      
      console.log(`当前数据: ${nodeCount.toLocaleString()} 节点, ${relCount.toLocaleString()} 关系`)
      
      if (nodeCount === 0 && relCount === 0) {
        console.log('✅ 数据库已经是空的')
        return
      }
    } finally {
      await session.close()
    }

    // 方法1: 简单粗暴删除 (小批量)
    console.log('\n🗑️  开始清理数据...')
    
    // 删除关系
    console.log('   删除关系...')
    session = driver.session()
    try {
      let totalRelsDeleted = 0
      let batchSize = 5000
      
      while (true) {
        const result = await session.run(`
          MATCH ()-[r]-() 
          WITH r LIMIT ${batchSize}
          DELETE r
          RETURN count(r) as deleted
        `)
        
        const deleted = result.records[0].get('deleted').toNumber()
        if (deleted === 0) break
        
        totalRelsDeleted += deleted
        console.log(`   已删除 ${deleted.toLocaleString()} 关系 (总计: ${totalRelsDeleted.toLocaleString()})`)
        
        // 短暂休息
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log(`✅ 关系删除完成: ${totalRelsDeleted.toLocaleString()} 个`)
    } finally {
      await session.close()
    }

    // 删除节点
    console.log('   删除节点...')
    session = driver.session()
    try {
      let totalNodesDeleted = 0
      let batchSize = 3000
      
      while (true) {
        const result = await session.run(`
          MATCH (n) 
          WITH n LIMIT ${batchSize}
          DELETE n
          RETURN count(n) as deleted
        `)
        
        const deleted = result.records[0].get('deleted').toNumber()
        if (deleted === 0) break
        
        totalNodesDeleted += deleted  
        console.log(`   已删除 ${deleted.toLocaleString()} 节点 (总计: ${totalNodesDeleted.toLocaleString()})`)
        
        // 短暂休息
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log(`✅ 节点删除完成: ${totalNodesDeleted.toLocaleString()} 个`)
    } finally {
      await session.close()
    }

    // 验证结果
    console.log('\n📊 验证清理结果...')
    session = driver.session()
    try {
      const finalResult = await session.run(`
        CALL {
          MATCH (n) RETURN count(n) as nodes
        }
        CALL {
          MATCH ()-[r]-() RETURN count(r) as rels  
        }
        RETURN nodes, rels
      `)
      
      const finalRecord = finalResult.records[0]
      const finalNodes = finalRecord.get('nodes').toNumber()
      const finalRels = finalRecord.get('rels').toNumber()
      
      console.log(`最终数据: ${finalNodes.toLocaleString()} 节点, ${finalRels.toLocaleString()} 关系`)
      
      if (finalNodes === 0 && finalRels === 0) {
        console.log('🎉 数据库重置成功！')
        console.log('\n💡 现在可以运行 "bun graph sync" 重新同步干净的数据')
      } else {
        console.log('⚠️  部分数据未完全清理')
      }
      
    } finally {
      await session.close()
    }

    await driver.close()
    
  } catch (error) {
    logger.error('重置失败', { error })
    console.log(`\n❌ 重置失败: ${error}`)
    process.exit(1)
  }
}

simpleReset()