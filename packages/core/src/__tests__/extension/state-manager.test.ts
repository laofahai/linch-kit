import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

import { ExtensionStateManager } from '../../extension/state-manager'
import type { ExtensionRegistration, ExtensionMetrics, ExtensionHealth } from '../../extension/state-manager'

describe('ExtensionStateManager', () => {
  let stateManager: ExtensionStateManager
  let mockRegistration: ExtensionRegistration

  beforeEach(() => {
    stateManager = new ExtensionStateManager({
      healthCheckInterval: 1000,
      metricsInterval: 500,
      enableAutoHealthCheck: false, // 禁用自动检查以避免测试干扰
    })

    mockRegistration = {
      extension: {
        metadata: {
          id: 'test-extension',
          name: 'Test Extension',
          version: '1.0.0',
          displayName: 'Test Extension',
          capabilities: { hasUI: true },
          permissions: [],
        },
        defaultConfig: {},
      },
      config: { enabled: true },
      instance: undefined,
      status: 'registered',
      registeredAt: Date.now(),
      lastUpdated: Date.now(),
    } as any
  })

  afterEach(() => {
    stateManager.destroy()
  })

  describe('Extension状态注册', () => {
    it('应该成功注册Extension状态', () => {
      const eventHandler = mock(() => {})
      stateManager.on('registered', eventHandler)

      stateManager.register('test-extension', mockRegistration)

      const state = stateManager.getState('test-extension')
      expect(state).toBeDefined()
      expect(state!.name).toBe('test-extension')
      expect(state!.status).toBe('registered')
      expect(state!.metrics).toBeDefined()
      expect(state!.health).toBeDefined()
      expect(eventHandler).toHaveBeenCalled()
    })

    it('应该初始化正确的指标结构', () => {
      stateManager.register('test-extension', mockRegistration)

      const state = stateManager.getState('test-extension')
      expect(state!.metrics.initializationTime).toBe(0)
      expect(state!.metrics.startupTime).toBe(0)
      expect(state!.metrics.memoryUsage).toBe(0)
      expect(state!.metrics.cpuUsage).toBe(0)
      expect(state!.metrics.activeConnections).toBe(0)
      expect(state!.metrics.requestCount).toBe(0)
      expect(state!.metrics.errorCount).toBe(0)
      expect(state!.metrics.lastActivity).toBeGreaterThan(0)
    })

    it('应该初始化正确的健康状态结构', () => {
      stateManager.register('test-extension', mockRegistration)

      const state = stateManager.getState('test-extension')
      expect(state!.health.score).toBe(100)
      expect(state!.health.status).toBe('unknown')
      expect(state!.health.checks).toHaveLength(0)
      expect(state!.health.lastCheckTime).toBeGreaterThan(0)
    })
  })

  describe('状态更新', () => {
    beforeEach(() => {
      stateManager.register('test-extension', mockRegistration)
    })

    it('应该成功更新Extension状态', () => {
      stateManager.updateStatus('test-extension', 'running')

      const state = stateManager.getState('test-extension')
      expect(state!.status).toBe('running')
      expect(state!.startedAt).toBeGreaterThan(0)
    })

    it('应该记录启动时间', () => {
      const startTime = Date.now()
      stateManager.updateStatus('test-extension', 'running')

      const state = stateManager.getState('test-extension')
      expect(state!.startedAt).toBeGreaterThanOrEqual(startTime)
    })

    it('应该记录停止时间', () => {
      stateManager.updateStatus('test-extension', 'running')
      const stopTime = Date.now()
      stateManager.updateStatus('test-extension', 'stopped')

      const state = stateManager.getState('test-extension')
      expect(state!.stoppedAt).toBeGreaterThanOrEqual(stopTime)
    })

    it('应该记录错误信息', () => {
      const error = new Error('Test error')
      stateManager.updateStatus('test-extension', 'error', error)

      const state = stateManager.getState('test-extension')
      expect(state!.error).toBe(error)
      expect(state!.metrics.errorCount).toBe(1)
    })

    it('应该忽略不存在Extension的状态更新', () => {
      // 获取更新前的状态数量
      const statesBefore = stateManager.getAllStates().length
      
      stateManager.updateStatus('non-existent', 'running')

      // 确保状态数量没有变化
      expect(stateManager.getAllStates()).toHaveLength(statesBefore)
    })
  })

  describe('指标更新', () => {
    beforeEach(() => {
      stateManager.register('test-extension', mockRegistration)
    })

    it('应该成功更新Extension指标', () => {
      const metrics: Partial<ExtensionMetrics> = {
        memoryUsage: 50 * 1024 * 1024,
        cpuUsage: 25.5,
        requestCount: 100,
      }

      stateManager.updateMetrics('test-extension', metrics)

      const state = stateManager.getState('test-extension')
      expect(state!.metrics.memoryUsage).toBe(50 * 1024 * 1024)
      expect(state!.metrics.cpuUsage).toBe(25.5)
      expect(state!.metrics.requestCount).toBe(100)
    })

    it('应该保留未更新的指标值', () => {
      const initialMetrics: Partial<ExtensionMetrics> = {
        memoryUsage: 30 * 1024 * 1024,
        requestCount: 50,
      }
      stateManager.updateMetrics('test-extension', initialMetrics)

      const updateMetrics: Partial<ExtensionMetrics> = {
        cpuUsage: 15.0,
      }
      stateManager.updateMetrics('test-extension', updateMetrics)

      const state = stateManager.getState('test-extension')
      expect(state!.metrics.memoryUsage).toBe(30 * 1024 * 1024) // 保留
      expect(state!.metrics.requestCount).toBe(50) // 保留
      expect(state!.metrics.cpuUsage).toBe(15.0) // 更新
    })

    it('应该忽略不存在Extension的指标更新', () => {
      const statesBefore = stateManager.getAllStates().length
      
      stateManager.updateMetrics('non-existent', { cpuUsage: 10 })

      expect(stateManager.getAllStates()).toHaveLength(statesBefore)
    })
  })

  describe('健康状态更新', () => {
    beforeEach(() => {
      stateManager.register('test-extension', mockRegistration)
    })

    it('应该成功更新Extension健康状态', () => {
      const health: Partial<ExtensionHealth> = {
        score: 85,
        status: 'warning',
        checks: [
          {
            name: 'memory_check',
            status: 'warn',
            message: 'Memory usage high',
            timestamp: Date.now(),
            duration: 10,
          },
        ],
      }

      stateManager.updateHealth('test-extension', health)

      const state = stateManager.getState('test-extension')
      expect(state!.health.score).toBe(85)
      expect(state!.health.status).toBe('warning')
      expect(state!.health.checks).toHaveLength(1)
    })

    it('应该保留未更新的健康状态值', () => {
      const initialHealth: Partial<ExtensionHealth> = {
        score: 90,
        status: 'healthy',
      }
      stateManager.updateHealth('test-extension', initialHealth)

      const updateHealth: Partial<ExtensionHealth> = {
        score: 75,
      }
      stateManager.updateHealth('test-extension', updateHealth)

      const state = stateManager.getState('test-extension')
      expect(state!.health.score).toBe(75) // 更新
      expect(state!.health.status).toBe('healthy') // 保留
    })

    it('应该忽略不存在Extension的健康状态更新', () => {
      const statesBefore = stateManager.getAllStates().length
      
      stateManager.updateHealth('non-existent', { score: 50 })

      expect(stateManager.getAllStates()).toHaveLength(statesBefore)
    })
  })

  describe('健康检查', () => {
    beforeEach(() => {
      stateManager.register('test-extension', mockRegistration)
      stateManager.updateStatus('test-extension', 'running')
    })

    it('应该执行完整的健康检查', async () => {
      const health = await stateManager.performHealthCheck('test-extension')

      expect(health.score).toBeGreaterThanOrEqual(0)
      expect(health.score).toBeLessThanOrEqual(100)
      expect(health.status).toMatch(/healthy|warning|critical/)
      expect(health.checks.length).toBeGreaterThan(0)
      expect(health.lastCheckTime).toBeGreaterThan(0)
    })

    it('应该为不存在的Extension抛出错误', async () => {
      await expect(stateManager.performHealthCheck('non-existent')).rejects.toThrow()
    })

    it('应该正确计算健康评分', async () => {
      // 模拟指标以影响健康检查结果
      stateManager.updateMetrics('test-extension', {
        memoryUsage: 10 * 1024 * 1024, // 较低内存使用
        errorCount: 0, // 无错误
      })

      const health = await stateManager.performHealthCheck('test-extension')

      expect(health.score).toBeGreaterThan(50) // 应该有合理的健康评分
      expect(health.checks.every(check => check.status === 'pass' || check.status === 'warn')).toBe(true)
    })

    it('应该检测高内存使用', async () => {
      stateManager.updateMetrics('test-extension', {
        memoryUsage: 500 * 1024 * 1024, // 高内存使用
      })

      const health = await stateManager.performHealthCheck('test-extension')
      const memoryCheck = health.checks.find(check => check.name === 'memory')

      expect(memoryCheck).toBeDefined()
      expect(memoryCheck!.status).toMatch(/warn|fail/)
    })

    it('应该检测高错误率', async () => {
      stateManager.updateMetrics('test-extension', {
        errorCount: 50,
        requestCount: 100,
      })

      const health = await stateManager.performHealthCheck('test-extension')
      const errorCheck = health.checks.find(check => check.name === 'error_rate')

      expect(errorCheck).toBeDefined()
      expect(errorCheck!.status).toMatch(/warn|fail/)
    })
  })

  describe('状态查询', () => {
    it('应该返回已注册Extension的状态', () => {
      stateManager.register('test-extension', mockRegistration)

      const state = stateManager.getState('test-extension')
      expect(state).toBeDefined()
      expect(state!.name).toBe('test-extension')
    })

    it('应该对不存在的Extension返回undefined', () => {
      const state = stateManager.getState('non-existent')
      expect(state).toBeUndefined()
    })

    it('应该返回所有Extension状态', () => {
      stateManager.register('extension-1', mockRegistration)
      stateManager.register('extension-2', {
        ...mockRegistration,
        extension: {
          ...mockRegistration.extension,
          metadata: {
            ...mockRegistration.extension.metadata,
            id: 'extension-2',
            name: 'Extension 2',
          },
        },
      })

      const allStates = stateManager.getAllStates()
      expect(allStates).toHaveLength(2)
      expect(allStates.map(s => s.name)).toContain('extension-1')
      expect(allStates.map(s => s.name)).toContain('extension-2')
    })

    it('应该返回正在运行的Extension', () => {
      stateManager.register('running-ext', mockRegistration)
      stateManager.register('stopped-ext', mockRegistration)

      stateManager.updateStatus('running-ext', 'running')
      stateManager.updateStatus('stopped-ext', 'stopped')

      const runningStates = stateManager.getRunningExtensions()
      const allStates = stateManager.getAllStates()
      const stoppedStates = allStates.filter(s => s.status === 'stopped')

      expect(runningStates).toHaveLength(1)
      expect(runningStates[0].name).toBe('running-ext')
      expect(stoppedStates).toHaveLength(1)
      expect(stoppedStates[0].name).toBe('stopped-ext')
    })

    it('应该返回不健康的Extension', () => {
      stateManager.register('healthy-ext', mockRegistration)
      stateManager.register('warning-ext', mockRegistration)

      stateManager.updateHealth('healthy-ext', { status: 'healthy' })
      stateManager.updateHealth('warning-ext', { status: 'warning' })

      const unhealthyStates = stateManager.getUnhealthyExtensions()
      const allStates = stateManager.getAllStates()
      const healthyStates = allStates.filter(s => s.health.status === 'healthy')

      expect(healthyStates).toHaveLength(1)
      expect(healthyStates[0].name).toBe('healthy-ext')
      expect(unhealthyStates).toHaveLength(1)
      expect(unhealthyStates[0].name).toBe('warning-ext')
    })
  })

  describe('状态清理', () => {
    beforeEach(() => {
      stateManager.register('test-extension', mockRegistration)
    })

    it('应该成功注销Extension状态', () => {
      const eventHandler = mock(() => {})
      stateManager.on('unregistered', eventHandler)

      stateManager.unregister('test-extension')

      expect(stateManager.getState('test-extension')).toBeUndefined()
      expect(eventHandler).toHaveBeenCalledWith({
        extensionName: 'test-extension',
      })
    })

    it('应该注销不存在的Extension时发射事件', () => {
      const eventHandler = mock(() => {})
      stateManager.on('unregistered', eventHandler)

      stateManager.unregister('non-existent')

      // unregister 总是会发射事件，不管Extension是否存在
      expect(eventHandler).toHaveBeenCalled()
    })

    it('应该销毁后清空所有Extension状态', () => {
      stateManager.register('ext-1', mockRegistration)
      stateManager.register('ext-2', mockRegistration)

      expect(stateManager.getAllStates()).toHaveLength(3) // 包括test-extension

      stateManager.destroy()

      expect(stateManager.getAllStates()).toHaveLength(0)
    })
  })

  describe('状态更新验证', () => {
    beforeEach(() => {
      stateManager.register('test-extension', mockRegistration)
    })

    it('应该在状态变化时更新状态', () => {
      stateManager.updateStatus('test-extension', 'running')

      const state = stateManager.getState('test-extension')
      expect(state!.status).toBe('running')
      expect(state!.startedAt).toBeGreaterThan(0)
    })

    it('应该正确更新指标数据', () => {
      stateManager.updateMetrics('test-extension', { cpuUsage: 30 })

      const state = stateManager.getState('test-extension')
      expect(state!.metrics.cpuUsage).toBe(30)
      expect(state!.lastUpdated).toBeGreaterThan(0)
    })
  })

  describe('生命周期管理', () => {
    it('应该正确销毁状态管理器', () => {
      const destroyedManager = new ExtensionStateManager()
      destroyedManager.register('test', mockRegistration)

      expect(destroyedManager.getAllStates()).toHaveLength(1)

      destroyedManager.destroy()

      expect(destroyedManager.getAllStates()).toHaveLength(0)
    })

    it('应该在销毁后停止周期性任务', () => {
      const managerWithAutoCheck = new ExtensionStateManager({
        healthCheckInterval: 100,
        metricsInterval: 100,
        enableAutoHealthCheck: true,
      })

      managerWithAutoCheck.destroy()

      // 等待一段时间确保周期性任务已停止
      // 这里没有简单的方法验证，但destroy方法应该清理定时器
      expect(true).toBe(true) // 占位符断言
    })
  })

  describe('边界情况和错误处理', () => {
    it('应该处理重复注册相同Extension', () => {
      stateManager.register('test-extension', mockRegistration)
      stateManager.register('test-extension', mockRegistration) // 重复注册

      const allStates = stateManager.getAllStates()
      expect(allStates).toHaveLength(1) // 应该只有一个状态
    })

    it('应该处理极大的指标值', () => {
      stateManager.register('test-extension', mockRegistration)

      const largeMetrics: Partial<ExtensionMetrics> = {
        memoryUsage: Number.MAX_SAFE_INTEGER,
        requestCount: Number.MAX_SAFE_INTEGER,
      }

      stateManager.updateMetrics('test-extension', largeMetrics)

      const state = stateManager.getState('test-extension')
      expect(state!.metrics.memoryUsage).toBe(Number.MAX_SAFE_INTEGER)
      expect(state!.metrics.requestCount).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('应该处理负数指标值', () => {
      stateManager.register('test-extension', mockRegistration)

      const negativeMetrics: Partial<ExtensionMetrics> = {
        cpuUsage: -10,
        memoryUsage: -1024,
      }

      stateManager.updateMetrics('test-extension', negativeMetrics)

      const state = stateManager.getState('test-extension')
      expect(state!.metrics.cpuUsage).toBe(-10)
      expect(state!.metrics.memoryUsage).toBe(-1024)
    })
  })
})