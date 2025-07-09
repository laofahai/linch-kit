/**
 * Extension 生命周期管理器
 * @module core/extension-lifecycle
 */

import { EventEmitter } from 'eventemitter3'
import type { ExtensionInstance } from '@linch-kit/core'

import { extensionLoader } from './extension-loader'
import type { ExtensionLoadStatus } from './extension-loader'

/**
 * Extension 生命周期阶段
 */
export type ExtensionLifecyclePhase = 
  | 'loading'
  | 'initializing'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'unloaded'

/**
 * Extension 生命周期事件
 */
export interface ExtensionLifecycleEvent {
  /** Extension 名称 */
  extensionName: string
  /** 当前阶段 */
  phase: ExtensionLifecyclePhase
  /** 上一个阶段 */
  previousPhase?: ExtensionLifecyclePhase
  /** 时间戳 */
  timestamp: number
  /** 阶段耗时 */
  duration?: number
  /** 错误信息 */
  error?: Error
  /** 额外数据 */
  data?: any
}

/**
 * Extension 生命周期状态
 */
export interface ExtensionLifecycleState {
  /** Extension 名称 */
  name: string
  /** 当前阶段 */
  currentPhase: ExtensionLifecyclePhase
  /** 阶段历史 */
  phaseHistory: Array<{
    phase: ExtensionLifecyclePhase
    startTime: number
    endTime?: number
    duration?: number
    error?: Error
  }>
  /** 创建时间 */
  createdAt: number
  /** 最后更新时间 */
  lastUpdated: number
  /** Extension 实例 */
  instance?: ExtensionInstance
}

/**
 * Extension 生命周期管理器
 * 
 * 功能：
 * - 跟踪 Extension 生命周期状态
 * - 管理生命周期转换
 * - 提供生命周期事件监听
 * - 支持生命周期钩子
 */
export class ExtensionLifecycleManager extends EventEmitter {
  private lifecycleStates = new Map<string, ExtensionLifecycleState>()
  private lifecycleHooks = new Map<string, Array<{
    phase: ExtensionLifecyclePhase
    callback: (event: ExtensionLifecycleEvent) => void | Promise<void>
  }>>()

  constructor() {
    super()
    this.setupEventHandlers()
  }

  /**
   * 注册 Extension 生命周期
   */
  registerExtension(extensionName: string, instance?: ExtensionInstance): void {
    const state: ExtensionLifecycleState = {
      name: extensionName,
      currentPhase: 'loading',
      phaseHistory: [{
        phase: 'loading',
        startTime: Date.now()
      }],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      instance
    }

    this.lifecycleStates.set(extensionName, state)
    
    this.emitLifecycleEvent({
      extensionName,
      phase: 'loading',
      timestamp: Date.now()
    })
  }

  /**
   * 更新 Extension 生命周期阶段
   */
  updatePhase(
    extensionName: string,
    newPhase: ExtensionLifecyclePhase,
    data?: any
  ): void {
    const state = this.lifecycleStates.get(extensionName)
    if (!state) {
      console.warn(`Extension ${extensionName} not registered in lifecycle manager`)
      return
    }

    const previousPhase = state.currentPhase
    const now = Date.now()
    
    // 结束当前阶段
    const currentPhaseHistory = state.phaseHistory[state.phaseHistory.length - 1]
    if (currentPhaseHistory && !currentPhaseHistory.endTime) {
      currentPhaseHistory.endTime = now
      currentPhaseHistory.duration = now - currentPhaseHistory.startTime
    }

    // 开始新阶段
    state.phaseHistory.push({
      phase: newPhase,
      startTime: now
    })

    state.currentPhase = newPhase
    state.lastUpdated = now

    // 触发生命周期事件
    const event: ExtensionLifecycleEvent = {
      extensionName,
      phase: newPhase,
      previousPhase,
      timestamp: now,
      duration: currentPhaseHistory?.duration,
      data
    }

    this.emitLifecycleEvent(event)
  }

  /**
   * 设置 Extension 生命周期错误
   */
  setError(extensionName: string, error: Error): void {
    const state = this.lifecycleStates.get(extensionName)
    if (!state) {
      return
    }

    // 标记当前阶段为错误
    const currentPhaseHistory = state.phaseHistory[state.phaseHistory.length - 1]
    if (currentPhaseHistory) {
      currentPhaseHistory.error = error
      currentPhaseHistory.endTime = Date.now()
      currentPhaseHistory.duration = currentPhaseHistory.endTime - currentPhaseHistory.startTime
    }

    // 更新到失败状态
    this.updatePhase(extensionName, 'failed', { error })
  }

  /**
   * 获取 Extension 生命周期状态
   */
  getLifecycleState(extensionName: string): ExtensionLifecycleState | undefined {
    return this.lifecycleStates.get(extensionName)
  }

  /**
   * 获取所有 Extension 生命周期状态
   */
  getAllLifecycleStates(): ExtensionLifecycleState[] {
    return Array.from(this.lifecycleStates.values())
  }

  /**
   * 获取指定阶段的 Extension 列表
   */
  getExtensionsByPhase(phase: ExtensionLifecyclePhase): ExtensionLifecycleState[] {
    return Array.from(this.lifecycleStates.values())
      .filter(state => state.currentPhase === phase)
  }

  /**
   * 添加生命周期钩子
   */
  addLifecycleHook(
    extensionName: string,
    phase: ExtensionLifecyclePhase,
    callback: (event: ExtensionLifecycleEvent) => void | Promise<void>
  ): void {
    const hooks = this.lifecycleHooks.get(extensionName) || []
    hooks.push({ phase, callback })
    this.lifecycleHooks.set(extensionName, hooks)
  }

