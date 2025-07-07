/**
 * LinchKit AI CLI Plugin
 * 
 * 为 LinchKit 提供 AI 相关的命令行工具
 * 包含图数据提取、查询等功能
 */

import { extractCommand } from './commands/extract.js'
import { queryCommand } from './commands/query.js'
import { generateCommand } from './commands/generate.js'
import { contextCommand } from './commands/context.js'

// Temporary local types until core package types are properly exported
export interface CommandContext {
  log: (message: string) => void
  logger: {
    info: (message: string) => void
    error: (message: string) => void
    warn: (message: string) => void
  }
  options: Record<string, unknown>
  flags: Record<string, unknown>
  args: string[]
  t: unknown
  commandName: string
}

export interface CommandResult {
  success: boolean
  message?: string
  data?: unknown
  error?: string
  duration?: number
}

export interface CLICommand {
  name: string
  description: string
  category: string
  options?: Array<{
    name: string
    description: string
    type?: string
    defaultValue?: unknown
    required?: boolean
  }>
  handler: (context: CommandContext) => Promise<CommandResult> | CommandResult
  examples?: string[]
}

/**
 * AI CLI 插件配置
 */
export const aiCLIPlugin = {
  name: '@linch-kit/ai',
  version: '1.0.0',
  commands: [
    extractCommand,
    queryCommand,
    generateCommand,
    contextCommand
  ]
}