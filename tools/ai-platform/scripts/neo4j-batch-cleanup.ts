#!/usr/bin/env bun

/**
 * Neo4j批量数据库清理脚本 - 解决内存限制问题
 * 
 * 使用分批删除策略，避免事务内存溢出
 */

import { createLogger } from '@linch-kit/core/server'
import neo4j, { Driver, Session } from 'neo4j-driver'
import { loadNeo4jConfig, validateNeo4jConfig } from '../src/core/config/neo4j-config.js'

const logger = createLogger({ name: 'neo4j-batch-cleanup' })

class BatchCleanupService {
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
   * 批量删除冗余关系
   */
  async batchDeleteRedundantRelations(): Promise<number> {
    if (!this.session) return 0

    logger.info('开始批量删除冗余关系...')
    let totalDeleted = 0
    const batchSize = 1000

    // 删除冗余的REFERENCES关系
    while (true) {
      const result = await this.session.run(`
        MATCH (a)-[r:REFERENCES]->(b)
        WHERE NOT EXISTS {
          MATCH (a)-[:IMPORTS|:CONTAINS|:DEFINES]->(b)
        }
        AND NOT (
          (a.type = 'File' AND b.type IN ['Function', 'Class', 'Interface']) OR
          (a.type IN ['Function', 'Class'] AND b.type IN ['Interface', 'Type'])
        )
        WITH r LIMIT ${batchSize}
        DELETE r
        RETURN count(*) as deletedCount
      `)

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0
      totalDeleted += deletedCount
      
      logger.info(`批次删除冗余REFERENCES: ${deletedCount}个，累计: ${totalDeleted}个`)
      
      if (deletedCount === 0) break
    }

    return totalDeleted
  }

  /**
   * 批量删除重复关系
   */
  async batchDeleteDuplicateRelations(): Promise<number> {
    if (!this.session) return 0

    logger.info('开始批量删除重复关系...')
    let totalDeleted = 0
    const batchSize = 1000

    while (true) {
      const result = await this.session.run(`
        MATCH (a)-[r]->(b)
        WITH a, b, type(r) as relType, collect(r) as rels
        WHERE size(rels) > 1
        WITH rels[1..${batchSize}] as duplicateRels
        UNWIND duplicateRels as duplicateRel
        DELETE duplicateRel
        RETURN count(*) as deletedCount
      `)

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0
      totalDeleted += deletedCount
      
      logger.info(`批次删除重复关系: ${deletedCount}个，累计: ${totalDeleted}个`)
      
      if (deletedCount === 0) break
    }

    return totalDeleted
  }

  /**
   * 获取当前统计
   */
  async getCurrentStats(): Promise<{ totalNodes: number, totalRelationships: number }> {
    if (!this.session) return { totalNodes: 0, totalRelationships: 0 }

    const nodeResult = await this.session.run('MATCH (n) RETURN count(n) as count')
    const relResult = await this.session.run('MATCH ()-[r]->() RETURN count(r) as count')

    return {
      totalNodes: nodeResult.records[0]?.get('count')?.toNumber() || 0,
      totalRelationships: relResult.records[0]?.get('count')?.toNumber() || 0
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const service = new BatchCleanupService()
  
  try {
    await service.connect()
    
    // 获取初始统计
    const initialStats = await service.getCurrentStats()
    logger.info('清理前统计', initialStats)
    
    // 批量删除冗余关系
    const redundantDeleted = await service.batchDeleteRedundantRelations()
    
    // 批量删除重复关系  
    const duplicateDeleted = await service.batchDeleteDuplicateRelations()
    
    // 获取最终统计
    const finalStats = await service.getCurrentStats()
    logger.info('清理后统计', finalStats)
    
    console.log('\n✅ 批量清理完成！')
    console.log(`📊 删除冗余关系: ${redundantDeleted.toLocaleString()}`)
    console.log(`📊 删除重复关系: ${duplicateDeleted.toLocaleString()}`)
    console.log(`📊 总删除数: ${(redundantDeleted + duplicateDeleted).toLocaleString()}`)
    console.log(`📊 剩余关系: ${finalStats.totalRelationships.toLocaleString()}`)
    
  } catch (error) {
    logger.error('批量清理失败', error instanceof Error ? error : undefined)
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