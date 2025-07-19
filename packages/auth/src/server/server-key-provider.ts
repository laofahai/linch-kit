/**
 * @linch-kit/auth Server Runtime密钥提供者
 * 
 * 专为Node.js Server环境设计的密钥提供者实现
 * 利用Node.js专用模块和服务器端功能
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import { readFileSync } from 'fs'
import { join } from 'path'

import { BaseKeyProvider, type BaseKeyProviderConfig } from '../core/key-provider.interface'

/**
 * 密钥来源类型
 */
export type KeySource = 'env' | 'file' | 'vault' | 'direct'

/**
 * 文件密钥配置
 */
export interface FileKeyConfig {
  /**
   * 密钥文件路径
   */
  path: string

  /**
   * 文件编码
   */
  encoding?: BufferEncoding

  /**
   * 是否去除文件末尾的换行符
   */
  trimNewlines?: boolean
}

/**
 * Vault密钥配置（扩展性预留）
 */
export interface VaultKeyConfig {
  /**
   * Vault地址
   */
  url: string

  /**
   * 认证令牌
   */
  token: string

  /**
   * 密钥路径
   */
  keyPath: string
}

/**
 * Server环境密钥提供者配置
 */
export interface ServerKeyProviderConfig extends BaseKeyProviderConfig {
  /**
   * JWT密钥配置
   */
  jwt: {
    source: KeySource
    value?: string
    envVar?: string
    file?: FileKeyConfig
    vault?: VaultKeyConfig
  }

  /**
   * 加密密钥配置
   */
  encryption: {
    source: KeySource
    value?: string
    envVar?: string
    file?: FileKeyConfig
    vault?: VaultKeyConfig
  }

  /**
   * 默认环境变量名称
   */
  defaultEnvVars?: {
    jwtSecret: string
    encryptionKey: string
  }
}

/**
 * Server Runtime密钥提供者
 * 
 * 特点：
 * - 支持多种密钥来源（环境变量、文件、Vault等）
 * - 利用Node.js服务器端能力
 * - 更强的安全性和灵活性
 * - 支持密钥轮换和热更新
 */
export class ServerKeyProvider extends BaseKeyProvider {
  private readonly serverConfig: ServerKeyProviderConfig
  private jwtSecretCache?: string
  private encryptionKeyCache?: string
  private lastKeyRefresh = 0
  private readonly keyRefreshInterval = 5 * 60 * 1000 // 5分钟缓存

  constructor(config: ServerKeyProviderConfig) {
    super(config)
    
    this.serverConfig = {
      defaultEnvVars: {
        jwtSecret: 'JWT_SECRET',
        encryptionKey: 'ENCRYPTION_KEY'
      },
      ...config
    }

    // 验证配置的完整性
    this.validateServerConfig()
  }

  /**
   * 获取JWT签名密钥
   */
  async getJWTSecret(): Promise<string> {
    // 检查缓存是否有效
    if (this.jwtSecretCache && this.isCacheValid()) {
      return this.jwtSecretCache
    }

    const key = await this.loadKey(this.serverConfig.jwt)
    this.validateKey(key)
    
    // 更新缓存
    this.jwtSecretCache = key
    this.lastKeyRefresh = Date.now()
    
    return key
  }

  /**
   * 获取加密密钥
   */
  async getEncryptionKey(): Promise<string> {
    // 检查缓存是否有效
    if (this.encryptionKeyCache && this.isCacheValid()) {
      return this.encryptionKeyCache
    }

    const key = await this.loadKey(this.serverConfig.encryption)
    this.validateKey(key)
    
    // 更新缓存
    this.encryptionKeyCache = key
    this.lastKeyRefresh = Date.now()
    
    return key
  }

  /**
   * 获取提供者类型
   */
  getProviderType(): 'server' {
    return 'server'
  }

  /**
   * 清除密钥缓存（强制重新加载）
   */
  clearKeyCache(): void {
    this.jwtSecretCache = undefined
    this.encryptionKeyCache = undefined
    this.lastKeyRefresh = 0
  }

  /**
   * Server环境健康检查
   */
  async isHealthy(): Promise<boolean> {
    try {
      // 基础健康检查
      await this.validateProvider()

      // Server环境特定检查
      if (!this.isServerRuntimeCompatible()) {
        return false
      }

      // 测试密钥加载
      await this.getJWTSecret()
      await this.getEncryptionKey()

      return true
    } catch {
      return false
    }
  }

  /**
   * 根据配置加载密钥
   */
  private async loadKey(config: ServerKeyProviderConfig['jwt']): Promise<string> {
    switch (config.source) {
      case 'direct':
        if (!config.value) {
          throw new Error('Direct key value is required when source is "direct"')
        }
        return config.value

      case 'env':
        return this.loadFromEnv(config.envVar || this.getDefaultEnvVar(config))

      case 'file':
        if (!config.file) {
          throw new Error('File configuration is required when source is "file"')
        }
        return this.loadFromFile(config.file)

      case 'vault':
        if (!config.vault) {
          throw new Error('Vault configuration is required when source is "vault"')
        }
        return this.loadFromVault(config.vault)

      default:
        throw new Error(`Unsupported key source: ${config.source}`)
    }
  }

