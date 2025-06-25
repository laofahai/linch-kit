/**
 * 配置管理器实现
 * @module config/manager
 */

import { EventEmitter } from 'eventemitter3'

import type { 
  ConfigManager as IConfigManager,
  ConfigSource,
  ConfigValue,
  ConfigWatchOptions,
} from '../types'

/**
 * 多层配置管理器
 */
export class ConfigManager extends EventEmitter implements IConfigManager {
  private configs = new Map<string, ConfigValue>()
  private sources = new Map<string, ConfigSource>()
  private watchers = new Map<string, () => void>()

  constructor() {
    super()
  }

  async loadConfig(source: ConfigSource): Promise<void> {
    try {
      this.sources.set(source.id, source)
      
      const config = await this.loadFromSource(source)
      this.mergeConfig(config, source.priority || 0)
      
      this.emit('config:loaded', { sourceId: source.id, config })
    } catch (error) {
      this.emit('config:error', { 
        sourceId: source.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }

  get<T = unknown>(key: string, defaultValue?: T): T {
    const value = this.configs.get(key)
    return value !== undefined ? (value as T) : (defaultValue as T)
  }

  set(key: string, value: ConfigValue): void {
    const oldValue = this.configs.get(key)
    this.configs.set(key, value)
    
    if (oldValue !== value) {
      this.emit('config:changed', { key, oldValue, newValue: value })
    }
  }

  has(key: string): boolean {
    return this.configs.has(key)
  }

  delete(key: string): boolean {
    const existed = this.configs.has(key)
    if (existed) {
      const oldValue = this.configs.get(key)
      this.configs.delete(key)
      this.emit('config:deleted', { key, oldValue })
    }
    return existed
  }

  getAll(): Record<string, ConfigValue> {
    return Object.fromEntries(this.configs)
  }

  watch(key: string, callback: (value: ConfigValue) => void, options?: ConfigWatchOptions): () => void {
    const handler = (event: { key: string; newValue: ConfigValue }) => {
      if (event.key === key || (options?.deep && key.startsWith(event.key + '.'))) {
        callback(event.newValue)
      }
    }

    this.on('config:changed', handler)

    const unwatch = () => {
      this.off('config:changed', handler)
    }

    if (options?.watchId) {
      this.watchers.set(options.watchId, unwatch)
    }

    return unwatch
  }

  unwatch(watchId: string): void {
    const unwatch = this.watchers.get(watchId)
    if (unwatch) {
      unwatch()
      this.watchers.delete(watchId)
    }
  }

  async reload(sourceId?: string): Promise<void> {
    if (sourceId) {
      const source = this.sources.get(sourceId)
      if (source) {
        await this.loadConfig(source)
      }
    } else {
      // 重新加载所有配置源
      for (const source of this.sources.values()) {
        await this.loadConfig(source)
      }
    }
  }

  clear(): void {
    this.configs.clear()
    this.sources.clear()
    
    // 清理所有监听器
    for (const unwatch of this.watchers.values()) {
      unwatch()
    }
    this.watchers.clear()
    
    this.emit('config:cleared')
  }

  private async loadFromSource(source: ConfigSource): Promise<Record<string, ConfigValue>> {
    switch (source.type) {
      case 'object':
        return source.data as Record<string, ConfigValue>
      
      case 'file':
        return this.loadFromFile(source.path!)
      
      case 'env':
        return this.loadFromEnv(source.prefix)
      
      case 'remote':
        return this.loadFromRemote(source.url!)
      
      default:
        throw new Error(`Unsupported config source type: ${(source as any).type}`)
    }
  }

  private async loadFromFile(filePath: string): Promise<Record<string, ConfigValue>> {
    try {
      // 动态导入以支持不同文件格式
      if (filePath.endsWith('.json')) {
        const fs = await import('fs/promises')
        const content = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(content)
      } 
      
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        const fs = await import('fs/promises')
        const yaml = await import('yaml')
        const content = await fs.readFile(filePath, 'utf-8')
        return yaml.parse(content)
      }
      
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        const config = await import(filePath)
        return config.default || config
      }
      
      throw new Error(`Unsupported file format: ${filePath}`)
    } catch (error) {
      throw new Error(`Failed to load config from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private loadFromEnv(prefix = ''): Record<string, ConfigValue> {
    const config: Record<string, ConfigValue> = {}
    
    for (const [key, value] of Object.entries(process.env)) {
      if (!prefix || key.startsWith(prefix)) {
        const configKey = prefix ? key.slice(prefix.length) : key
        config[configKey.toLowerCase()] = this.parseEnvValue(value!)
      }
    }
    
    return config
  }

  private async loadFromRemote(url: string): Promise<Record<string, ConfigValue>> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        return response.json()
      }
      
      if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
        const yaml = await import('yaml')
        const text = await response.text()
        return yaml.parse(text)
      }
      
      throw new Error(`Unsupported remote content type: ${contentType}`)
    } catch (error) {
      throw new Error(`Failed to load remote config from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseEnvValue(value: string): ConfigValue {
    // 尝试解析为数字
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10)
    }
    
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value)
    }
    
    // 尝试解析为布尔值
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    
    // 尝试解析为JSON
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value)
      } catch {
        // 解析失败，返回原字符串
      }
    }
    
    return value
  }

  private mergeConfig(config: Record<string, ConfigValue>, priority: number): void {
    for (const [key, value] of Object.entries(config)) {
      // 简单的优先级合并策略
      if (!this.configs.has(key) || priority > 0) {
        this.set(key, value)
      }
    }
  }
}

/**
 * 默认配置管理器实例
 */
export const configManager = new ConfigManager()