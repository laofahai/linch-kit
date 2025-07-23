#!/usr/bin/env bun

/**
 * 增量同步命令行工具
 * 
 * 用法：
 *   bun tools/ai-platform/scripts/incremental-sync.ts --check    # 检查变更
 *   bun tools/ai-platform/scripts/incremental-sync.ts --sync     # 执行增量同步
 *   bun tools/ai-platform/scripts/incremental-sync.ts --full     # 强制完整同步
 */

import { createLogger } from '@linch-kit/core/server'
import { IncrementalSyncManager } from '../src/core/incremental-sync'
import { Neo4jService } from '../src/core/graph/neo4j-service'
import { FunctionExtractor } from '../src/extractors/function-extractor'
import { ImportExtractor } from '../src/extractors/import-extractor'

const logger = createLogger({ name: 'incremental-sync' })

interface SyncOptions {
  check?: boolean
  sync?: boolean
  full?: boolean
  dryRun?: boolean
}

async function parseArgs(): Promise<SyncOptions> {
  const args = process.argv.slice(2)
  return {
    check: args.includes('--check'),
    sync: args.includes('--sync'),
    full: args.includes('--full'),
    dryRun: args.includes('--dry-run')
  }
}

async function checkChanges(syncManager: IncrementalSyncManager) {
  console.log('\n🔍 检查文件变更...\n')
  
  await syncManager.loadState()
  const changes = await syncManager.scanChangedFiles()
  
  const stats = syncManager.getStats()
  
  console.log('📊 同步状态:')
  console.log(`  上次同步: ${stats.lastSync.toLocaleString()}`)
  console.log(`  跟踪文件: ${stats.trackedFiles} 个`)
  console.log(`  版本: ${stats.version}`)
  console.log()
  
  console.log('📋 变更统计:')
  console.log(`  🆕 新增文件: ${changes.added.length} 个`)
  console.log(`  📝 修改文件: ${changes.changed.length} 个`)
  console.log(`  🗑️  删除文件: ${changes.deleted.length} 个`)
  console.log(`  ✅ 未变更: ${changes.unchanged.length} 个`)
  console.log()
  
  if (changes.added.length > 0) {
    console.log('🆕 新增文件:')
    changes.added.slice(0, 10).forEach(file => {
      console.log(`  + ${file.replace(process.cwd(), '.')}`)
    })
    if (changes.added.length > 10) {
      console.log(`  ... 还有 ${changes.added.length - 10} 个文件`)
    }
    console.log()
  }
  
  if (changes.changed.length > 0) {
    console.log('📝 修改文件:')
    changes.changed.slice(0, 10).forEach(file => {
      console.log(`  ~ ${file.replace(process.cwd(), '.')}`)
    })
    if (changes.changed.length > 10) {
      console.log(`  ... 还有 ${changes.changed.length - 10} 个文件`)
    }
    console.log()
  }
  
  if (changes.deleted.length > 0) {
    console.log('🗑️ 删除文件:')
    changes.deleted.slice(0, 10).forEach(file => {
      console.log(`  - ${file.replace(process.cwd(), '.')}`)
    })
    if (changes.deleted.length > 10) {
      console.log(`  ... 还有 ${changes.deleted.length - 10} 个文件`)
    }
    console.log()
  }
  
  const totalChanges = changes.added.length + changes.changed.length + changes.deleted.length
  if (totalChanges === 0) {
    console.log('✅ 没有文件变更，无需同步')
  } else {
    console.log(`💡 建议执行增量同步处理 ${totalChanges} 个变更文件`)
  }
  
  return changes
}

async function performIncrementalSync(
  syncManager: IncrementalSyncManager, 
  neo4jService: Neo4jService,
  options: SyncOptions
) {
  console.log('\n🔄 执行增量同步...\n')
  
  await syncManager.loadState()
  
  // 检查是否需要完整同步
  if (syncManager.shouldForceFullSync() || options.full) {
    console.log('⚠️  检测到需要完整同步，转为完整同步模式')
    return await performFullSync(neo4jService, options)
  }
  
  const changes = await syncManager.scanChangedFiles()
  const totalChanges = changes.added.length + changes.changed.length + changes.deleted.length
  
  if (totalChanges === 0) {
    console.log('✅ 没有变更，跳过同步')
    return
  }
  
  console.log(`📊 将处理 ${totalChanges} 个变更文件`)
  
  if (options.dryRun) {
    console.log('🔍 预览模式，不会实际修改数据库')
    return
  }
  
  // 连接数据库
  await neo4jService.connect()
  
  try {
    // 处理删除的文件
    if (changes.deleted.length > 0) {
      console.log(`\n🗑️  处理 ${changes.deleted.length} 个删除文件...`)
      await removeDeletedFileData(neo4jService, changes.deleted)
    }
    
    // 处理新增和修改的文件
    const filesToProcess = [...changes.added, ...changes.changed]
    if (filesToProcess.length > 0) {
      console.log(`\n📝 处理 ${filesToProcess.length} 个新增/修改文件...`)
      await processChangedFiles(neo4jService, filesToProcess)
    }
    
    // 保存同步状态
    await syncManager.saveState()
    
    console.log('\n✅ 增量同步完成')
    
  } finally {
    await neo4jService.disconnect()
  }
}