  /**
   * 从环境变量加载密钥
   */
  private loadFromEnv(envVar: string): string {
    const value = process.env[envVar]
    if (!value) {
      throw new Error(`Environment variable ${envVar} is not set`)
    }
    return value
  }

  /**
   * 从文件加载密钥
   */
  private loadFromFile(config: FileKeyConfig): string {
    try {
      const encoding = config.encoding || 'utf8'
      let content = readFileSync(config.path, encoding)
      
      if (config.trimNewlines !== false) {
        content = content.replace(/\r?\n|\r/g, '')
      }
      
      return content
    } catch (error) {
      throw new Error(`Failed to read key from file ${config.path}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 从Vault加载密钥（扩展性预留）
   */
  private async loadFromVault(_config: VaultKeyConfig): Promise<string> {
    // 这里可以实现HashiCorp Vault集成
    // 为了演示，现在抛出错误
    throw new Error('Vault integration not implemented yet')
  }

  /**
   * 获取默认环境变量名
   */
  private getDefaultEnvVar(config: ServerKeyProviderConfig['jwt']): string {
    if (config === this.serverConfig.jwt) {
      return this.serverConfig.defaultEnvVars!.jwtSecret
    }
    return this.serverConfig.defaultEnvVars!.encryptionKey
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastKeyRefresh < this.keyRefreshInterval
  }

  /**
   * 验证Server配置
   */
  private validateServerConfig(): void {
    if (!this.serverConfig.jwt || !this.serverConfig.encryption) {
      throw new Error('Both JWT and encryption key configurations are required')
    }

    // 验证每个密钥配置
    this.validateKeyConfig(this.serverConfig.jwt, 'JWT')
    this.validateKeyConfig(this.serverConfig.encryption, 'Encryption')
  }

  /**
   * 验证单个密钥配置
   */
  private validateKeyConfig(
    config: ServerKeyProviderConfig['jwt'], 
    keyType: string
  ): void {
    if (!config.source) {
      throw new Error(`${keyType} key source is required`)
    }

    switch (config.source) {
      case 'direct':
        if (!config.value) {
          throw new Error(`${keyType} key value is required when using direct source`)
        }
        break

      case 'file':
        if (!config.file?.path) {
          throw new Error(`${keyType} key file path is required when using file source`)
        }
        break

      case 'vault':
        if (!config.vault?.url || !config.vault?.token || !config.vault?.keyPath) {
          throw new Error(`${keyType} key vault configuration is incomplete`)
        }
        break

      case 'env':
        // 环境变量在运行时验证
        break

      default:
        throw new Error(`Unsupported ${keyType} key source: ${config.source}`)
    }
  }

  /**
   * 检查Server Runtime兼容性
   */
  private isServerRuntimeCompatible(): boolean {
    try {
      // 检查Node.js专用模块是否可用
      const requiredModules = ['fs', 'path', 'crypto', 'os']
      
      for (const moduleName of requiredModules) {
        try {
          require(moduleName)
        } catch {
          return false
        }
      }

      // 检查process对象
      if (typeof process === 'undefined' || !process.env) {
        return false
      }

      return true
    } catch {
      return false
    }
  }
}

/**
 * 创建Server Runtime密钥提供者
 */
export function createServerKeyProvider(config: ServerKeyProviderConfig): ServerKeyProvider {
  return new ServerKeyProvider(config)
}

/**
 * 创建基于环境变量的Server密钥提供者
 */
export function createEnvServerKeyProvider(
  jwtEnvVar = 'JWT_SECRET',
  encryptionEnvVar = 'ENCRYPTION_KEY'
): ServerKeyProvider {
  return new ServerKeyProvider({
    jwt: {
      source: 'env',
      envVar: jwtEnvVar
    },
    encryption: {
      source: 'env',
      envVar: encryptionEnvVar
    }
  })
}

/**
 * 创建基于文件的Server密钥提供者
 */
export function createFileServerKeyProvider(
  jwtFilePath: string,
  encryptionFilePath: string,
  baseDir?: string
): ServerKeyProvider {
  const resolveFilePath = (filePath: string) => 
    baseDir ? join(baseDir, filePath) : filePath

  return new ServerKeyProvider({
    jwt: {
      source: 'file',
      file: {
        path: resolveFilePath(jwtFilePath),
        trimNewlines: true
      }
    },
    encryption: {
      source: 'file',
      file: {
        path: resolveFilePath(encryptionFilePath),
        trimNewlines: true
      }
    }
  })
}

/**
 * 默认Server密钥提供者配置
 */
export const defaultServerKeyProviderConfig: ServerKeyProviderConfig = {
  jwt: {
    source: 'env',
    envVar: 'JWT_SECRET'
  },
  encryption: {
    source: 'env',
    envVar: 'ENCRYPTION_KEY'
  },
  defaultEnvVars: {
    jwtSecret: 'JWT_SECRET',
    encryptionKey: 'ENCRYPTION_KEY'
  },
  validateOnInit: true
}