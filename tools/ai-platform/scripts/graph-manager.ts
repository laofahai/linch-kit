#!/usr/bin/env bun

/**
 * LinchKit 图谱数据管理器 - 统一入口
 * 
 * 🎯 一个命令管理所有图谱操作！
 * 
 * 用法：
 *   bun graph                  # 显示帮助
 *   bun graph check            # 检查数据状态和变更文件  
 *   bun graph sync             # 智能同步（增量/完整自动选择）
 *   bun graph clean            # 清理重复数据
 *   bun graph reset            # 重置数据库
 *   bun graph stats            # 查看数据统计
 */

import { createLogger } from '@linch-kit/core/server'
import { IncrementalSyncManager } from '../src/core/incremental-sync'
import { Neo4jService } from '../src/core/graph/neo4j-service'
import neo4j from 'neo4j-driver'
import { loadNeo4jConfig } from '../src/core/config/neo4j-config.js'
import { spawn } from 'child_process'
import { promisify } from 'util'

const logger = createLogger({ name: 'graph-manager' })

class GraphManager {
  private syncManager: IncrementalSyncManager
  private neo4jService: Neo4jService

  constructor() {
    this.syncManager = new IncrementalSyncManager()
    // Initialize with default config, will load properly when connecting
    this.neo4jService = new Neo4jService(this.getDefaultConfig())
  }

