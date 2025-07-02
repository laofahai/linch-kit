/**
 * Next.js 环境变量提供器 - 客户端安全版本
 * @description 客户端安全的环境变量访问，仅支持公共变量
 * @module config/nextjs-provider-client
 * @since 0.1.0
 */

import type { ConfigSource, ConfigValue } from '../types'

/**
 * Next.js 客户端环境变量配置
 */
export interface NextjsClientEnvConfig {
  /** 公共环境变量 (NEXT_PUBLIC_*) */
  publicVars: Record<string, string>
  /** 当前环境 */
  nodeEnv: 'development' | 'production' | 'test'
}

/**
 * Next.js 客户端环境变量提供器
 * @description 客户端安全的环境变量访问
 */
export class NextjsClientEnvProvider {
  constructor() {}

  /**
   * 创建客户端配置源
   * @description 创建符合LinchKit配置管理的客户端ConfigSource
   * @returns 配置源定义
   */
  createConfigSource(): ConfigSource & { load: () => Promise<Record<string, ConfigValue>> } {
    return {
      id: 'nextjs-client-env',
      type: 'env',
      priority: 90, // 略低于服务端优先级
      load: () => this.load()
    }
  }

  /**
   * 加载客户端可用的环境变量
   * @description 仅加载NEXT_PUBLIC_*变量
   * @returns 解析后的公共配置对象
   */
  async load(): Promise<Record<string, ConfigValue>> {
    const config: Record<string, ConfigValue> = {}
    
    // 仅在浏览器环境中提取公共环境变量
    if (typeof window !== 'undefined') {
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_')) {
          const value = process.env[key]
          if (value !== undefined) {
            config[key] = value
          }
        }
      })
    }
    
    // 添加NODE_ENV
    config.NODE_ENV = process.env.NODE_ENV || 'development'
    
    return config
  }

  /**
   * 获取Next.js客户端配置
   * @description 提取客户端可用的环境变量配置
   * @returns Next.js客户端配置对象
   */
  async getNextjsConfig(): Promise<NextjsClientEnvConfig> {
    const allVars = await this.load()
    
    const publicVars: Record<string, string> = {}

    for (const [key, value] of Object.entries(allVars)) {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicVars[key] = String(value)
      }
    }

    return {
      publicVars,
      nodeEnv: (allVars.NODE_ENV as 'development' | 'production' | 'test') || 'development'
    }
  }
}

/**
 * 创建Next.js客户端环境变量提供器
 */
export function createNextjsClientEnvProvider(): NextjsClientEnvProvider {
  return new NextjsClientEnvProvider()
}