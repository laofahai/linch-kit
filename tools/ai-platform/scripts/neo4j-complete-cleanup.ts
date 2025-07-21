#!/usr/bin/env bun

/**
 * Neo4j完全清理脚本 - 彻底清理冗余关系
 * 
 * 彻底清理策略：
 * 1. 保留核心结构关系（IMPORTS, CONTAINS, DEFINES, IMPLEMENTS, EXTENDS）
 * 2. 保留高质量函数调用关系（CALLS）
 * 3. 删除大部分REFERENCES关系，只保留必要的
 * 4. 删除低置信度的RELATED_TO关系
 */

import { createLogger } from '@linch-kit/core/server'
import neo4j, { Driver, Session } from 'neo4j-driver'
import { loadNeo4jConfig, validateNeo4jConfig } from '../src/core/config/neo4j-config.js'

const logger = createLogger({ name: 'neo4j-complete-cleanup' })

class CompleteCleanupService {
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
   * 执行完全清理
   */
  async completeCleanup(): Promise<{ totalDeleted: number }> {
    if (!this.session) throw new Error('未连接到Neo4j')

    logger.info('开始执行完全清理...')
    let totalDeleted = 0

    // 1. 删除大部分REFERENCES关系，只保留文件级别的
    const referencesDeleted = await this.cleanupReferencesRelations()
    totalDeleted += referencesDeleted

    // 2. 删除低质量RELATED_TO关系
    const relatedDeleted = await this.cleanupRelatedToRelations()
    totalDeleted += relatedDeleted

    // 3. 删除冗余的USES_TYPE关系
    const usesTypeDeleted = await this.cleanupUsesTypeRelations()
    totalDeleted += usesTypeDeleted

    // 4. 删除过多的CALLS关系，保留核心调用
    const callsDeleted = await this.cleanupCallsRelations()
    totalDeleted += callsDeleted

    logger.info(`完全清理完成，总删除: ${totalDeleted}`)
    return { totalDeleted }
  }

  /**
   * 清理REFERENCES关系，只保留必要的
   */
  private async cleanupReferencesRelations(): Promise<number> {
    if (!this.session) return 0

    logger.info('清理REFERENCES关系...')
    let totalDeleted = 0
    const batchSize = 2000

    // 删除除文件级别外的所有REFERENCES关系
    while (true) {
      const result = await this.session.run(`
        MATCH (a)-[r:REFERENCES]->(b)
        WHERE NOT (a.type = 'File' OR b.type = 'File')
        WITH r LIMIT ${batchSize}
        DELETE r
        RETURN count(*) as deletedCount
      `)

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0
      totalDeleted += deletedCount
      
      if (deletedCount === 0) break
      logger.info(`删除非文件REFERENCES: ${deletedCount}个，累计: ${totalDeleted}个`)
    }

    logger.info(`REFERENCES关系清理完成，删除: ${totalDeleted}`)
    return totalDeleted
  }

  /**
   * 清理RELATED_TO关系，删除低质量的
   */
  private async cleanupRelatedToRelations(): Promise<number> {
    if (!this.session) return 0

    logger.info('清理RELATED_TO关系...')
    
    const result = await this.session.run(`
      MATCH (a)-[r:RELATED_TO]->(b)
      WHERE (r.confidence < 0.6 OR r.confidence IS NULL)
      OR r.description IN ['语义相关', '']
      DELETE r
      RETURN count(*) as deletedCount
    `)

    const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0
    logger.info(`RELATED_TO关系清理完成，删除: ${deletedCount}`)
    return deletedCount
  }

  /**
   * 清理USES_TYPE关系，删除冗余的
   */
  private async cleanupUsesTypeRelations(): Promise<number> {
    if (!this.session) return 0

    logger.info('清理USES_TYPE关系...')
    
    // 保留置信度高的USES_TYPE关系
    const result = await this.session.run(`
      MATCH (a)-[r:USES_TYPE]->(b)
      WHERE (r.confidence < 0.7 OR r.confidence IS NULL)
      DELETE r
      RETURN count(*) as deletedCount
    `)

    const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0
    logger.info(`USES_TYPE关系清理完成，删除: ${deletedCount}`)
    return deletedCount
  }

