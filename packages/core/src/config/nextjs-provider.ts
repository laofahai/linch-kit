/**
 * Next.js 环境变量提供器
 * @description 为LinchKit提供Next.js环境变量兼容性支持
 * @module config/nextjs-provider
 * @since 0.1.0
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import type { ConfigSource, ConfigValue } from '../types'

/**
 * Next.js 环境变量配置
 */
export interface NextjsEnvConfig {
  /** 公共环境变量 (NEXT_PUBLIC_*) */
  publicVars: Record<string, string>
  /** 私有环境变量 (服务端专用) */
  privateVars: Record<string, string>
  /** 环境文件列表 */
  envFiles: string[]
  /** 当前环境 */
  nodeEnv: 'development' | 'production' | 'test'
}

/**
 * Next.js 环境变量提供器
 * @description 实现Next.js环境变量的加载顺序和优先级处理
 */
export class NextjsEnvProvider {
  private readonly ENV_FILE_ORDER = [
    '.env.local',
    '.env.development', // 或 .env.production
    '.env',
  ]

  private basePath: string
  private nodeEnv: string

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath
    this.nodeEnv = process.env.NODE_ENV || 'development'
  }

  /**
   * 创建配置源
   * @description 创建符合LinchKit配置管理的ConfigSource
   * @returns 配置源定义
   */
  createConfigSource(): ConfigSource & { load: () => Promise<Record<string, ConfigValue>> } {
    return {
      id: 'nextjs-env',
      type: 'env',
      priority: 100, // 高优先级
      load: () => this.load(),
    }
  }

  /**
   * 加载Next.js环境变量
   * @description 按Next.js的优先级顺序加载环境变量
   * @returns 解析后的配置对象
   */
  async load(): Promise<Record<string, ConfigValue>> {
    const config: Record<string, ConfigValue> = {}

    // 1. 加载环境文件 (按优先级倒序)
    const envFiles = this.getEnvFiles()
    for (const file of envFiles.reverse()) {
      const filePath = join(this.basePath, file)
      if (existsSync(filePath)) {
        const envConfig = this.parseEnvFile(filePath)
        Object.assign(config, envConfig)
      }
    }

    // 2. 加载 process.env (最高优先级)
    Object.assign(config, process.env)

    // 3. 处理Next.js特殊变量
    return this.processNextjsVars(config)
  }

  /**
   * 获取Next.js配置
   * @description 提取Next.js特定的环境变量配置
   * @returns Next.js配置对象
   */
  async getNextjsConfig(): Promise<NextjsEnvConfig> {
    const allVars = await this.load()

    const publicVars: Record<string, string> = {}
    const privateVars: Record<string, string> = {}

    for (const [key, value] of Object.entries(allVars)) {
      const strValue = String(value)
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicVars[key] = strValue
      } else {
        privateVars[key] = strValue
      }
    }

    return {
      publicVars,
      privateVars,
      envFiles: this.getEnvFiles(),
      nodeEnv: this.nodeEnv as 'development' | 'production' | 'test',
    }
  }

  /**
   * 获取环境文件列表
   * @private
   */
  private getEnvFiles(): string[] {
    const files = ['.env']

    // 添加环境特定文件
    if (this.nodeEnv === 'development') {
      files.push('.env.development')
    } else if (this.nodeEnv === 'production') {
      files.push('.env.production')
    } else if (this.nodeEnv === 'test') {
      files.push('.env.test')
    }

    // 添加本地文件 (优先级最高)
    files.push('.env.local')

    return files
  }

  /**
   * 解析环境变量文件
   * @private
   */
  private parseEnvFile(filePath: string): Record<string, string> {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const result: Record<string, string> = {}

      content.split('\n').forEach(line => {
        // 移除注释和空行
        line = line.trim()
        if (!line || line.startsWith('#')) return

        // 解析 KEY=VALUE 格式
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const [, key, value] = match
          result[key.trim()] = this.parseEnvValue(value.trim())
        }
      })

      return result
    } catch (error) {
      console.warn(`Failed to parse env file ${filePath}:`, error)
      return {}
    }
  }

  /**
   * 解析环境变量值
   * @description 处理引号、转义字符等
   * @private
   */
  private parseEnvValue(value: string): string {
    // 移除引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // 处理转义字符
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
  }

  /**
   * 处理Next.js特殊变量
   * @description 应用Next.js的变量处理规则
   * @private
   */
  private processNextjsVars(config: Record<string, ConfigValue>): Record<string, ConfigValue> {
    const processed: Record<string, ConfigValue> = {}

    for (const [key, value] of Object.entries(config)) {
      // Next.js 公共变量处理
      if (key.startsWith('NEXT_PUBLIC_')) {
        // 公共变量在客户端和服务端都可用
        processed[key] = value
        // 同时创建不带前缀的版本 (可选)
        const publicKey = key.replace('NEXT_PUBLIC_', '')
        processed[`public.${publicKey}`] = value
      } else {
        // 私有变量只在服务端可用
        processed[key] = value
      }
    }

    // 添加Next.js特殊变量
    processed['NEXT_RUNTIME'] = process.env.NEXT_RUNTIME || 'nodejs'
    processed['NODE_ENV'] = this.nodeEnv

    return processed
  }

  /**
   * 验证Next.js环境变量
   * @description 检查必需的Next.js环境变量
   * @param requiredVars 必需的变量列表
   * @returns 验证结果
   */
  validateNextjsVars(requiredVars: string[] = []): {
    valid: boolean
    missing: string[]
    warnings: string[]
  } {
    const config = process.env
    const missing: string[] = []
    const warnings: string[] = []

    // 检查必需变量
    for (const varName of requiredVars) {
      if (!config[varName]) {
        missing.push(varName)
      }
    }

    // 检查常见问题
    if (config.NEXT_PUBLIC_API_URL && !config.NEXT_PUBLIC_API_URL.startsWith('http')) {
      warnings.push('NEXT_PUBLIC_API_URL should start with http or https')
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    }
  }
}

/**
 * 创建Next.js环境变量提供器
 * @description 为LinchKit项目创建Next.js兼容的环境变量提供器
 * @param basePath 项目根路径
 * @returns Next.js环境变量提供器实例
 * @example
 * ```typescript
 * import { createNextjsEnvProvider } from '@linch-kit/core'
 *
 * const provider = createNextjsEnvProvider()
 * const configSource = provider.createConfigSource()
 *
 * // 在配置管理器中使用
 * await configManager.loadConfig(configSource)
 * ```
 * @since 0.1.0
 */
export function createNextjsEnvProvider(basePath?: string): NextjsEnvProvider {
  return new NextjsEnvProvider(basePath)
}
