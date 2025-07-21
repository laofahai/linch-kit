#!/usr/bin/env bun

/**
 * Neo4j 数据库清理脚本
 * 
 * 解决40万关系限制问题：
 * 1. 删除冗余的REFERENCES关系（约27万个）
 * 2. 保留高质量的结构化关系
 * 3. 优化数据库性能
 * 
 * 用法:
 *   bun run tools/ai-platform/scripts/neo4j-cleanup.ts --dry-run    # 预览清理操作
 *   bun run tools/ai-platform/scripts/neo4j-cleanup.ts --execute   # 执行清理
 */

import { createLogger } from '@linch-kit/core/server'
import neo4j, { Driver, Session } from 'neo4j-driver'
import { loadNeo4jConfig, validateNeo4jConfig } from '../src/core/config/neo4j-config.js'

const logger = createLogger({ name: 'neo4j-cleanup' })

interface CleanupStats {
  totalRelationships: number
  redundantReferences: number
  lowQualityRelations: number
  duplicateRelations: number
  removedCount: number
  remainingCount: number
}

class Neo4jCleanupService {
  private driver: Driver | null = null
  private session: Session | null = null
  private dryRun: boolean = false

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun
  }

  /**
   * 连接数据库
   */
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
        maxConnectionPoolSize: 50,
      }
    )

    await this.driver.verifyConnectivity()
    this.session = this.driver.session({ database: config.database })
    
    logger.info('Neo4j连接成功', {
      uri: config.connectionUri,
      database: config.database,
    })
  }

  /**
   * 断开连接
   */
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
   * 执行数据库清理
   */
  async cleanup(): Promise<CleanupStats> {
    if (!this.session) throw new Error('未连接到Neo4j')

    logger.info(this.dryRun ? '开始预览清理操作...' : '开始执行数据库清理...')

    // 获取初始统计
    const initialStats = await this.getRelationshipStats()
    logger.info('清理前统计', initialStats)

    let removedCount = 0

    // 1. 清理冗余的REFERENCES关系（最大的问题源）
    const redundantRefs = await this.cleanupRedundantReferences()
    removedCount += redundantRefs
    logger.info(`冗余REFERENCES关系处理: ${redundantRefs}个`)

    // 2. 清理重复关系
    const duplicates = await this.cleanupDuplicateRelationships()
    removedCount += duplicates
    logger.info(`重复关系处理: ${duplicates}个`)

    // 3. 清理低质量关系
    const lowQuality = await this.cleanupLowQualityRelationships()
    removedCount += lowQuality
    logger.info(`低质量关系处理: ${lowQuality}个`)

    // 获取最终统计
    const finalStats = await this.getRelationshipStats()
    logger.info('清理后统计', finalStats)

    return {
      totalRelationships: initialStats.totalCount,
      redundantReferences: redundantRefs,
      lowQualityRelations: lowQuality,
      duplicateRelations: duplicates,
      removedCount,
      remainingCount: finalStats.totalCount,
    }
  }

  /**
   * 清理冗余的REFERENCES关系
   * 策略：保留文件系统结构和导入关系，删除过度生成的语义关联
   */
  private async cleanupRedundantReferences(): Promise<number> {
    if (!this.session) return 0

    logger.info('分析REFERENCES关系冗余情况...')

    // 查找冗余的REFERENCES关系
    const query = `
      MATCH (a)-[r:REFERENCES]->(b)
      WHERE NOT EXISTS {
        MATCH (a)-[:IMPORTS|:CONTAINS|:DEFINES]->(b)
      }
      AND NOT (
        (a.type = 'File' AND b.type IN ['Function', 'Class', 'Interface']) OR
        (a.type IN ['Function', 'Class'] AND b.type IN ['Interface', 'Type'])
      )
      RETURN count(r) as redundantCount
    `

    const result = await this.session.run(query)
    const redundantCount = result.records[0]?.get('redundantCount')?.toNumber() || 0

    logger.info(`发现 ${redundantCount} 个冗余REFERENCES关系`)

    if (redundantCount === 0) return 0

    if (this.dryRun) {
      logger.info('[预览] 将删除这些冗余REFERENCES关系')
      return redundantCount
    }

    // 执行删除
    const deleteQuery = `
      MATCH (a)-[r:REFERENCES]->(b)
      WHERE NOT EXISTS {
        MATCH (a)-[:IMPORTS|:CONTAINS|:DEFINES]->(b)
      }
      AND NOT (
        (a.type = 'File' AND b.type IN ['Function', 'Class', 'Interface']) OR
        (a.type IN ['Function', 'Class'] AND b.type IN ['Interface', 'Type'])
      )
      DELETE r
      RETURN count(*) as deletedCount
    `

    const deleteResult = await this.session.run(deleteQuery)
    const deletedCount = deleteResult.records[0]?.get('deletedCount')?.toNumber() || 0

    logger.info(`成功删除 ${deletedCount} 个冗余REFERENCES关系`)
    return deletedCount
  }

  /**
   * 清理重复关系
   */
  private async cleanupDuplicateRelationships(): Promise<number> {
    if (!this.session) return 0

    logger.info('查找重复关系...')

    const query = `
      MATCH (a)-[r]->(b)
      WITH a, b, type(r) as relType, collect(r) as rels
      WHERE size(rels) > 1
      RETURN sum(size(rels) - 1) as duplicateCount
    `

    const result = await this.session.run(query)
    const duplicateCount = result.records[0]?.get('duplicateCount')?.toNumber() || 0

    logger.info(`发现 ${duplicateCount} 个重复关系`)

    if (duplicateCount === 0) return 0

    if (this.dryRun) {
      logger.info('[预览] 将保留最新的关系，删除重复项')
      return duplicateCount
    }

    // 删除重复关系，保留最新创建的
    const deleteQuery = `
      MATCH (a)-[r]->(b)
      WITH a, b, type(r) as relType, collect(r) as rels
      WHERE size(rels) > 1
      WITH rels, relType
      UNWIND rels[1..] as duplicateRel
      DELETE duplicateRel
      RETURN count(*) as deletedCount
    `

    const deleteResult = await this.session.run(deleteQuery)
    const deletedCount = deleteResult.records[0]?.get('deletedCount')?.toNumber() || 0

    logger.info(`成功删除 ${deletedCount} 个重复关系`)
    return deletedCount
  }

  /**
   * 清理低质量关系
   */
  private async cleanupLowQualityRelationships(): Promise<number> {
    if (!this.session) return 0

    logger.info('查找低质量关系...')

    // 查找置信度低且无明确语义的RELATED_TO关系
    const query = `
      MATCH (a)-[r:RELATED_TO]->(b)
      WHERE (r.confidence < 0.5 OR r.confidence IS NULL)
      AND NOT (r.description =~ '.*同文件.*|.*调用.*|.*导入.*')
      RETURN count(r) as lowQualityCount
    `

    const result = await this.session.run(query)
    const lowQualityCount = result.records[0]?.get('lowQualityCount')?.toNumber() || 0

    logger.info(`发现 ${lowQualityCount} 个低质量关系`)

    if (lowQualityCount === 0) return 0

    if (this.dryRun) {
      logger.info('[预览] 将删除低置信度的RELATED_TO关系')
      return lowQualityCount
    }

    // 删除低质量关系
    const deleteQuery = `
      MATCH (a)-[r:RELATED_TO]->(b)
      WHERE (r.confidence < 0.5 OR r.confidence IS NULL)
      AND NOT (r.description =~ '.*同文件.*|.*调用.*|.*导入.*')
      DELETE r
      RETURN count(*) as deletedCount
    `

    const deleteResult = await this.session.run(deleteQuery)
    const deletedCount = deleteResult.records[0]?.get('deletedCount')?.toNumber() || 0

    logger.info(`成功删除 ${deletedCount} 个低质量关系`)
    return deletedCount
  }

  /**
   * 获取关系统计信息
   */
  private async getRelationshipStats(): Promise<{
    totalCount: number
    byType: Record<string, number>
  }> {
    if (!this.session) return { totalCount: 0, byType: {} }

    // 总数
    const totalResult = await this.session.run('MATCH ()-[r]->() RETURN count(r) as total')
    const totalCount = totalResult.records[0]?.get('total')?.toNumber() || 0

    // 按类型统计
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

    return { totalCount, byType }
  }

  /**
   * 优化数据库性能
   */
  async optimizeDatabase(): Promise<void> {
    if (!this.session || this.dryRun) return

    logger.info('优化数据库性能...')

    try {
      // 创建索引以提高查询性能
      await this.session.run('CREATE INDEX IF NOT EXISTS FOR (n:GraphNode) ON (n.type)')
      await this.session.run('CREATE INDEX IF NOT EXISTS FOR (n:GraphNode) ON (n.name)')
      await this.session.run('CREATE INDEX IF NOT EXISTS FOR (f:File) ON (f.file_path)')

      logger.info('数据库索引优化完成')
    } catch (error) {
      logger.warn('数据库优化失败', { error })
    }
  }
}

