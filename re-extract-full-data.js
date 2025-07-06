#!/usr/bin/env node

/**
 * 重新提取完整代码库数据到 Neo4j
 * 恢复知识图谱的完整性
 */

import neo4j from 'neo4j-driver'

async function reExtractFullData() {
  console.log('🚀 开始重新提取完整代码库数据...')
  
  // 0. 确保在正确的工作目录
  console.log('📂 当前工作目录:', process.cwd())
  const projectRoot = '/home/laofahai/workspace/linch-kit'
  console.log('📂 切换到项目根目录:', projectRoot)
  process.chdir(projectRoot)
  console.log('📂 新工作目录:', process.cwd())
  
  try {
    // 1. 清空现有数据
    console.log('🧹 清空 Neo4j 数据库...')
    const driver = neo4j.driver(
      'neo4j+s://d4a26556.databases.neo4j.io',
      neo4j.auth.basic('neo4j', 'UbY-DQI7y3TjkOw548Nm99Qpw43_DvAa2F6o8HRZBkY')
    )
    
    const session = driver.session()
    await session.run('MATCH (n) DETACH DELETE n')
    console.log('✅ 数据库已清空')
    await session.close()
    await driver.close()
    
    // 2. 动态导入提取器
    console.log('📦 加载数据提取器...')
    const extractorModule = await import('./packages/ai/dist/extractors/index.js')
    console.log('可用提取器:', Object.keys(extractorModule))
    
    const { 
      PackageExtractor, 
      SchemaExtractor, 
      DocumentExtractor
    } = extractorModule
    
    // 3. 动态导入Neo4j服务和配置
    const aiModule = await import('./packages/ai/dist/index.js')
    const { Neo4jService } = aiModule
    
    // 创建Neo4j服务实例，传入正确的配置对象
    const neo4jConfig = {
      connectionUri: 'neo4j+s://d4a26556.databases.neo4j.io',
      username: 'neo4j', 
      password: 'UbY-DQI7y3TjkOw548Nm99Qpw43_DvAa2F6o8HRZBkY',
      database: 'neo4j'
    }
    const neo4jService = new Neo4jService(neo4jConfig)
    await neo4jService.connect()
    
    // 4. 执行可用的提取器
    const extractors = [
      { name: 'Package', extractor: new PackageExtractor() },
      { name: 'Schema', extractor: new SchemaExtractor() },
      { name: 'Document', extractor: new DocumentExtractor() }
    ]
    
    let totalNodes = []
    let totalRelationships = []
    
    for (const { name, extractor } of extractors) {
      console.log(`🔍 执行 ${name} 提取器...`)
      try {
        const result = await extractor.extract()
        console.log(`  ${name}: ${result.nodes.length} 节点, ${result.relationships.length} 关系`)
        totalNodes.push(...result.nodes)
        totalRelationships.push(...result.relationships)
      } catch (error) {
        console.error(`  ❌ ${name} 提取器失败:`, error.message)
      }
    }
    
    // 5. 导入到Neo4j
    console.log(`📤 导入数据到 Neo4j: ${totalNodes.length} 节点, ${totalRelationships.length} 关系`)
    await neo4jService.importData(totalNodes, totalRelationships)
    
    await neo4jService.disconnect()
    
    console.log('✨ 完整数据提取完成！')
    console.log(`📊 最终统计: ${totalNodes.length} 节点, ${totalRelationships.length} 关系`)
    
  } catch (error) {
    console.error('❌ 重新提取失败:', error)
    console.error('错误详情:', error.stack)
  }
}

reExtractFullData()