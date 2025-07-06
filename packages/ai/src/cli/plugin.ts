/**
 * LinchKit AI CLI Plugin
 * 
 * 为 LinchKit 提供 AI 相关的命令行工具
 * 包含图数据提取、查询等功能
 */

import { createCLIPlugin } from '@linch-kit/core/cli'
import type { CLICommand } from '@linch-kit/core/cli'

import { extractCommand } from './commands/extract.js'
import { queryCommand } from './commands/query.js'

/**
 * AI CLI 插件配置
 */
export const aiCLIPlugin = createCLIPlugin({
  name: '@linch-kit/ai',
  version: '1.0.0',
  commands: [
    extractCommand,
    queryCommand
  ]
})