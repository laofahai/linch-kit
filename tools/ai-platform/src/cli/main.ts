/**
 * LinchKit AI CLI Main Entry Point
 *
 * 独立的 AI CLI 工具，用于数据提取和查询
 */

import { createLogger } from '@linch-kit/core/server'
import { extractCommand } from './commands/extract.js'
import { queryCommand } from './commands/query.js'
import { generateCommand } from './commands/generate.js'
import { contextCommand } from './commands/context.js'
import type { CommandContext } from './plugin.js'

const logger = createLogger({ name: 'ai:cli-main' })

async function main() {
  const args = process.argv.slice(2)
  const commandName = args[0]

  // 解析选项
  const options: Record<string, unknown> = {}
  const remainingArgs: string[] = []

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const nextArg = args[i + 1]
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg
        i++ // skip next arg
      } else {
        options[key] = true
      }
    } else {
      remainingArgs.push(arg)
    }
  }

  // 创建命令上下文
  const context: CommandContext = {
    args: remainingArgs,
    options,
    flags: options,
    commandName,
    t: (key: string) => key, // 简单的翻译函数
    log: console.log,
    logger: {
      info: (msg: string) => logger.info(`[INFO] ${msg}`),
      warn: (msg: string) => logger.warn(`[WARN] ${msg}`),
      error: (msg: string) => logger.error(`[ERROR] ${msg}`),
    },
  }

  // 路由到相应的命令
  let command
  switch (commandName) {
    case 'ai:extract':
      command = extractCommand
      break
    case 'ai:query':
      command = queryCommand
      break
    case 'ai:generate':
      command = generateCommand
      break
    case 'ai:context':
      command = contextCommand
      break
    default:
      logger.error(`Unknown command: ${commandName}`)
      logger.info('Available commands:')
      logger.info('  ai:extract   - 提取代码库结构化数据')
      logger.info('  ai:query     - 查询知识图谱')
      logger.info('  ai:generate  - 生成代码')
      logger.info('  ai:context   - 上下文分析')
      process.exit(1)
  }

  try {
    const result = await command.handler(context)
    if (!result.success) {
      logger.error(`Command failed: ${result.error || result.message}`)
      process.exit(1)
    }
    if (result.message) {
      logger.info(result.message)
    }
  } catch (error) {
    logger.error('Command execution failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)
