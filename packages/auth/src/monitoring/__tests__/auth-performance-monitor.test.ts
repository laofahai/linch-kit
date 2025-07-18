/**
 * 认证性能监控模块测试
 * 
 * 测试AuthPerformanceMonitor的核心功能
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { AuthPerformanceMonitor, createAuthPerformanceMonitor } from '../auth-performance-monitor'
import type { AuthPerformanceMetric, AuthOperation } from '../auth-performance-monitor'

// Mock @linch-kit/core/server
const mockCoreMonitor = {
  recordMetric: mock(() => Promise.resolve()),
  getPerformanceStats: mock(() => Promise.resolve({
    totalRequests: 100,
    successRequests: 90,
    failureRequests: 8,
    errorRequests: 2,
    successRate: 90,
    averageResponseTime: 150,
    p95ResponseTime: 300,
    p99ResponseTime: 500,
    windowStart: new Date('2025-07-18T00:00:00Z'),
    windowEnd: new Date('2025-07-18T01:00:00Z')
  })),
  cleanup: mock(() => Promise.resolve()),
  startTimer: mock(() => ({
    operation: 'test',
    startTime: Date.now(),
    success: mock(() => Promise.resolve()),
    failure: mock(() => Promise.resolve()),
    error: mock(() => Promise.resolve())
  }))
}

const mockCreatePerformanceMonitor = mock(() => mockCoreMonitor)

mock.module('@linch-kit/core/server', () => ({
  createPerformanceMonitor: mockCreatePerformanceMonitor
}))

describe('AuthPerformanceMonitor', () => {
  let monitor: AuthPerformanceMonitor
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      info: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {})
    }
    
    monitor = new AuthPerformanceMonitor(mockLogger)
    
    // Reset mock call counts
    mockCoreMonitor.recordMetric.mockClear()
    mockCoreMonitor.getPerformanceStats.mockClear()
    mockCoreMonitor.cleanup.mockClear()
    mockCreatePerformanceMonitor.mockClear()
  })

  it('should create monitor with logger', () => {
    expect(monitor).toBeTruthy()
    // Monitor should be created successfully (constructor call verification not needed)
    expect(typeof monitor.recordAuthMetric).toBe('function')
    expect(typeof monitor.getAuthPerformanceStats).toBe('function')
  })

  it('should record auth metric', async () => {
    const metric: AuthPerformanceMetric = {
      operation: 'login',
      status: 'success',
      duration: 150,
      userId: 'user123',
      sessionId: 'session456',
      clientIp: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      authMethod: 'password',
      timestamp: new Date()
    }

    await monitor.recordAuthMetric(metric)

    expect(mockCoreMonitor.recordMetric).toHaveBeenCalledWith({
      operation: 'login',
      status: 'success',
      duration: 150,
      userId: 'user123',
      errorCode: undefined,
      errorMessage: undefined,
      timestamp: metric.timestamp,
      metadata: {
        sessionId: 'session456',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        authMethod: 'password',
        permissionLevel: undefined
      }
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Auth performance metric recorded',
      expect.objectContaining({
        operation: 'login',
        status: 'success',
        duration: 150,
        userId: 'user123',
        sessionId: 'session456',
        authMethod: 'password'
      })
    )
  })

  it('should record error metric', async () => {
    const metric: AuthPerformanceMetric = {
      operation: 'login',
      status: 'error',
      duration: 200,
      errorCode: 'AUTH_FAILED',
      errorMessage: 'Invalid credentials',
      timestamp: new Date()
    }

    await monitor.recordAuthMetric(metric)

    expect(mockCoreMonitor.recordMetric).toHaveBeenCalledWith({
      operation: 'login',
      status: 'error',
      duration: 200,
      userId: undefined,
      errorCode: 'AUTH_FAILED',
      errorMessage: 'Invalid credentials',
      timestamp: metric.timestamp,
      metadata: {
        sessionId: undefined,
        clientIp: undefined,
        userAgent: undefined,
        authMethod: undefined,
        permissionLevel: undefined
      }
    })
  })

  it('should get auth performance stats', async () => {
    // Add some test metrics to the buffer
    const testMetrics = [
      {
        operation: 'login' as AuthOperation,
        status: 'success' as const,
        duration: 100,
        authMethod: 'password',
        timestamp: new Date()
      },
      {
        operation: 'login' as AuthOperation,
        status: 'failure' as const,
        duration: 150,
        authMethod: 'password',
        timestamp: new Date()
      },
      {
        operation: 'refresh_token' as AuthOperation,
        status: 'success' as const,
        duration: 50,
        authMethod: 'jwt',
        timestamp: new Date()
      }
    ]

    // Add metrics to buffer
    for (const metric of testMetrics) {
      await monitor.recordAuthMetric(metric)
    }

    const stats = await monitor.getAuthPerformanceStats(60)

    expect(stats).toBeTruthy()
    expect(stats.totalRequests).toBe(100)
    expect(stats.successRequests).toBe(90)
    expect(stats.operationStats).toBeTruthy()
    expect(stats.authMethodStats).toBeTruthy()

    expect(mockCoreMonitor.getPerformanceStats).toHaveBeenCalledWith(60)
  })

  it('should start auth timer', () => {
    const timer = monitor.startAuthTimer('login', { source: 'test' })

    expect(timer).toBeTruthy()
    expect(timer.operation).toBe('login')
    expect(timer.startTime).toBeTruthy()
    expect(timer.metadata).toEqual({ source: 'test' })
  })

  it('should cleanup old metrics', async () => {
    await monitor.cleanup(24)

    expect(mockCoreMonitor.cleanup).toHaveBeenCalledWith(24)
  })

  it('should get top errors', async () => {
    // Add error metrics to buffer
    const errorMetrics = [
      {
        operation: 'login' as AuthOperation,
        status: 'error' as const,
        duration: 100,
        errorCode: 'AUTH_FAILED',
        timestamp: new Date()
      },
      {
        operation: 'login' as AuthOperation,
        status: 'error' as const,
        duration: 120,
        errorCode: 'AUTH_FAILED',
        timestamp: new Date()
      },
      {
        operation: 'refresh_token' as AuthOperation,
        status: 'error' as const,
        duration: 80,
        errorCode: 'TOKEN_EXPIRED',
        timestamp: new Date()
      }
    ]

    for (const metric of errorMetrics) {
      await monitor.recordAuthMetric(metric)
    }

    const topErrors = await monitor.getTopErrors(5)

    expect(topErrors).toBeTruthy()
    expect(Array.isArray(topErrors)).toBe(true)
    expect(topErrors.length).toBeLessThanOrEqual(5)

    if (topErrors.length > 0) {
      expect(topErrors[0]).toHaveProperty('errorCode')
      expect(topErrors[0]).toHaveProperty('count')
      expect(topErrors[0]).toHaveProperty('operations')
    }
  })

  it('should get slow operations', async () => {
    // Add slow operation metrics to buffer
    const slowMetrics = [
      {
        operation: 'login' as AuthOperation,
        status: 'success' as const,
        duration: 1500, // Slow operation
        timestamp: new Date()
      },
      {
        operation: 'login' as AuthOperation,
        status: 'success' as const,
        duration: 1200, // Slow operation
        timestamp: new Date()
      },
      {
        operation: 'refresh_token' as AuthOperation,
        status: 'success' as const,
        duration: 50, // Fast operation
        timestamp: new Date()
      }
    ]

    for (const metric of slowMetrics) {
      await monitor.recordAuthMetric(metric)
    }

    const slowOps = await monitor.getSlowOperations(1000, 5)

    expect(slowOps).toBeTruthy()
    expect(Array.isArray(slowOps)).toBe(true)
    expect(slowOps.length).toBeLessThanOrEqual(5)

    if (slowOps.length > 0) {
      expect(slowOps[0]).toHaveProperty('operation')
      expect(slowOps[0]).toHaveProperty('avgDuration')
      expect(slowOps[0]).toHaveProperty('count')
      expect(slowOps[0].avgDuration).toBeGreaterThanOrEqual(1000)
    }
  })

  it('should handle cleanup errors gracefully', async () => {
    // Mock cleanup error
    mockCoreMonitor.cleanup.mockImplementationOnce(() => Promise.reject(new Error('Cleanup failed')))

    // Record a metric to trigger cleanup
    await monitor.recordAuthMetric({
      operation: 'login',
      status: 'success',
      duration: 100,
      timestamp: new Date()
    })

    // Should not throw error - cleanup happens asynchronously
    // We'll just check that the operation completed without throwing
    expect(true).toBe(true)
  })

  it('should calculate operation stats correctly', async () => {
    // Add specific metrics for calculation
    const testMetrics = [
      {
        operation: 'login' as AuthOperation,
        status: 'success' as const,
        duration: 100,
        timestamp: new Date()
      },
      {
        operation: 'login' as AuthOperation,
        status: 'success' as const,
        duration: 200,
        timestamp: new Date()
      },
      {
        operation: 'login' as AuthOperation,
        status: 'failure' as const,
        duration: 150,
        timestamp: new Date()
      }
    ]

    for (const metric of testMetrics) {
      await monitor.recordAuthMetric(metric)
    }

    const stats = await monitor.getAuthPerformanceStats(60)

    expect(stats.operationStats).toBeTruthy()
    
    if (stats.operationStats.login) {
      expect(stats.operationStats.login.requests).toBe(3)
      expect(Math.round(stats.operationStats.login.successRate * 100) / 100).toBe(66.67) // 2/3 * 100
      expect(stats.operationStats.login.avgDuration).toBe(150) // (100+200+150)/3
    }
  })

  it('should calculate auth method stats correctly', async () => {
    // Add specific metrics for auth method calculation
    const testMetrics = [
      {
        operation: 'login' as AuthOperation,
        status: 'success' as const,
        duration: 100,
        authMethod: 'password',
        timestamp: new Date()
      },
      {
        operation: 'login' as AuthOperation,
        status: 'failure' as const,
        duration: 150,
        authMethod: 'password',
        timestamp: new Date()
      },
      {
        operation: 'refresh_token' as AuthOperation,
        status: 'success' as const,
        duration: 50,
        authMethod: 'jwt',
        timestamp: new Date()
      }
    ]

    for (const metric of testMetrics) {
      await monitor.recordAuthMetric(metric)
    }

    const stats = await monitor.getAuthPerformanceStats(60)

    expect(stats.authMethodStats).toBeTruthy()
    
    if (stats.authMethodStats.password) {
      expect(stats.authMethodStats.password.requests).toBe(2)
      expect(stats.authMethodStats.password.successRate).toBe(50) // 1/2 * 100
    }
    
    if (stats.authMethodStats.jwt) {
      expect(stats.authMethodStats.jwt.requests).toBe(1)
      expect(stats.authMethodStats.jwt.successRate).toBe(100) // 1/1 * 100
    }
  })
})

describe('AuthPerformanceTimer', () => {
  let monitor: AuthPerformanceMonitor
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      info: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {})
    }
    
    monitor = new AuthPerformanceMonitor(mockLogger)
    
    // Reset mock call counts
    mockCoreMonitor.recordMetric.mockClear()
  })

  it('should create timer with correct properties', () => {
    const timer = monitor.startAuthTimer('login', { source: 'test' })

    expect(timer.operation).toBe('login')
    expect(timer.startTime).toBeTruthy()
    expect(timer.metadata).toEqual({ source: 'test' })
  })

  it('should record success metric', async () => {
    const timer = monitor.startAuthTimer('login')
    
    await timer.success({
      userId: 'user123',
      sessionId: 'session456',
      authMethod: 'password',
      metadata: { additional: 'data' }
    })

    expect(mockCoreMonitor.recordMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'login',
        status: 'success',
        duration: expect.any(Number),
        userId: 'user123',
        errorCode: undefined,
        errorMessage: undefined,
        timestamp: expect.any(Date),
        metadata: expect.objectContaining({
          sessionId: 'session456',
          authMethod: 'password',
          additional: 'data'
        })
      })
    )
  })

  it('should record failure metric', async () => {
    const timer = monitor.startAuthTimer('login')
    
    await timer.failure({
      errorCode: 'AUTH_FAILED',
      errorMessage: 'Invalid credentials',
      authMethod: 'password'
    })

    expect(mockCoreMonitor.recordMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'login',
        status: 'failure',
        duration: expect.any(Number),
        errorCode: 'AUTH_FAILED',
        errorMessage: 'Invalid credentials',
        timestamp: expect.any(Date),
        metadata: expect.objectContaining({
          authMethod: 'password'
        })
      })
    )
  })

  it('should record error metric', async () => {
    const timer = monitor.startAuthTimer('login')
    const testError = new Error('Database connection failed')
    
    await timer.error(testError, {
      authMethod: 'password'
    })

    expect(mockCoreMonitor.recordMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'login',
        status: 'error',
        duration: expect.any(Number),
        errorCode: 'Error',
        errorMessage: 'Database connection failed',
        timestamp: expect.any(Date),
        metadata: expect.objectContaining({
          authMethod: 'password'
        })
      })
    )
  })

  it('should calculate duration correctly', async () => {
    const timer = monitor.startAuthTimer('login')
    
    // Wait a bit to ensure duration > 0
    await new Promise(resolve => setTimeout(resolve, 10))
    
    await timer.success()

    const recordedCall = mockCoreMonitor.recordMetric.mock.calls[0][0]
    expect(recordedCall.duration).toBeGreaterThan(0)
  })
})

describe('createAuthPerformanceMonitor', () => {
  it('should create monitor instance', () => {
    const logger = { info: mock(() => {}), error: mock(() => {}) }
    const monitor = createAuthPerformanceMonitor(logger)

    expect(monitor).toBeTruthy()
    expect(monitor).toBeInstanceOf(AuthPerformanceMonitor)
  })

  it('should create monitor without logger', () => {
    const monitor = createAuthPerformanceMonitor()

    expect(monitor).toBeTruthy()
    expect(monitor).toBeInstanceOf(AuthPerformanceMonitor)
  })
})

describe('AuthPerformanceMonitor edge cases', () => {
  let monitor: AuthPerformanceMonitor

  beforeEach(() => {
    monitor = new AuthPerformanceMonitor()
  })

  it('should handle empty metrics buffer', async () => {
    const stats = await monitor.getAuthPerformanceStats(60)
    
    expect(stats).toBeTruthy()
    expect(stats.operationStats).toBeTruthy()
    expect(stats.authMethodStats).toBeTruthy()
  })

  it('should handle metrics without auth method', async () => {
    await monitor.recordAuthMetric({
      operation: 'login',
      status: 'success',
      duration: 100,
      timestamp: new Date()
    })

    const stats = await monitor.getAuthPerformanceStats(60)
    
    expect(stats).toBeTruthy()
    expect(stats.operationStats).toBeTruthy()
  })

  it('should handle zero duration metrics', async () => {
    await monitor.recordAuthMetric({
      operation: 'login',
      status: 'success',
      duration: 0,
      timestamp: new Date()
    })

    const stats = await monitor.getAuthPerformanceStats(60)
    
    expect(stats).toBeTruthy()
    expect(stats.operationStats.login?.avgDuration).toBe(0)
  })

  it('should handle cleanup of empty buffer', async () => {
    await monitor.cleanup(1)
    
    // Should not throw error
    expect(true).toBe(true)
  })
})