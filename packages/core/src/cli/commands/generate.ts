/**
 * linch generate 命令
 * 
 * 这只是一个命令组，具体的生成命令由各个包自己实现
 */

import { type CLIManager, type CLICommand } from '../index'
import { Logger } from '../../logger-client'

// generate 命令本身只是一个帮助命令，显示所有可用的生成器
const generateCommand: CLICommand = {
  name: 'generate',
  description: '代码生成器',
  category: 'util',
  aliases: ['g'],
  handler: async ({ t: _t }) => {
    Logger.info('可用的生成命令:')
    Logger.info('')
    Logger.info('  linch generate:schema    - 从 Prisma 生成 Zod Schema (@linch-kit/schema)')
    Logger.info('  linch generate:api       - 生成 tRPC API 路由 (@linch-kit/trpc)')
    Logger.info('  linch generate:crud      - 生成 CRUD 操作 (@linch-kit/crud)')
    Logger.info('  linch generate:component - 生成 UI 组件 (@linch-kit/ui)')
    Logger.info('  linch generate:page      - 生成页面 (@linch-kit/console)')
    Logger.info('')
    Logger.info('提示: 各个生成命令由对应的包提供，请确保已安装相关包')
    
    return { success: true }
  }
}


export function registerGenerateCommands(cli: CLIManager) {
  // 只注册 generate 命令本身
  // 具体的生成命令由各个包自己提供
  cli.registerCommand(generateCommand)
}