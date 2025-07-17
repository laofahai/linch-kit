/**
 * @jest-environment node
 */

import { Server } from 'http'

import { describe, it, expect, beforeEach, afterEach, mock, type Mock } from 'bun:test'

import {
  LinchKitHealthMonitor,
  createHealthMonitor,
  builtinCheckers,
} from '../../observability/health'
import type { HealthChecker, HealthStatus } from '../../types'

// bun test 暂不支持 vi.mock，简化测试以避免外部依赖
// TODO: 当 bun test 支持 vi.mock 时重新启用完整的测试

describe('LinchKitHealthMonitor', () => {
  let healthMonitor: LinchKitHealthMonitor
  let mockChecker: HealthChecker

  beforeEach(() => {
    healthMonitor = new LinchKitHealthMonitor()

    mockChecker = {
      name: 'test-checker',
      timeout: 1000,
      check: mock().mockResolvedValue({
        status: 'healthy',
        message: 'Test checker OK',
        timestamp: Date.now(),
      }),
    }
  })

  afterEach(() => {
    healthMonitor.stop()
  })

  describe('检查器管理', () => {
    it('should add health checkers', () => {
      healthMonitor.addChecker(mockChecker)

      const checkerNames = healthMonitor.getCheckerNames()
      expect(checkerNames).toContain('test-checker')
    })

    it('should remove health checkers', () => {
      healthMonitor.addChecker(mockChecker)
      healthMonitor.removeChecker('test-checker')

      const checkerNames = healthMonitor.getCheckerNames()
      expect(checkerNames).not.toContain('test-checker')
    })

    it('should get all checker names', () => {
      const checker1 = { ...mockChecker, name: 'checker1' }
      const checker2 = { ...mockChecker, name: 'checker2' }

      healthMonitor.addChecker(checker1)
      healthMonitor.addChecker(checker2)

      const names = healthMonitor.getCheckerNames()
      expect(names).toEqual(['checker1', 'checker2'])
    })
  })

  describe('单个检查', () => {
    beforeEach(() => {
      healthMonitor.addChecker(mockChecker)
    })

    it('should check individual checker', async () => {
      const result = await healthMonitor.check('test-checker')

      expect(result).toEqual({
        status: 'healthy',
        message: 'Test checker OK',
        timestamp: expect.any(Number),
      })
      expect(mockChecker.check).toHaveBeenCalled()
    })

    it('should return undefined for non-existent checker', async () => {
      const result = await healthMonitor.check('non-existent')

      expect(result).toBeUndefined()
    })

    it('should handle checker errors', async () => {
      const error = new Error('Checker failed')
      ;(mockChecker.check as any).mockRejectedValue(error)

      const result = await healthMonitor.check('test-checker')

      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Checker failed',
        timestamp: expect.any(Number),
      })
    })
  })

  describe('createHealthMonitor 工厂函数', () => {
    it('should create health monitor instance', () => {
      const monitor = createHealthMonitor()
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })
  })

  describe('批量检查', () => {
    beforeEach(() => {
      const checker1 = {
        name: 'checker1',
        timeout: 1000,
        check: mock().mockResolvedValue({
          status: 'healthy',
          message: 'Checker 1 OK',
          timestamp: Date.now(),
        }),
      }
      const checker2 = {
        name: 'checker2', 
        timeout: 1000,
        check: mock().mockResolvedValue({
          status: 'degraded',
          message: 'Checker 2 degraded',
          timestamp: Date.now(),
        }),
      }
      
      healthMonitor.addChecker(checker1)
      healthMonitor.addChecker(checker2)
    })

    it('should check all checkers', async () => {
      const results = await healthMonitor.checkAll()

      expect(Object.keys(results)).toEqual(['checker1', 'checker2'])
      expect(results.checker1.status).toBe('healthy')
      expect(results.checker2.status).toBe('degraded')
    })

    it('should get overall health status', async () => {
      const overallHealth = await healthMonitor.getOverallHealth()

      expect(overallHealth.status).toBe('degraded')
      expect(overallHealth.message).toBe('2 checks completed')
      expect(overallHealth.details).toBeDefined()
      expect(overallHealth.timestamp).toBeGreaterThan(0)
    })

    it('should return unhealthy when any checker fails', async () => {
      const unhealthyChecker = {
        name: 'unhealthy',
        timeout: 1000,
        check: mock().mockResolvedValue({
          status: 'unhealthy',
          message: 'Failed',
          timestamp: Date.now(),
        }),
      }
      
      healthMonitor.addChecker(unhealthyChecker)
      const overallHealth = await healthMonitor.getOverallHealth()

      expect(overallHealth.status).toBe('unhealthy')
    })

    it('should return healthy when all checkers are healthy', async () => {
      // Remove degraded checker
      healthMonitor.removeChecker('checker2')
      
      const overallHealth = await healthMonitor.getOverallHealth()
      expect(overallHealth.status).toBe('healthy')
    })
  })

  describe('超时处理', () => {
    it('should handle checker timeout', async () => {
      const slowChecker = {
        name: 'slow-checker',
        timeout: 100,
        check: mock().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 200))
        ),
      }
      
      healthMonitor.addChecker(slowChecker)
      const result = await healthMonitor.check('slow-checker')

      expect(result?.status).toBe('unhealthy')
      expect(result?.message).toContain('timed out')
    })

    it('should handle checker without timeout', async () => {
      const noTimeoutChecker = {
        name: 'no-timeout',
        check: mock().mockResolvedValue({
          status: 'healthy',
          message: 'OK',
          timestamp: Date.now(),
        }),
      }
      
      healthMonitor.addChecker(noTimeoutChecker)
      const result = await healthMonitor.check('no-timeout')

      expect(result?.status).toBe('healthy')
    })
  })

  describe('监控器生命周期', () => {
    it('should start monitoring', () => {
      healthMonitor.addChecker(mockChecker)
      healthMonitor.start()

      expect(healthMonitor.getCheckerNames()).toContain('test-checker')
    })

    it('should stop monitoring', () => {
      healthMonitor.start()
      healthMonitor.stop()

      // Monitor should still have checkers after stop
      expect(healthMonitor.getCheckerNames()).toBeDefined()
    })

    it('should warn when adding checker after start', () => {
      healthMonitor.start()
      
      // This should trigger a warning in logs
      healthMonitor.addChecker(mockChecker)
      
      expect(healthMonitor.getCheckerNames()).toContain('test-checker')
    })
  })

  describe('错误处理', () => {
    it('should handle checker that throws non-Error objects', async () => {
      const badChecker = {
        name: 'bad-checker',
        timeout: 1000,
        check: mock().mockRejectedValue('string error'),
      }
      
      healthMonitor.addChecker(badChecker)
      const result = await healthMonitor.check('bad-checker')

      expect(result?.status).toBe('unhealthy')
      expect(result?.message).toBe('Unknown error')
    })

    it('should handle multiple checker failures gracefully', async () => {
      const failingChecker1 = {
        name: 'failing1',
        timeout: 1000,
        check: mock().mockRejectedValue(new Error('Failure 1')),
      }
      const failingChecker2 = {
        name: 'failing2', 
        timeout: 1000,
        check: mock().mockRejectedValue(new Error('Failure 2')),
      }
      
      healthMonitor.addChecker(failingChecker1)
      healthMonitor.addChecker(failingChecker2)
      
      const results = await healthMonitor.checkAll()
      
      expect(results.failing1.status).toBe('unhealthy')
      expect(results.failing2.status).toBe('unhealthy')
      expect(results.failing1.message).toBe('Failure 1')
      expect(results.failing2.message).toBe('Failure 2')
    })
  })

  describe('内置检查器', () => {
    it('should export builtin checkers', () => {
      expect(builtinCheckers).toBeDefined()
      expect(typeof builtinCheckers).toBe('object')
    })

    it('should create memory checker', () => {
      const memoryChecker = builtinCheckers.memory(0.8)
      
      expect(memoryChecker.name).toBe('memory')
      expect(memoryChecker.timeout).toBe(1000)
      expect(typeof memoryChecker.check).toBe('function')
    })

    it('should create disk checker', () => {
      const diskChecker = builtinCheckers.disk('/', 0.9)
      
      expect(diskChecker.name).toBe('disk')
      expect(diskChecker.timeout).toBe(2000)
      expect(typeof diskChecker.check).toBe('function')
    })

    it('should memory checker return healthy for normal usage', async () => {
      const memoryChecker = builtinCheckers.memory(0.99)
      const result = await memoryChecker.check()
      
      expect(['healthy', 'degraded']).toContain(result.status)
      expect(result.details).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should memory checker return degraded for elevated usage', async () => {
      const memoryChecker = builtinCheckers.memory(0.01)
      const result = await memoryChecker.check()
      
      expect(['degraded', 'unhealthy']).toContain(result.status)
      expect(result.details).toBeDefined()
    })
  })

  describe('createHealthMonitor 工厂函数', () => {
    it('should create health monitor instance', () => {
      const monitor = createHealthMonitor()
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })

    it('should create monitor with empty config', () => {
      const monitor = createHealthMonitor({})
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })

    it('should create monitor with graceful shutdown config', () => {
      const monitor = createHealthMonitor({
        gracefulShutdown: {
          enabled: true,
          timeout: 10000,
          signals: ['SIGTERM', 'SIGINT'],
        },
      })
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })

    it('should create monitor with custom endpoints', () => {
      const monitor = createHealthMonitor({
        endpoints: {
          health: '/custom-health',
          ready: '/custom-ready',
        },
      })
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })
  })

  describe('优雅关闭功能', () => {
    it('should setup graceful shutdown with default options', () => {
      // Create a more realistic server mock
      const mockServer = {
        listeners: mock().mockReturnValue([]),
        on: mock(),
        removeListener: mock(),
        removeAllListeners: mock(),
      } as unknown as Server
      
      // This tests the setupGracefulShutdown method exists and can be called
      expect(() => {
        healthMonitor.setupGracefulShutdown(mockServer)
      }).not.toThrow()
    })

    it('should setup graceful shutdown with custom options', () => {
      const mockServer = {
        listeners: mock().mockReturnValue([]),
        on: mock(),
        removeListener: mock(),
        removeAllListeners: mock(),
      } as unknown as Server
      
      const customOptions = {
        timeout: 10000,
        signal: 'SIGTERM' as const,
        onSignal: mock().mockResolvedValue(undefined),
        onShutdown: mock().mockResolvedValue(undefined),
        onSendFailureDuringShutdown: mock().mockResolvedValue(undefined),
      }
      
      expect(() => {
        healthMonitor.setupGracefulShutdown(mockServer, customOptions)
      }).not.toThrow()
    })
  })

  describe('磁盘检查器实际功能', () => {
    it('should handle disk checker errors gracefully', async () => {
      const diskChecker = builtinCheckers.disk('/nonexistent', 0.9)
      const result = await diskChecker.check()
      
      // Should handle the case where path doesn't exist
      expect(result.status).toBe('unhealthy')
      expect(result.message).toContain('Failed to check disk usage')
    })
  })
})
