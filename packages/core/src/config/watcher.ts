/**
 * 配置文件监听器
 * @description 基于chokidar的配置文件变更监听
 * @module config/watcher
 * @since 0.1.0
 */

import { existsSync } from 'fs'

import chokidar from 'chokidar'
import { EventEmitter } from 'eventemitter3'

import type { TranslationFunction } from '../i18n'
import { useTranslation } from '../i18n'

/**
 * 配置监听选项
 */
export interface ConfigWatchOptions {
  /** 监听的文件路径 */
  paths: string[]
  /** 忽略的文件模式 */
  ignored?: string[]
  /** 是否监听初始文件 */
  ignoreInitial?: boolean
  /** 防抖延迟 (毫秒) */
  debounceDelay?: number
  /** 监听器ID */
  id?: string
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  /** 变更类型 */
  type: 'add' | 'change' | 'unlink'
  /** 文件路径 */
  path: string
  /** 监听器ID */
  watcherId: string
  /** 变更时间 */
  timestamp: Date
}

/**
 * 配置监听器事件
 */
export interface ConfigWatcherEvents {
  'file:added': ConfigChangeEvent
  'file:changed': ConfigChangeEvent
  'file:removed': ConfigChangeEvent
  'watcher:error': { watcherId: string; error: Error }
  'watcher:ready': { watcherId: string; paths: string[] }
}

/**
 * 配置文件监听器
 * @description 基于chokidar的高级配置文件监听器，支持防抖和批量变更
 */
export class ConfigWatcher extends EventEmitter {
  private watchers = new Map<string, chokidar.FSWatcher>()
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private t: TranslationFunction

  constructor(options?: { t?: TranslationFunction }) {
    super()
    this.t = options?.t || useTranslation()
  }

