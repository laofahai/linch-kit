#!/usr/bin/env node

/**
 * 使用现有的提取器将数据导入到 Neo4j Aura
 */

import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
config({ path: join(__dirname, '.env') })

async function extractToNeo4j() {
  try {
    console.log('🚀 开始将 LinchKit 代码库数据提取到 Neo4j Aura...')
    
    // 动态导入提取命令模块
    const { extractCommand } = await import('./packages/ai/dist/cli/index.js')
    
    // 创建模拟的命令上下文
    const context = {
      log: console.log,
      logger: {
        info: console.log,
        error: console.error,
        warn: console.warn
      },
      options: {
        extractors: 'all',
        output: 'neo4j',
        clear: true,  // 清空现有数据
        'working-dir': __dirname
      },
      flags: {},
      args: [],
      t: undefined,
      commandName: 'ai:extract'
    }
    
    console.log('📊 执行数据提取和导入...')
    const result = await extractCommand.handler(context)
    
    if (result.success) {
      console.log('✅ 数据提取和导入成功完成！')
      console.log('📊 结果:', result.message)
    } else {
      console.error('❌ 数据提取失败:', result.error)
      throw new Error(result.error)
    }
    
  } catch (error) {
    console.error('❌ 提取过程失败:', error)
    console.error('错误详情:', error.stack)
    throw error
  }
}

// 运行提取
extractToNeo4j().catch(process.exit.bind(process, 1))