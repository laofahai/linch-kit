/**
 * Extension状态管理
 * @module extension/state-manager
 */

import { EventEmitter } from 'eventemitter3'

import type { ExtensionRegistration } from './types'

export interface ExtensionState {
  /** Extension名称 */
  name: string
  /** 当前状态 */
  status: ExtensionRegistration['status']
  /** 状态更新时间 */
  lastUpdated: number
  /** 启动时间 */
  startedAt?: number
  /** 停止时间 */
  stoppedAt?: number
  /** 错误信息 */
  error?: Error
  /** 性能指标 */
  metrics: ExtensionMetrics
  /** 健康状态 */
  health: ExtensionHealth
}

export interface ExtensionMetrics {
  /** 初始化耗时(ms) */
  initializationTime: number
  /** 启动耗时(ms) */
  startupTime: number
  /** 内存使用量(bytes) */
  memoryUsage: number
  /** CPU使用率(%) */
  cpuUsage: number
  /** 活跃连接数 */
  activeConnections: number
  /** 处理的请求数 */
  requestCount: number
  /** 错误次数 */
  errorCount: number
  /** 最后活跃时间 */
  lastActivity: number
}

export interface ExtensionHealth {
  /** 健康评分 (0-100) */
  score: number
  /** 健康状态 */
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  /** 检查项结果 */
  checks: HealthCheck[]
  /** 最后检查时间 */
  lastCheckTime: number
}

export interface HealthCheck {
  /** 检查名称 */
  name: string
  /** 检查状态 */
  status: 'pass' | 'fail' | 'warn'
  /** 检查消息 */
  message: string
  /** 检查时间 */
  timestamp: number
  /** 检查耗时(ms) */
  duration: number
}

export interface StateUpdateEvent {
  type: 'status_changed' | 'metrics_updated' | 'health_updated' | 'error_occurred'
  extensionName: string
  oldState?: Partial<ExtensionState>
  newState: ExtensionState
  timestamp: number
}

/**
 * Extension状态管理器
 */
export class ExtensionStateManager extends EventEmitter {
  private states = new Map<string, ExtensionState>()
  private healthCheckInterval?: NodeJS.Timeout
  private metricsInterval?: NodeJS.Timeout

  constructor(
    private config: {
      /** 健康检查间隔(ms) */
      healthCheckInterval: number
      /** 指标收集间隔(ms) */
      metricsInterval: number
      /** 是否启用自动健康检查 */
      enableAutoHealthCheck: boolean
    } = {
      healthCheckInterval: 30000, // 30秒
      metricsInterval: 5000, // 5秒
      enableAutoHealthCheck: true,
    }
  ) {
    super()
    this.startPeriodicTasks()
  }

  /**
   * 注册Extension状态
   */
  register(extensionName: string, registration: ExtensionRegistration): void {
    const state: ExtensionState = {
      name: extensionName,
      status: registration.status,
      lastUpdated: Date.now(),
      metrics: this.createInitialMetrics(),
      health: this.createInitialHealth(),
    }

    this.states.set(extensionName, state)
    this.emit('registered', { extensionName, state })
  }

  /**
   * 更新Extension状态
   */
  updateStatus(
    extensionName: string,
    newStatus: ExtensionRegistration['status'],
    error?: Error
  ): void {
    const state = this.states.get(extensionName)
    if (!state) return

    const oldState = { ...state }
    const now = Date.now()

    state.status = newStatus
    state.lastUpdated = now
    state.error = error

    // 更新时间戳
    if (newStatus === 'running' && oldState.status !== 'running') {
      state.startedAt = now
    } else if (newStatus === 'stopped' && oldState.status === 'running') {
      state.stoppedAt = now
    }

    // 更新错误计数
    if (error) {
      state.metrics.errorCount++
    }

    this.states.set(extensionName, state)
    this.emitStateUpdate('status_changed', extensionName, oldState, state)
  }

  /**
   * 更新Extension指标
   */
  updateMetrics(extensionName: string, metrics: Partial<ExtensionMetrics>): void {
    const state = this.states.get(extensionName)
    if (!state) return

    const oldState = { ...state }
    state.metrics = { ...state.metrics, ...metrics }
    state.lastUpdated = Date.now()

    this.states.set(extensionName, state)
    this.emitStateUpdate('metrics_updated', extensionName, oldState, state)
  }

