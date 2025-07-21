#!/usr/bin/env bun

/**
 * Neo4j完全清空脚本
 * 
 * 删除数据库中的所有数据：
 * - 删除所有关系
 * - 删除所有节点
 * - 删除所有索引和约束
 */

import { createLogger } from '@linch-kit/core/server'
import neo4j, { Driver, Session } from 'neo4j-driver'
import { loadNeo4jConfig, validateNeo4jConfig } from '../src/core/config/neo4j-config.js'

const logger = createLogger({ name: 'neo4j-full-wipe' })

class FullWipeService {
  private driver: Driver | null = null
  private session: Session | null = null

  async connect(): Promise<void> {
    const config = await loadNeo4jConfig()
    if (!validateNeo4jConfig(config)) {
      throw new Error('Neo4j配置验证失败')
    }

    this.driver = neo4j.driver(
      config.connectionUri,
      neo4j.auth.basic(config.username, config.password),
      {
        database: config.database,
        maxConnectionPoolSize: 10,
      }
    )

    await this.driver.verifyConnectivity()
    this.session = this.driver.session({ database: config.database })
    
    logger.info('Neo4j连接成功')
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      await this.session.close()
      this.session = null
    }
    if (this.driver) {
      await this.driver.close()
      this.driver = null
    }
  }

  /**
   * 完全清空数据库
   */
  async fullWipe(): Promise<void> {
    if (!this.session) throw new Error('未连接到Neo4j')

    logger.info('开始完全清空数据库...')

    // 1. 删除所有关系
    logger.info('删除所有关系...')
    const relResult = await this.session.run(`
      MATCH ()-[r]->()
      DELETE r
      RETURN count(*) as deletedCount
    `)
    const deletedRels = relResult.records[0]?.get('deletedCount')?.toNumber() || 0
    logger.info(`删除了 ${deletedRels} 个关系`)

    // 2. 删除所有节点
    logger.info('删除所有节点...')
    const nodeResult = await this.session.run(`
      MATCH (n)
      DELETE n
      RETURN count(*) as deletedCount
    `)
    const deletedNodes = nodeResult.records[0]?.get('deletedCount')?.toNumber() || 0
    logger.info(`删除了 ${deletedNodes} 个节点`)

    // 3. 删除所有索引（如果有权限的话）
    try {
      logger.info('清理索引...')
      await this.session.run('DROP INDEX IF EXISTS FOR (n:GraphNode) ON (n.id)')
      await this.session.run('DROP INDEX IF EXISTS FOR (n:GraphNode) ON (n.type)')
      await this.session.run('DROP INDEX IF EXISTS FOR (n:GraphNode) ON (n.name)')
      await this.session.run('DROP INDEX IF EXISTS FOR (f:File) ON (f.file_path)')
      logger.info('索引清理完成')
    } catch (error) {
      logger.warn('索引清理失败，可能没有权限', { error })
    }

    // 4. 验证清理结果
    const finalNodeCount = await this.session.run('MATCH (n) RETURN count(n) as count')
    const finalRelCount = await this.session.run('MATCH ()-[r]->() RETURN count(r) as count')
    
    const remainingNodes = finalNodeCount.records[0]?.get('count')?.toNumber() || 0
    const remainingRels = finalRelCount.records[0]?.get('count')?.toNumber() || 0

    if (remainingNodes > 0 || remainingRels > 0) {
      throw new Error(`清理不完整：剩余 ${remainingNodes} 个节点，${remainingRels} 个关系`)
    }

    logger.info('数据库完全清空完成')
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const service = new FullWipeService()
  
  try {
    await service.connect()
    
    console.log('\n⚠️  警告：即将完全清空Neo4j数据库！')
    console.log('这将删除所有节点和关系数据。')
    
    await service.fullWipe()
    
    console.log('\n✅ 数据库完全清空完成！')
    console.log('📊 剩余节点: 0')
    console.log('📊 剩余关系: 0')
    
  } catch (error) {
    logger.error('数据库清空失败', error instanceof Error ? error : undefined)
    console.error('\n❌ 错误:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await service.disconnect()
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })
}