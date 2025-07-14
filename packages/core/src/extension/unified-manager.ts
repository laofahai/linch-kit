/**
 * 统一的Extension管理器 - 替换Plugin Registry依赖
 * @module extension/unified-manager
 */

import { EventEmitter } from 'eventemitter3'

import type { OperationResult } from '../types/common'

import type {
  Extension,
  ExtensionManager as IExtensionManager,
  ExtensionInstance,
  ExtensionLoadResult,
  ExtensionRegistration,
  ExtensionContext,
  ExtensionConfig,
  ExtensionPermission,
  ExtensionMetadata,
} from './types'
import { permissionManager } from './permission-manager'
import { createSandbox } from './sandbox'
import type { ExtensionSandbox } from './sandbox'

/**
 * Extension实例实现
 */
class ExtensionInstanceImpl implements ExtensionInstance {
  public initialized = false
  public running = false
  private sandbox: ExtensionSandbox

  constructor(
    public name: string,
    public metadata: ExtensionMetadata,
    public context: ExtensionContext,
    private extension: Extension,
    private managerConfig: ExtensionManagerConfig
  ) {
    // 创建沙箱环境
    this.sandbox = createSandbox(context, permissionManager, {
      enabled: managerConfig.enableSandbox,
      allowNetworkAccess: metadata.permissions.includes('api:read'),
      allowFileSystemAccess: metadata.permissions.includes('database:read'),
    })
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      if (this.extension.init) {
        await this.extension.init(this.context.config)
      }
      this.initialized = true
      this.context.logger.info(`Extension ${this.name} initialized`)
    } catch (error) {
      this.context.logger.error(`Failed to initialize extension ${this.name}:`, error)
      throw error
    }
  }

  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
    if (this.running) return

    try {
      if (this.extension.setup) {
        await this.extension.setup(this.context.config)
      }
      if (this.extension.start) {
        await this.extension.start(this.context.config)
      }
      if (this.extension.ready) {
        await this.extension.ready(this.context.config)
      }
      this.running = true
      this.context.logger.info(`Extension ${this.name} started`)
    } catch (error) {
      this.context.logger.error(`Failed to start extension ${this.name}:`, error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return

    try {
      if (this.extension.stop) {
        await this.extension.stop(this.context.config)
      }
      this.running = false
      this.context.logger.info(`Extension ${this.name} stopped`)
    } catch (error) {
      this.context.logger.error(`Failed to stop extension ${this.name}:`, error)
      throw error
    }
  }

  async destroy(): Promise<void> {
    if (this.running) {
      await this.stop()
    }

    try {
      if (this.extension.destroy) {
        await this.extension.destroy(this.context.config)
      }
      this.initialized = false
      this.context.logger.info(`Extension ${this.name} destroyed`)
    } catch (error) {
      this.context.logger.error(`Failed to destroy extension ${this.name}:`, error)
      throw error
    }
  }
}

/**
 * Extension管理器配置
 */
export interface ExtensionManagerConfig {
  /** Extension根目录路径 */
  extensionRoot: string
  /** 是否启用沙箱隔离 */
  enableSandbox: boolean
  /** 允许的权限列表 */
  allowedPermissions?: ExtensionPermission[]
}

/**
 * 统一的Extension管理器实现
 * 整合了Plugin Registry的功能，提供统一的扩展管理
 */
export class UnifiedExtensionManager extends EventEmitter implements IExtensionManager {
  private extensions = new Map<string, ExtensionRegistration>()
  private manifestCache = new Map<string, ExtensionMetadata>()
  private config: ExtensionManagerConfig

  constructor(config?: Partial<ExtensionManagerConfig>) {
    super()
    this.config = {
      extensionRoot: process.cwd() + '/extensions',
      enableSandbox: true,
      allowedPermissions: [
        'api:read',
        'api:write',
        'database:read',
        'database:write',
        'ui:render',
        'system:hooks',
      ] as ExtensionPermission[],
      ...config,
    }
  }

