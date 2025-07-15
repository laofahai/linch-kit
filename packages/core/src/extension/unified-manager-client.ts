/**
 * 客户端安全的扩展管理器
 * 仅包含客户端可用的功能，不包含服务器端依赖
 */

import { EventEmitter } from 'eventemitter3'

import type { OperationResult, ErrorInfo } from '../types/common'

import type { 
  Extension, 
  ExtensionConfig, 
  ExtensionMetadata,
  ExtensionCapabilities,
  ExtensionPermission 
} from './types'

/**
 * 扩展状态枚举
 */
export type ExtensionStatus = 
  | 'registered'
  | 'loading' 
  | 'loaded'
  | 'starting'
  | 'running'
  | 'stopping' 
  | 'stopped'
  | 'error'

export interface ClientExtensionRegistration {
  id: string
  config: ExtensionConfig
  metadata: ExtensionMetadata
  capabilities: ExtensionCapabilities
  permissions: ExtensionPermission[]
  status: ExtensionStatus
  instance?: Extension
  context?: unknown
  loadedAt?: Date
  startedAt?: Date
  stoppedAt?: Date
  error?: Error
}

export interface ClientExtensionEvents {
  'extension:registered': [string, ClientExtensionRegistration]
  'extension:unregistered': [string]
  'extension:started': [string, Extension]
  'extension:stopped': [string]
  'extension:error': [string, Error]
  'extension:status:changed': [string, ExtensionStatus, ExtensionStatus]
}

/**
 * 客户端安全的扩展管理器
 * 不包含sandbox、文件系统等服务器端功能
 */
export class ClientUnifiedExtensionManager extends EventEmitter<ClientExtensionEvents> {
  private extensions = new Map<string, ClientExtensionRegistration>()
  private isInitialized = false

  constructor() {
    super()
  }

  /**
   * 创建错误信息
   */
  private createErrorInfo(code: string, message: string, error?: unknown): ErrorInfo {
    return {
      code,
      message,
      details: error instanceof Error ? { stack: error.stack } : { error }
    }
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    this.isInitialized = true
    console.log('[ClientExtensionManager] 客户端扩展管理器已初始化')
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    // 停止所有扩展
    await this.stopAll()
    
    // 清理资源
    this.extensions.clear()
    this.removeAllListeners()
    
    this.isInitialized = false
    console.log('[ClientExtensionManager] 客户端扩展管理器已销毁')
  }

