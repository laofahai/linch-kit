/**
 * LinchKit 初始化系统
 * 
 * 提供统一的初始化流程，简化项目配置
 * @module @linch-kit/core/init
 */

import { Logger } from '../logger-client'
import { PluginSystem } from '../plugin'
import type { Plugin } from '../types'

export interface LinchKitInitOptions {
  /**
   * 应用名称
   */
  appName: string
  
  /**
   * 应用版本
   */
  version?: string
  
  /**
   * 环境：development, production, test
   */
  environment?: 'development' | 'production' | 'test'
  
  /**
   * 是否启用调试模式
   */
  debug?: boolean
  
  /**
   * 插件列表
   */
  plugins?: Plugin[]
  
  /**
   * 自定义配置
   */
  config?: Record<string, unknown>
  
  /**
   * 初始化回调
   */
  onInit?: () => void | Promise<void>
  
  /**
   * 错误处理
   */
  onError?: (error: Error) => void
}

export interface LinchKitContext {
  app: {
    name: string
    version: string
    environment: string
  }
  config: Record<string, unknown>
  plugins: PluginSystem
  logger: typeof Logger
}

let context: LinchKitContext | null = null

/**
 * 初始化 LinchKit 应用
 */
export async function initLinchKit(options: LinchKitInitOptions): Promise<LinchKitContext> {
  try {
    // 设置环境
    const environment = options.environment || process.env.NODE_ENV || 'development'
    const version = options.version || '1.0.0'
    
    // 配置日志
    if (options.debug) {
      Logger.setLevel('debug')
    }
    
    Logger.info(`Initializing ${options.appName} v${version} in ${environment} mode`)
    
    // 初始化插件系统
    const pluginSystem = new PluginSystem()
    
    // 注册插件
    if (options.plugins) {
      for (const plugin of options.plugins) {
        await pluginSystem.register(plugin)
      }
    }
    
    // 创建上下文
    context = {
      app: {
        name: options.appName,
        version,
        environment
      },
      config: options.config || {},
      plugins: pluginSystem,
      logger: Logger
    }
    
    // 执行自定义初始化
    if (options.onInit) {
      await options.onInit()
    }
    
    Logger.info(`${options.appName} initialized successfully`)
    
    return context
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    Logger.error(`Failed to initialize ${options.appName}: ${err.message}`)
    
    if (options.onError) {
      options.onError(err)
    }
    
    throw err
  }
}

/**
 * 获取 LinchKit 上下文
 */
export function getLinchKitContext(): LinchKitContext {
  if (!context) {
    throw new Error('LinchKit not initialized. Call initLinchKit() first.')
  }
  return context
}

/**
 * 检查是否已初始化
 */
export function isLinchKitInitialized(): boolean {
  return context !== null
}

/**
 * 重置 LinchKit (主要用于测试)
 */
export function resetLinchKit(): void {
  context = null
}

/**
 * LinchKit 环境变量辅助函数
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Environment variable ${key} is not defined`)
  }
  return value
}

/**
 * 获取必需的环境变量
 */
export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not defined`)
  }
  return value
}

/**
 * 验证环境变量
 */
export function validateEnv(requiredVars: string[]): void {
  const missing: string[] = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}