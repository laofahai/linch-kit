/**
 * 平台管理器 - 统一管理业务开发能力
 * @module platform/platform-manager
 */

import type { ExtensionContext } from '@linch-kit/core'

import { CRUDExtension } from './extensions/crud-extension'
import { RuntimeValidator } from './validation'

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
  private crudExtension?: CRUDExtension
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
    if (!extensionContext) {
      throw new Error('ExtensionContext is required for Platform Manager')
    }

    // 初始化CRUD Extension
    if (this.config.enableCrud) {
      this.crudExtension = new CRUDExtension({ extensionContext })
    }

    // 初始化验证器
    if (this.config.enableValidation) {
      this.validator = new RuntimeValidator(extensionContext)
    }

    // 记录初始化日志
    extensionContext.logger.info('Platform manager initialized', {
      crud: this.config.enableCrud,
      trpc: this.config.enableTrpc,
      validation: this.config.enableValidation,
    })
  }

  /**
   * 获取CRUD Extension
   */
  getCrudExtension(): CRUDExtension {
    if (!this.crudExtension) {
      throw new Error('CRUD extension not initialized or disabled')
    }
    return this.crudExtension
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
    // 重新初始化CRUD Extension
    if (this.crudExtension) {
      this.crudExtension = new CRUDExtension({ extensionContext: context })
    }

    // 重新初始化验证器
    if (this.validator) {
      this.validator = new RuntimeValidator(context)
    }
  }

  /**
   * 销毁平台资源
   */
  async destroy(): Promise<void> {
    // 清理资源
    this.crudExtension = undefined
    this.validator = undefined
  }

  /**
   * 获取平台状态
   */
  getStatus() {
    return {
      initialized: !!(this.crudExtension || this.validator),
      capabilities: {
        crud: !!this.crudExtension,
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
