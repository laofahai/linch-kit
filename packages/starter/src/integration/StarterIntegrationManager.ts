import { logger } from '@linch-kit/core/server'

import type { 
  StarterConfig, 
  ExtensionIntegration, 
  StarterIntegrationManager as IStarterIntegrationManager 
} from '../types'

/**
 * LinchKit Starter Integration Manager
 * 管理Starter应用的扩展集成和配置
 */
export class StarterIntegrationManager implements IStarterIntegrationManager {
  private config: StarterConfig
  private extensions: Map<string, ExtensionIntegration> = new Map()

  constructor(config: StarterConfig) {
    this.config = config
  }

  /**
   * 初始化Starter应用
   */
  async initialize(config: StarterConfig): Promise<void> {
    try {
      this.config = config
      logger.info(`Initializing LinchKit Starter: ${config.appName}`)
      
      // 初始化扩展
      if (config.extensions.length > 0) {
        logger.info(`Loading ${config.extensions.length} extensions...`)
        for (const extensionName of config.extensions) {
          await this.addExtension({
            name: extensionName,
            version: '1.0.0',
            enabled: true,
            config: {},
          })
        }
      }

      logger.info('LinchKit Starter initialized successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize LinchKit Starter:', err)
      throw err
    }
  }

  /**
   * 添加扩展
   */
  async addExtension(extension: ExtensionIntegration): Promise<void> {
    try {
      logger.info(`Adding extension: ${extension.name}@${extension.version}`)
      
      // 验证扩展配置
      if (this.extensions.has(extension.name)) {
        logger.warn(`Extension ${extension.name} already exists, updating...`)
      }

      this.extensions.set(extension.name, extension)
      
      // 更新配置中的扩展列表
      if (!this.config.extensions.includes(extension.name)) {
        this.config.extensions.push(extension.name)
      }

      logger.info(`Extension ${extension.name} added successfully`)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`Failed to add extension ${extension.name}:`, err)
      throw err
    }
  }

  /**
   * 移除扩展
   */
  async removeExtension(name: string): Promise<void> {
    try {
      logger.info(`Removing extension: ${name}`)
      
      if (!this.extensions.has(name)) {
        logger.warn(`Extension ${name} not found`)
        return
      }

      this.extensions.delete(name)
      
      // 从配置中移除扩展
      this.config.extensions = this.config.extensions.filter(ext => ext !== name)

      logger.info(`Extension ${name} removed successfully`)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`Failed to remove extension ${name}:`, err)
      throw err
    }
  }

  /**
   * 获取已安装的扩展
   */
  getInstalledExtensions(): ExtensionIntegration[] {
    return Array.from(this.extensions.values())
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<StarterConfig>): Promise<void> {
    try {
      logger.info('Updating Starter configuration...')
      
      this.config = { ...this.config, ...newConfig }
      
      logger.info('Starter configuration updated successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update Starter configuration:', err)
      throw err
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): StarterConfig {
    return this.config
  }

  /**
   * 检查扩展是否已安装
   */
  isExtensionInstalled(name: string): boolean {
    return this.extensions.has(name)
  }

  /**
   * 获取扩展配置
   */
  getExtensionConfig(name: string): ExtensionIntegration | undefined {
    return this.extensions.get(name)
  }

  /**
   * 更新扩展配置
   */
  async updateExtensionConfig(
    name: string, 
    config: Record<string, unknown>
  ): Promise<void> {
    const extension = this.extensions.get(name)
    if (!extension) {
      throw new Error(`Extension ${name} not found`)
    }

    extension.config = { ...extension.config, ...config }
    this.extensions.set(name, extension)
  }
}

/**
 * 创建Starter Integration Manager实例
 */
export function createStarterIntegrationManager(config: StarterConfig): StarterIntegrationManager {
  return new StarterIntegrationManager(config)
}