#!/usr/bin/env bun

/**
 * Neo4j 数据库统计脚本
 * 
 * 直接查询Neo4j数据库获取统计信息，包括：
 * - 节点总数
 * - 关系总数
 * - 节点类型分布
 * - 关系类型分布
 * 
 * 使用现有的Neo4j配置管理系统
 * 
 * 用法:
 *   bun run tools/ai-platform/scripts/neo4j-stats.ts          # 表格格式输出
 *   bun run tools/ai-platform/scripts/neo4j-stats.ts --json   # JSON格式输出
 */

import { createLogger } from '@linch-kit/core/server'
import neo4j, { Driver, Session } from 'neo4j-driver'
import { loadNeo4jConfig, validateNeo4jConfig } from '../src/config/neo4j-config.js'
import type { Neo4jConfig } from '../src/types/index.js'

const logger = createLogger({ name: 'neo4j-stats' })

interface NodeStats {
  type: string
  count: number
}

interface RelationshipStats {
  type: string
  count: number
}

interface DatabaseStats {
  totalNodes: number
  totalRelationships: number
  nodeTypes: NodeStats[]
  relationshipTypes: RelationshipStats[]
}

/**
 * Neo4j 统计查询服务
 */
class Neo4jStatsService {
  private driver: Driver | null = null
  private session: Session | null = null
  private quiet: boolean = false

  constructor(private config: Neo4jConfig, quiet: boolean = false) {
    this.quiet = quiet
  }

  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    try {
      this.driver = neo4j.driver(
        this.config.connectionUri,
        neo4j.auth.basic(this.config.username, this.config.password),
        {
          database: this.config.database,
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000,
        }
      )

      // 验证连接
      await this.driver.verifyConnectivity()
      this.session = this.driver.session({ database: this.config.database })
      
      if (!this.quiet) {
        logger.info('Neo4j 连接成功', {
          uri: this.config.connectionUri,
          database: this.config.database,
          username: this.config.username,
        })
      }
    } catch (error) {
      logger.error('Neo4j 连接失败', error instanceof Error ? error : undefined)
      throw error
    }
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
   * 获取节点总数
   */
  async getTotalNodes(): Promise<number> {
    if (!this.session) throw new Error('未连接到Neo4j')
    
    const result = await this.session.run('MATCH (n) RETURN count(n) as count')
    return result.records[0]?.get('count')?.toNumber() || 0
  }

  /**
   * 获取关系总数
   */
  async getTotalRelationships(): Promise<number> {
    if (!this.session) throw new Error('未连接到Neo4j')
    
    const result = await this.session.run('MATCH ()-[r]->() RETURN count(r) as count')
    return result.records[0]?.get('count')?.toNumber() || 0
  }

  /**
   * 获取节点类型分布
   */
  async getNodeTypeDistribution(): Promise<NodeStats[]> {
    if (!this.session) throw new Error('未连接到Neo4j')
    
    const result = await this.session.run(`
      MATCH (n) 
      RETURN labels(n)[0] as type, count(n) as count 
      ORDER BY count DESC
    `)
    
    return result.records.map(record => ({
      type: record.get('type') || 'UNLABELED',
      count: record.get('count')?.toNumber() || 0
    }))
  }

  /**
   * 获取关系类型分布
   */
  async getRelationshipTypeDistribution(): Promise<RelationshipStats[]> {
    if (!this.session) throw new Error('未连接到Neo4j')
    
    const result = await this.session.run(`
      MATCH ()-[r]->() 
      RETURN type(r) as type, count(r) as count 
      ORDER BY count DESC
    `)
    
    return result.records.map(record => ({
      type: record.get('type') || 'UNKNOWN',
      count: record.get('count')?.toNumber() || 0
    }))
  }