async function performFullSync(neo4jService: Neo4jService, options: SyncOptions) {
  console.log('\n🔄 执行完整同步...\n')
  
  if (options.dryRun) {
    console.log('🔍 预览模式，不会实际修改数据库')
    return
  }
  
  // 这里可以调用现有的完整同步逻辑
  console.log('💡 执行完整同步，请使用: bun run ai:session sync')
}

async function removeDeletedFileData(neo4jService: Neo4jService, deletedFiles: string[]) {
  for (const filePath of deletedFiles) {
    const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '')
    
    // 删除文件相关的节点和关系
    const query = `
      MATCH (f:GraphNode {type: 'File'})
      WHERE f.file_path CONTAINS $relativePath
      DETACH DELETE f
    `
    
    await neo4jService.query(query, { relativePath })
    console.log(`  - 删除文件数据: ${relativePath}`)
  }
}

async function processChangedFiles(neo4jService: Neo4jService, changedFiles: string[]) {
  const functionExtractor = new FunctionExtractor()
  const importExtractor = new ImportExtractor()
  
  // 批量处理文件
  const batchSize = 10
  for (let i = 0; i < changedFiles.length; i += batchSize) {
    const batch = changedFiles.slice(i, i + batchSize)
    
    console.log(`  处理批次 ${Math.floor(i / batchSize) + 1}: ${batch.length} 个文件`)
    
    for (const filePath of batch) {
      const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '')
      
      try {
        // 先删除旧数据
        const deleteQuery = `
          MATCH (f:GraphNode {type: 'File'})
          WHERE f.file_path = $relativePath
          DETACH DELETE f
        `
        await neo4jService.query(deleteQuery, { relativePath })
        
        // 提取新数据
        const functionData = await functionExtractor.extractFromFiles([filePath])
        const importData = await importExtractor.extract()
        
        // 过滤只处理当前文件的数据
        const fileNodes = functionData.nodes.filter(n => 
          n.properties?.file_path === relativePath
        )
        const fileRelationships = functionData.relationships.filter(r => 
          fileNodes.some(n => n.id === r.source || n.id === r.target)
        )
        
        // 导入新数据
        if (fileNodes.length > 0 || fileRelationships.length > 0) {
          await neo4jService.importData(fileNodes, fileRelationships)
        }
        
        console.log(`    ✓ ${relativePath}`)
        
      } catch (error) {
        console.log(`    ✗ ${relativePath}: ${error}`)
      }
    }
  }
}

async function main() {
  try {
    const options = await parseArgs()
    
    if (!options.check && !options.sync && !options.full) {
      console.log(`
🔄 LinchKit 增量同步工具

用法:
  bun tools/ai-platform/scripts/incremental-sync.ts --check     # 检查变更
  bun tools/ai-platform/scripts/incremental-sync.ts --sync      # 执行增量同步
  bun tools/ai-platform/scripts/incremental-sync.ts --full      # 强制完整同步
  bun tools/ai-platform/scripts/incremental-sync.ts --dry-run   # 预览模式

选项:
  --check     检查哪些文件发生了变更
  --sync      执行增量同步，只处理变更文件
  --full      强制执行完整同步
  --dry-run   预览模式，不实际修改数据库
      `)
      return
    }
    
    const syncManager = new IncrementalSyncManager()
    const neo4jService = new Neo4jService()
    
    if (options.check) {
      await checkChanges(syncManager)
    } else if (options.sync || options.full) {
      await performIncrementalSync(syncManager, neo4jService, options)
    }
    
  } catch (error) {
    logger.error('增量同步失败', { error })
    process.exit(1)
  }
}

main()