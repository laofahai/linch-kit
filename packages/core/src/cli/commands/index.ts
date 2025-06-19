/**
 * @ai-context CLI 命令集合导出
 * @ai-purpose 统一导出所有内置 CLI 命令
 * @ai-extensible 支持插件动态添加命令
 * @ai-organization 按功能分类组织命令
 */

import type { CommandMetadata } from '../../types/cli'
import { initCommand } from './init'
import { configCommands } from './config'
import { pluginCommands } from './plugin'
import { devCommands } from './dev'

/**
 * @ai-constant 内置命令映射表
 * @ai-purpose 定义所有内置 CLI 命令
 * @ai-organization 按功能分类：项目管理、配置管理、插件管理、开发工具
 * @ai-extensible 插件可以通过 CommandRegistry 添加更多命令
 */
export const builtinCommands: Record<string, CommandMetadata> = {
  // AI: 项目管理命令
  'init': initCommand,

  // AI: 配置管理命令
  'config:show': configCommands.show,
  'config:set': configCommands.set,
  'config:get': configCommands.get,
  'config:validate': configCommands.validate,

  // AI: 插件管理命令
  'plugin:list': pluginCommands['plugin:list'],
  'plugin:install': pluginCommands['plugin:install'],
  'plugin:uninstall': pluginCommands['plugin:uninstall'],
  'plugin:info': pluginCommands['plugin:info'],

  // AI: 开发工具命令
  'dev': devCommands.dev,
  'build': devCommands.build,
  'test': devCommands.test
}

/**
 * @ai-constant 命令分类映射
 * @ai-purpose 用于帮助信息的分类显示
 * @ai-user-experience 提供更好的命令组织和发现体验
 */
export const commandCategories = {
  'project': {
    name: 'Project Management',
    description: 'Commands for project initialization and management',
    commands: ['init']
  },
  'config': {
    name: 'Configuration',
    description: 'Commands for configuration management',
    commands: ['config:show', 'config:set', 'config:get', 'config:validate']
  },
  'plugin': {
    name: 'Plugin Management',
    description: 'Commands for plugin discovery and management',
    commands: ['plugin:list', 'plugin:install', 'plugin:uninstall', 'plugin:info']
  },
  'dev': {
    name: 'Development Tools',
    description: 'Commands for development and building',
    commands: ['dev', 'build', 'test']
  }
} as const

/**
 * @ai-function 获取命令分类信息
 * @ai-purpose 为帮助系统提供命令分类数据
 * @ai-parameter commandName?: string - 可选的命令名称
 * @ai-return 命令分类信息或特定命令的分类
 */
export function getCommandCategory(commandName?: string) {
  if (!commandName) {
    return commandCategories
  }

  for (const [categoryKey, category] of Object.entries(commandCategories)) {
    if ((category.commands as readonly string[]).includes(commandName)) {
      return { key: categoryKey, ...category }
    }
  }

  return null
}

/**
 * @ai-function 获取所有内置命令
 * @ai-purpose 提供内置命令的统一访问接口
 * @ai-return Record<string, CommandMetadata> - 所有内置命令
 */
export function getBuiltinCommands(): Record<string, CommandMetadata> {
  return { ...builtinCommands }
}

/**
 * @ai-function 检查命令是否为内置命令
 * @ai-purpose 判断命令是否为系统内置命令
 * @ai-parameter commandName: string - 命令名称
 * @ai-return boolean - 是否为内置命令
 */
export function isBuiltinCommand(commandName: string): boolean {
  return commandName in builtinCommands
}

/**
 * @ai-function 获取命令的 AI 标签
 * @ai-purpose 为 AI 系统提供命令分类和推荐信息
 * @ai-parameter commandName: string - 命令名称
 * @ai-return string[] - AI 标签列表
 */
export function getCommandAITags(commandName: string): string[] {
  const command = builtinCommands[commandName]
  if (!command || !command.aiTags) {
    return []
  }
  return command.aiTags
}

// AI: 导出所有命令模块，便于单独使用
export { initCommand } from './init'
export { configCommands } from './config'
export { pluginCommands } from './plugin'
export { devCommands } from './dev'
