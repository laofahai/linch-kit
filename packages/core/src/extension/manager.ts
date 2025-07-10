/**
 * Extension管理器实现
 * @module extension/manager
 */

import { EventEmitter } from 'eventemitter3'

import { pluginRegistry } from '../plugin/registry'

// import { appRegistry } from '../../console/src/core/app-registry' // TODO: 修复导入路径
import { permissionManager } from './permission-manager'
import { createSandbox } from './sandbox'
import type {
  Extension,
  ExtensionManager as IExtensionManager,
  ExtensionInstance,
  ExtensionLoadResult,
  ExtensionRegistration,
  ExtensionContext,
  ExtensionPermission,
} from './types'
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
    public metadata: Extension['metadata'],
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
      if (this.extension.start) {
        await this.extension.start(this.context.config)
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
  allowedPermissions: ExtensionPermission[]
}

/**
 * Extension管理器实现
 * 基于现有Plugin系统，扩展支持Extension动态加载、权限验证等
 */
export class ExtensionManager extends EventEmitter implements IExtensionManager {
  private extensions = new Map<string, ExtensionRegistration>()
  private manifestCache = new Map<string, Extension['metadata']>()
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
   * 加载Extension
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

      // 验证权限和依赖
      const validationResult = await this.validateExtension(manifest)
      if (!validationResult.success) {
        return validationResult
      }

      // 授权Extension权限
      const permissionResult = await permissionManager.grantExtensionPermissions(
        extensionName,
        manifest,
        { autoGrant: true }
      )

      if (permissionResult.denied.length > 0) {
        return {
          success: false,
          error: {
            code: 'PERMISSIONS_DENIED',
            message: `Extension requires denied permissions: ${permissionResult.denied.join(', ')}`,
          },
        }
      }

      // 创建Extension执行上下文
      const context = this.createExtensionContext(manifest)

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

      // 创建Extension实例
      const instance = new ExtensionInstanceImpl(
        extensionName,
        manifest,
        context,
        extensionModule,
        this.config
      )

      // 注册到Plugin系统
      const pluginResult = await pluginRegistry.register(extensionModule, context.config)
      if (!pluginResult.success) {
        return {
          success: false,
          error: pluginResult.error || {
            code: 'PLUGIN_REGISTRATION_FAILED',
            message: 'Failed to register extension as plugin',
          },
        }
      }

      // 注册Extension
      const registration: ExtensionRegistration = {
        extension: extensionModule,
        config: context.config,
        instance,
        status: 'loaded',
        registeredAt: Date.now(),
        lastUpdated: Date.now(),
      }

      this.extensions.set(extensionName, registration)

      // 加载Extension能力
      await this.loadExtensionCapabilities(extensionName, manifest, registration)

      // 启动Extension
      await instance.start()
      registration.status = 'running'
      registration.lastUpdated = Date.now()

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

      // 记录错误状态
      const registration = this.extensions.get(extensionName)
      if (registration) {
        registration.status = 'error'
        registration.error = error instanceof Error ? error : new Error(String(error))
        registration.lastUpdated = Date.now()
      }

