#!/usr/bin/env bun

/**
 * Claude Code 专用上下文查询CLI工具
 *
 * 专为Claude Code调用优化的简化版本
 * 输出标准JSON格式，便于AI解析
 */

import { createLogger } from '@linch-kit/core/server'

import { ContextQueryTool } from '../context/context-query-tool.js'
import { createLogger } from '@linch-kit/core/server'

const logger = createLogger({ name: 'claude-context-cli' })

// 类型定义
interface EntityResult {
  id: string
  name: string
  type: string
  package?: string
  description?: string
  relevance?: number
}

interface RelationshipResult {
  from: string
  to: string
  type: string
}

interface QueryMetadata {
  total_results: number
  relevance_score: number
}

interface ContextResult {
  entities?: EntityResult[]
  relationships?: RelationshipResult[]
  metadata?: QueryMetadata
}

interface PatternResult {
  name: string
  description: string
  usage?: string
}

interface PracticeResult {
  name: string
  description: string
  category?: string
}

type QueryResult = ContextResult | PatternResult[] | PracticeResult[]

interface CLIOptions {
  query: string
  type: 'context' | 'patterns' | 'practices'
  limit: number
  format: 'json' | 'text'
  verbose: boolean
}

/**
 * 解析命令行参数
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    query: '',
    type: 'context',
    limit: 10,
    format: 'json',
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    switch (arg) {
      case '--query':
      case '-q':
        options.query = nextArg || ''
        i++
        break
      case '--type':
      case '-t':
        options.type = (nextArg as CLIOptions['type']) || 'context'
        i++
        break
      case '--limit':
      case '-l':
        options.limit = parseInt(nextArg) || 10
        i++
        break
      case '--format':
      case '-f':
        options.format = (nextArg as CLIOptions['format']) || 'json'
        i++
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--help':
      case '-h':
        showHelp()
        process.exit(0)
        break
      default:
        // 如果没有 --query 标志，第一个参数作为查询内容
        if (!options.query && !arg.startsWith('-')) {
          options.query = arg
        }
    }
  }

  return options
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  logger.info(`
Claude Code 上下文查询工具

用法:
  bun claude-context [options] <query>
  bun claude-context --query "查询内容" [options]

选项:
  -q, --query <text>     查询内容 (必需)
  -t, --type <type>      查询类型: context|patterns|practices (默认: context)
  -l, --limit <number>   结果数量限制 (默认: 10)
  -f, --format <format>  输出格式: json|text (默认: json)
  -v, --verbose          详细输出
  -h, --help             显示帮助

示例:
  # 基础查询
  bun claude-context "用户认证系统"
  
  # 指定查询类型
  bun claude-context --query "React组件" --type patterns
  
  # 查找最佳实践
  bun claude-context --query "错误处理" --type practices --limit 5
  
  # 文本格式输出
  bun claude-context "API设计" --format text
`)
}

/**
 * 格式化输出结果
 */
function formatOutput(data: QueryResult, type: string, format: 'json' | 'text'): void {
  if (format === 'json') {
    // Claude Code 友好的JSON格式
    const output = {
      success: true,
      query_type: type,
      timestamp: new Date().toISOString(),
      data: data,
    }
    logger.info(JSON.stringify(output, null, 2))
  } else {
    // 人类友好的文本格式
    formatTextOutput(data, type)
  }
}

/**
 * 文本格式输出
 */
function formatTextOutput(data: QueryResult, type: string): void {
  switch (type) {
    case 'context':
      logger.info('\n📋 上下文查询结果:')
      if (data.entities?.length > 0) {
        logger.info('\n🔍 相关实体:')
        data.entities.forEach((entity: EntityResult, index: number) => {
          logger.info(`  ${index + 1}. ${entity.name} (${entity.type})`)
          if (entity.package) logger.info(`     包: ${entity.package}`)
          if (entity.description) logger.info(`     描述: ${entity.description}`)
        })
      }

      if (data.relationships?.length > 0) {
        logger.info('\n🔗 关系:')
        data.relationships.slice(0, 5).forEach((rel: RelationshipResult) => {
          logger.info(`  • ${rel.from} → ${rel.to} (${rel.type})`)
        })
      }

      if (data.metadata) {
        logger.info(
          `\n📊 统计: ${data.metadata.total_results} 个结果，相关性 ${(data.metadata.relevance_score * 100).toFixed(0)}%`
        )
      }
      break

    case 'patterns':
      logger.info('\n🎨 代码模式:')
      ;(data as PatternResult[]).forEach((pattern, index) => {
        logger.info(`\n  ${index + 1}. ${pattern.name}`)
        logger.info(`     ${pattern.description}`)
        if (pattern.usage) logger.info(`     用法: ${pattern.usage}`)
      })
      break

    case 'practices':
      logger.info('\n✨ 最佳实践:')
      ;(data as PracticeResult[]).forEach((practice, index) => {
        logger.info(`\n  ${index + 1}. ${practice.name}`)
        logger.info(`     ${practice.description}`)
        if (practice.category) logger.info(`     分类: ${practice.category}`)
      })
      break
  }
  logger.info()
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const options = parseArgs()

  if (!options.query) {
    logger.error('错误: 请提供查询内容\n')
    showHelp()
    process.exit(1)
  }

  if (options.verbose) {
    logger.info('开始查询', {
      query: options.query,
      type: options.type,
      limit: options.limit,
    })
  }

  try {
    const tool = new ContextQueryTool()

    if (options.verbose) {
      logger.error('正在初始化上下文查询工具...')
    }

    await tool.initialize()

    if (options.verbose) {
      logger.error(`正在执行 ${options.type} 查询...`)
    }

    const startTime = Date.now()
    let result: QueryResult

    switch (options.type) {
      case 'context':
        result = await tool.queryContext(options.query)
        break
      case 'patterns':
        result = await tool.findPatterns(options.query)
        break
      case 'practices':
        result = await tool.getBestPractices(options.query)
        break
      default:
        throw new Error(`不支持的查询类型: ${options.type}`)
    }

    const duration = Date.now() - startTime

    if (options.verbose) {
      logger.error(`查询完成，耗时 ${duration}ms`)
    }

    formatOutput(result, options.type, options.format)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    if (options.format === 'json') {
      logger.info(
        JSON.stringify(
          {
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      )
    } else {
      logger.error(`❌ 查询失败: ${errorMessage}`)
    }

    process.exit(1)
  }
}

// 运行主函数
if (import.meta.main) {
  main().catch(console.error)
}

export { main }