  /**
   * 开始监听配置文件
   * @param options 监听选项
   * @returns 监听器ID
   */
  watch(options: ConfigWatchOptions): string {
    const watcherId = options.id || `watcher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (this.watchers.has(watcherId)) {
      throw new Error(
        this.t('config.watcher.exists', { watcherId })
      )
    }

    const {
      paths,
      ignored = ['**/node_modules/**', '**/.git/**'],
      ignoreInitial = true,
      debounceDelay = 300
    } = options

    // 过滤存在的路径
    const existingPaths = paths.filter(path => {
      if (!existsSync(path)) {
        console.warn(
          this.t('config.watcher.path.not.found', { path })
        )
        return false
      }
      return true
    })

    if (existingPaths.length === 0) {
      throw new Error(
        this.t('config.watcher.no.valid.paths')
      )
    }

    // 创建chokidar监听器
    const watcher = chokidar.watch(existingPaths, {
      ignored,
      ignoreInitial,
      persistent: true,
      usePolling: false, // 使用原生事件
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    })

    // 设置事件监听
    this.setupWatcherEvents(watcher, watcherId, debounceDelay)

    // 存储监听器
    this.watchers.set(watcherId, watcher)

    return watcherId
  }

  /**
   * 停止监听
   * @param watcherId 监听器ID
   * @returns 是否成功停止
   */
  async unwatch(watcherId: string): Promise<boolean> {
    const watcher = this.watchers.get(watcherId)
    if (!watcher) {
      return false
    }

    try {
      // 清除防抖定时器
      const timer = this.debounceTimers.get(watcherId)
      if (timer) {
        clearTimeout(timer)
        this.debounceTimers.delete(watcherId)
      }

      // 关闭监听器
      await watcher.close()
      this.watchers.delete(watcherId)
      
      return true
    } catch (error) {
      this.emit('watcher:error', {
        watcherId,
        error: error instanceof Error ? error : new Error(String(error))
      })
      return false
    }
  }

  /**
   * 停止所有监听
   */
  async unwatchAll(): Promise<void> {
    const watcherIds = Array.from(this.watchers.keys())
    await Promise.all(
      watcherIds.map(id => this.unwatch(id))
    )
  }

  /**
   * 获取所有监听器
   * @returns 监听器ID列表
   */
  getWatchers(): string[] {
    return Array.from(this.watchers.keys())
  }

  /**
   * 检查监听器是否存在
   * @param watcherId 监听器ID
   */
  hasWatcher(watcherId: string): boolean {
    return this.watchers.has(watcherId)
  }

  /**
   * 获取监听器信息
   * @param watcherId 监听器ID
   * @returns 监听器信息
   */
  getWatcherInfo(watcherId: string): {
    paths: string[]
    isReady: boolean
  } | undefined {
    const watcher = this.watchers.get(watcherId)
    if (!watcher) {
      return undefined
    }

    const watched = watcher.getWatched()
    const paths: string[] = []
    
    for (const [dir, files] of Object.entries(watched)) {
      for (const file of files) {
        paths.push(`${dir}/${file}`)
      }
    }

    return {
      paths,
      isReady: watcher.options.ignoreInitial ? true : false // 简化的就绪状态
    }
  }

  /**
   * 设置监听器事件
   * @private
   */
  private setupWatcherEvents(
    watcher: chokidar.FSWatcher,
    watcherId: string,
    debounceDelay: number
  ): void {
    // 文件添加事件
    watcher.on('add', (path) => {
      this.handleFileEvent('add', path, watcherId, debounceDelay)
    })

    // 文件变更事件
    watcher.on('change', (path) => {
      this.handleFileEvent('change', path, watcherId, debounceDelay)
    })

    // 文件删除事件
    watcher.on('unlink', (path) => {
      this.handleFileEvent('unlink', path, watcherId, debounceDelay)
    })

    // 监听器就绪事件
    watcher.on('ready', () => {
      const watchedPaths = Object.keys(watcher.getWatched())
      this.emit('watcher:ready', { watcherId, paths: watchedPaths })
    })

    // 错误事件
    watcher.on('error', (error) => {
      this.emit('watcher:error', { watcherId, error })
    })
  }

  /**
   * 处理文件事件 (支持防抖)
   * @private
   */
  private handleFileEvent(
    type: 'add' | 'change' | 'unlink',
    path: string,
    watcherId: string,
    debounceDelay: number
  ): void {
    const debounceKey = `${watcherId}:${path}`
    
    // 清除之前的定时器
    const existingTimer = this.debounceTimers.get(debounceKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      const event: ConfigChangeEvent = {
        type,
        path,
        watcherId,
        timestamp: new Date()
      }

      // 发送对应的事件
      switch (type) {
        case 'add':
          this.emit('file:added', event)
          break
        case 'change':
          this.emit('file:changed', event)
          break
        case 'unlink':
          this.emit('file:removed', event)
          break
      }

      // 清理定时器
      this.debounceTimers.delete(debounceKey)
    }, debounceDelay)

    this.debounceTimers.set(debounceKey, timer)
  }

  /**
   * 批量添加监听路径
   * @param watcherId 监听器ID
   * @param paths 路径列表
   */
  addPaths(watcherId: string, paths: string[]): void {
    const watcher = this.watchers.get(watcherId)
    if (!watcher) {
      throw new Error(
        this.t('config.watcher.not.found', { watcherId })
      )
    }

    const existingPaths = paths.filter(existsSync)
    if (existingPaths.length > 0) {
      watcher.add(existingPaths)
    }
  }

  /**
   * 批量移除监听路径
   * @param watcherId 监听器ID
   * @param paths 路径列表
   */
  removePaths(watcherId: string, paths: string[]): void {
    const watcher = this.watchers.get(watcherId)
    if (!watcher) {
      throw new Error(
        this.t('config.watcher.not.found', { watcherId })
      )
    }

    watcher.unwatch(paths)
  }
}

/**
 * 创建配置监听器
 * @description 创建基于chokidar的配置文件监听器
 * @param options 配置选项
 * @returns 配置监听器实例
 * @example
 * ```typescript
 * import { createConfigWatcher } from '@linch-kit/core'
 * 
 * const watcher = createConfigWatcher()
 * 
 * // 监听配置文件
 * const watcherId = watcher.watch({
 *   paths: ['./config.json', './.env'],
 *   debounceDelay: 500
 * })
 * 
 * // 监听变更事件
 * watcher.on('file:changed', (event) => {
 *   console.log(`配置文件 ${event.path} 已变更`)
 *   // 重新加载配置
 * })
 * ```
 * @since 0.1.0
 */
export function createConfigWatcher(options?: {
  t?: TranslationFunction
}): ConfigWatcher {
  return new ConfigWatcher(options)
}

/**
 * 创建简单的配置文件监听器
 * @description 创建一个预配置的简单监听器，适合快速开始
 * @param paths 监听路径
 * @param callback 变更回调
 * @param options 监听选项
 * @returns 监听器ID和取消函数
 * @example
 * ```typescript
 * import { createSimpleConfigWatcher } from '@linch-kit/core'
 * 
 * const { watcherId, unwatch } = createSimpleConfigWatcher(
 *   ['./config.json'],
 *   (event) => {
 *     console.log('配置已变更:', event.path)
 *   }
 * )
 * 
 * // 稍后取消监听
 * await unwatch()
 * ```
 * @since 0.1.0
 */
export function createSimpleConfigWatcher(
  paths: string[],
  callback: (event: ConfigChangeEvent) => void,
  options?: Partial<ConfigWatchOptions>
): {
  watcherId: string
  unwatch: () => Promise<void>
} {
  const watcher = createConfigWatcher()
  
  const watcherId = watcher.watch({
    paths,
    ...options
  })

  // 监听所有变更事件
  const eventTypes: Array<keyof ConfigWatcherEvents> = [
    'file:added',
    'file:changed', 
    'file:removed'
  ]

  eventTypes.forEach(eventType => {
    watcher.on(eventType, callback)
  })

  return {
    watcherId,
    unwatch: async () => {
      await watcher.unwatch(watcherId)
    }
  }
}