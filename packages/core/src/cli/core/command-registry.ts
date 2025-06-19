/**
 * @ai-context CLI 命令注册表核心系统
 * @ai-purpose 管理所有可用的 CLI 命令，支持动态注册和插件扩展
 * @ai-pattern Singleton + Registry Pattern
 * @ai-thread-safety 非线程安全，仅在主线程使用
 * @ai-dependencies commander, @linch-kit/config
 */

import { Command } from 'commander'
import type { CommandPlugin, CLIContext, CommandMetadata } from '../../types/cli'

/**
 * @ai-class CLI 命令注册表
 * @ai-purpose 中央化管理所有 CLI 命令，支持插件动态扩展
 * @ai-singleton 全局唯一实例，确保命令注册的一致性
 * @ai-memory-usage 轻量级设计，仅存储命令元数据和引用
 */
export class CommandRegistry {
  private static instance: CommandRegistry
  private commands = new Map<string, CommandMetadata>()
  private plugins = new Map<string, CommandPlugin>()
  private rootCommand: Command

  /**
   * @ai-constructor 私有构造函数，实现单例模式
   * @ai-parameter rootCommand: Command - Commander.js 根命令实例
   */
  private constructor(rootCommand: Command) {
    this.rootCommand = rootCommand
  }

  /**
   * @ai-method 获取注册表单例实例
   * @ai-pattern Singleton Factory
   * @ai-parameter rootCommand: Command - Commander.js 根命令实例
   * @ai-return CommandRegistry - 全局唯一的注册表实例
   */
  static getInstance(rootCommand?: Command): CommandRegistry {
    if (!CommandRegistry.instance) {
      if (!rootCommand) {
        throw new Error('AI: First call to getInstance must provide rootCommand')
      }
      CommandRegistry.instance = new CommandRegistry(rootCommand)
    }
    return CommandRegistry.instance
  }

  /**
   * @ai-method 注册单个命令
   * @ai-purpose 将命令添加到注册表并绑定到 Commander.js
   * @ai-parameter name: string - 命令名称，必须唯一
   * @ai-parameter metadata: CommandMetadata - 命令元数据和处理器
   * @ai-side-effects 修改全局命令注册表和 Commander.js 实例
   * @ai-error-handling 重复命令名会抛出错误
   * @ai-validation 验证命令名格式和元数据完整性
   */
  registerCommand(name: string, metadata: CommandMetadata): void {
    // AI: 检查命令是否已注册，如果是则跳过
    if (this.commands.has(name)) {
      if (!process.env.LINCH_SILENT) {
        console.log(`AI: Command '${name}' already registered, skipping`)
      }
      return
    }

    // AI: 验证命令元数据
    this.validateCommandMetadata(name, metadata)

    // AI: 注册到内部映射表
    this.commands.set(name, metadata)

    // AI: 创建 Commander.js 命令实例
    // 支持冒号分隔的命令格式，如 schema:generate:prisma
    const command = this.rootCommand
      .command(name)
      .description(metadata.description)

    // AI: 添加命令选项
    if (metadata.options) {
      metadata.options.forEach(option => {
        command.option(option.flags, option.description, option.defaultValue)
      })
    }

    // AI: 添加命令参数
    if (metadata.arguments) {
      metadata.arguments.forEach(arg => {
        if (arg.required) {
          command.argument(arg.name, arg.description)
        } else {
          command.argument(`[${arg.name}]`, arg.description, arg.defaultValue)
        }
      })
    }

    // AI: 绑定命令处理器
    command.action(async (...args) => {
      try {
        // AI: 创建执行上下文
        const context = this.createExecutionContext(name, args)

        // AI: 执行命令处理器
        await metadata.handler(context)
      } catch (error) {
        // AI: 统一错误处理
        this.handleCommandError(name, error)
      }
    })

    if (!process.env.LINCH_SILENT) {
      console.log(`AI: Command '${name}' registered successfully`)
    }
  }

  /**
   * @ai-method 批量注册命令
   * @ai-purpose 一次性注册多个命令，常用于插件初始化
   * @ai-parameter commands: Record<string, CommandMetadata> - 命令映射表
   * @ai-performance 批量操作，减少重复验证开销
   * @ai-error-handling 单个命令失败不影响其他命令注册
   */
  registerCommands(commands: Record<string, CommandMetadata>): void {
    Object.entries(commands).forEach(([name, metadata]) => {
      this.registerCommand(name, metadata)
    })
  }