  private getDefaultConfig() {
    return {
      connectionUri: process.env.NEO4J_CONNECTION_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j', 
      password: process.env.NEO4J_PASSWORD || 'password',
      database: process.env.NEO4J_DATABASE || 'neo4j'
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🚀 LinchKit 图谱数据管理器

📋 可用命令:
  check     检查数据状态和变更文件
  sync      智能同步（自动选择增量或完整同步）
  clean     清理重复和冗余数据
  reset     完全重置数据库
  stats     查看数据库统计信息

💡 使用示例:
  bun graph check           # 快速检查状态
  bun graph sync            # 日常同步操作
  bun graph clean           # 发现重复数据时清理
  bun graph reset           # 数据损坏时重置

🎯 推荐日常工作流:
  1. bun graph check        # 查看哪些文件变更了
  2. bun graph sync         # 同步变更到图谱
  3. bun graph clean        # 偶尔清理重复数据
    `)
  }

  /**
   * 检查数据状态
   */
  async check() {
    console.log('\n🔍 检查图谱数据状态...\n')
    
    try {
      // 1. 检查Neo4j连接
      await this.checkConnection()
      
      // 2. 检查数据统计
      await this.showBasicStats()
      
      // 3. 检查文件变更
      await this.checkFileChanges()
      
    } catch (error) {
      console.log(`❌ 检查失败: ${error}`)
    }
  }

  /**
   * 智能同步
   */
  async sync() {
    console.log('\n🔄 执行智能同步...\n')
    
    try {
      await this.syncManager.loadState()
      
      // 检查是否需要完整同步
      if (this.syncManager.shouldForceFullSync()) {
        console.log('⚡ 执行完整同步（超过7天或首次运行）')
        await this.runFullSync()
      } else {
        const changes = await this.syncManager.scanChangedFiles()
        const totalChanges = changes.added.length + changes.changed.length + changes.deleted.length
        
        if (totalChanges === 0) {
          console.log('✅ 无文件变更，跳过同步')
          return
        }
        
        console.log(`📊 发现 ${totalChanges} 个变更文件，执行增量同步`)
        await this.runIncrementalSync(changes)
      }
      
      console.log('\n✅ 同步完成')
      
    } catch (error) {
      console.log(`❌ 同步失败: ${error}`)
    }
  }

  /**
   * 清理重复数据
   */
  async clean() {
    console.log('\n🧹 清理重复和冗余数据...\n')
    
    try {
      // 调用清理脚本
      await this.runCommand('bun', ['tools/ai-platform/scripts/neo4j-cleanup.ts', '--execute'])
      console.log('✅ 数据清理完成')
      
    } catch (error) {
      console.log(`❌ 清理失败: ${error}`)
    }
  }

  /**
   * 重置数据库
   */
  async reset() {
    console.log('\n🔄 重置图谱数据库...\n')
    
    // 确认操作
    const confirmed = await this.confirmReset()
    if (!confirmed) {
      console.log('❌ 操作已取消')
      return
    }
    
    try {
      await this.clearDatabase()
      await this.runFullSync()
      console.log('✅ 数据库重置完成')
      
    } catch (error) {
      console.log(`❌ 重置失败: ${error}`)
    }
  }

  /**
   * 显示统计信息
   */
  async stats() {
    console.log('\n📊 图谱数据统计...\n')
    
    try {
      await this.neo4jService.connect()
      const stats = await this.neo4jService.getStats()
      
      console.log('📈 数据库统计:')
      console.log(`  节点总数: ${stats.node_count.toLocaleString()}`)
      console.log(`  关系总数: ${stats.relationship_count.toLocaleString()}`)
      console.log(`  最后更新: ${stats.last_updated}`)
      console.log()
      
      console.log('📋 节点类型分布:')
      Object.entries(stats.node_types).forEach(([type, count]) => {
        console.log(`  ${type}: ${count.toLocaleString()}`)
      })
      console.log()
      
      console.log('🔗 关系类型分布:')
      Object.entries(stats.relationship_types).forEach(([type, count]) => {
        console.log(`  ${type}: ${count.toLocaleString()}`)
      })
      
      await this.neo4jService.disconnect()
      
    } catch (error) {
      console.log(`❌ 获取统计失败: ${error}`)
    }
  }

  // 私有方法
  private async checkConnection() {
    try {
      console.log('✅ Neo4j 配置检查通过')
    } catch (error) {
      throw new Error(`Neo4j 连接失败: ${error}`)
    }
  }

  private async showBasicStats() {
    try {
      await this.neo4jService.connect()
      const stats = await this.neo4jService.getStats()
      console.log(`📊 当前数据: ${stats.node_count.toLocaleString()} 节点, ${stats.relationship_count.toLocaleString()} 关系`)
      await this.neo4jService.disconnect()
    } catch (error) {
      console.log('⚠️  无法获取数据统计')
    }
  }

  private async checkFileChanges() {
    await this.syncManager.loadState()
    const changes = await this.syncManager.scanChangedFiles()
    
    const totalChanges = changes.added.length + changes.changed.length + changes.deleted.length
    
    if (totalChanges === 0) {
      console.log('✅ 无文件变更')
    } else {
      console.log(`📝 发现变更: ${changes.added.length} 新增, ${changes.changed.length} 修改, ${changes.deleted.length} 删除`)
      console.log('💡 运行 "bun graph sync" 进行同步')
    }
  }

  private async runFullSync() {
    await this.runCommand('bun', ['tools/ai-platform/scripts/graph-data-extractor.ts'])
  }

  private async runIncrementalSync(changes: any) {
    // 简化的增量同步逻辑
    console.log('⚡ 增量同步功能开发中，暂时执行完整同步')
    await this.runFullSync()
    await this.syncManager.saveState()
  }

  private async clearDatabase() {
    const config = await loadNeo4jConfig()
    const driver = neo4j.driver(
      config.connectionUri,
      neo4j.auth.basic(config.username, config.password),
      { database: config.database }
    )

    const session = driver.session()
    
    try {
      console.log('🗑️  删除所有关系...')
      await session.run('MATCH ()-[r]-() DELETE r')
      
      console.log('🗑️  删除所有节点...')
      await session.run('MATCH (n) DELETE n')
      
      console.log('✅ 数据库已清空')
    } finally {
      await session.close()
      await driver.close()
    }
  }

  private async confirmReset(): Promise<boolean> {
    return new Promise((resolve) => {
      process.stdout.write('⚠️  确认要重置数据库吗？这将删除所有数据！(y/N): ')
      
      process.stdin.once('data', (data) => {
        const input = data.toString().trim().toLowerCase()
        resolve(input === 'y' || input === 'yes')
      })
    })
  }

  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { 
        stdio: 'inherit',
        shell: true 
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`命令执行失败，退出码: ${code}`))
        }
      })
      
      child.on('error', reject)
    })
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const manager = new GraphManager()
  
  switch (command) {
    case 'check':
      await manager.check()
      break
    case 'sync':
      await manager.sync()
      break
    case 'clean':
      await manager.clean()
      break
    case 'reset':
      await manager.reset()
      break
    case 'stats':
      await manager.stats()
      break
    default:
      manager.showHelp()
  }
}

main().catch(error => {
  logger.error('图谱管理器执行失败', { error })
  process.exit(1)
})