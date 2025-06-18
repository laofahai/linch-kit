import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import type { LinchConfig, ConfigLoaderOptions, ConfigProvider } from './types'
import { LinchConfigSchema } from './types'

/**
 * 配置文件类型
 */
export type ConfigFileType = 'js' | 'ts' | 'json' | 'mjs'

/**
 * 默认配置文件名
 */
const DEFAULT_CONFIG_FILES = [
  'linch.config.ts',
  'linch.config.js',
  'linch.config.mjs',
  'linch.config.json',
  'linch-kit.config.ts',
  'linch-kit.config.js',
  'linch-kit.config.mjs',
  'linch-kit.config.json'
]

/**
 * 查找配置文件
 */
export function findConfigFile(options: ConfigLoaderOptions = {}): string | null {
  const { configPath, cwd = process.cwd() } = options

  // 如果指定了配置文件路径，直接使用
  if (configPath) {
    const fullPath = resolve(cwd, configPath)
    return existsSync(fullPath) ? fullPath : null
  }

  // 按顺序查找默认配置文件
  for (const fileName of DEFAULT_CONFIG_FILES) {
    const fullPath = resolve(cwd, fileName)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }

  return null
}

/**
 * 加载配置文件
 */
export async function loadLinchConfig(options: ConfigLoaderOptions = {}): Promise<LinchConfig | null> {
  const configFile = findConfigFile(options)

  if (!configFile) {
    if (options.required) {
      throw new Error('Linch config file not found')
    }
    return null
  }

  try {
    const ext = configFile.split('.').pop()?.toLowerCase()
    let rawConfig: any

    switch (ext) {
      case 'json':
        rawConfig = loadJsonConfig(configFile)
        break
      case 'js':
      case 'mjs':
        rawConfig = await loadJsConfig(configFile)
        break
      case 'ts':
        rawConfig = await loadTsConfig(configFile)
        break
      default:
        throw new Error(`Unsupported config file type: ${ext}`)
    }

    // 验证配置
    const config = LinchConfigSchema.parse(rawConfig)

    // 如果启用了数据库配置加载，合并数据库中的应用配置
    if (options.loadAppFromDatabase && config.database) {
      const dbConfig = await loadAppConfigFromDatabase(config.database)
      if (dbConfig) {
        config.app = { ...config.app, ...dbConfig }
      }
    }

    return config
  } catch (error) {
    throw new Error(`Failed to load Linch config from ${configFile}: ${error}`)
  }
}

/**
 * 加载 JSON 配置
 */
function loadJsonConfig(configFile: string): any {
  const content = readFileSync(configFile, 'utf-8')
  return JSON.parse(content)
}

/**
 * 加载 JS/MJS 配置
 */
async function loadJsConfig(configFile: string): Promise<any> {
  const { pathToFileURL } = await import('url')
  const module = await import(pathToFileURL(configFile).href)
  return module.default || module
}

/**
 * 加载 TS 配置
 */
async function loadTsConfig(configFile: string): Promise<any> {
  try {
    // 尝试使用动态导入（如果环境支持）
    const { pathToFileURL } = await import('url')
    const module = await import(pathToFileURL(configFile).href)
    return module.default || module
  } catch (error) {
    throw new Error(`TypeScript config loading requires ts-node or similar runtime: ${error}`)
  }
}

/**
 * 从数据库加载应用配置
 */
async function loadAppConfigFromDatabase(databaseConfig: any): Promise<any> {
  // 这里需要根据数据库类型实现具体的加载逻辑
  // 暂时返回 null，实际实现时需要连接数据库
  return null
}

/**
 * 文件配置提供者
 */
export class FileConfigProvider implements ConfigProvider {
  constructor(private options: ConfigLoaderOptions = {}) {}

  async load(): Promise<Partial<LinchConfig>> {
    const config = await loadLinchConfig(this.options)
    return config || {}
  }

  async save(config: Partial<LinchConfig>): Promise<void> {
    // 文件配置提供者通常不支持保存
    throw new Error('FileConfigProvider does not support saving')
  }

  watch(callback: (config: Partial<LinchConfig>) => void): void {
    // 实现文件监听
    const configFile = findConfigFile(this.options)
    if (!configFile) return

    // 使用 fs.watchFile 监听文件变化
    const fs = require('fs')
    fs.watchFile(configFile, async () => {
      try {
        const newConfig = await this.load()
        callback(newConfig)
      } catch (error) {
        console.error('Error reloading config:', error)
      }
    })
  }
}

/**
 * 内存配置提供者
 */
export class MemoryConfigProvider implements ConfigProvider {
  private config: Partial<LinchConfig> = {}

  constructor(initialConfig: Partial<LinchConfig> = {}) {
    this.config = initialConfig
  }

  async load(): Promise<Partial<LinchConfig>> {
    return { ...this.config }
  }

  async save(config: Partial<LinchConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
  }
}

/**
 * 配置管理器
 */
export class ConfigManager {
  private providers: ConfigProvider[] = []
  private cache: LinchConfig | null = null

  constructor(providers: ConfigProvider[] = []) {
    this.providers = providers
  }

  addProvider(provider: ConfigProvider): void {
    this.providers.push(provider)
  }

  async load(): Promise<LinchConfig> {
    if (this.cache) {
      return this.cache
    }

    let mergedConfig: Partial<LinchConfig> = {}

    // 按顺序加载所有提供者的配置，后面的覆盖前面的
    for (const provider of this.providers) {
      const config = await provider.load()
      mergedConfig = { ...mergedConfig, ...config }
    }

    // 验证最终配置
    this.cache = LinchConfigSchema.parse(mergedConfig)
    return this.cache
  }

  async save(config: Partial<LinchConfig>): Promise<void> {
    // 保存到最后一个支持保存的提供者
    for (let i = this.providers.length - 1; i >= 0; i--) {
      try {
        await this.providers[i].save(config)
        this.cache = null // 清除缓存
        break
      } catch (error) {
        // 如果当前提供者不支持保存，尝试下一个
        continue
      }
    }
  }

  clearCache(): void {
    this.cache = null
  }

  watch(callback: (config: LinchConfig) => void): void {
    this.providers.forEach(provider => {
      if (provider.watch) {
        provider.watch(async () => {
          this.clearCache()
          const newConfig = await this.load()
          callback(newConfig)
        })
      }
    })
  }
}