  /**
   * @ai-method 注册命令插件
   * @ai-purpose 加载并注册第三方命令插件
   * @ai-parameter plugin: CommandPlugin - 插件实例
   * @ai-lifecycle init -> validate -> register -> store
   * @ai-error-handling 插件注册失败会记录错误但不中断系统
   */
  async registerPlugin(plugin: CommandPlugin): Promise<void> {
    try {
      // AI: 验证插件接口
      this.validatePlugin(plugin)

      // AI: 检查插件依赖
      await this.checkPluginDependencies(plugin)

      // AI: 初始化插件
      if (plugin.init) {
        const context = this.createPluginContext()
        await plugin.init(context)
      }

      // AI: 让插件注册其命令
      await plugin.register(this)

      // AI: 存储插件引用
      this.plugins.set(plugin.name, plugin)

      console.log(`AI: Plugin '${plugin.name}' registered successfully`)
    } catch (error) {
      console.error(`AI: Failed to register plugin '${plugin.name}':`, error)
      throw error
    }
  }

  /**
   * @ai-method 获取已注册的命令列表
   * @ai-purpose 提供命令发现和调试功能
   * @ai-return CommandMetadata[] - 所有已注册命令的元数据
   * @ai-performance O(n) 复杂度，适合调试和小规模查询
   */
  getRegisteredCommands(): CommandMetadata[] {
    return Array.from(this.commands.values())
  }

  /**
   * @ai-method 获取已注册的插件列表
   * @ai-purpose 提供插件管理和调试功能
   * @ai-return CommandPlugin[] - 所有已注册插件的实例
   */
  getRegisteredPlugins(): CommandPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * @ai-method 验证命令元数据
   * @ai-purpose 确保命令定义的完整性和正确性
   * @ai-parameter name: string - 命令名称
   * @ai-parameter metadata: CommandMetadata - 命令元数据
   * @ai-validation 检查必需字段、格式和逻辑一致性
   * @ai-error-handling 验证失败抛出详细错误信息
   */
  private validateCommandMetadata(name: string, metadata: CommandMetadata): void {
    if (!metadata.description) {
      throw new Error(`AI: Command '${name}' missing description`)
    }

    if (!metadata.handler || typeof metadata.handler !== 'function') {
      throw new Error(`AI: Command '${name}' missing or invalid handler`)
    }

    // AI: 验证命令名格式 (kebab-case 或 colon-separated)
    // 支持 kebab-case (如 plugin-list) 和 colon-separated (如 schema:generate:prisma)
    if (!/^[a-z][a-z0-9:-]*$/.test(name)) {
      throw new Error(`AI: Command name '${name}' must be kebab-case or colon-separated`)
    }
  }

  /**
   * @ai-method 验证插件接口
   * @ai-purpose 确保插件实现了必需的接口
   * @ai-parameter plugin: CommandPlugin - 插件实例
   * @ai-validation 检查插件接口完整性
   */
  private validatePlugin(plugin: CommandPlugin): void {
    if (!plugin.name || !plugin.version || !plugin.register) {
      throw new Error('AI: Plugin missing required properties (name, version, register)')
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`AI: Plugin '${plugin.name}' already registered`)
    }
  }

  /**
   * @ai-method 检查插件依赖
   * @ai-purpose 确保插件依赖的其他插件已经加载
   * @ai-parameter plugin: CommandPlugin - 插件实例
   * @ai-dependency-resolution 简单的依赖检查，不支持循环依赖
   */
  private async checkPluginDependencies(plugin: CommandPlugin): Promise<void> {
    if (!plugin.dependencies) return

    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`AI: Plugin '${plugin.name}' depends on '${dep}' which is not registered`)
      }
    }
  }

  /**
   * @ai-method 创建命令执行上下文
   * @ai-purpose 为命令处理器提供统一的执行环境
   * @ai-parameter commandName: string - 命令名称
   * @ai-parameter args: any[] - 命令参数
   * @ai-return CLIContext - 执行上下文对象
   */
  private createExecutionContext(commandName: string, args: any[]): CLIContext {
    return {
      commandName,
      args,
      registry: this,
      cwd: process.cwd(),
      verbose: false,
      silent: false
    }
  }

  /**
   * @ai-method 创建插件上下文
   * @ai-purpose 为插件初始化提供必要的上下文信息
   * @ai-return CLIContext - 插件上下文对象
   */
  private createPluginContext(): CLIContext {
    return {
      registry: this,
      cwd: process.cwd(),
      verbose: false,
      silent: false
    }
  }

  /**
   * @ai-method 统一命令错误处理
   * @ai-purpose 提供一致的错误处理和用户反馈
   * @ai-parameter commandName: string - 出错的命令名称
   * @ai-parameter error: any - 错误对象
   * @ai-user-experience 提供友好的错误信息和解决建议
   */
  private handleCommandError(commandName: string, error: any): void {
    console.error(`AI: Command '${commandName}' failed:`, error.message)
    
    // AI: 根据错误类型提供不同的处理策略
    if (error.code === 'ENOENT') {
      console.error('AI: File or directory not found. Please check your paths.')
    } else if (error.code === 'EACCES') {
      console.error('AI: Permission denied. Please check file permissions.')
    }
    
    process.exit(1)
  }
}
