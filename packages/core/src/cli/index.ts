/**
 * CLI系统模块
 * @description 为LinchKit提供完整的命令行工具支持，支持插件化命令扩展
 * @module cli
 * @since 0.1.0
 */

import { Command } from 'commander'
import { EventEmitter } from 'eventemitter3'
import type { TranslationFunction } from '../i18n'
import { useTranslation } from '../i18n'

/**
 * 命令选项定义
 */
export interface CommandOption {
  /** 选项名称 */
  name: string
  /** 选项描述 */
  description: string
  /** 是否必需 */
  required?: boolean
  /** 默认值 */
  defaultValue?: unknown
  /** 选项类型 */
  type?: 'string' | 'number' | 'boolean' | 'array'
}

/**
 * 命令执行上下文
 */
export interface CommandContext {
  /** 命令参数 */
  args: string[]
  /** 解析后的选项 */
  options: Record<string, unknown>
  /** 翻译函数 */
  t: TranslationFunction
  /** 命令名称 */
  commandName: string
}

/**
 * 命令执行结果
 */
export interface CommandResult {
  /** 是否成功 */
  success: boolean
  /** 结果数据 */
  data?: unknown
  /** 错误信息 */
  error?: string
  /** 执行时间（毫秒） */
  duration?: number
}

/**
 * 命令执行器类型
 */
export type CommandHandler = (
  context: CommandContext
) => Promise<CommandResult> | CommandResult

/**
 * 命令中间件类型
 */
export type CommandMiddleware = (
  context: CommandContext,
  next: () => Promise<CommandResult>
) => Promise<CommandResult>

/**
 * CLI命令定义
 */
export interface CLICommand {
  /** 命令名称 */
  name: string
  /** 命令描述 */
  description: string
  /** 命令类别 */
  category: 'core' | 'plugin' | 'config' | 'schema' | 'dev' | 'ops' | 'deploy' | 'util'
  /** 命令选项 */
  options?: CommandOption[]
  /** 命令执行器 */
  handler: CommandHandler
  /** 中间件 */
  middleware?: CommandMiddleware[]
  /** 命令别名 */
  aliases?: string[]
  /** 是否隐藏命令 */
  hidden?: boolean
  /** 使用示例 */
  examples?: string[]
}

/**
 * CLI事件类型
 */
export interface CLIEvents {
  'command:registered': { command: CLICommand }
  'command:executing': { name: string; context: CommandContext }
  'command:executed': { name: string; result: CommandResult; context: CommandContext }
  'command:error': { name: string; error: Error; context: CommandContext }
}

/**
 * CLI管理器接口
 */
export interface CLIManager {
  /**
   * 注册命令
   * @param command 命令定义
   */
  registerCommand(command: CLICommand): void
  
  /**
   * 注册多个命令
   * @param commands 命令数组
   */
  registerCommands(commands: CLICommand[]): void
  
  /**
   * 执行命令
   * @param name 命令名称
   * @param args 命令参数
   * @param options 执行选项
   */
  executeCommand(
    name: string, 
    args: string[], 
    options?: { t?: TranslationFunction }
  ): Promise<CommandResult>
  
  /**
   * 获取所有命令
   * @param category 类别过滤
   */
  getCommands(category?: string): CLICommand[]
  
  /**
   * 获取命令帮助
   * @param name 命令名称
   */
  getCommandHelp(name?: string): string
  
  /**
   * 检查命令是否存在
   * @param name 命令名称
   */
  hasCommand(name: string): boolean
  
  /**
   * 移除命令
   * @param name 命令名称
   */
  removeCommand(name: string): boolean
}

/**
 * CLI管理器实现
 * @description 基于Commander.js的CLI管理器，支持插件化命令扩展
 */
export class CLIManagerImpl extends EventEmitter implements CLIManager {
  private commands = new Map<string, CLICommand>()
  private program = new Command()
  private t: TranslationFunction

  constructor(options?: { t?: TranslationFunction }) {
    super()
    this.t = options?.t || useTranslation()
    this.setupProgram()
  }

  /**
   * 初始化命令程序
   * @private
   */
  private setupProgram(): void {
    this.program
      .name('linchkit')
      .description('LinchKit AI-First 全栈开发框架')
      .version('0.1.0')
      .helpOption('-h, --help', '显示帮助信息')
  }