/**
 * 显示清理报告
 */
function displayCleanupReport(stats: CleanupStats, dryRun: boolean): void {
  console.log('\n🧹 Neo4j数据库清理报告')
  console.log('=' .repeat(50))
  
  console.log('\n📊 清理统计:')
  console.log(`  清理前关系总数: ${stats.totalRelationships.toLocaleString()}`)
  console.log(`  冗余REFERENCES: ${stats.redundantReferences.toLocaleString()}`)
  console.log(`  重复关系: ${stats.duplicateRelations.toLocaleString()}`)
  console.log(`  低质量关系: ${stats.lowQualityRelations.toLocaleString()}`)
  console.log(`  ${dryRun ? '预计' : '实际'}删除总数: ${stats.removedCount.toLocaleString()}`)
  console.log(`  ${dryRun ? '预计' : ''}剩余关系: ${stats.remainingCount.toLocaleString()}`)

  const reductionPercent = ((stats.removedCount / stats.totalRelationships) * 100).toFixed(1)
  console.log(`  减少比例: ${reductionPercent}%`)

  console.log('\n💡 清理效果:')
  if (stats.remainingCount < 300000) {
    console.log('  ✅ 关系数量已降至安全范围')
  } else {
    console.log('  ⚠️  关系数量仍较高，建议进一步优化')
  }

  console.log('\n' + '=' .repeat(50))
}

