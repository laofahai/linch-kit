/**
 * @linch-kit/schema 插件注册
 * 将Schema包注册为Core插件，实现标准插件接口
 */

import type { Plugin, PluginConfig } from '@linch-kit/core'

import { schemaCommands } from './cli/commands'
import { logError, logInfo, useSchemaTranslation } from './infrastructure'

/**
 * Schema插件配置接口
 */
export interface SchemaPluginConfig extends PluginConfig {
  /** 是否自动注册CLI命令 */
  autoRegisterCommands?: boolean
  /** 是否启用代码生成监听 */
  enableWatcher?: boolean
  /** 默认生成器列表 */
  defaultGenerators?: string[]
  /** Schema文件输入目录 */
  inputDir?: string
  /** 代码生成输出目录 */
  outputDir?: string
}

/**
 * Schema插件默认配置
 */
export const defaultSchemaPluginConfig: SchemaPluginConfig = {
  enabled: true,
  autoRegisterCommands: true,
  enableWatcher: false,
  defaultGenerators: ['typescript', 'prisma'],
  inputDir: './src/schema',
  outputDir: './generated'
}

/**
 * Schema插件实现
 */
export const schemaPlugin: Plugin = {
  metadata: {
    id: 'schema',
    name: 'LinchKit Schema Plugin',
    version: '0.1.0',
    description: 'Schema-driven development engine for LinchKit',
    author: 'LinchKit Team',
    dependencies: []
  },
  
  defaultConfig: defaultSchemaPluginConfig,

  /**
   * 插件初始化
   */
  async init(config: SchemaPluginConfig): Promise<void> {
    const t = useSchemaTranslation()

    try {
      logInfo(t('plugin.init.starting'))

      // 初始化Schema系统基础设施
      await initializeInfrastructure(config)

      logInfo(t('plugin.init.success'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logError(t('plugin.register.error', { error: errorMessage }), error instanceof Error ? error : undefined)
      throw error
    }
  },

  /**
   * 插件设置
   */
  async setup(config: SchemaPluginConfig): Promise<void> {
    const t = useSchemaTranslation()
    
    try {
      // 注册CLI命令
      if (config.autoRegisterCommands) {
        await registerCliCommands()
      }

      // 设置代码生成监听器
      if (config.enableWatcher) {
        await setupWatcher(config)
      }
      
      logInfo(t('plugin.register.success'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logError(t('plugin.register.error', { error: errorMessage }), error instanceof Error ? error : undefined)
      throw error
    }
  },

  /**
   * 插件启动
   */
  async start(_config: SchemaPluginConfig): Promise<void> {
    // Schema插件启动时的逻辑
    // 可以在这里启动文件监听、预加载Schema等
    logInfo('Schema plugin started successfully')
  },

  /**
   * 插件就绪
   */
  async ready(_config: SchemaPluginConfig): Promise<void> {
    // Schema插件就绪时的逻辑
    // 可以在这里执行一些需要其他插件已启动的操作
    logInfo('Schema plugin is ready')
  },

  /**
   * 插件停止
   */
  async stop(_config: SchemaPluginConfig): Promise<void> {
    // 清理资源，停止监听器等
    logInfo('Schema plugin stopped')
  },

  /**
   * 插件销毁
   */
  async destroy(_config: SchemaPluginConfig): Promise<void> {
    // 完全清理插件资源
    logInfo('Schema plugin destroyed')
  }
}

/**
 * 初始化基础设施
 */
async function initializeInfrastructure(config: SchemaPluginConfig): Promise<void> {
  // 初始化日志系统（已在infrastructure/index.ts中完成）
  // 初始化国际化系统（已在infrastructure/index.ts中完成）
  // 初始化配置管理（使用传入的config）

  logInfo('Schema infrastructure initialized', {
    inputDir: config.inputDir,
    outputDir: config.outputDir,
    generators: config.defaultGenerators
  })
}

/**
 * 注册CLI命令
 */
async function registerCliCommands(): Promise<void> {
  // 注册Schema相关的CLI命令
  // 这些命令将集成到Core的CLI系统中
  logInfo('Schema CLI commands registered', {
    commandCount: schemaCommands.length,
    commands: schemaCommands.map(cmd => cmd.name)
  })
}

/**
 * 设置文件监听器
 */
async function setupWatcher(config: SchemaPluginConfig): Promise<void> {
  // 设置Schema文件变化监听器
  // 当Schema文件发生变化时自动重新生成代码
  logInfo('Schema file watcher setup', {
    watchDir: config.inputDir
  })
}

/**
 * 导出插件实例供外部使用
 */
export default schemaPlugin