  registerCommand(command: CLICommand): void {
    // 检查命令是否已存在
    if (this.commands.has(command.name)) {
      throw new Error(
        this.t('cli.command.duplicate', { name: command.name })
      )
    }

    // 存储命令定义
    this.commands.set(command.name, command)

    // 创建Commander命令
    const cmd = this.program
      .command(command.name)
      .description(command.description)

    // 添加选项
    command.options?.forEach(option => {
      const flag = option.required 
        ? `--${option.name} <value>`
        : `--${option.name} [value]`
      
      if (option.defaultValue !== undefined) {
        cmd.option(flag, option.description, option.defaultValue as string | boolean)
      } else {
        cmd.option(flag, option.description)
      }
    })

    // 添加别名
    if (command.aliases) {
      command.aliases.forEach(alias => cmd.alias(alias))
    }

    // 设置命令执行器
    cmd.action(async (...args) => {
      const [options] = args.slice(-1)
      const commandArgs = args.slice(0, -1)
      
      const context: CommandContext = {
        args: commandArgs,
        options,
        t: this.t,
        commandName: command.name
      }

      try {
        this.emit('command:executing', { name: command.name, context })
        
        const startTime = Date.now()
        let result = await this.executeWithMiddleware(command, context)
        
        result = {
          ...result,
          duration: Date.now() - startTime
        }

        this.emit('command:executed', { name: command.name, result, context })
        
        if (!result.success) {
          process.exit(1)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        this.emit('command:error', { name: command.name, error: err, context })
        
        console.error(
          this.t('cli.command.error', { 
            name: command.name, 
            error: err.message 
          })
        )
        process.exit(1)
      }
    })

    // 设置隐藏命令 (Commander.js可能不支持hideHelp方法)
    if (command.hidden) {
      // cmd.hideHelp() // 暂时注释掉，某些版本的Commander.js不支持此方法
    }

    this.emit('command:registered', { command })
  }

  registerCommands(commands: CLICommand[]): void {
    commands.forEach(command => this.registerCommand(command))
  }

  async executeCommand(
    name: string, 
    args: string[], 
    options?: { t?: TranslationFunction }
  ): Promise<CommandResult> {
    const command = this.commands.get(name)
    if (!command) {
      throw new Error(this.t('cli.command.not.found', { name }))
    }

    const context: CommandContext = {
      args,
      options: {},
      t: options?.t || this.t,
      commandName: name
    }

    const startTime = Date.now()
    const result = await this.executeWithMiddleware(command, context)
    
    return {
      ...result,
      duration: Date.now() - startTime
    }
  }

  /**
   * 使用中间件执行命令
   * @private
   */
  private async executeWithMiddleware(
    command: CLICommand, 
    context: CommandContext
  ): Promise<CommandResult> {
    if (!command.middleware?.length) {
      return await command.handler(context)
    }

    let index = 0
    
    const next = async (): Promise<CommandResult> => {
      if (index >= command.middleware!.length) {
        return await command.handler(context)
      }
      
      const middleware = command.middleware![index++]
      return await middleware(context, next)
    }

    return await next()
  }

  getCommands(category?: string): CLICommand[] {
    const commands = Array.from(this.commands.values())
    return category 
      ? commands.filter(cmd => cmd.category === category)
      : commands
  }

  getCommandHelp(name?: string): string {
    if (name) {
      return this.program.helpInformation()
    }
    return this.program.helpInformation()
  }

  hasCommand(name: string): boolean {
    return this.commands.has(name)
  }

  removeCommand(name: string): boolean {
    const command = this.commands.get(name)
    if (!command) {
      return false
    }

    this.commands.delete(name)
    // 注: Commander.js 不支持动态移除命令，这里只移除内部记录
    return true
  }

  /**
   * 解析命令行参数
   * @param argv 命令行参数
   */
  async parse(argv?: string[]): Promise<void> {
    await this.program.parseAsync(argv)
  }
}

/**
 * 创建CLI管理器实例
 * @description 为LinchKit创建CLI管理器，支持插件化命令扩展
 * @param options 配置选项
 * @returns CLI管理器实例
 * @example
 * ```typescript
 * import { createCLIManager } from '@linch-kit/core'
 * 
 * const cli = createCLIManager()
 * 
 * // 注册命令
 * cli.registerCommand({
 *   name: 'hello',
 *   description: '打印问候信息',
 *   category: 'util',
 *   handler: async ({ args, t }) => {
 *     console.log(t('hello.message', { name: args[0] || 'World' }))
 *     return { success: true }
 *   }
 * })
 * 
 * // 执行命令
 * await cli.executeCommand('hello', ['LinchKit'])
 * ```
 * @since 0.1.0
 */
export function createCLIManager(options?: { 
  t?: TranslationFunction 
}): CLIManager {
  return new CLIManagerImpl(options)
}

/**
 * 默认CLI管理器实例
 * @description @linch-kit/core包的默认CLI管理器
 * @since 0.1.0
 */
export const defaultCLI = createCLIManager()

// 向后兼容的导出
export const cli: CLIManager = defaultCLI

/**
 * 注册核心CLI命令
 * @description 注册基本的CLI命令
 * @param cliManager CLI管理器实例
 * @since 0.1.0
 */
export function registerCoreCLICommands(cliManager: CLIManager): void {
  const commands: CLICommand[] = [
    {
      name: 'info',
      description: '显示项目信息',
      category: 'util',
      handler: async ({ t }) => {
        console.log('LinchKit AI-First 全栈开发框架 v0.1.0')
        console.log(t('cli.info.description'))
        return { success: true }
      }
    },
    {
      name: 'version',
      description: '显示版本信息',
      category: 'util',
      aliases: ['v'],
      handler: async () => {
        console.log('0.1.0')
        return { success: true }
      }
    },
    {
      name: 'help',
      description: '显示帮助信息',
      category: 'util',
      aliases: ['h'],
      options: [
        {
          name: 'command',
          description: '显示特定命令的帮助',
          type: 'string'
        }
      ],
      handler: async ({ options }) => {
        if (options.command) {
          console.log(cliManager.getCommandHelp(options.command as string))
        } else {
          console.log(cliManager.getCommandHelp())
        }
        return { success: true }
      }
    }
  ]

  cliManager.registerCommands(commands)
}

// 自动注册核心命令
registerCoreCLICommands(defaultCLI)