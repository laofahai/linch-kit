/**
 * 平台管理器 - 统一管理业务开发能力
 * @module platform/platform-manager
 */

import { PlatformCrudManager } from './crud/platform-crud-manager'
import { RuntimeValidator } from './validation'
import type { ExtensionContext } from '@linch-kit/core'

/**
 * 平台管理器配置
 */
export interface PlatformConfig {
  /** 是否启用CRUD */
  enableCrud?: boolean
  /** 是否启用tRPC */
  enableTrpc?: boolean
  /** 是否启用验证 */
  enableValidation?: boolean
  /** 自定义配置 */
  [key: string]: unknown
}

/**
 * 平台管理器
 * 为Extension提供统一的业务开发能力入口
 */
export class PlatformManager {
  private crudManager?: PlatformCrudManager
  private validator?: RuntimeValidator
  private config: PlatformConfig

  constructor(config: PlatformConfig = {}) {
    this.config = {
      enableCrud: true,
      enableTrpc: true,
      enableValidation: true,
      ...config,
    }
  }

  /**
   * 初始化平台能力
   */
  async initialize(extensionContext?: ExtensionContext): Promise<void> {
    // 初始化CRUD
    if (this.config.enableCrud) {
      this.crudManager = new PlatformCrudManager()
      if (extensionContext) {
        this.crudManager.setExtensionContext(extensionContext)
      }
    }

    // 初始化验证器
    if (this.config.enableValidation) {
      this.validator = new RuntimeValidator(extensionContext)
    }

    // 记录初始化日志
    extensionContext?.logger.info('Platform manager initialized', {
      crud: this.config.enableCrud,
      trpc: this.config.enableTrpc,
      validation: this.config.enableValidation,
    })
  }

  /**
   * 获取CRUD管理器
   */
  getCrudManager(): PlatformCrudManager {
    if (!this.crudManager) {
      throw new Error('CRUD manager not initialized or disabled')
    }
    return this.crudManager
  }

  /**
   * 获取验证器
   */
  getValidator(): RuntimeValidator {
    if (!this.validator) {
      throw new Error('Validator not initialized or disabled')
    }
    return this.validator
  }

  /**
   * 更新Extension上下文
   */
  updateExtensionContext(context: ExtensionContext): void {
    if (this.crudManager) {
      this.crudManager.setExtensionContext(context)
    }

    if (this.validator) {
      this.validator = new RuntimeValidator(context)
    }
  }

  /**
   * 销毁平台资源
   */
  async destroy(): Promise<void> {
    // 清理资源
    this.crudManager = undefined
    this.validator = undefined
  }

  /**
   * 获取平台状态
   */
  getStatus() {
    return {
      initialized: !!(this.crudManager || this.validator),
      capabilities: {
        crud: !!this.crudManager,
        validation: !!this.validator,
      },
      config: this.config,
    }
  }
}

/**
 * 创建平台管理器实例
 */
export function createPlatformManager(config?: PlatformConfig): PlatformManager {
  return new PlatformManager(config)
}