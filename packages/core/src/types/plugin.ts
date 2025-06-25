/**
 * 轻量级插件系统类型定义
 * @module types/plugin
 */

import type { BaseConfig, OperationResult } from './common'

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  dependencies?: string[]
}

/**
 * 插件配置
 */
export interface PluginConfig extends BaseConfig {
  enabled?: boolean
  priority?: number
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycleHooks {
  init?: (config: PluginConfig) => Promise<void> | void
  setup?: (config: PluginConfig) => Promise<void> | void
  start?: (config: PluginConfig) => Promise<void> | void
  ready?: (config: PluginConfig) => Promise<void> | void
  stop?: (config: PluginConfig) => Promise<void> | void
  destroy?: (config: PluginConfig) => Promise<void> | void
}

/**
 * 插件定义
 */
export interface Plugin extends PluginLifecycleHooks {
  metadata: PluginMetadata
  defaultConfig?: PluginConfig
}

/**
 * 插件注册信息
 */
export interface PluginRegistration {
  plugin: Plugin
  config: PluginConfig
  status: PluginStatus
  registeredAt: number
}

/**
 * 插件状态
 */
export type PluginStatus = 'registered' | 'initialized' | 'started' | 'stopped' | 'error'

/**
 * 插件管理器接口
 */
export interface PluginManager {
  register(plugin: Plugin, config?: PluginConfig): Promise<OperationResult>
  unregister(pluginId: string): Promise<OperationResult>
  start(pluginId: string): Promise<OperationResult>
  stop(pluginId: string): Promise<OperationResult>
  get(pluginId: string): PluginRegistration | undefined
  getAll(): PluginRegistration[]
  has(pluginId: string): boolean
  getStatus(pluginId: string): PluginStatus | undefined
  startAll(): Promise<OperationResult[]>
  stopAll(): Promise<OperationResult[]>
}