  /**
   * 注册扩展
   */
  async register(extension: Extension): Promise<OperationResult> {
    try {
      const extensionId = extension.metadata.id

      // 检查是否已注册
      if (this.extensions.has(extensionId)) {
        return {
          success: false,
          error: this.createErrorInfo('EXTENSION_ALREADY_REGISTERED', `Extension ${extensionId} is already registered`)
        }
      }

      // 创建注册记录
      const registration: ClientExtensionRegistration = {
        id: extensionId,
        config: extension.defaultConfig || { enabled: true },
        metadata: extension.metadata,
        capabilities: extension.metadata.capabilities || {},
        permissions: extension.metadata.permissions || [],
        status: 'registered',
        instance: extension,
        context: {},
        loadedAt: new Date()
      }

      // 存储注册信息
      this.extensions.set(extensionId, registration)

      // 触发事件
      this.emit('extension:registered', extensionId, registration)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: this.createErrorInfo('EXTENSION_REGISTER_ERROR', 'Failed to register extension', error)
      }
    }
  }

  /**
   * 注销扩展
   */
  async unregister(extensionId: string): Promise<OperationResult> {
    try {
      const registration = this.extensions.get(extensionId)
      if (!registration) {
        return {
          success: false,
          error: this.createErrorInfo('EXTENSION_NOT_REGISTERED', `Extension ${extensionId} is not registered`)
        }
      }

      // 如果正在运行，先停止
      if (registration.status === 'running') {
        await this.stop(extensionId)
      }

      // 移除注册信息
      this.extensions.delete(extensionId)

      // 触发事件
      this.emit('extension:unregistered', extensionId)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: this.createErrorInfo('EXTENSION_UNREGISTER_ERROR', 'Failed to unregister extension', error)
      }
    }
  }

  /**
   * 启动扩展
   */
  async start(extensionId: string): Promise<OperationResult> {
    try {
      const registration = this.extensions.get(extensionId)
      if (!registration) {
        return {
          success: false,
          error: this.createErrorInfo('EXTENSION_NOT_REGISTERED', `Extension ${extensionId} is not registered`)
        }
      }

      if (registration.status === 'running') {
        return { success: true }
      }

      // 更新状态
      this.updateStatus(extensionId, 'starting')

      // 启动扩展
      if (registration.instance?.start) {
        await registration.instance.start(registration.config)
      }

      // 更新状态和时间
      registration.startedAt = new Date()
      this.updateStatus(extensionId, 'running')

      // 触发事件
      this.emit('extension:started', extensionId, registration.instance!)

      return { success: true }
    } catch (error) {
      // 更新错误状态
      this.updateStatus(extensionId, 'error')
      if (this.extensions.has(extensionId)) {
        this.extensions.get(extensionId)!.error = error instanceof Error ? error : new Error(String(error))
      }

      this.emit('extension:error', extensionId, error instanceof Error ? error : new Error(String(error)))

      return {
        success: false,
        error: this.createErrorInfo('EXTENSION_START_ERROR', 'Failed to start extension', error)
      }
    }
  }

  /**
   * 停止扩展
   */
  async stop(extensionId: string): Promise<OperationResult> {
    try {
      const registration = this.extensions.get(extensionId)
      if (!registration) {
        return {
          success: false,
          error: this.createErrorInfo('EXTENSION_NOT_REGISTERED', `Extension ${extensionId} is not registered`)
        }
      }

      if (registration.status === 'stopped') {
        return { success: true }
      }

      // 更新状态
      this.updateStatus(extensionId, 'stopping')

      // 停止扩展
      if (registration.instance?.stop) {
        await registration.instance.stop(registration.config)
      }

      // 更新状态和时间
      registration.stoppedAt = new Date()
      this.updateStatus(extensionId, 'stopped')

      // 触发事件
      this.emit('extension:stopped', extensionId)

      return { success: true }
    } catch (error) {
      // 更新错误状态
      this.updateStatus(extensionId, 'error')
      if (this.extensions.has(extensionId)) {
        this.extensions.get(extensionId)!.error = error instanceof Error ? error : new Error(String(error))
      }

      this.emit('extension:error', extensionId, error instanceof Error ? error : new Error(String(error)))

      return {
        success: false,
        error: this.createErrorInfo('EXTENSION_STOP_ERROR', 'Failed to stop extension', error)
      }
    }
  }

  /**
   * 更新扩展状态
   */
  private updateStatus(extensionId: string, newStatus: ExtensionStatus): void {
    const registration = this.extensions.get(extensionId)
    if (!registration) {
      return
    }

    const oldStatus = registration.status
    registration.status = newStatus
    
    this.emit('extension:status:changed', extensionId, oldStatus, newStatus)
  }

  /**
   * 获取扩展状态
   */
  getStatus(extensionId: string): ExtensionStatus | undefined {
    return this.extensions.get(extensionId)?.status
  }

  /**
   * 获取扩展实例
   */
  getInstance(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId)?.instance
  }

  /**
   * 获取扩展注册信息
   */
  getRegistration(extensionId: string): ClientExtensionRegistration | undefined {
    return this.extensions.get(extensionId)
  }

  /**
   * 获取所有扩展
   */
  getExtensions(): Map<string, ClientExtensionRegistration> {
    return new Map(this.extensions)
  }

  /**
   * 获取所有扩展ID
   */
  getExtensionIds(): string[] {
    return Array.from(this.extensions.keys())
  }

  /**
   * 检查扩展是否已注册
   */
  hasExtension(extensionId: string): boolean {
    return this.extensions.has(extensionId)
  }

  /**
   * 启动所有扩展
   */
  async startAll(): Promise<OperationResult[]> {
    const results: OperationResult[] = []

    for (const [extensionId, registration] of this.extensions) {
      if (registration.config.enabled) {
        const result = await this.start(extensionId)
        results.push(result)
      }
    }

    return results
  }

  /**
   * 停止所有扩展
   */
  async stopAll(): Promise<OperationResult[]> {
    const results: OperationResult[] = []

    for (const [extensionId] of this.extensions) {
      const result = await this.stop(extensionId)
      results.push(result)
    }

    return results
  }

  /**
   * 清理所有扩展
   */
  async clear(): Promise<void> {
    await this.stopAll()
    this.extensions.clear()
    console.log('[ClientExtensionManager] 所有扩展已清理')
  }
}

// 创建客户端扩展管理器实例
export const clientExtensionManager = new ClientUnifiedExtensionManager()

// 默认导出
export default clientExtensionManager