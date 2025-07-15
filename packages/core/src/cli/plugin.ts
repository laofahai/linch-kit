/**
 * LinchKit CLI 插件系统
 *
 * 允许各个包动态注册自己的 CLI 命令
 */

import { logger } from '../logger'

import { type CLIManager, type CLICommand } from './index'

export interface CLIPlugin {
  /**
   * 插件名称（通常是包名）
   */
  name: string

  /**
   * 插件版本
   */
  version?: string

  /**
   * 注册命令的函数
   */
  register: (cli: CLIManager) => void | Promise<void>
}

/**
 * CLI 插件管理器
 */
export class CLIPluginManager {
  private plugins = new Map<string, CLIPlugin>()
  private cli: CLIManager

  constructor(cli: CLIManager) {
    this.cli = cli
  }

  /**
   * 注册插件
   */
  async registerPlugin(plugin: CLIPlugin) {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`CLI plugin ${plugin.name} already registered`)
      return
    }

    this.plugins.set(plugin.name, plugin)

    // 调用插件的注册函数
    await plugin.register(this.cli)

    logger.debug(`CLI plugin ${plugin.name} registered`)
  }

  /**
   * 自动发现并加载插件
   * 查找所有 @linch-kit/* 包并尝试加载它们的 CLI 插件
   */
  async autoDiscoverPlugins() {
    const packageNames = [
      '@linch-kit/schema',
      '@linch-kit/auth',
      '@linch-kit/crud',
      '@linch-kit/trpc',
      '@linch-kit/ui',
      '@linch-kit/console',
      '@linch-kit/ai',
    ]

    for (const packageName of packageNames) {
      try {
        // 尝试导入包的 CLI 插件
        const module = await import(`${packageName}/cli`)

        if (module.cliPlugin) {
          await this.registerPlugin(module.cliPlugin)
        }
      } catch {
        // 包可能没有 CLI 插件，这是正常的
        logger.debug(`No CLI plugin found for ${packageName}`)
      }
    }
  }

  /**
   * 获取所有已注册的插件
   */
  getPlugins(): CLIPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 检查插件是否已注册
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name)
  }
}

/**
 * 创建 CLI 插件
 */
export function createCLIPlugin(options: {
  name: string
  version?: string
  commands: CLICommand[]
}): CLIPlugin {
  return {
    name: options.name,
    version: options.version,
    register: cli => {
      options.commands.forEach(command => {
        cli.registerCommand(command)
      })
    },
  }
}

/**
 * Core CLI插件 - 极简版
 * 仅提供开发必需的核心命令：init 和 info
 */
export const coreCLIPlugin: CLIPlugin = {
  name: '@linch-kit/core',
  version: '1.0.2',
  register: (cli: CLIManager) => {
    // 导入并注册核心命令
    const { registerCoreCLICommands } = require('./index')
    registerCoreCLICommands(cli)
  },
}
