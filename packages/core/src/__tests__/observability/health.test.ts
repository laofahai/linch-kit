/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { Server } from 'http'
import { LinchKitHealthMonitor, createHealthMonitor, builtinCheckers } from '../../observability/health'
import type { HealthChecker, HealthStatus } from '../../types'

// Mock @godaddy/terminus
vi.mock('@godaddy/terminus', () => ({
  createTerminus: vi.fn(),
  HealthCheckError: class extends Error {
    constructor(message: string, details?: unknown) {
      super(message)
      this.name = 'HealthCheckError'
      this.details = details
    }
    details?: unknown
  }
}))

// Mock logger
vi.mock('../../observability/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe('LinchKitHealthMonitor', () => {
  let healthMonitor: LinchKitHealthMonitor
  let mockChecker: HealthChecker

  beforeEach(() => {
    vi.clearAllMocks()
    healthMonitor = new LinchKitHealthMonitor()
    
    mockChecker = {
      name: 'test-checker',
      timeout: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Test checker OK',
        timestamp: Date.now()
      })
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

    it('should warn when adding checker after start', () => {
      const { logger } = require('../../observability/logger')
      
      healthMonitor.start()
      healthMonitor.addChecker(mockChecker)
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Adding health checker after monitor started',
        { checkerName: 'test-checker' }
      )
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
        timestamp: expect.any(Number)
      })
      expect(mockChecker.check).toHaveBeenCalled()
    })

    it('should return undefined for non-existent checker', async () => {
      const result = await healthMonitor.check('non-existent')
      
      expect(result).toBeUndefined()
    })

    it('should handle checker errors', async () => {
      const error = new Error('Checker failed')
      ;(mockChecker.check as Mock).mockRejectedValue(error)
      
      const result = await healthMonitor.check('test-checker')
      
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Checker failed',
        timestamp: expect.any(Number)
      })
    })

    it('should handle non-Error objects', async () => {
      ;(mockChecker.check as Mock).mockRejectedValue('String error')
      
      const result = await healthMonitor.check('test-checker')
      
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Unknown error',
        timestamp: expect.any(Number)
      })
    })

    it('should apply timeout when specified', async () => {
      vi.useFakeTimers()
      
      const slowChecker = {
        ...mockChecker,
        timeout: 100,
        check: vi.fn().mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({ status: 'healthy', message: 'OK', timestamp: Date.now() }), 200)
        ))
      }
      
      healthMonitor.addChecker(slowChecker)
      
      const resultPromise = healthMonitor.check('test-checker')
      
      // 快进时间以触发超时
      vi.advanceTimersByTime(150)
      
      const result = await resultPromise
      
      expect(result).toEqual({
        status: 'unhealthy',
        message: expect.stringContaining('timed out after 100ms'),
        timestamp: expect.any(Number)
      })
      
      vi.useRealTimers()
    })

    it('should work without timeout', async () => {
      const checkerWithoutTimeout = {
        name: 'no-timeout-checker',
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          message: 'OK',
          timestamp: Date.now()
        })
      }
      
      healthMonitor.addChecker(checkerWithoutTimeout)
      
      const result = await healthMonitor.check('no-timeout-checker')
      
      expect(result).toEqual({
        status: 'healthy',
        message: 'OK',
        timestamp: expect.any(Number)
      })
    })
  })

  describe('全部检查', () => {
    beforeEach(() => {
      const healthyChecker = {
        name: 'healthy-checker',
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          message: 'OK',
          timestamp: Date.now()
        })
      }
      
      const degradedChecker = {
        name: 'degraded-checker',
        check: vi.fn().mockResolvedValue({
          status: 'degraded',
          message: 'Somewhat slow',
          timestamp: Date.now()
        })
      }
      
      const unhealthyChecker = {
        name: 'unhealthy-checker',
        check: vi.fn().mockRejectedValue(new Error('Failed'))
      }
      
      healthMonitor.addChecker(healthyChecker)
      healthMonitor.addChecker(degradedChecker)
      healthMonitor.addChecker(unhealthyChecker)
    })

    it('should check all checkers', async () => {
      const results = await healthMonitor.checkAll()
      
      expect(results).toHaveProperty('healthy-checker')
      expect(results).toHaveProperty('degraded-checker')
      expect(results).toHaveProperty('unhealthy-checker')
      
      expect(results['healthy-checker'].status).toBe('healthy')
      expect(results['degraded-checker'].status).toBe('degraded')
      expect(results['unhealthy-checker'].status).toBe('unhealthy')
    })

    it('should calculate overall health as unhealthy when any checker is unhealthy', async () => {
      const overall = await healthMonitor.getOverallHealth()
      
      expect(overall.status).toBe('unhealthy')
      expect(overall.message).toBe('3 checks completed')
      expect(overall.details).toBeDefined()
    })

    it('should calculate overall health as degraded when no unhealthy but some degraded', async () => {
      healthMonitor.removeChecker('unhealthy-checker')
      
      const overall = await healthMonitor.getOverallHealth()
      
      expect(overall.status).toBe('degraded')
    })

    it('should calculate overall health as healthy when all are healthy', async () => {
      healthMonitor.removeChecker('unhealthy-checker')
      healthMonitor.removeChecker('degraded-checker')
      
      const overall = await healthMonitor.getOverallHealth()
      
      expect(overall.status).toBe('healthy')
    })
  })

  describe('生命周期管理', () => {
    it('should start and stop monitor', () => {
      const { logger } = require('../../observability/logger')
      
      healthMonitor.start()
      expect(logger.info).toHaveBeenCalledWith(
        'Health monitor started',
        { checkersCount: 0 }
      )
      
      healthMonitor.stop()
      expect(logger.info).toHaveBeenCalledWith('Health monitor stopped')
    })
  })

  describe('优雅关闭', () => {
    let mockServer: Server

    beforeEach(() => {
      mockServer = {} as Server
    })

    it('should setup graceful shutdown with default options', () => {
      const { createTerminus } = require('@godaddy/terminus')
      
      healthMonitor.setupGracefulShutdown(mockServer)
      
      expect(createTerminus).toHaveBeenCalledWith(mockServer, expect.objectContaining({
        signal: 'SIGTERM',
        timeout: 5000,
        healthChecks: expect.objectContaining({
          '/health': expect.any(Function),
          '/ready': expect.any(Function)
        }),
        onSignal: expect.any(Function),
        onShutdown: expect.any(Function),
        onSendFailureDuringShutdown: expect.any(Function)
      }))
    })

    it('should setup graceful shutdown with custom options', () => {
      const { createTerminus } = require('@godaddy/terminus')
      const customOptions = {
        signal: 'SIGINT' as const,
        timeout: 10000,
        onSignal: vi.fn(),
        onShutdown: vi.fn()
      }
      
      healthMonitor.setupGracefulShutdown(mockServer, customOptions)
      
      expect(createTerminus).toHaveBeenCalledWith(mockServer, expect.objectContaining({
        signal: 'SIGINT',
        timeout: 10000
      }))
    })

    it('should handle health check endpoint', async () => {
      const { createTerminus } = require('@godaddy/terminus')
      healthMonitor.addChecker(mockChecker)
      
      healthMonitor.setupGracefulShutdown(mockServer)
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      const healthCheck = terminusOptions.healthChecks['/health']
      
      const result = await healthCheck()
      expect(result).toEqual(expect.objectContaining({
        status: 'healthy',
        message: '1 checks completed'
      }))
    })

    it('should throw HealthCheckError when unhealthy', async () => {
      const { createTerminus, HealthCheckError } = require('@godaddy/terminus')
      
      const unhealthyChecker = {
        name: 'unhealthy',
        check: vi.fn().mockRejectedValue(new Error('Failed'))
      }
      healthMonitor.addChecker(unhealthyChecker)
      
      healthMonitor.setupGracefulShutdown(mockServer)
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      const healthCheck = terminusOptions.healthChecks['/health']
      
      await expect(healthCheck()).rejects.toThrow(HealthCheckError)
    })

    it('should handle readiness check endpoint', async () => {
      const { createTerminus } = require('@godaddy/terminus')
      healthMonitor.addChecker(mockChecker)
      
      healthMonitor.setupGracefulShutdown(mockServer)
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      const readinessCheck = terminusOptions.healthChecks['/ready']
      
      const result = await readinessCheck()
      expect(result).toEqual({
        status: 'ready',
        timestamp: expect.any(Number)
      })
    })

    it('should throw HealthCheckError when not ready', async () => {
      const { createTerminus, HealthCheckError } = require('@godaddy/terminus')
      
      const unhealthyChecker = {
        name: 'unhealthy',
        check: vi.fn().mockRejectedValue(new Error('Failed'))
      }
      healthMonitor.addChecker(unhealthyChecker)
      
      healthMonitor.setupGracefulShutdown(mockServer)
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      const readinessCheck = terminusOptions.healthChecks['/ready']
      
      await expect(readinessCheck()).rejects.toThrow(HealthCheckError)
    })

    it('should handle shutdown signals', async () => {
      const { createTerminus } = require('@godaddy/terminus')
      const { logger } = require('../../observability/logger')
      const customOnSignal = vi.fn()
      
      healthMonitor.setupGracefulShutdown(mockServer, { onSignal: customOnSignal })
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      await terminusOptions.onSignal()
      
      expect(logger.info).toHaveBeenCalledWith('Server is starting cleanup')
      expect(customOnSignal).toHaveBeenCalled()
    })

    it('should handle shutdown completion', async () => {
      const { createTerminus } = require('@godaddy/terminus')
      const { logger } = require('../../observability/logger')
      const customOnShutdown = vi.fn()
      
      healthMonitor.setupGracefulShutdown(mockServer, { onShutdown: customOnShutdown })
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      await terminusOptions.onShutdown()
      
      expect(logger.info).toHaveBeenCalledWith('Cleanup finished, server is shutting down')
      expect(customOnShutdown).toHaveBeenCalled()
    })

    it('should handle shutdown failure', async () => {
      const { createTerminus } = require('@godaddy/terminus')
      const { logger } = require('../../observability/logger')
      const customFailureHandler = vi.fn()
      
      healthMonitor.setupGracefulShutdown(mockServer, { 
        onSendFailureDuringShutdown: customFailureHandler 
      })
      
      const terminusOptions = (createTerminus as Mock).mock.calls[0][1]
      await terminusOptions.onSendFailureDuringShutdown()
      
      expect(logger.error).toHaveBeenCalledWith('Failed to send response during shutdown')
      expect(customFailureHandler).toHaveBeenCalled()
    })
  })

  describe('createHealthMonitor', () => {
    it('should create health monitor with default config', () => {
      const monitor = createHealthMonitor()
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })

    it('should create health monitor with custom config', () => {
      const config = {
        gracefulShutdown: { enabled: true, timeout: 10000 },
        endpoints: { health: '/custom-health', ready: '/custom-ready' }
      }
      
      const monitor = createHealthMonitor(config)
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })
  })

  describe('内置检查器', () => {
    describe('内存检查器', () => {
      it('should create memory checker with default threshold', () => {
        const checker = builtinCheckers.memory()
        
        expect(checker.name).toBe('memory')
        expect(checker.timeout).toBe(1000)
        expect(typeof checker.check).toBe('function')
      })

      it('should create memory checker with custom threshold', () => {
        const checker = builtinCheckers.memory(0.8)
        expect(checker.name).toBe('memory')
      })

      it('should check memory usage and return healthy status', async () => {
        // Mock process.memoryUsage to return low usage
        const originalMemoryUsage = process.memoryUsage
        process.memoryUsage = vi.fn().mockReturnValue({
          heapUsed: 50 * 1024 * 1024, // 50MB
          heapTotal: 100 * 1024 * 1024, // 100MB
          external: 0,
          rss: 0,
          arrayBuffers: 0
        })

        const checker = builtinCheckers.memory(0.9) // 90% threshold
        const result = await checker.check()

        expect(result.status).toBe('healthy')
        expect(result.message).toContain('Memory usage normal: 50.0%')
        
        process.memoryUsage = originalMemoryUsage
      })

      it('should check memory usage and return degraded status', async () => {
        const originalMemoryUsage = process.memoryUsage
        process.memoryUsage = vi.fn().mockReturnValue({
          heapUsed: 75 * 1024 * 1024, // 75MB  
          heapTotal: 100 * 1024 * 1024, // 100MB
          external: 0,
          rss: 0,
          arrayBuffers: 0
        })

        const checker = builtinCheckers.memory(0.9) // 90% threshold (75% > 80% of 90%)
        const result = await checker.check()

        expect(result.status).toBe('degraded')
        expect(result.message).toContain('Memory usage elevated: 75.0%')
        
        process.memoryUsage = originalMemoryUsage
      })

      it('should check memory usage and return unhealthy status', async () => {
        const originalMemoryUsage = process.memoryUsage
        process.memoryUsage = vi.fn().mockReturnValue({
          heapUsed: 95 * 1024 * 1024, // 95MB
          heapTotal: 100 * 1024 * 1024, // 100MB
          external: 0,
          rss: 0,
          arrayBuffers: 0
        })

        const checker = builtinCheckers.memory(0.9) // 90% threshold
        const result = await checker.check()

        expect(result.status).toBe('unhealthy')
        expect(result.message).toContain('Memory usage too high: 95.0%')
        
        process.memoryUsage = originalMemoryUsage
      })
    })

    describe('磁盘检查器', () => {
      it('should create disk checker with default parameters', () => {
        const checker = builtinCheckers.disk()
        
        expect(checker.name).toBe('disk')
        expect(checker.timeout).toBe(2000)
        expect(typeof checker.check).toBe('function')
      })

      it('should create disk checker with custom parameters', () => {
        const checker = builtinCheckers.disk('/tmp', 0.8)
        expect(checker.name).toBe('disk')
      })

      it('should handle statfs errors gracefully', async () => {
        // Mock fs.promises.statfs to throw error
        vi.doMock('fs', () => ({
          promises: {
            statfs: vi.fn().mockRejectedValue(new Error('Permission denied'))
          }
        }))

        const checker = builtinCheckers.disk()
        const result = await checker.check()

        expect(result.status).toBe('unhealthy')
        expect(result.message).toContain('Failed to check disk usage')
      })

      // Note: Testing actual statfs would require mocking Node.js internal modules
      // which is complex and platform-specific. In a real test environment,
      // you might want to mock the fs module more thoroughly.
    })
  })

  describe('超时处理', () => {
    it('should handle timeout correctly', async () => {
      vi.useFakeTimers()
      
      const slowChecker = {
        name: 'slow-checker',
        timeout: 100,
        check: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            status: 'healthy',
            message: 'OK',
            timestamp: Date.now()
          }), 200))
        )
      }
      
      healthMonitor.addChecker(slowChecker)
      
      const checkPromise = healthMonitor.check('slow-checker')
      
      // 快进时间以触发超时
      vi.advanceTimersByTime(150)
      
      const result = await checkPromise
      
      expect(result?.status).toBe('unhealthy')
      expect(result?.message).toContain('timed out after 100ms')
      
      vi.useRealTimers()
    })
  })

  describe('错误处理', () => {
    it('should handle Promise.allSettled in checkAll', async () => {
      const workingChecker = {
        name: 'working',
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          message: 'OK',
          timestamp: Date.now()
        })
      }
      
      const failingChecker = {
        name: 'failing',
        check: vi.fn().mockRejectedValue(new Error('Always fails'))
      }
      
      healthMonitor.addChecker(workingChecker)
      healthMonitor.addChecker(failingChecker)
      
      const results = await healthMonitor.checkAll()
      
      expect(results.working.status).toBe('healthy')
      expect(results.failing.status).toBe('unhealthy')
      expect(results.failing.message).toBe('Always fails')
    })
  })
})