  /**
   * 移除生命周期钩子
   */
  removeLifecycleHook(
    extensionName: string,
    phase: ExtensionLifecyclePhase,
    callback: (event: ExtensionLifecycleEvent) => void | Promise<void>
  ): void {
    const hooks = this.lifecycleHooks.get(extensionName) || []
    const filteredHooks = hooks.filter(
      hook => hook.phase !== phase || hook.callback !== callback
    )
    this.lifecycleHooks.set(extensionName, filteredHooks)
  }

  /**
   * 获取 Extension 生命周期统计
   */
  getLifecycleStats(extensionName: string): {
    totalTime: number
    phaseStats: Record<ExtensionLifecyclePhase, { count: number, totalTime: number, avgTime: number }>
  } | undefined {
    const state = this.lifecycleStates.get(extensionName)
    if (!state) {
      return undefined
    }

    const phaseStats: Record<string, { count: number, totalTime: number, avgTime: number }> = {}
    let totalTime = 0

    for (const phaseHistory of state.phaseHistory) {
      const phase = phaseHistory.phase
      const duration = phaseHistory.duration || 0
      
      if (!phaseStats[phase]) {
        phaseStats[phase] = { count: 0, totalTime: 0, avgTime: 0 }
      }
      
      phaseStats[phase].count++
      phaseStats[phase].totalTime += duration
      totalTime += duration
    }

    // 计算平均时间
    for (const phase in phaseStats) {
      const stats = phaseStats[phase]
      stats.avgTime = stats.totalTime / stats.count
    }

    return {
      totalTime,
      phaseStats: phaseStats as Record<ExtensionLifecyclePhase, { count: number, totalTime: number, avgTime: number }>
    }
  }

  /**
   * 触发生命周期事件
   */
  private emitLifecycleEvent(event: ExtensionLifecycleEvent): void {
    // 触发全局事件
    this.emit('lifecycleEvent', event)
    this.emit(`phase:${event.phase}`, event)
    this.emit(`extension:${event.extensionName}`, event)

    // 执行钩子
    this.executeLifecycleHooks(event)
  }

  /**
   * 执行生命周期钩子
   */
  private async executeLifecycleHooks(event: ExtensionLifecycleEvent): Promise<void> {
    const hooks = this.lifecycleHooks.get(event.extensionName) || []
    const phaseHooks = hooks.filter(hook => hook.phase === event.phase)

    for (const hook of phaseHooks) {
      try {
        await hook.callback(event)
      } catch (error) {
        console.error(`Lifecycle hook error for ${event.extensionName}:`, error)
        
        // 如果钩子执行失败，触发错误事件
        this.emit('hookError', {
          extensionName: event.extensionName,
          phase: event.phase,
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听 ExtensionLoader 的事件
    extensionLoader.on('extensionLoaded', ({ name, instance }) => {
      if (!this.lifecycleStates.has(name)) {
        this.registerExtension(name, instance)
      }
      this.updatePhase(name, 'running', { instance })
    })

    extensionLoader.on('extensionLoadFailed', ({ name, error }) => {
      if (!this.lifecycleStates.has(name)) {
        this.registerExtension(name)
      }
      this.setError(name, error)
    })

    extensionLoader.on('extensionUnloaded', ({ name }) => {
      this.updatePhase(name, 'unloaded')
    })

    extensionLoader.on('extensionUnloadFailed', ({ name, error }) => {
      this.setError(name, error)
    })

    extensionLoader.on('statusUpdated', ({ name, status }) => {
      if (!this.lifecycleStates.has(name)) {
        this.registerExtension(name)
      }
      
      // 根据加载状态更新生命周期阶段
      switch (status.status) {
        case 'loading':
          this.updatePhase(name, 'loading')
          break
        case 'loaded':
          this.updatePhase(name, 'running')
          break
        case 'failed':
          this.setError(name, status.error || new Error('Unknown error'))
          break
        case 'unloaded':
          this.updatePhase(name, 'unloaded')
          break
      }
    })
  }

  /**
   * 清理 Extension 生命周期状态
   */
  cleanup(extensionName: string): void {
    this.lifecycleStates.delete(extensionName)
    this.lifecycleHooks.delete(extensionName)
  }

  /**
   * 获取生命周期摘要
   */
  getLifecycleSummary(): {
    totalExtensions: number
    phaseDistribution: Record<ExtensionLifecyclePhase, number>
    averageLifetime: number
  } {
    const states = Array.from(this.lifecycleStates.values())
    const phaseDistribution: Record<string, number> = {}
    let totalLifetime = 0

    for (const state of states) {
      // 统计阶段分布
      const phase = state.currentPhase
      phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1
      
      // 计算生命周期总时间
      const lifetime = state.lastUpdated - state.createdAt
      totalLifetime += lifetime
    }

    return {
      totalExtensions: states.length,
      phaseDistribution: phaseDistribution as Record<ExtensionLifecyclePhase, number>,
      averageLifetime: states.length > 0 ? totalLifetime / states.length : 0
    }
  }
}

/**
 * 创建生命周期管理器实例
 */
export function createExtensionLifecycleManager(): ExtensionLifecycleManager {
  return new ExtensionLifecycleManager()
}

/**
 * 默认生命周期管理器实例
 */
export const extensionLifecycleManager = createExtensionLifecycleManager()