  /**
   * 获取完整的数据库统计信息
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    if (!this.session) throw new Error('未连接到Neo4j')
    
    // 使用单个事务执行所有查询
    const txc = this.session.beginTransaction()
    
    try {
      // 1. 获取节点总数
      const nodeCountResult = await txc.run('MATCH (n) RETURN count(n) as count')
      const totalNodes = nodeCountResult.records[0]?.get('count')?.toNumber() || 0
      
      // 2. 获取关系总数
      const relCountResult = await txc.run('MATCH ()-[r]->() RETURN count(r) as count')
      const totalRelationships = relCountResult.records[0]?.get('count')?.toNumber() || 0
      
      // 3. 获取节点类型分布
      const nodeTypeResult = await txc.run(`
        MATCH (n) 
        RETURN labels(n)[0] as type, count(n) as count 
        ORDER BY count DESC
      `)
      const nodeTypes = nodeTypeResult.records.map(record => ({
        type: record.get('type') || 'UNLABELED',
        count: record.get('count')?.toNumber() || 0
      }))
      
      // 4. 获取关系类型分布
      const relTypeResult = await txc.run(`
        MATCH ()-[r]->() 
        RETURN type(r) as type, count(r) as count 
        ORDER BY count DESC
      `)
      const relationshipTypes = relTypeResult.records.map(record => ({
        type: record.get('type') || 'UNKNOWN',
        count: record.get('count')?.toNumber() || 0
      }))
      
      await txc.commit()
      
      return {
        totalNodes,
        totalRelationships,
        nodeTypes,
        relationshipTypes
      }
    } catch (error) {
      await txc.rollback()
      throw error
    }
  }
}

/**
 * 格式化统计结果显示
 */
function formatStats(stats: DatabaseStats): void {
  console.log('\n🔍 Neo4j 数据库统计信息')
  console.log('=' .repeat(50))
  
  // 总体统计
  console.log('\n📊 总体统计:')
  console.log(`  节点总数: ${stats.totalNodes.toLocaleString()}`)
  console.log(`  关系总数: ${stats.totalRelationships.toLocaleString()}`)
  
  // 节点类型分布
  console.log('\n🏷️  节点类型分布:')
  if (stats.nodeTypes.length === 0) {
    console.log('  暂无节点数据')
  } else {
    stats.nodeTypes.forEach((nodeType, index) => {
      const percentage = stats.totalNodes > 0 ? 
        ((nodeType.count / stats.totalNodes) * 100).toFixed(1) : '0.0'
      console.log(`  ${index + 1}. ${nodeType.type}: ${nodeType.count.toLocaleString()} (${percentage}%)`)
    })
  }
  
  // 关系类型分布
  console.log('\n🔗 关系类型分布:')
  if (stats.relationshipTypes.length === 0) {
    console.log('  暂无关系数据')
  } else {
    stats.relationshipTypes.forEach((relType, index) => {
      const percentage = stats.totalRelationships > 0 ? 
        ((relType.count / stats.totalRelationships) * 100).toFixed(1) : '0.0'
      console.log(`  ${index + 1}. ${relType.type}: ${relType.count.toLocaleString()} (${percentage}%)`)
    })
  }
  
  // 数据库健康度指标
  console.log('\n💊 数据库健康度:')
  const nodeToRelationshipRatio = stats.totalNodes > 0 ? 
    (stats.totalRelationships / stats.totalNodes).toFixed(2) : '0.00'
  console.log(`  节点/关系比: 1:${nodeToRelationshipRatio}`)
  
  const typesDiversity = stats.nodeTypes.length + stats.relationshipTypes.length
  console.log(`  类型多样性: ${typesDiversity} 种不同类型`)
  
  console.log('\n' + '=' .repeat(50))
}

/**
 * 解析命令行参数
 */
function parseArgs(): { format: 'table' | 'json'; quiet: boolean } {
  const args = process.argv.slice(2)
  const format = args.includes('--json') ? 'json' : 'table'
  const quiet = args.includes('--quiet') || args.includes('-q')
  return { format, quiet }
}

/**
 * JSON格式输出
 */
function formatStatsAsJSON(stats: DatabaseStats): void {
  console.log(JSON.stringify(stats, null, 2))
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  let statsService: Neo4jStatsService | null = null
  
  try {
    // 解析命令行参数
    const { format, quiet } = parseArgs()
    
    // 加载配置
    if (!quiet) logger.info('加载 Neo4j 配置...')
    const config = await loadNeo4jConfig()
    
    // 验证配置
    if (!validateNeo4jConfig(config)) {
      logger.error('Neo4j 配置验证失败')
      process.exit(1)
    }
    
    // 初始化服务
    statsService = new Neo4jStatsService(config, quiet)
    
    // 连接数据库
    await statsService.connect()
    
    // 获取统计信息
    if (!quiet) logger.info('正在获取数据库统计信息...')
    const stats = await statsService.getDatabaseStats()
    
    // 格式化输出
    if (format === 'json') {
      formatStatsAsJSON(stats)
    } else {
      formatStats(stats)
    }
    
  } catch (error) {
    logger.error('获取统计信息失败', error instanceof Error ? error : undefined)
    console.error('\n❌ 错误:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    // 清理连接
    if (statsService) {
      await statsService.disconnect()
    }
  }
}

// 显示帮助信息
function showHelp(): void {
  console.log(`
Neo4j 数据库统计脚本

用法:
  bun run tools/ai-platform/scripts/neo4j-stats.ts [选项]

选项:
  --json          输出JSON格式的统计信息
  --quiet, -q     静默模式，不输出日志信息
  --help, -h      显示帮助信息

示例:
  bun run tools/ai-platform/scripts/neo4j-stats.ts              # 表格格式
  bun run tools/ai-platform/scripts/neo4j-stats.ts --json       # JSON格式
  bun run tools/ai-platform/scripts/neo4j-stats.ts --json -q    # 静默JSON格式
`)
}

// 运行脚本
if (import.meta.main) {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }
  
  main().catch(error => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })
}