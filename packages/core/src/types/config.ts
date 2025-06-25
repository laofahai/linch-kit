/**
 * 配置管理类型定义
 * @module types/config
 */

import type { TenantContext, OperationResult } from './common'

/**
 * 配置源定义
 */
export interface ConfigSource {
  id: string
  type: 'file' | 'env' | 'object' | 'remote'
  priority?: number
  path?: string
  url?: string
  prefix?: string
  data?: unknown
}

/**
 * 配置值类型
 */
export type ConfigValue = string | number | boolean | object | unknown[] | null | undefined

/**
 * 配置项定义
 */
export interface ConfigItem {
  key: string
  value: ConfigValue
  source: ConfigSource
  description?: string
  type?: string
  required?: boolean
  default?: ConfigValue
  validator?: (value: unknown) => boolean
  sensitive?: boolean
  lastModified?: number
}

/**
 * 配置更新事件
 */
export interface ConfigChangeEvent {
  key: string
  oldValue: ConfigValue
  newValue: ConfigValue
  source: ConfigSource
  tenantId?: string
  timestamp: number
}

/**
 * 配置监听器
 */
export type ConfigListener = (event: ConfigChangeEvent) => Promise<void> | void

/**
 * 配置验证器
 */
export interface ConfigValidator {
  validate(config: Record<string, unknown>): OperationResult<boolean>
  getSchema(): unknown
}

/**
 * 配置提供器接口
 */
export interface ConfigProvider {
  /**
   * 提供器名称
   */
  name: string

  /**
   * 优先级（数字越小优先级越高）
   */
  priority: number

  /**
   * 加载配置
   */
  load(context?: TenantContext): Promise<Record<string, ConfigValue>>

  /**
   * 保存配置
   */
  save?(config: Record<string, ConfigValue>, context?: TenantContext): Promise<void>

  /**
   * 监听配置变化
   */
  watch?(callback: (changes: ConfigChangeEvent[]) => void): () => void

  /**
   * 检查是否支持
   */
  isSupported(): boolean
}

/**
 * 文件配置提供器选项
 */
export interface FileConfigProviderOptions {
  filePath: string
  format?: 'json' | 'yaml' | 'toml' | 'ini'
  encoding?: BufferEncoding
  watchForChanges?: boolean
}

/**
 * 环境变量配置提供器选项
 */
export interface EnvConfigProviderOptions {
  prefix?: string
  separator?: string
  transform?: {
    keys?: (key: string) => string
    values?: (value: string, key: string) => ConfigValue
  }
}

/**
 * 数据库配置提供器选项
 */
export interface DatabaseConfigProviderOptions {
  table: string
  keyColumn: string
  valueColumn: string
  tenantColumn?: string
  connectionString?: string
}

/**
 * 多租户配置
 */
export interface TenantConfig {
  tenantId: string
  config: Record<string, ConfigValue>
  lastModified: number
  version?: string
}

/**
 * 配置监听选项
 */
export interface ConfigWatchOptions {
  deep?: boolean
  watchId?: string
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  /**
   * 加载配置源
   */
  loadConfig(source: ConfigSource): Promise<void>

  /**
   * 获取配置值
   */
  get<T = unknown>(key: string, defaultValue?: T): T

  /**
   * 设置配置值
   */
  set(key: string, value: ConfigValue): void

  /**
   * 检查配置是否存在
   */
  has(key: string): boolean

  /**
   * 删除配置
   */
  delete(key: string): boolean

  /**
   * 获取所有配置
   */
  getAll(): Record<string, ConfigValue>

  /**
   * 监听配置变化
   */
  watch(key: string, callback: (value: ConfigValue) => void, options?: ConfigWatchOptions): () => void

  /**
   * 取消监听
   */
  unwatch(watchId: string): void

  /**
   * 重新加载配置
   */
  reload(sourceId?: string): Promise<void>

  /**
   * 清除所有配置
   */
  clear(): void
}

/**
 * 配置缓存选项
 */
export interface ConfigCacheOptions {
  ttl?: number
  maxSize?: number
  checkPeriod?: number
}

/**
 * 配置管理选项
 */
export interface ConfigManagerOptions {
  providers?: ConfigProvider[]
  validator?: ConfigValidator
  cache?: ConfigCacheOptions | false
  multiTenant?: boolean
  encryptSensitive?: boolean
  encryptionKey?: string
}