      this.emit('extensionError', { name: extensionName, error })
      return errorResult
    }
  }

  /**
   * 卸载Extension
   */
  async unloadExtension(extensionName: string): Promise<boolean> {
    try {
      const registration = this.extensions.get(extensionName)
      if (!registration) {
        return false
      }

      // 停止Extension实例
      if (registration.instance && registration.instance.running) {
        await registration.instance.destroy()
      }

      // 从Plugin系统卸载
      await pluginRegistry.unregister(extensionName)

      // 清理AppRegistry中的资源
      await this.cleanupExtensionResources(extensionName, registration)

      // 移除注册信息
      this.extensions.delete(extensionName)

      this.emit('extensionUnloaded', { name: extensionName })
      return true
    } catch (error) {
      this.emit('extensionError', { name: extensionName, error })
      return false
    }
  }

  /**
   * 热重载Extension
   */
  async reloadExtension(extensionName: string): Promise<ExtensionLoadResult> {
    const wasLoaded = this.extensions.has(extensionName)

    if (wasLoaded) {
      const unloaded = await this.unloadExtension(extensionName)
      if (!unloaded) {
        return {
          success: false,
          error: {
            code: 'UNLOAD_FAILED',
            message: `Failed to unload extension for reload: ${extensionName}`,
          },
        }
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
    return this.extensions.get(extensionName)?.instance
  }

  /**
   * 获取所有Extension
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
    return this.extensions.has(extensionName)
  }

  /**
   * 获取Extension状态
   */
  getExtensionStatus(extensionName: string): string | undefined {
    return this.extensions.get(extensionName)?.status
  }

  /**
   * 文件读取器（可用于测试mock）
   */
  private fileReader = async (path: string): Promise<string> => {
    const { readFile } = await import('node:fs/promises')
    return readFile(path, 'utf-8')
  }

  /**
   * 设置文件读取器（用于测试）
   */
  public setFileReader(reader: (path: string) => Promise<string>): void {
    this.fileReader = reader
  }

  /**
   * 加载Extension manifest
   */
  private async loadManifest(extensionName: string): Promise<Extension['metadata'] | null> {
    // 先检查缓存
    if (this.manifestCache.has(extensionName)) {
      return this.manifestCache.get(extensionName)!
    }

    try {
      // 尝试从extensions目录加载
      const manifestPath = `${this.config.extensionRoot}/${extensionName}/package.json`
      const manifestContent = await this.fileReader(manifestPath)
      const packageJson = JSON.parse(manifestContent)

      if (!packageJson.linchkit) {
        return null
      }

      // 转换package.json格式到Extension metadata
      const manifest: Extension['metadata'] = {
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
  private async validateExtension(manifest: Extension['metadata']): Promise<ExtensionLoadResult> {
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

    // 检查依赖版本
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
   * 创建Extension执行上下文
   */
  private createExtensionContext(manifest: Extension['metadata']): ExtensionContext {
    return {
      name: manifest.name,
      permissions: manifest.permissions,
      config: { ...manifest.configuration, enabled: true },
      logger: this.createNamespacedLogger(manifest.name),
      events: this.createEventBus(manifest.name),
      storage: this.createIsolatedStorage(manifest.name),
    }
  }

  /**
   * 动态导入Extension
   */
  private async importExtension(
    extensionName: string,
    _manifest: Extension['metadata']
  ): Promise<Extension | null> {
    try {
      // 尝试导入Extension主入口
      const extensionPath = `${this.config.extensionRoot}/${extensionName}/src/index.ts`
      const extensionModule = await import(extensionPath)

      // 检查是否为有效的Extension
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
   * 设置模块导入器（用于测试）
   */
  public setModuleImporter(importer: (path: string) => Promise<{ default: Extension }>): void {
    this.importExtension = async (extensionName: string) => {
      try {
        const extensionPath = `${this.config.extensionRoot}/${extensionName}/src/index.ts`
        const extensionModule = await importer(extensionPath)
        return extensionModule.default
      } catch (error) {
        console.warn(`Failed to import extension ${extensionName}:`, error)
        return null
      }
    }
  }

  /**
   * 加载Extension能力
   */
  private async loadExtensionCapabilities(
    extensionName: string,
    manifest: Extension['metadata'],
    _registration: ExtensionRegistration
  ): Promise<void> {
    const { capabilities } = manifest

    try {
      // 加载Schema能力
      if (capabilities.hasSchema && manifest.entries?.schema) {
        const schemaModule = await import(
          `${this.config.extensionRoot}/${extensionName}/src/${manifest.entries.schema}`
        )
        if (schemaModule.default) {
          // TODO: 注册Schema到AppRegistry
          console.info(`Schema loaded for extension ${extensionName}`)
        }
      }

      // 加载API能力
      if (capabilities.hasAPI && manifest.entries?.api) {
        const apiModule = await import(
          `${this.config.extensionRoot}/${extensionName}/src/${manifest.entries.api}`
        )
        if (apiModule.default) {
          // TODO: 注册API路由到AppRegistry
          console.info(`API routes loaded for extension ${extensionName}`)
        }
      }

      // 加载UI组件能力
      if (capabilities.hasUI && manifest.entries?.components) {
        // UI组件延迟加载，创建加载器
        const _componentLoader = () =>
          import(
            `${this.config.extensionRoot}/${extensionName}/src/${manifest.entries?.components}`
          )

        // TODO: 注册组件加载器到AppRegistry
        console.info(`UI components loaded for extension ${extensionName}`)
      }

      // 加载钩子能力
      if (capabilities.hasHooks && manifest.entries?.hooks) {
        const hooksModule = await import(
          `${this.config.extensionRoot}/${extensionName}/src/${manifest.entries.hooks}`
        )
        if (hooksModule.default) {
          // TODO: 注册钩子到事件系统
          console.info(`Hooks loaded for extension ${extensionName}`)
        }
      }
    } catch (error) {
      console.warn(`Failed to load capabilities for ${extensionName}:`, error)
      // 不抛出错误，允许部分能力加载失败
    }
  }

  /**
   * 清理Extension资源
   */
  private async cleanupExtensionResources(
    _extensionName: string,
    _registration: ExtensionRegistration
  ): Promise<void> {
    // TODO: 从AppRegistry清理Extension注册的资源
    // 这需要扩展AppRegistry支持按Extension名称清理
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

    // 服务端环境不支持localStorage，需要使用替代方案
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
 * 默认Extension管理器实例
 */
export const extensionManager = new ExtensionManager({
  extensionRoot: process.env.EXTENSION_ROOT || process.cwd() + '/extensions',
  enableSandbox: process.env.NODE_ENV === 'production',
})
