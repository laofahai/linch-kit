#!/usr/bin/env node

/**
 * @ai-context Linch Kit CLI 主入口
 * @ai-purpose 统一的 CLI 系统入口，整合所有核心组件
 * @ai-architecture CommandRegistry + PluginLoader + ConfigManager
 * @ai-extensible 支持插件动态扩展命令和配置
 */

import { Command } from 'commander'
import { CommandRegistry } from './cli/core/command-registry'
import { PluginLoader } from './cli/core/plugin-loader'
import { ConfigManager } from './cli/core/config-manager'
import { builtinCommands } from './cli/commands'

/**
 * @ai-class Linch Kit CLI 应用
 * @ai-purpose 主 CLI 应用类，协调所有核心组件
 * @ai-lifecycle init -> loadPlugins -> registerCommands -> parse
 */
export class LinchCLI {
  private program: Command
  private registry: CommandRegistry
  private pluginLoader: PluginLoader
  private configManager: ConfigManager

  /**
   * @ai-constructor 初始化 CLI 应用
   * @ai-setup 创建并配置所有核心组件
   */
  constructor() {
    // AI: 创建 Commander 程序实例
    this.program = new Command()
    
    // AI: 初始化核心组件
    this.registry = CommandRegistry.getInstance(this.program)
    this.pluginLoader = PluginLoader.getInstance()
    this.configManager = ConfigManager.getInstance()
    
    // AI: 建立组件间连接
    this.pluginLoader.setRegistry(this.registry)
    
    // AI: 配置基础程序信息
    this.setupProgram()
  }

  /**
   * @ai-method 配置基础程序信息
   * @ai-purpose 设置 CLI 程序的基本信息和全局选项
   */
  private setupProgram(): void {
    this.program
      .name('linch')
      .description('🚀 Linch Kit - AI-First rapid development framework CLI')
      .version('0.1.0')
      .option('-v, --verbose', 'Enable verbose output')
      .option('-s, --silent', 'Suppress output')
      .option('--config <path>', 'Specify config file path')
      .option('--cwd <path>', 'Working directory')
  }

  /**
   * @ai-method 初始化 CLI 系统
   * @ai-purpose 加载配置、插件和注册所有命令
   * @ai-lifecycle 在解析命令前调用
   */
  async initialize(): Promise<void> {
    try {
      // AI: 加载配置
      await this.loadConfiguration()
      
      // AI: 注册内置命令
      this.registerBuiltinCommands()
      
      // AI: 加载和注册插件
      await this.loadPlugins()
      
      // AI: 设置错误处理
      this.setupErrorHandling()
      
      if (!process.env.LINCH_SILENT) {
        console.log('AI: CLI system initialized successfully')
      }
    } catch (error) {
      console.error('AI: Failed to initialize CLI system:', error)
      process.exit(1)
    }
  }

  /**
   * @ai-method 加载配置
   * @ai-purpose 初始化配置管理器并加载配置
   */
  private async loadConfiguration(): Promise<void> {
    // AI: 这里可以注册额外的配置提供者
    // 例如：环境变量、远程配置等
    
    const config = await this.configManager.loadConfig()
    if (!process.env.LINCH_SILENT) {
      console.log('AI: Configuration loaded')
    }
  }

  /**
   * @ai-method 注册内置命令
   * @ai-purpose 注册所有内置的 CLI 命令
   */
  private registerBuiltinCommands(): void {
    this.registry.registerCommands(builtinCommands)
    if (!process.env.LINCH_SILENT) {
      console.log('AI: Built-in commands registered')
    }
  }

  /**
   * @ai-method 加载插件
   * @ai-purpose 发现、加载和注册所有插件
   */
  private async loadPlugins(): Promise<void> {
    const result = await this.pluginLoader.loadAndRegisterPlugins()
    
    if (result.loaded.length > 0 && !process.env.LINCH_SILENT) {
      console.log(`AI: Loaded ${result.loaded.length} plugins: ${result.loaded.map(p => p.name).join(', ')}`)
    }
    
    if (result.failed.length > 0) {
      console.warn(`AI: Failed to load ${result.failed.length} plugins: ${result.failed.join(', ')}`)
    }
  }

  /**
   * @ai-method 设置错误处理
   * @ai-purpose 配置全局错误处理和未知命令处理
   */
  private setupErrorHandling(): void {
    // AI: 处理未知命令
    this.program.on('command:*', () => {
      console.error(`❌ Unknown command: ${this.program.args.join(' ')}`)
      console.log('💡 Use --help to see available commands')
      process.exit(1)
    })

    // AI: 处理未捕获的异常
    process.on('unhandledRejection', (reason, promise) => {
      console.error('AI: Unhandled Rejection at:', promise, 'reason:', reason)
      process.exit(1)
    })

    process.on('uncaughtException', (error) => {
      console.error('AI: Uncaught Exception:', error)
      process.exit(1)
    })
  }

  /**
   * @ai-method 解析和执行命令
   * @ai-purpose 解析命令行参数并执行对应命令
   * @ai-parameter args?: string[] - 可选的参数数组，默认使用 process.argv
   */
  async run(args?: string[]): Promise<void> {
    try {
      // AI: 初始化系统
      await this.initialize()
      
      // AI: 解析并执行命令
      await this.program.parseAsync(args || process.argv)
      
      // AI: 如果没有提供命令，显示帮助
      if (!args && !process.argv.slice(2).length) {
        this.program.outputHelp()
      }
    } catch (error) {
      console.error('AI: Command execution failed:', error)
      process.exit(1)
    }
  }

  /**
   * @ai-method 获取程序实例
   * @ai-purpose 提供对 Commander 程序的访问
   * @ai-return Command - Commander 程序实例
   */
  getProgram(): Command {
    return this.program
  }

  /**
   * @ai-method 获取注册表实例
   * @ai-purpose 提供对命令注册表的访问
   * @ai-return CommandRegistry - 命令注册表实例
   */
  getRegistry(): CommandRegistry {
    return this.registry
  }

  /**
   * @ai-method 获取配置管理器实例
   * @ai-purpose 提供对配置管理器的访问
   * @ai-return ConfigManager - 配置管理器实例
   */
  getConfigManager(): ConfigManager {
    return this.configManager
  }

  /**
   * @ai-method 获取插件加载器实例
   * @ai-purpose 提供对插件加载器的访问
   * @ai-return PluginLoader - 插件加载器实例
   */
  getPluginLoader(): PluginLoader {
    return this.pluginLoader
  }
}

/**
 * @ai-function 创建并运行 CLI 应用
 * @ai-purpose 便捷函数，创建 CLI 实例并运行
 * @ai-parameter args?: string[] - 可选的参数数组
 * @ai-usage 主要用于 CLI 入口文件
 */
export async function createCLI(args?: string[]): Promise<LinchCLI> {
  const cli = new LinchCLI()
  await cli.run(args)
  return cli
}

/**
 * @ai-function 默认 CLI 导出
 * @ai-purpose 提供简单的 CLI 启动函数
 * @ai-backward-compatibility 保持向后兼容性
 */
export const cli = createCLI

// AI: 如果直接运行此文件，启动 CLI
if (typeof require !== 'undefined' && require.main === module) {
  createCLI().catch(error => {
    console.error('AI: Failed to start CLI:', error)
    process.exit(1)
  })
}

// AI: 导出核心组件，便于高级用法
export { CommandRegistry } from './cli/core/command-registry'
export { PluginLoader } from './cli/core/plugin-loader'
export { ConfigManager } from './cli/core/config-manager'
export { builtinCommands } from './cli/commands'
export * from './types'