  /**
   * 更新Extension健康状态
   */
  updateHealth(extensionName: string, health: Partial<ExtensionHealth>): void {
    const state = this.states.get(extensionName)
    if (!state) return

    const oldState = { ...state }
    state.health = { ...state.health, ...health }
    state.lastUpdated = Date.now()

    this.states.set(extensionName, state)
    this.emitStateUpdate('health_updated', extensionName, oldState, state)
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(extensionName: string): Promise<ExtensionHealth> {
    const state = this.states.get(extensionName)
    if (!state) {
      throw new Error(`Extension ${extensionName} not registered`)
    }

    const checks: HealthCheck[] = []

    // 状态检查
    checks.push(await this.checkStatus(extensionName, state))

    // 内存检查
    checks.push(await this.checkMemoryUsage(extensionName, state))

    // 响应时间检查
    checks.push(await this.checkResponseTime(extensionName, state))

    // 错误率检查
    checks.push(await this.checkErrorRate(extensionName, state))

    // 计算健康评分
    const passedChecks = checks.filter(check => check.status === 'pass').length
    const warningChecks = checks.filter(check => check.status === 'warn').length
    const failedChecks = checks.filter(check => check.status === 'fail').length

    const score = Math.round(
      (passedChecks * 100 + warningChecks * 50 + failedChecks * 0) / checks.length
    )

    // 确定健康状态
    let healthStatus: ExtensionHealth['status'] = 'healthy'
    if (score < 50) {
      healthStatus = 'critical'
    } else if (score < 80) {
      healthStatus = 'warning'
    } else if (failedChecks > 0) {
      healthStatus = 'warning'
    }

    const health: ExtensionHealth = {
      score,
      status: healthStatus,
      checks,
      lastCheckTime: Date.now(),
    }

    this.updateHealth(extensionName, health)
    return health
  }

  /**
   * 获取Extension状态
   */
  getState(extensionName: string): ExtensionState | undefined {
    return this.states.get(extensionName)
  }

  /**
   * 获取所有Extension状态
   */
  getAllStates(): ExtensionState[] {
    return Array.from(this.states.values())
  }

  /**
   * 获取运行中的Extension
   */
  getRunningExtensions(): ExtensionState[] {
    return Array.from(this.states.values()).filter(state => state.status === 'running')
  }

  /**
   * 获取有问题的Extension
   */
  getUnhealthyExtensions(): ExtensionState[] {
    return Array.from(this.states.values()).filter(
      state => state.health.status === 'warning' || state.health.status === 'critical'
    )
  }

  /**
   * 注销Extension状态
   */
  unregister(extensionName: string): void {
    this.states.delete(extensionName)
    this.emit('unregistered', { extensionName })
  }

  /**
   * 销毁状态管理器
   */
  destroy(): void {
    this.stopPeriodicTasks()
    this.states.clear()
    this.removeAllListeners()
  }

  /**
   * 启动周期性任务
   */
  private startPeriodicTasks(): void {
    if (this.config.enableAutoHealthCheck) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthChecksForAll()
      }, this.config.healthCheckInterval)
    }

    this.metricsInterval = setInterval(() => {
      this.collectMetricsForAll()
    }, this.config.metricsInterval)
  }

  /**
   * 停止周期性任务
   */
  private stopPeriodicTasks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = undefined
    }
  }

  /**
   * 为所有Extension执行健康检查
   */
  private async performHealthChecksForAll(): Promise<void> {
    const runningExtensions = this.getRunningExtensions()
    const checkPromises = runningExtensions.map(state =>
      this.performHealthCheck(state.name).catch(error => {
        console.error(`Health check failed for ${state.name}:`, error)
      })
    )

    await Promise.all(checkPromises)
  }

  /**
   * 为所有Extension收集指标
   */
  private collectMetricsForAll(): void {
    const runningExtensions = this.getRunningExtensions()

    runningExtensions.forEach(state => {
      // 模拟指标收集
      const metrics: Partial<ExtensionMetrics> = {
        memoryUsage: this.getMemoryUsage(state.name),
        cpuUsage: this.getCpuUsage(state.name),
        lastActivity: Date.now(),
      }

      this.updateMetrics(state.name, metrics)
    })
  }

  /**
   * 创建初始指标
   */
  private createInitialMetrics(): ExtensionMetrics {
    return {
      initializationTime: 0,
      startupTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      requestCount: 0,
      errorCount: 0,
      lastActivity: Date.now(),
    }
  }

  /**
   * 创建初始健康状态
   */
  private createInitialHealth(): ExtensionHealth {
    return {
      score: 100,
      status: 'unknown',
      checks: [],
      lastCheckTime: Date.now(),
    }
  }

  /**
   * 状态检查
   */
  private async checkStatus(extensionName: string, state: ExtensionState): Promise<HealthCheck> {
    const start = Date.now()

    let status: HealthCheck['status'] = 'pass'
    let message = 'Extension is running normally'

    if (state.status === 'error') {
      status = 'fail'
      message = 'Extension is in error state'
    } else if (state.status !== 'running') {
      status = 'warn'
      message = `Extension is ${state.status}`
    }

    return {
      name: 'status',
      status,
      message,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  }

  /**
   * 内存使用检查
   */
  private async checkMemoryUsage(
    _extensionName: string,
    state: ExtensionState
  ): Promise<HealthCheck> {
    const start = Date.now()
    const memoryUsage = state.metrics.memoryUsage
    const memoryLimitMB = 100 // 100MB限制

    let status: HealthCheck['status'] = 'pass'
    let message = `Memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`

    if (memoryUsage > memoryLimitMB * 1024 * 1024) {
      status = 'fail'
      message += ' (exceeds limit)'
    } else if (memoryUsage > memoryLimitMB * 0.8 * 1024 * 1024) {
      status = 'warn'
      message += ' (approaching limit)'
    }

    return {
      name: 'memory',
      status,
      message,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  }

  /**
   * 响应时间检查
   */
  private async checkResponseTime(
    _extensionName: string,
    _state: ExtensionState
  ): Promise<HealthCheck> {
    const start = Date.now()

    // 模拟响应时间检查
    const responseTime = Math.random() * 100 // 0-100ms

    let status: HealthCheck['status'] = 'pass'
    let message = `Response time: ${Math.round(responseTime)}ms`

    if (responseTime > 1000) {
      status = 'fail'
      message += ' (too slow)'
    } else if (responseTime > 500) {
      status = 'warn'
      message += ' (slow)'
    }

    return {
      name: 'response_time',
      status,
      message,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  }

  /**
   * 错误率检查
   */
  private async checkErrorRate(extensionName: string, state: ExtensionState): Promise<HealthCheck> {
    const start = Date.now()
    const errorRate =
      state.metrics.requestCount > 0
        ? (state.metrics.errorCount / state.metrics.requestCount) * 100
        : 0

    let status: HealthCheck['status'] = 'pass'
    let message = `Error rate: ${Math.round(errorRate)}%`

    if (errorRate > 10) {
      status = 'fail'
      message += ' (too high)'
    } else if (errorRate > 5) {
      status = 'warn'
      message += ' (elevated)'
    }

    return {
      name: 'error_rate',
      status,
      message,
      timestamp: Date.now(),
      duration: Date.now() - start,
    }
  }

  /**
   * 获取内存使用量
   */
  private getMemoryUsage(_extensionName: string): number {
    // 实际实现中应该从系统获取真实的内存使用量
    return Math.random() * 50 * 1024 * 1024 // 模拟0-50MB
  }

  /**
   * 获取CPU使用率
   */
  private getCpuUsage(_extensionName: string): number {
    // 实际实现中应该从系统获取真实的CPU使用率
    return Math.random() * 20 // 模拟0-20%
  }

  /**
   * 发送状态更新事件
   */
  private emitStateUpdate(
    type: StateUpdateEvent['type'],
    extensionName: string,
    oldState: ExtensionState,
    newState: ExtensionState
  ): void {
    this.emit('stateUpdate', {
      type,
      extensionName,
      oldState,
      newState,
      timestamp: Date.now(),
    } as StateUpdateEvent)
  }
}

/**
 * 创建状态管理器实例
 */
export function createStateManager(
  config?: Partial<{
    healthCheckInterval: number
    metricsInterval: number
    enableAutoHealthCheck: boolean
  }>
): ExtensionStateManager {
  const fullConfig = {
    healthCheckInterval: 30000,
    metricsInterval: 5000,
    enableAutoHealthCheck: true,
    ...config
  }
  return new ExtensionStateManager(fullConfig)
}