  /**
   * 清理CALLS关系，保留核心调用
   */
  private async cleanupCallsRelations(): Promise<number> {
    if (!this.session) return 0

    logger.info('清理CALLS关系...')
    let totalDeleted = 0

    // 删除置信度低的CALLS关系
    const lowConfidenceResult = await this.session.run(`
      MATCH (a)-[r:CALLS]->(b)
      WHERE (r.confidence < 0.5 OR r.confidence IS NULL)
      DELETE r
      RETURN count(*) as deletedCount
    `)

    const lowConfidenceDeleted = lowConfidenceResult.records[0]?.get('deletedCount')?.toNumber() || 0
    totalDeleted += lowConfidenceDeleted

    // 如果CALLS关系仍然太多，进一步清理
    const remainingResult = await this.session.run('MATCH ()-[r:CALLS]->() RETURN count(r) as count')
    const remainingCalls = remainingResult.records[0]?.get('count')?.toNumber() || 0

    if (remainingCalls > 15000) {
      logger.info(`CALLS关系仍有${remainingCalls}个，进一步清理...`)
      
      // 随机删除一些CALLS关系
      const extraDeleteResult = await this.session.run(`
        MATCH (a)-[r:CALLS]->(b)
        WITH r, rand() as randomValue
        WHERE randomValue < 0.3
        DELETE r
        RETURN count(*) as deletedCount
      `)

      const extraDeleted = extraDeleteResult.records[0]?.get('deletedCount')?.toNumber() || 0
      totalDeleted += extraDeleted
    }

    logger.info(`CALLS关系清理完成，删除: ${totalDeleted}`)
    return totalDeleted
  }

  /**
   * 获取当前统计
   */
  async getCurrentStats(): Promise<{ totalNodes: number, totalRelationships: number, byType: Record<string, number> }> {
    if (!this.session) return { totalNodes: 0, totalRelationships: 0, byType: {} }

    const nodeResult = await this.session.run('MATCH (n) RETURN count(n) as count')
    const relResult = await this.session.run('MATCH ()-[r]->() RETURN count(r) as count')
    
    const typeResult = await this.session.run(`
      MATCH ()-[r]->() 
      RETURN type(r) as relType, count(r) as count 
      ORDER BY count DESC
    `)

    const byType: Record<string, number> = {}
    for (const record of typeResult.records) {
      const relType = record.get('relType')
      const count = record.get('count')?.toNumber() || 0
      byType[relType] = count
    }

    return {
      totalNodes: nodeResult.records[0]?.get('count')?.toNumber() || 0,
      totalRelationships: relResult.records[0]?.get('count')?.toNumber() || 0,
      byType
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const service = new CompleteCleanupService()
  
  try {
    await service.connect()
    
    // 获取初始统计
    const initialStats = await service.getCurrentStats()
    logger.info('清理前统计', initialStats)
    
    // 执行完全清理
    const { totalDeleted } = await service.completeCleanup()
    
    // 获取最终统计
    const finalStats = await service.getCurrentStats()
    logger.info('清理后统计', finalStats)
    
    console.log('\n✅ 完全清理完成！')
    console.log(`📊 总删除数: ${totalDeleted.toLocaleString()}`)
    console.log(`📊 剩余节点: ${finalStats.totalNodes.toLocaleString()}`)
    console.log(`📊 剩余关系: ${finalStats.totalRelationships.toLocaleString()}`)
    console.log('\n📋 关系类型分布:')
    
    Object.entries(finalStats.byType).forEach(([type, count]) => {
      const percent = ((count / finalStats.totalRelationships) * 100).toFixed(1)
      console.log(`  ${type}: ${count.toLocaleString()} (${percent}%)`)
    })
    
  } catch (error) {
    logger.error('完全清理失败', error instanceof Error ? error : undefined)
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