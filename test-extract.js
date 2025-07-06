#!/usr/bin/env node

/**
 * 临时测试脚本：测试数据提取功能
 */

import { PackageExtractor } from './packages/ai/dist/extractors/index.js'

async function testExtraction() {
  console.log('🔍 开始测试包提取器...')
  
  try {
    const extractor = new PackageExtractor()
    console.log('✅ 提取器创建成功')
    
    const result = await extractor.extract()
    console.log('📊 提取结果:')
    console.log(`  - 节点数量: ${result.nodes.length}`)
    console.log(`  - 关系数量: ${result.relationships.length}`)
    
    if (result.nodes.length > 0) {
      const nodeTypes = result.nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1
        return acc
      }, {})
      console.log('  - 节点类型分布:', nodeTypes)
    }
    
    if (result.relationships.length > 0) {
      const relTypes = result.relationships.reduce((acc, rel) => {
        acc[rel.type] = (acc[rel.type] || 0) + 1
        return acc
      }, {})
      console.log('  - 关系类型分布:', relTypes)
    }
    
    // 保存到本地文件用于调试
    const fs = await import('fs/promises')
    await fs.writeFile('./test-nodes.json', JSON.stringify(result.nodes, null, 2))
    await fs.writeFile('./test-relationships.json', JSON.stringify(result.relationships, null, 2))
    console.log('💾 结果已保存到 test-nodes.json 和 test-relationships.json')
    
  } catch (error) {
    console.error('❌ 提取失败:', error.message)
    console.error(error.stack)
  }
}

testExtraction()