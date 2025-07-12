/**
 * Context Query Command
 *
 * 为 Claude Code 提供项目上下文查询功能
 */

import { createLogger } from '@linch-kit/core/server'
import chalk from 'chalk'

import type { CommandContext, CommandResult, CLICommand } from '../plugin.js'
import { ContextQueryTool } from '../../context/context-query-tool.js'

const logger = createLogger({ name: 'ai:context-command' })

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

interface ExampleResult {
  title: string
  description: string
  code?: string
}

interface QueryMetadata {
  total_results: number
  relevance_score: number
}

interface ContextResult {
  entities?: EntityResult[]
  relationships?: RelationshipResult[]
  examples?: ExampleResult[]
  metadata?: QueryMetadata
}

interface PatternResult {
  name: string
  description: string
  usage: string
  related_entities?: string[]
}

interface PracticeResult {
  name: string
  description: string
  category: string
  examples?: string[]
}

/**
 * 执行上下文查询
 */
async function executeContextQuery(
  query: string,
  options: {
    type: 'context' | 'patterns' | 'practices'
    limit: number
  }
): Promise<CommandResult> {
  const startTime = Date.now()

  try {
    logger.info('执行上下文查询', { query, type: options.type })

    const tool = new ContextQueryTool()
    await tool.initialize()

    let result: unknown

    switch (options.type) {
      case 'context':
        result = await tool.queryContext(query)
        break

      case 'patterns':
        result = await tool.findPatterns(query)
        break

      case 'practices':
        result = await tool.getBestPractices(query)
        break

      default:
        throw new Error(`未知的查询类型: ${options.type}`)
    }

    const duration = Date.now() - startTime

    return {
      success: true,
      message: `查询完成 (${duration}ms)`,
      data: result,
      duration,
    }
  } catch (error) {
    logger.error('上下文查询失败', error instanceof Error ? error : undefined)

    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      duration: Date.now() - startTime,
    }
  }
}

/**
 * 输出上下文查询结果
 */
function outputContextResult(data: unknown, type: string): void {
  switch (type) {
    case 'context': {
      const context = data as ContextResult

      console.log(chalk.cyan('\n📋 查询结果:\n'))

      // 显示实体
      if (context.entities && context.entities.length > 0) {
        console.log(chalk.yellow('🔍 相关实体:'))
        context.entities.forEach((entity: EntityResult) => {
          console.log(`  • ${chalk.green(entity.name)} (${entity.type}) - ${entity.package}`)
          if (entity.description) {
            console.log(`    ${chalk.gray(entity.description)}`)
          }
        })
        console.log()
      }

      // 显示关系
      if (context.relationships && context.relationships.length > 0) {
        console.log(chalk.yellow('🔗 关系:'))
        context.relationships.slice(0, 10).forEach((rel: RelationshipResult) => {
          console.log(`  • ${rel.from} ${chalk.blue(rel.type)} ${rel.to}`)
        })
        console.log()
      }

      // 显示示例
      if (context.examples && context.examples.length > 0) {
        console.log(chalk.yellow('💡 示例:'))
        context.examples.slice(0, 3).forEach((example: ExampleResult) => {
          console.log(`  • ${example.description}`)
          if (example.code) {
            console.log(chalk.gray('    ' + example.code.split('\n')[0] + '...'))
          }
        })
        console.log()
      }

      // 显示元数据
      if (context.metadata) {
        console.log(chalk.yellow('📊 统计:'))
        console.log(`  • 总结果数: ${context.metadata.total_results}`)
        console.log(`  • 相关性评分: ${(context.metadata.relevance_score * 100).toFixed(0)}%`)
      }
      break
    }

    case 'patterns': {
      const patterns = data as PatternResult[]

      console.log(chalk.cyan('\n🎨 代码模式:\n'))
      patterns.forEach(pattern => {
        console.log(chalk.yellow(`📌 ${pattern.name}`))
        console.log(`  ${pattern.description}`)
        console.log(`  ${chalk.gray('用法:')} ${pattern.usage}`)
        if (pattern.related_entities && pattern.related_entities.length > 0) {
          console.log(`  ${chalk.gray('相关实体:')} ${pattern.related_entities.join(', ')}`)
        }
        console.log()
      })
      break
    }

    case 'practices': {
      const practices = data as PracticeResult[]

      console.log(chalk.cyan('\n✨ 最佳实践:\n'))
      practices.forEach(practice => {
        console.log(chalk.yellow(`🏆 ${practice.name}`))
        console.log(`  ${practice.description}`)
        console.log(`  ${chalk.gray('分类:')} ${practice.category}`)
        if (practice.examples && practice.examples.length > 0) {
          console.log(`  ${chalk.gray('示例:')}`)
          practice.examples.forEach((ex: string) => {
            console.log(`    ${chalk.green(ex)}`)
          })
        }
        console.log()
      })
      break
    }
  }
}

/**
 * Context 命令定义
 */
export const contextCommand: CLICommand = {
  name: 'ai:context',
  description: '查询项目上下文信息，为 Claude Code 提供知识增强',
  category: 'dev',
  options: [
    {
      name: 'query',
      description: '查询内容',
      type: 'string',
      required: true,
    },
    {
      name: 'type',
      description: '查询类型 (context,patterns,practices)',
      type: 'string',
      defaultValue: 'context',
      required: false,
    },
    {
      name: 'limit',
      description: '结果数量限制',
      type: 'number',
      defaultValue: 10,
      required: false,
    },
  ],

  async handler(context: CommandContext): Promise<CommandResult> {
    const {
      query,
      type = 'context',
      limit = 10,
    } = context.options as {
      query?: string
      type?: string
      limit?: number
    }

    if (!query) {
      return {
        success: false,
        error: '请提供查询内容',
      }
    }

    const result = await executeContextQuery(query, {
      type: type as 'context' | 'patterns' | 'practices',
      limit,
    })

    if (result.success && result.data) {
      outputContextResult(result.data, type)
    }

    return result
  },

  examples: [
    '# 查询认证相关的上下文',
    'ai:context --query "认证系统" --type context',
    '',
    '# 查找API开发的最佳实践',
    'ai:context --query "API开发" --type practices',
    '',
    '# 查找使用模式',
    'ai:context --query "用户管理" --type patterns',
  ],
}