  /**
   * 注册Extension
   */
  async register(extension: Extension, config: ExtensionConfig = {}): Promise<OperationResult> {
    try {
      // 验证Extension元数据
      this.validateExtensionMetadata(extension)

      // 验证Extension生命周期方法
      this.validateExtensionMethods(extension)

      const { id } = extension.metadata

      if (this.extensions.has(id)) {
        return {
          success: false,
          error: { code: 'EXTENSION_ALREADY_REGISTERED', message: `Extension ${id} is already registered` },
        }
      }

      // 合并配置
      const finalConfig = { ...extension.defaultConfig, ...config, enabled: config.enabled ?? true }

      // 创建Extension执行上下文
      const context = this.createExtensionContext(extension.metadata, finalConfig)

      // 创建Extension实例
      const instance = new ExtensionInstanceImpl(
        extension.metadata.name,
        extension.metadata,
        context,
        extension,
        this.config
      )

      const registration: ExtensionRegistration = {
        extension,
        config: finalConfig,
        instance,
        status: 'registered',
        registeredAt: Date.now(),
        lastUpdated: Date.now(),
      }

      this.extensions.set(id, registration)

      this.emit('extensionRegistered', { type: 'extensionRegistered', extension })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * 注销Extension
   */
  async unregister(extensionId: string): Promise<OperationResult> {
    try {
      const registration = this.extensions.get(extensionId)
      if (!registration) {
        return {
          success: false,
          error: { code: 'EXTENSION_NOT_FOUND', message: `Extension ${extensionId} not found` },
        }
      }

      // 检查依赖关系
      const dependents = this.getDependents(extensionId)
      if (dependents.length > 0) {
        return {
          success: false,
          error: {
            code: 'EXTENSION_HAS_DEPENDENTS',
            message: `Cannot unregister ${extensionId}: required by ${dependents.join(', ')}`,
          },
        }
      }

      // 停止Extension
      if (registration.status === 'running') {
        await this.stop(extensionId)
      }

      // 销毁Extension实例
      if (registration.instance) {
        await registration.instance.destroy()
      }

      this.extensions.delete(extensionId)
      this.emit('extensionUnregistered', { extensionId })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNREGISTER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * 启动Extension
   */
  async start(extensionId: string): Promise<OperationResult> {
    try {
      const registration = this.extensions.get(extensionId)
      if (!registration) {
        return {
          success: false,
          error: { code: 'EXTENSION_NOT_FOUND', message: `Extension ${extensionId} not found` },
        }
      }

      if (registration.status === 'running') {
        return { success: true } // 已经在运行
      }

      if (!registration.config.enabled) {
        return {
          success: false,
          error: { code: 'EXTENSION_DISABLED', message: `Extension ${extensionId} is disabled` },
        }
      }

      // 启动依赖
      await this.startDependencies(registration.extension.metadata.dependencies || [])

      // 启动Extension实例
      if (registration.instance) {
        await registration.instance.start()
      }

      registration.status = 'running'
      registration.lastUpdated = Date.now()

      this.emit('extensionStarted', { extensionId, extension: registration.extension })
      return { success: true }
    } catch (error) {
      // 标记为错误状态
      const registration = this.extensions.get(extensionId)
      if (registration) {
        registration.status = 'error'
        registration.error = error instanceof Error ? error : new Error(String(error))
        registration.lastUpdated = Date.now()
      }

      return {
        success: false,
        error: {
          code: 'START_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * 停止Extension
   */
  async stop(extensionId: string): Promise<OperationResult> {
    try {
      const registration = this.extensions.get(extensionId)
      if (!registration) {
        return {
          success: false,
          error: { code: 'EXTENSION_NOT_FOUND', message: `Extension ${extensionId} not found` },
        }
      }

      if (registration.status !== 'running') {
        return { success: true } // 已经停止
      }

      // 停止依赖此Extension的其他Extension
      await this.stopDependents(extensionId)

      // 停止Extension实例
      if (registration.instance) {
        await registration.instance.stop()
      }

      registration.status = 'stopped'
      registration.lastUpdated = Date.now()

      this.emit('extensionStopped', { extensionId, extension: registration.extension })
      return { success: true }
    } catch (error) {
      // 标记为错误状态
      const registration = this.extensions.get(extensionId)
      if (registration) {
        registration.status = 'error'
        registration.error = error instanceof Error ? error : new Error(String(error))
        registration.lastUpdated = Date.now()
      }

      return {
        success: false,
        error: {
          code: 'STOP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * 获取Extension注册信息
   */
  get(extensionId: string): ExtensionRegistration | undefined {
    return this.extensions.get(extensionId)
  }

  /**
   * 获取所有Extension注册信息
   */
  getAll(): ExtensionRegistration[] {
    return Array.from(this.extensions.values())
  }

  /**
   * 检查Extension是否存在
   */
  has(extensionId: string): boolean {
    return this.extensions.has(extensionId)
  }

  /**
   * 获取Extension状态
   */
  getStatus(extensionId: string): string | undefined {
    return this.extensions.get(extensionId)?.status
  }

  /**
   * 启动所有Extension
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
   * 停止所有Extension
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
   * 动态加载Extension
   */
  async loadExtension(extensionName: string): Promise<ExtensionLoadResult> {
    try {
      // 检查是否已加载
      if (this.extensions.has(extensionName)) {
        const registration = this.extensions.get(extensionName)!
        if (registration.status === 'running' && registration.instance) {
          return { success: true, instance: registration.instance }
        }
      }

      // 加载Extension manifest
      const manifest = await this.loadManifest(extensionName)
      if (!manifest) {
        return {
          success: false,
          error: {
            code: 'MANIFEST_NOT_FOUND',
            message: `Extension manifest not found: ${extensionName}`,
          },
        }
      }

      // 验证Extension
      const validationResult = await this.validateExtension(manifest)
      if (!validationResult.success) {
        return validationResult
      }

      // 动态导入Extension代码
      const extensionModule = await this.importExtension(extensionName, manifest)
      if (!extensionModule) {
        return {
          success: false,
          error: {
            code: 'IMPORT_FAILED',
            message: `Failed to import extension: ${extensionName}`,
          },
        }
      }

      // 注册Extension
      const registerResult = await this.register(extensionModule, {})
      if (!registerResult.success) {
        return {
          success: false,
          error: registerResult.error || {
            code: 'REGISTRATION_FAILED',
            message: 'Failed to register extension',
          },
        }
      }

      // 启动Extension
      const startResult = await this.start(extensionModule.metadata.id)
      if (!startResult.success) {
        return {
          success: false,
          error: startResult.error || {
            code: 'START_FAILED',
            message: 'Failed to start extension',
          },
        }
      }

      const instance = this.extensions.get(extensionModule.metadata.id)?.instance
      if (!instance) {
        return {
          success: false,
          error: {
            code: 'INSTANCE_NOT_FOUND',
            message: 'Extension instance not found after registration',
          },
        }
      }

      this.emit('extensionLoaded', { name: extensionName, instance })
      return { success: true, instance }
    } catch (error) {
      const errorResult: ExtensionLoadResult = {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }

      this.emit('extensionError', { name: extensionName, error })
      return errorResult
    }
  }

  /**
   * 动态卸载Extension
   */
  async unloadExtension(extensionName: string): Promise<boolean> {
    try {
      // 尝试通过名称找到Extension ID
      let extensionId: string | undefined
      for (const [id, registration] of this.extensions) {
        if (registration.extension.metadata.name === extensionName) {
          extensionId = id
          break
        }
      }

      if (!extensionId) {
        return false
      }

      const result = await this.unregister(extensionId)
      if (result.success) {
        this.emit('extensionUnloaded', { name: extensionName })
        return true
      }

      return false
    } catch (error) {
      this.emit('extensionError', { name: extensionName, error })
      return false
    }
  }

  /**
   * 热重载Extension
   */
  async reloadExtension(extensionName: string): Promise<ExtensionLoadResult> {
    const wasLoaded = await this.unloadExtension(extensionName)
    if (!wasLoaded) {
      return {
        success: false,
        error: {
          code: 'UNLOAD_FAILED',
          message: `Failed to unload extension for reload: ${extensionName}`,
        },
      }
    }

    // 清除缓存的manifest
    this.manifestCache.delete(extensionName)

    return this.loadExtension(extensionName)
  }

  /**
   * 获取Extension实例
   */
  getExtension(extensionName: string): ExtensionInstance | undefined {
    for (const registration of this.extensions.values()) {
      if (registration.extension.metadata.name === extensionName) {
        return registration.instance
      }
    }
    return undefined
  }

  /**
   * 获取所有Extension实例
   */
  getAllExtensions(): ExtensionInstance[] {
    return Array.from(this.extensions.values())
      .map(reg => reg.instance)
      .filter(Boolean) as ExtensionInstance[]
  }

  /**
   * 检查Extension是否存在
   */
  hasExtension(extensionName: string): boolean {
    for (const registration of this.extensions.values()) {
      if (registration.extension.metadata.name === extensionName) {
        return true
      }
    }
    return false
  }

  /**
   * 获取Extension状态
   */
  getExtensionStatus(extensionName: string): string | undefined {
    for (const registration of this.extensions.values()) {
      if (registration.extension.metadata.name === extensionName) {
        return registration.status
      }
    }
    return undefined
  }

  /**
   * 验证Extension元数据
   */
  private validateExtensionMetadata(extension: Extension): void {
    if (!extension.metadata?.id) {
      throw new Error('Extension ID is required')
    }
    if (!extension.metadata?.name) {
      throw new Error('Extension name is required')
    }
    if (!extension.metadata?.version) {
      throw new Error('Extension version is required')
    }
    if (extension.metadata?.dependencies && !Array.isArray(extension.metadata.dependencies)) {
      throw new Error('Dependencies must be an array')
    }
  }

  /**
   * 验证Extension方法
   */
  private validateExtensionMethods(extension: Extension): void {
    // Extension的init方法是可选的，不强制要求
    if (extension.init && typeof extension.init !== 'function') {
      throw new Error('Extension init method must be a function')
    }
  }

  /**
   * 启动依赖Extension
   */
  private async startDependencies(dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      if (!this.extensions.has(depId)) {
        throw new Error(`Dependency ${depId} not found`)
      }

      // 检查循环依赖
      if (this.hasCircularDependency(depId, dependencies)) {
        throw new Error('Circular dependency detected')
      }

      await this.start(depId)
    }
  }

  /**
   * 停止依赖于此Extension的其他Extension
   */
  private async stopDependents(extensionId: string): Promise<void> {
    for (const [id, registration] of this.extensions) {
      const deps = registration.extension.metadata.dependencies || []
      if (deps.includes(extensionId) && registration.status === 'running') {
        await this.stop(id)
      }
    }
  }

  /**
   * 检查循环依赖
   */
  private hasCircularDependency(extensionId: string, _dependencies: string[]): boolean {
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (id: string): boolean => {
      if (visited.has(id)) return false
      if (visiting.has(id)) return true

      visiting.add(id)

      const extension = this.extensions.get(id)
      if (extension) {
        const deps = extension.extension.metadata.dependencies || []
        for (const depId of deps) {
          if (visit(depId)) return true
        }
      }

      visiting.delete(id)
      visited.add(id)
      return false
    }

    return visit(extensionId)
  }

  /**
   * 获取依赖于指定Extension的Extension列表
   */
  private getDependents(extensionId: string): string[] {
    const dependents: string[] = []

    for (const [id, registration] of this.extensions) {
      const deps = registration.extension.metadata.dependencies || []
      if (deps.includes(extensionId)) {
        dependents.push(id)
      }
    }

    return dependents
  }

  /**
   * 创建Extension执行上下文
   */
  private createExtensionContext(metadata: ExtensionMetadata, config: ExtensionConfig): ExtensionContext {
    return {
      name: metadata.name,
      permissions: metadata.permissions,
      config,
      logger: this.createNamespacedLogger(metadata.name),
      events: this.createEventBus(metadata.name),
      storage: this.createIsolatedStorage(metadata.name),
    }
  }

  /**
   * 加载Extension manifest
   */
  private async loadManifest(extensionName: string): Promise<ExtensionMetadata | null> {
    // 先检查缓存
    if (this.manifestCache.has(extensionName)) {
      return this.manifestCache.get(extensionName)!
    }

    try {
      const { readFile } = await import('node:fs/promises')
      const manifestPath = `${this.config.extensionRoot}/${extensionName}/package.json`
      const manifestContent = await readFile(manifestPath, 'utf-8')
      const packageJson = JSON.parse(manifestContent)

      if (!packageJson.linchkit) {
        return null
      }

      const manifest: ExtensionMetadata = {
        id: packageJson.name,
        name: packageJson.linchkit.displayName || packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        displayName: packageJson.linchkit.displayName,
        capabilities: packageJson.linchkit.capabilities || {},
        category: packageJson.linchkit.category,
        tags: packageJson.linchkit.tags || [],
        permissions: packageJson.linchkit.permissions || [],
        configuration: packageJson.linchkit.configuration,
        entries: packageJson.linchkit.entries,
        dependencies: packageJson.linchkit.dependencies,
      }

      this.manifestCache.set(extensionName, manifest)
      return manifest
    } catch (error) {
      console.warn(`Failed to load manifest for ${extensionName}:`, error)
      return null
    }
  }

  /**
   * 验证Extension
   */
  private async validateExtension(manifest: ExtensionMetadata): Promise<ExtensionLoadResult> {
    // 检查权限
    for (const permission of manifest.permissions) {
      if (!permissionManager.hasPermission(permission)) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Extension requires permission: ${permission}`,
          },
        }
      }
    }

    // 检查依赖
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!permissionManager.isDependencyAvailable(dep)) {
          return {
            success: false,
            error: {
              code: 'DEPENDENCY_MISSING',
              message: `Missing dependency: ${dep}`,
            },
          }
        }
      }
    }

    return { success: true }
  }

  /**
   * 动态导入Extension
   */
  private async importExtension(
    extensionName: string,
    _manifest: ExtensionMetadata
  ): Promise<Extension | null> {
    try {
      const extensionPath = `${this.config.extensionRoot}/${extensionName}/src/index.ts`
      const extensionModule = await import(extensionPath)

      if (extensionModule.default && extensionModule.default.metadata) {
        return extensionModule.default as Extension
      }

      return null
    } catch (error) {
      console.warn(`Failed to import extension ${extensionName}:`, error)
      return null
    }
  }

  /**
   * 创建命名空间日志器
   */
  private createNamespacedLogger(extensionName: string) {
    const prefix = `[Extension:${extensionName}]`
    return {
      debug: (message: string, ...args: unknown[]) => console.debug(prefix, message, ...args),
      info: (message: string, ...args: unknown[]) => console.info(prefix, message, ...args),
      warn: (message: string, ...args: unknown[]) => console.warn(prefix, message, ...args),
      error: (message: string, ...args: unknown[]) => console.error(prefix, message, ...args),
    }
  }

  /**
   * 创建事件总线
   */
  private createEventBus(extensionName: string) {
    const eventEmitter = new EventEmitter()
    const prefix = `extension:${extensionName}:`

    return {
      emit: (event: string, data?: unknown) => {
        eventEmitter.emit(prefix + event, data)
        this.emit('extensionEvent', { extension: extensionName, event, data })
      },
      on: (event: string, handler: (data: unknown) => void) =>
        eventEmitter.on(prefix + event, handler),
      off: (event: string, handler: (data: unknown) => void) =>
        eventEmitter.off(prefix + event, handler),
    }
  }

  /**
   * 创建隔离存储
   */
  private createIsolatedStorage(extensionName: string) {
    const storageKey = `extension:${extensionName}:`

    if (typeof window === 'undefined') {
      // 服务端存储实现
      const serverStorage = new Map<string, unknown>()

      return {
        get: async <T>(key: string): Promise<T | null> => {
          const fullKey = storageKey + key
          return (serverStorage.get(fullKey) as T) || null
        },
        set: async <T>(key: string, value: T): Promise<void> => {
          const fullKey = storageKey + key
          serverStorage.set(fullKey, value)
        },
        delete: async (key: string): Promise<void> => {
          const fullKey = storageKey + key
          serverStorage.delete(fullKey)
        },
        clear: async (): Promise<void> => {
          const keys = Array.from(serverStorage.keys()).filter(k => k.startsWith(storageKey))
          keys.forEach(key => serverStorage.delete(key))
        },
      }
    }

    // 客户端localStorage实现
    return {
      get: async <T>(key: string): Promise<T | null> => {
        try {
          const item = localStorage.getItem(storageKey + key)
          return item ? JSON.parse(item) : null
        } catch {
          return null
        }
      },
      set: async <T>(key: string, value: T): Promise<void> => {
        try {
          localStorage.setItem(storageKey + key, JSON.stringify(value))
        } catch (error) {
          console.warn(`Failed to set storage for ${extensionName}:`, error)
        }
      },
      delete: async (key: string): Promise<void> => {
        localStorage.removeItem(storageKey + key)
      },
      clear: async (): Promise<void> => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(storageKey))
        keys.forEach(key => localStorage.removeItem(key))
      },
    }
  }
}

/**
 * 默认统一Extension管理器实例
 */
export const unifiedExtensionManager = new UnifiedExtensionManager({
  extensionRoot: process.env.EXTENSION_ROOT || process.cwd() + '/extensions',
  enableSandbox: process.env.NODE_ENV === 'production',
})

// 向后兼容的导出
export { unifiedExtensionManager as extensionManager }