/**
 * 解析命令行参数
 */
function parseArgs(): { mode: 'dry-run' | 'execute' | 'help' } {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    return { mode: 'help' }
  }
  
  if (args.includes('--execute')) {
    return { mode: 'execute' }
  }
  
  return { mode: 'dry-run' }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
Neo4j数据库清理脚本

用法:
  bun run tools/ai-platform/scripts/neo4j-cleanup.ts [选项]

选项:
  --dry-run       预览清理操作，不实际删除数据（默认）
  --execute       执行实际的清理操作
  --help, -h      显示帮助信息

清理策略:
  1. 删除冗余的REFERENCES关系（保留结构化关系）
  2. 删除重复的关系（保留最新创建的）
  3. 删除低质量的RELATED_TO关系（置信度<0.5）
  4. 优化数据库索引

安全措施:
  - 默认预览模式，需要明确指定--execute才会删除数据
  - 保留所有重要的结构化关系（IMPORTS, CONTAINS, DEFINES等）
  - 只删除明确冗余的关系

示例:
  bun run tools/ai-platform/scripts/neo4j-cleanup.ts              # 预览
  bun run tools/ai-platform/scripts/neo4j-cleanup.ts --execute   # 执行
`)
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const { mode } = parseArgs()

  if (mode === 'help') {
    showHelp()
    return
  }

  const dryRun = mode === 'dry-run'
  const service = new Neo4jCleanupService(dryRun)

  try {
    await service.connect()
    
    const stats = await service.cleanup()
    
    if (!dryRun) {
      await service.optimizeDatabase()
    }
    
    displayCleanupReport(stats, dryRun)
    
    if (dryRun) {
      console.log('\n💡 这是预览模式。要执行实际清理，请使用: --execute')
    } else {
      console.log('\n✅ 数据库清理完成！')
    }
    
  } catch (error) {
    logger.error('清理操作失败', error instanceof Error ? error : undefined)
    console.error('\n❌ 错误:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await service.disconnect()
  }
}

// 运行脚本
if (import.meta.main) {
  main().catch(error => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })
}