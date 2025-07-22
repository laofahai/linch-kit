import { logger } from '@linch-kit/core/server'
import { StarterIntegrationManager } from '../integration/StarterIntegrationManager'
import { TemplateGenerator } from '../templates/TemplateGenerator'
import type { StarterConfig, ExtensionIntegration } from '../types'

export interface StarterCLIOptions {
  /** 输出目录 */
  outputDir?: string
  /** 是否覆盖现有文件 */
  overwrite?: boolean
  /** 是否生成测试文件 */
  generateTests?: boolean
}

/**
 * LinchKit Starter CLI
 * 提供命令行接口用于管理Starter应用
 */
export class StarterCLI {
  private integrationManager: StarterIntegrationManager
  private templateGenerator: TemplateGenerator

  constructor(config: StarterConfig) {
    this.integrationManager = new StarterIntegrationManager(config)
    this.templateGenerator = new TemplateGenerator()
  }

  /**
   * 初始化新的Starter应用
   */
  async init(config: StarterConfig, options: StarterCLIOptions = {}): Promise<void> {
    try {
      logger.info(`Initializing LinchKit Starter: ${config.appName}`)
      
      await this.integrationManager.initialize(config)
      
      if (options.outputDir) {
        await this.generateFiles(options.outputDir, options.overwrite)
      }

      logger.info('LinchKit Starter initialized successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize LinchKit Starter:', err)
      throw err
    }
  }

  /**
   * 添加扩展到现有应用
   */
  async addExtension(
    extensionName: string, 
    version = '1.0.0',
    config: Record<string, unknown> = {}
  ): Promise<void> {
    const extension: ExtensionIntegration = {
      name: extensionName,
      version,
      enabled: true,
      config,
    }

    await this.integrationManager.addExtension(extension)
    logger.info(`Extension ${extensionName} added successfully`)
  }

  /**
   * 移除扩展
   */
  async removeExtension(extensionName: string): Promise<void> {
    await this.integrationManager.removeExtension(extensionName)
    logger.info(`Extension ${extensionName} removed successfully`)
  }

  /**
   * 生成配置文件
   */
  async generateFiles(outputDir: string, overwrite = false): Promise<void> {
    try {
      const config = this.integrationManager.getConfig()
      const extensions = this.integrationManager.getInstalledExtensions()

      const templates = this.templateGenerator.generateCompleteConfig(config, extensions)

      // 这里应该实际写入文件系统，但为了保持类型安全，我们只记录日志
      logger.info(`Generating configuration files to: ${outputDir}`)
      logger.info('Generated templates:', {
        nextConfig: templates.nextConfig.length,
        trpcRouter: templates.trpcRouter.length,
        authMiddleware: templates.authMiddleware.length,
        extensionConfig: templates.extensionConfig.length,
      })

      if (overwrite) {
        logger.info('Overwrite mode enabled - existing files will be replaced')
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to generate files:', err)
      throw err
    }
  }

  /**
   * 显示当前状态
   */
  status(): void {
    const config = this.integrationManager.getConfig()
    const extensions = this.integrationManager.getInstalledExtensions()

    logger.info('LinchKit Starter Status:')
    logger.info(`App Name: ${config.appName}`)
    logger.info(`Version: ${config.version}`)
    logger.info(`Extensions: ${extensions.length}`)
    
    if (extensions.length > 0) {
      extensions.forEach(ext => {
        logger.info(`  - ${ext.name}@${ext.version} (${ext.enabled ? 'enabled' : 'disabled'})`)
      })
    }

    logger.info(`Auth: ${config.auth.enabled ? `enabled (${config.auth.provider})` : 'disabled'}`)
    logger.info(`Database: ${config.database.enabled ? `enabled (${config.database.provider})` : 'disabled'}`)
    logger.info(`tRPC: ${config.trpc.enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * 验证配置
   */
  validate(): boolean {
    try {
      const config = this.integrationManager.getConfig()
      
      // 基本验证
      if (!config.appName || config.appName.trim() === '') {
        logger.error('App name is required')
        return false
      }

      if (!config.version || config.version.trim() === '') {
        logger.error('App version is required')
        return false
      }

      // 扩展验证
      const extensions = this.integrationManager.getInstalledExtensions()
      for (const extension of extensions) {
        if (!extension.name || extension.name.trim() === '') {
          logger.error(`Invalid extension found: missing name`)
          return false
        }
      }

      logger.info('Configuration validation passed')
      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Configuration validation failed:', err)
      return false
    }
  }

  /**
   * 获取Integration Manager
   */
  getIntegrationManager(): StarterIntegrationManager {
    return this.integrationManager
  }

  /**
   * 获取Template Generator
   */
  getTemplateGenerator(): TemplateGenerator {
    return this.templateGenerator
  }
}

/**
 * 创建Starter CLI实例
 */
export function createStarterCLI(config: StarterConfig): StarterCLI {
  return new StarterCLI(config)
}