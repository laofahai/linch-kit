#!/usr/bin/env bun

/**
 * Neo4j 分批重置脚本 - 解决连接超时问题
 * 
 * 🎯 通过小批量操作避免连接被服务器关闭
 * 
 * 用法：
 *   bun tools/ai-platform/scripts/neo4j-batch-reset.ts
 */

import { createLogger } from '@linch-kit/core/server'
import { Neo4jService } from '../src/core/graph/neo4j-service'
import { loadNeo4jConfig } from '../src/core/config/neo4j-config'

const logger = createLogger({ name: 'batch-reset' })

class BatchResetManager {
  private neo4jService: Neo4jService | null = null

  async initialize() {
    try {
      const config = await loadNeo4jConfig()
      this.neo4jService = new Neo4jService(config)
      await this.neo4jService.connect()
      logger.info('Neo4j 连接成功')
    } catch (error) {
      logger.error('Neo4j 连接失败', { error })
      throw error
    }
  }

  async batchReset() {
    if (!this.neo4jService) {
      throw new Error('Neo4j service not initialized')
    }

    try {
      console.log('\n🚀 开始分批重置 Neo4j 数据库...\n')

      // 1. 获取当前统计
      console.log('📊 检查当前数据规模...')
      const initialStats = await this.neo4jService.getStats()
      console.log(`当前数据: ${initialStats.node_count.toLocaleString()} 节点, ${initialStats.relationship_count.toLocaleString()} 关系`)

      if (initialStats.relationship_count === 0 && initialStats.node_count === 0) {
        console.log('✅ 数据库已经是空的，无需重置')
        return
      }

      // 2. 分批删除关系 (避免超时)
      console.log('\n🗑️  分批删除关系...')
      await this.batchDeleteRelationships()

      // 3. 分批删除节点
      console.log('\n🗑️  分批删除节点...')
      await this.batchDeleteNodes()

      // 4. 验证清理结果
      console.log('\n✅ 验证清理结果...')
      const finalStats = await this.neo4jService.getStats()
      console.log(`最终数据: ${finalStats.node_count.toLocaleString()} 节点, ${finalStats.relationship_count.toLocaleString()} 关系`)

      if (finalStats.node_count === 0 && finalStats.relationship_count === 0) {
        console.log('🎉 数据库重置成功！')
      } else {
        console.log('⚠️  部分数据可能未完全清理，建议重新运行')
      }

    } catch (error) {
      logger.error('批量重置失败', { error })
      throw error
    } finally {
      await this.cleanup()
    }
  }

  private async batchDeleteRelationships() {
    const BATCH_SIZE = 10000 // 每批删除1万个关系
    let totalDeleted = 0

    while (true) {
      try {
        // 重新连接避免超时
        await this.reconnect()
        
        const result = await this.neo4jService!.query(
          `MATCH ()-[r]-() 
           WITH r LIMIT ${BATCH_SIZE}
           DELETE r
           RETURN count(r) as deleted`,
          {}
        )

        const deleted = result.records[0]?.get('deleted')?.toNumber() || 0
        
        if (deleted === 0) {
          break // 没有更多关系需要删除
        }

        totalDeleted += deleted
        console.log(`   已删除 ${deleted.toLocaleString()} 个关系 (总计: ${totalDeleted.toLocaleString()})`)
        
        // 短暂休息避免过载
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        logger.warn('关系删除批次失败，重试中...', { error: error instanceof Error ? error.message : error })
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    console.log(`✅ 关系删除完成，共删除 ${totalDeleted.toLocaleString()} 个关系`)
  }

  private async batchDeleteNodes() {
    const BATCH_SIZE = 5000 // 每批删除5千个节点
    let totalDeleted = 0

    while (true) {
      try {
        // 重新连接避免超时
        await this.reconnect()
        
        const result = await this.neo4jService!.query(
          `MATCH (n) 
           WITH n LIMIT ${BATCH_SIZE}
           DELETE n
           RETURN count(n) as deleted`,
          {}
        )

        const deleted = result.records[0]?.get('deleted')?.toNumber() || 0
        
        if (deleted === 0) {
          break // 没有更多节点需要删除
        }

        totalDeleted += deleted
        console.log(`   已删除 ${deleted.toLocaleString()} 个节点 (总计: ${totalDeleted.toLocaleString()})`)
        
        // 短暂休息避免过载
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        logger.warn('节点删除批次失败，重试中...', { error: error instanceof Error ? error.message : error })
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    console.log(`✅ 节点删除完成，共删除 ${totalDeleted.toLocaleString()} 个节点`)
  }

  private async reconnect() {
    try {
      if (this.neo4jService) {
        await this.neo4jService.disconnect()
        await this.neo4jService.connect()
      }
    } catch (error) {
      logger.warn('重连失败', { error })
      // 继续尝试，可能连接仍然有效
    }
  }

  private async cleanup() {
    if (this.neo4jService) {
      await this.neo4jService.disconnect()
      logger.info('已断开 Neo4j 连接')
    }
  }
}

async function confirmReset(): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write('⚠️  确认要分批重置数据库吗？这将删除所有数据！(y/N): ')
    
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase()
      resolve(input === 'y' || input === 'yes')
    })
  })
}

async function main() {
  try {
    console.log('🚀 Neo4j 分批重置工具\n')
    
    const confirmed = await confirmReset()
    if (!confirmed) {
      console.log('❌ 操作已取消')
      process.exit(0)
    }

    const manager = new BatchResetManager()
    await manager.initialize()
    await manager.batchReset()
    
    console.log('\n🎉 分批重置完成！现在可以运行 "bun graph sync" 重新同步数据。')
    
  } catch (error) {
    logger.error('分批重置失败', { error })
    console.log(`\n❌ 重置失败: ${error}`)
    process.exit(1)
  }
}

main()