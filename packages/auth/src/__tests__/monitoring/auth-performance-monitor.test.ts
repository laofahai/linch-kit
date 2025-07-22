/**
 * @linch-kit/auth 认证性能监控测试
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { 
  AuthPerformanceMonitor, 
  createAuthPerformanceMonitor,
  type AuthPerformanceMetric,
  type ILogger
} from '../../monitoring/auth-performance-monitor'

// Clear prometheus registry before each test
import { register, Registry } from 'prom-client'
import { createServerMetricCollector } from '@linch-kit/core/server'

// Mock logger
const mockLogger: ILogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {})
}

describe('AuthPerformanceMonitor', () => {
  let monitor: AuthPerformanceMonitor
  let testRegistry: Registry

  beforeEach(() => {
    // Create isolated test registry
    testRegistry = new Registry()
    
    // Clear default registry
    register.clear()
    
    // Reset mock call counts
    mockLogger.info.mockClear?.()
    mockLogger.warn.mockClear?.()
    mockLogger.error.mockClear?.()
    
    // Create monitor with isolated metric collector
    const testMetricCollector = createServerMetricCollector({ 
      registry: testRegistry,
      enableDefaultMetrics: false 
    })
    monitor = new AuthPerformanceMonitor(mockLogger, testMetricCollector)
  })

  afterEach(() => {
    // Clean up registries
    testRegistry.clear()
    register.clear()
    
    mockLogger.info.mockClear?.()
    mockLogger.warn.mockClear?.()
    mockLogger.error.mockClear?.()
  })

  describe('recordAuthMetric', () => {
    it('should record auth metric with all required fields', async () => {
      const metric: AuthPerformanceMetric = {
        operation: 'login',
        status: 'success',
        duration: 120,
        userId: 'user123',
        sessionId: 'session456',
        clientIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        authMethod: 'jwt'
      }

      await monitor.recordAuthMetric(metric)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'success',
          duration: 120,
          userId: 'user123',
          sessionId: 'session456',
          authMethod: 'jwt'
        })
      )
    })

    it('should record auth metric with error status', async () => {
      const metric: AuthPerformanceMetric = {
        operation: 'login',
        status: 'error',
        duration: 50,
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Invalid username or password',
        timestamp: new Date(),
        authMethod: 'password'
      }

      await monitor.recordAuthMetric(metric)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'error',
          duration: 50,
          errorCode: 'INVALID_CREDENTIALS'
        })
      )
    })

    it('should handle minimal metric data', async () => {
      const metric: AuthPerformanceMetric = {
        operation: 'validate_token',
        status: 'success',
        duration: 25,
        timestamp: new Date()
      }

      await monitor.recordAuthMetric(metric)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'validate_token',
          status: 'success',
          duration: 25
        })
      )
    })
  })

  describe('startAuthTimer', () => {
    it('should create auth timer with operation and metadata', () => {
      const timer = monitor.startAuthTimer('login', { provider: 'jwt' })

      expect(timer.operation).toBe('login')
      expect(timer.startTime).toBeTypeOf('number')
      expect(timer.metadata).toEqual({ provider: 'jwt' })
    })

    it('should create auth timer without metadata', () => {
      const timer = monitor.startAuthTimer('refresh_token')

      expect(timer.operation).toBe('refresh_token')
      expect(timer.startTime).toBeTypeOf('number')
      expect(timer.metadata).toBeUndefined()
    })
  })

  describe('AuthPerformanceTimer', () => {
    it('should complete timer with success', async () => {
      const timer = monitor.startAuthTimer('login')
      
      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await timer.success({
        userId: 'user123',
        sessionId: 'session456',
        authMethod: 'jwt'
      })

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'success',
          userId: 'user123',
          sessionId: 'session456',
          authMethod: 'jwt'
        })
      )
    })

    it('should complete timer with failure', async () => {
      const timer = monitor.startAuthTimer('login')
      
      await timer.failure({
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Invalid credentials',
        authMethod: 'password'
      })

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'failure',
          errorCode: 'INVALID_CREDENTIALS',
          authMethod: 'password'
        })
      )
    })

    it('should complete timer with error', async () => {
      const timer = monitor.startAuthTimer('validate_token')
      const error = new Error('Connection timeout')
      
      await timer.error(error, { authMethod: 'jwt' })

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'validate_token',
          status: 'error',
          errorCode: 'Error',
          authMethod: 'jwt'
        })
      )
    })
  })

  describe('getAuthPerformanceStats', () => {
    it('should return auth performance statistics', async () => {
      // Add some test metrics
      const metrics = [
        {
          operation: 'login' as const,
          status: 'success' as const,
          duration: 100,
          timestamp: new Date(),
          authMethod: 'jwt'
        },
        {
          operation: 'login' as const,
          status: 'failure' as const,
          duration: 50,
          timestamp: new Date(),
          authMethod: 'password'
        }
      ]

      for (const metric of metrics) {
        await monitor.recordAuthMetric(metric)
      }

      const stats = await monitor.getAuthPerformanceStats(60)

      expect(stats).toHaveProperty('totalRequests')
      expect(stats).toHaveProperty('successRequests')
      expect(stats).toHaveProperty('failureRequests')
      expect(stats).toHaveProperty('errorRequests')
      expect(stats).toHaveProperty('successRate')
      expect(stats).toHaveProperty('averageResponseTime')
      expect(stats).toHaveProperty('operationStats')
      expect(stats).toHaveProperty('authMethodStats')
    })

    it('should calculate operation statistics correctly', async () => {
      const loginMetrics = [
        {
          operation: 'login' as const,
          status: 'success' as const,
          duration: 100,
          timestamp: new Date(),
          authMethod: 'jwt'
        },
        {
          operation: 'login' as const,
          status: 'success' as const,
          duration: 200,
          timestamp: new Date(),
          authMethod: 'jwt'
        },
        {
          operation: 'login' as const,
          status: 'failure' as const,
          duration: 50,
          timestamp: new Date(),
          authMethod: 'password'
        }
      ]

      for (const metric of loginMetrics) {
        await monitor.recordAuthMetric(metric)
      }

      const stats = await monitor.getAuthPerformanceStats(60)

      expect(stats.operationStats.login).toEqual({
        requests: 3,
        successRate: (2 / 3) * 100,
        avgDuration: (100 + 200 + 50) / 3
      })
    })
  })

  describe('getTopErrors', () => {
    it('should return top errors by count', async () => {
      const errorMetrics = [
        {
          operation: 'login' as const,
          status: 'error' as const,
          duration: 50,
          timestamp: new Date(),
          errorCode: 'INVALID_CREDENTIALS'
        },
        {
          operation: 'login' as const,
          status: 'error' as const,
          duration: 75,
          timestamp: new Date(),
          errorCode: 'INVALID_CREDENTIALS'
        },
        {
          operation: 'validate_token' as const,
          status: 'error' as const,
          duration: 25,
          timestamp: new Date(),
          errorCode: 'TOKEN_EXPIRED'
        }
      ]

      for (const metric of errorMetrics) {
        await monitor.recordAuthMetric(metric)
      }

      const topErrors = await monitor.getTopErrors(5)

      expect(topErrors).toHaveLength(2)
      expect(topErrors[0]).toEqual({
        errorCode: 'INVALID_CREDENTIALS',
        count: 2,
        operations: ['login']
      })
      expect(topErrors[1]).toEqual({
        errorCode: 'TOKEN_EXPIRED',
        count: 1,
        operations: ['validate_token']
      })
    })

    it('should limit results to specified count', async () => {
      const errorMetrics = [
        {
          operation: 'login' as const,
          status: 'error' as const,
          duration: 50,
          timestamp: new Date(),
          errorCode: 'ERROR_1'
        },
        {
          operation: 'login' as const,
          status: 'error' as const,
          duration: 50,
          timestamp: new Date(),
          errorCode: 'ERROR_2'
        },
        {
          operation: 'login' as const,
          status: 'error' as const,
          duration: 50,
          timestamp: new Date(),
          errorCode: 'ERROR_3'
        }
      ]

      for (const metric of errorMetrics) {
        await monitor.recordAuthMetric(metric)
      }

      const topErrors = await monitor.getTopErrors(2)

      expect(topErrors).toHaveLength(2)
    })
  })

  describe('getSlowOperations', () => {
    it('should return slow operations above threshold', async () => {
      const slowMetrics = [
        {
          operation: 'login' as const,
          status: 'success' as const,
          duration: 1500,
          timestamp: new Date()
        },
        {
          operation: 'login' as const,
          status: 'success' as const,
          duration: 2000,
          timestamp: new Date()
        },
        {
          operation: 'validate_token' as const,
          status: 'success' as const,
          duration: 500,
          timestamp: new Date()
        }
      ]

      for (const metric of slowMetrics) {
        await monitor.recordAuthMetric(metric)
      }

      const slowOps = await monitor.getSlowOperations(1000, 5)

      expect(slowOps).toHaveLength(1)
      expect(slowOps[0]).toEqual({
        operation: 'login',
        avgDuration: (1500 + 2000) / 2,
        count: 2
      })
    })

    it('should sort by average duration descending', async () => {
      const slowMetrics = [
        {
          operation: 'login' as const,
          status: 'success' as const,
          duration: 1200,
          timestamp: new Date()
        },
        {
          operation: 'refresh_token' as const,
          status: 'success' as const,
          duration: 1800,
          timestamp: new Date()
        }
      ]

      for (const metric of slowMetrics) {
        await monitor.recordAuthMetric(metric)
      }

      const slowOps = await monitor.getSlowOperations(1000, 5)

      expect(slowOps).toHaveLength(2)
      expect(slowOps[0].operation).toBe('refresh_token')
      expect(slowOps[1].operation).toBe('login')
    })
  })

  describe('cleanup', () => {
    it('should clean up expired metrics', async () => {
      // Add multiple metrics including old ones to ensure buffer has data
      const oldMetric1: AuthPerformanceMetric = {
        operation: 'login',
        status: 'success',
        duration: 100,
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      }
      const oldMetric2: AuthPerformanceMetric = {
        operation: 'logout',
        status: 'success',
        duration: 50,
        timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000) // 30 hours ago
      }
      const recentMetric: AuthPerformanceMetric = {
        operation: 'validate_token',
        status: 'success',
        duration: 25,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }

      await monitor.recordAuthMetric(oldMetric1)
      await monitor.recordAuthMetric(oldMetric2)
      await monitor.recordAuthMetric(recentMetric)
      
      // Reset mock to ignore recordAuthMetric calls
      mockLogger.info.mockClear?.()
      
      // Clean up with 24 hour retention
      await monitor.cleanup(24)

      // Check that the cleanup message was logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cleaned up old auth metrics',
        expect.objectContaining({
          cleanedCount: expect.any(Number),
          remainingCount: expect.any(Number),
          cutoffTime: expect.any(String)
        })
      )
    })
  })
})

describe('createAuthPerformanceMonitor', () => {
  it('should create auth performance monitor with logger', () => {
    const testRegistry = new Registry()
    const testMetricCollector = createServerMetricCollector({ 
      registry: testRegistry,
      enableDefaultMetrics: false 
    })
    const monitor = createAuthPerformanceMonitor(mockLogger, testMetricCollector)
    
    expect(monitor).toBeInstanceOf(AuthPerformanceMonitor)
    testRegistry.clear()
  })

  it('should create auth performance monitor without logger', () => {
    const testRegistry = new Registry()
    const testMetricCollector = createServerMetricCollector({ 
      registry: testRegistry,
      enableDefaultMetrics: false 
    })
    const monitor = createAuthPerformanceMonitor(undefined, testMetricCollector)
    
    expect(monitor).toBeInstanceOf(AuthPerformanceMonitor)
    testRegistry.clear()
  })
})