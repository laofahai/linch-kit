/**
 * @linch-kit/auth Edge Runtime密钥提供者
 * 
 * 专为Edge Runtime环境设计的密钥提供者实现
 * 仅使用Web标准API，无Node.js专用依赖
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import { BaseKeyProvider, type BaseKeyProviderConfig } from '../core/key-provider.interface'

/**
 * Edge环境密钥提供者配置
 */
export interface EdgeKeyProviderConfig extends BaseKeyProviderConfig {
  /**
   * JWT签名密钥
   * 应从环境变量或安全存储中获取
   */
  jwtSecret?: string

  /**
   * 加密密钥
   * 用于敏感数据加密
   */
  encryptionKey?: string

  /**
   * 环境变量名称配置
   */
  envVars?: {
    jwtSecret?: string
    encryptionKey?: string
  }
}

/**
 * Edge Runtime密钥提供者
 * 
 * 特点：
 * - 仅使用Web标准API
 * - 不依赖Node.js专用模块
 * - 支持环境变量和直接配置
 * - 兼容Edge Runtime限制
 */
export class EdgeKeyProvider extends BaseKeyProvider {
  private readonly edgeConfig: EdgeKeyProviderConfig

  constructor(config: EdgeKeyProviderConfig = {}) {
    super(config)
    
    this.edgeConfig = {
      envVars: {
        jwtSecret: 'JWT_SECRET',
        encryptionKey: 'ENCRYPTION_KEY'
      },
      ...config
    }
  }

  /**
   * 获取JWT签名密钥
   * 
   * 优先级：
   * 1. 直接配置的密钥
   * 2. 环境变量
   * 3. 抛出错误
   */
  getJWTSecret(): string {
    // 优先使用直接配置的密钥
    if (this.edgeConfig.jwtSecret) {
      this.validateKey(this.edgeConfig.jwtSecret)
      return this.edgeConfig.jwtSecret
    }

    // 从环境变量获取
    const envVarName = this.edgeConfig.envVars!.jwtSecret!
    const envValue = this.getEnvVar(envVarName)
    
    if (!envValue) {
      throw new Error(`JWT secret not found. Please set ${envVarName} environment variable or provide jwtSecret in config.`)
    }

    this.validateKey(envValue)
    return envValue
  }

  /**
   * 获取加密密钥
   */
  getEncryptionKey(): string {
    // 优先使用直接配置的密钥
    if (this.edgeConfig.encryptionKey) {
      this.validateKey(this.edgeConfig.encryptionKey)
      return this.edgeConfig.encryptionKey
    }

    // 从环境变量获取
    const envVarName = this.edgeConfig.envVars!.encryptionKey!
    const envValue = this.getEnvVar(envVarName)
    
    if (!envValue) {
      throw new Error(`Encryption key not found. Please set ${envVarName} environment variable or provide encryptionKey in config.`)
    }

    this.validateKey(envValue)
    return envValue
  }

  /**
   * 获取提供者类型
   */
  getProviderType(): 'edge' {
    return 'edge'
  }

  /**
   * Edge Runtime环境变量访问
   * 
   * 使用安全的环境变量访问方式，兼容Edge Runtime
   */
  private getEnvVar(name: string): string | undefined {
    // Edge Runtime中的环境变量访问
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name]
    }

    // 备用方案：检查全局变量（某些Edge Runtime实现）
    if (typeof globalThis !== 'undefined') {
      const env = (globalThis as unknown as { env?: Record<string, string> }).env
      if (env) {
        return env[name]
      }
    }

    return undefined
  }

  /**
   * Edge Runtime健康检查
   * 
   * 专门针对Edge环境的健康检查逻辑
   */
  async isHealthy(): Promise<boolean> {
    try {
      // 基础健康检查
      await this.validateProvider()

      // Edge Runtime特定检查
      if (!this.isEdgeRuntimeCompatible()) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * 检查Edge Runtime兼容性
   */
  private isEdgeRuntimeCompatible(): boolean {
    try {
      // 检查必要的Web API是否可用
      const requiredAPIs = [
        'crypto',
        'TextEncoder',
        'TextDecoder',
        'Response',
        'Request',
        'URL'
      ]

      for (const api of requiredAPIs) {
        if (typeof globalThis[api as keyof typeof globalThis] === 'undefined') {
          return false
        }
      }

      // 检查crypto.subtle是否可用（用于安全操作）
      if (!globalThis.crypto || !globalThis.crypto.subtle) {
        return false
      }

      return true
    } catch {
      return false
    }
  }
}

/**
 * 创建Edge Runtime密钥提供者
 */
export function createEdgeKeyProvider(config?: EdgeKeyProviderConfig): EdgeKeyProvider {
  return new EdgeKeyProvider(config)
}

/**
 * 默认Edge密钥提供者配置
 * 
 * 使用标准环境变量名称
 */
export const defaultEdgeKeyProviderConfig: EdgeKeyProviderConfig = {
  envVars: {
    jwtSecret: 'JWT_SECRET',
    encryptionKey: 'ENCRYPTION_KEY'
  },
  validateOnInit: true
}