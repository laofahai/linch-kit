#!/usr/bin/env bun

/**
 * 简单的数据库清空脚本
 */

import { createLogger } from '@linch-kit/core/server'
import neo4j from 'neo4j-driver'
import { loadNeo4jConfig } from '../src/core/config/neo4j-config.js'

const logger = createLogger({ name: 'clear-db' })

async function clearDatabase() {
  try {
    const config = await loadNeo4jConfig()
    const driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      { 
        database: config.database,
        connectionTimeout: 30000,
        maxConnectionLifetime: 60000
      }
    )

    const session = driver.session()
    
    logger.info('开始清空数据库...')
    
    // 删除所有关系
    await session.run('MATCH ()-[r]-() DELETE r')
    logger.info('已删除所有关系')
    
    // 删除所有节点
    await session.run('MATCH (n) DELETE n')
    logger.info('已删除所有节点')
    
    // 删除所有约束和索引
    const constraints = await session.run('SHOW CONSTRAINTS')
    for (const record of constraints.records) {
      const name = record.get('name')
      try {
        await session.run(`DROP CONSTRAINT \`${name}\``)
        logger.debug(`删除约束: ${name}`)
      } catch (error) {
        logger.warn(`删除约束失败: ${name}`, { error })
      }
    }
    
    const indexes = await session.run('SHOW INDEXES')
    for (const record of indexes.records) {
      const name = record.get('name')
      if (name && !name.includes('btree')) { // 跳过系统索引
        try {
          await session.run(`DROP INDEX \`${name}\``)
          logger.debug(`删除索引: ${name}`)
        } catch (error) {
          logger.warn(`删除索引失败: ${name}`, { error })
        }
      }
    }
    
    await session.close()
    await driver.close()
    
    logger.info('✅ 数据库清空完成')
    
  } catch (error) {
    logger.error('❌ 数据库清空失败', { error })
    process.exit(1)
  }
}

clearDatabase()