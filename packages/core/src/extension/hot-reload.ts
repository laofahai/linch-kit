/**
 * Extension热重载管理
 * @module extension/hot-reload
 */

import { EventEmitter } from 'eventemitter3'
import { watch } from 'chokidar'
// @ts-ignore - lodash-es types not needed for build
import { debounce } from 'lodash-es'

import type { ExtensionManager } from './manager'

export interface HotReloadConfig {
  /** 是否启用热重载 */
  enabled: boolean
  /** Extension根目录路径 */
  extensionRoot: string
  /** 监听的文件扩展名 */
  watchExtensions: string[]
  /** 防抖延迟时间(ms) */
  debounceMs: number
  /** 排除的文件模式 */
  excludePatterns: string[]
}

export interface HotReloadEvent {
  type: 'reloading' | 'reloaded' | 'error'
  extensionName: string
  timestamp: number
  error?: Error
}

/**
 * Extension热重载管理器
 */
export class HotReloadManager extends EventEmitter {
  private watchers = new Map<string, ReturnType<typeof watch>>()
  private reloadQueue = new Set<string>()
  private isReloading = false

  constructor(
    private extensionManager: ExtensionManager,
    private config: HotReloadConfig = {
      enabled: true,
      extensionRoot: process.env.EXTENSION_ROOT || process.cwd() + '/extensions',
      watchExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      debounceMs: 300,
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
    }
  ) {
    super()
  }

  /**
   * 启用热重载
   */
  enable(): void {
    if (!this.config.enabled) return

    // 为所有已加载的Extension启用热重载
    const extensions = this.extensionManager.getAllExtensions()
    extensions.forEach(ext => this.enableForExtension(ext.name))

    // 监听Extension管理器事件
    this.extensionManager.on('extensionLoaded', ({ name }) => {
      this.enableForExtension(name)
    })

    this.extensionManager.on('extensionUnloaded', ({ name }) => {
      this.disableForExtension(name)
    })
  }

  /**
   * 禁用热重载
   */
  disable(): void {
    // 停止所有文件监听
    this.watchers.forEach(watcher => watcher.close())
    this.watchers.clear()
    this.reloadQueue.clear()
  }

  /**
   * 为特定Extension启用热重载
   */
  enableForExtension(extensionName: string): void {
    if (!this.config.enabled) return

    const extensionPath = `${this.config.extensionRoot}/${extensionName}`

    // 创建文件监听器
    const watcher = watch(extensionPath, {
      ignored: this.config.excludePatterns.map(pattern => `**/${pattern}/**`),
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    })

    // 防抖的重载函数
    const debouncedReload = debounce(
      () => this.reloadExtension(extensionName),
      this.config.debounceMs
    )

    // 监听文件变化
    watcher.on('change', filePath => {
      if (this.shouldReload(filePath)) {
        console.info(`[HotReload] File changed: ${filePath}`)
        debouncedReload()
      }
    })

    watcher.on('add', filePath => {
      if (this.shouldReload(filePath)) {
        console.info(`[HotReload] File added: ${filePath}`)
        debouncedReload()
      }
    })

    watcher.on('unlink', filePath => {
      if (this.shouldReload(filePath)) {
        console.info(`[HotReload] File removed: ${filePath}`)
        debouncedReload()
      }
    })

    watcher.on('error', error => {
      console.error(`[HotReload] Watcher error for ${extensionName}:`, error)
    })

    this.watchers.set(extensionName, watcher)
    console.info(`[HotReload] Enabled for extension: ${extensionName}`)
  }

  /**
   * 为特定Extension禁用热重载
   */
  disableForExtension(extensionName: string): void {
    const watcher = this.watchers.get(extensionName)
    if (watcher) {
      watcher.close()
      this.watchers.delete(extensionName)
      console.info(`[HotReload] Disabled for extension: ${extensionName}`)
    }
  }

  /**
   * 执行Extension重载
   */
  private async reloadExtension(extensionName: string): Promise<void> {
    if (this.isReloading) {
      // 如果正在重载，加入队列
      this.reloadQueue.add(extensionName)
      return
    }

    this.isReloading = true

    try {
      this.emit('reloading', {
        type: 'reloading',
        extensionName,
        timestamp: Date.now(),
      } as HotReloadEvent)

      console.info(`[HotReload] Reloading extension: ${extensionName}`)

      // 清除模块缓存
      await this.clearModuleCache(extensionName)

      // 执行热重载
      const result = await this.extensionManager.reloadExtension(extensionName)

      if (result.success) {
        this.emit('reloaded', {
          type: 'reloaded',
          extensionName,
          timestamp: Date.now(),
        } as HotReloadEvent)

        console.info(`[HotReload] Successfully reloaded extension: ${extensionName}`)
      } else {
        throw new Error(result.error?.message || 'Unknown reload error')
      }
    } catch (error) {
      const reloadError = error instanceof Error ? error : new Error(String(error))

      this.emit('error', {
        type: 'error',
        extensionName,
        timestamp: Date.now(),
        error: reloadError,
      } as HotReloadEvent)

      console.error(`[HotReload] Failed to reload extension ${extensionName}:`, reloadError)
    } finally {
      this.isReloading = false

      // 处理队列中的重载请求
      if (this.reloadQueue.size > 0) {
        const nextExtension = this.reloadQueue.values().next().value as string
        this.reloadQueue.delete(nextExtension)
        // 异步处理，避免阻塞
        setTimeout(() => this.reloadExtension(nextExtension), 100)
      }
    }
  }

  /**
   * 清除模块缓存
   */
  private async clearModuleCache(extensionName: string): Promise<void> {
    const extensionPath = `${this.config.extensionRoot}/${extensionName}`

    // 清除Node.js模块缓存
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(extensionPath)) {
        delete require.cache[key]
      }
    })

    // 清除动态导入缓存（如果支持）
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).importCache) {
      Object.keys(
        (globalThis as Record<string, unknown>).importCache as Record<string, unknown>
      ).forEach(key => {
        if (key.startsWith(extensionPath)) {
          delete ((globalThis as Record<string, unknown>).importCache as Record<string, unknown>)[
            key
          ]
        }
      })
    }
  }

  /**
   * 检查文件是否应该触发重载
   */
  private shouldReload(filePath: string): boolean {
    const extension = filePath.split('.').pop()
    return this.config.watchExtensions.includes(`.${extension}`)
  }

  /**
   * 获取热重载状态
   */
  getStatus(): {
    enabled: boolean
    watchingExtensions: string[]
    isReloading: boolean
    queueSize: number
  } {
    return {
      enabled: this.config.enabled,
      watchingExtensions: Array.from(this.watchers.keys()),
      isReloading: this.isReloading,
      queueSize: this.reloadQueue.size,
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<HotReloadConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (!this.config.enabled) {
      this.disable()
    } else {
      // 重新启用热重载
      this.disable()
      this.enable()
    }
  }
}

/**
 * 创建热重载管理器实例
 */
export function createHotReloadManager(
  extensionManager: ExtensionManager,
  config?: Partial<HotReloadConfig>
): HotReloadManager {
  const fullConfig: HotReloadConfig = {
    enabled: true,
    extensionRoot: process.cwd() + '/extensions',
    watchExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    debounceMs: 300,
    excludePatterns: ['node_modules', '.git', 'dist', 'build'],
    ...config,
  }
  return new HotReloadManager(extensionManager, fullConfig)
}
