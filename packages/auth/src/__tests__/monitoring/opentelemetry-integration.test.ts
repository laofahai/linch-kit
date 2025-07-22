import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import {
  OpenTelemetryAuthPerformanceMonitor,
  createOpenTelemetryAuthPerformanceMonitor,
  defaultOpenTelemetryConfig,
  AUTH_METRICS,
  type OpenTelemetryConfig
} from '../../monitoring/opentelemetry-integration'
import type { AuthMetrics, IAuthPerformanceMonitor } from '../../monitoring/auth-metrics'

// Mock OpenTelemetry API
const mockMeter = {
  createCounter: mock(() => ({
    add: mock(() => {})
  })),
  createHistogram: mock(() => ({
    record: mock(() => {})
  })),
  createUpDownCounter: mock(() => ({
    add: mock(() => {})
  }))
}

const mockMetrics = {
  getMeter: mock(() => mockMeter)
}

// Mock fallback monitor
const mockFallbackMonitor = {
  recordMetric: mock(async () => {}),
  getPerformanceStats: mock(async () => ({
    totalRequests: 100,
    successRequests: 95,
    failureRequests: 3,
    errorRequests: 2,
    successRate: 0.95,
    averageResponseTime: 150,
    p95ResponseTime: 300,
    p99ResponseTime: 500,
    windowStart: new Date(Date.now() - 3600000),
    windowEnd: new Date()
  })),
  startTimer: mock(() => ({
    operation: 'login',
    startTime: Date.now(),
    success: mock(async () => {}),
    failure: mock(async () => {}),
    error: mock(async () => {})
  })),
  cleanup: mock(async () => {})
}

// Mock auth-metrics import
mock.module('../monitoring/auth-metrics', () => ({
  InMemoryAuthPerformanceMonitor: class MockInMemoryAuthPerformanceMonitor {
    constructor() {
      return mockFallbackMonitor
    }
  }
}))

// Mock logger
const mockLogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
}

describe('OpenTelemetry Integration', () => {
  let monitor: OpenTelemetryAuthPerformanceMonitor
  let config: OpenTelemetryConfig

  beforeEach(() => {
    // Reset all mocks
    mockLogger.info.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.error.mockClear()
    mockMeter.createCounter.mockClear()
    mockMeter.createHistogram.mockClear()
    mockMeter.createUpDownCounter.mockClear()
    mockMetrics.getMeter.mockClear()
    mockFallbackMonitor.recordMetric.mockClear()
    mockFallbackMonitor.getPerformanceStats.mockClear()
    mockFallbackMonitor.startTimer.mockClear()
    mockFallbackMonitor.cleanup.mockClear()

    config = {
      serviceName: 'test-auth-service',
      serviceVersion: '1.0.0',
      environment: 'test',
      enableMetrics: true,
      enableTraces: true,
      enableLogs: true,
      attributes: {
        'service.region': 'us-east-1',
        'service.instance': 'auth-01'
      }
    }
  })

  afterEach(() => {
    // 确保资源清理
    if (monitor) {
      monitor.cleanup()
    }
  })

  describe('构造函数和初始化', () => {
    it('应该正确创建OpenTelemetry监控器', () => {
      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)

      expect(monitor).toBeInstanceOf(OpenTelemetryAuthPerformanceMonitor)
    })

    it('应该合并默认配置', () => {
      const partialConfig = {
        serviceName: 'partial-service'
      }

      monitor = new OpenTelemetryAuthPerformanceMonitor(partialConfig, mockLogger)

      expect(monitor).toBeDefined()
      // 通过创建成功来验证配置合并
    })

    it('应该处理OpenTelemetry不可用的情况', async () => {
      // Mock OpenTelemetry导入失败
      const originalImport = global.import
      global.import = mock(() => Promise.reject(new Error('OpenTelemetry not available')))

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)

      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'OpenTelemetry not available, falling back to in-memory monitoring',
        expect.any(Object)
      )

      global.import = originalImport
    })

    it('应该在成功初始化时记录日志', async () => {
      // Mock successful OpenTelemetry import
      const originalImport = global.import
      global.import = mock((module) => {
        if (module === '@opentelemetry/api') {
          return Promise.resolve({ metrics: mockMetrics })
        }
        return originalImport(module)
      })

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)

      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockLogger.info).toHaveBeenCalledWith(
        'OpenTelemetry metrics initialized successfully',
        expect.objectContaining({
          serviceName: config.serviceName,
          serviceVersion: config.serviceVersion,
          environment: config.environment
        })
      )

      global.import = originalImport
    })
  })

  describe('指标记录', () => {
    beforeEach(async () => {
      // Mock successful OpenTelemetry initialization
      const originalImport = global.import
      global.import = mock((module) => {
        if (module === '@opentelemetry/api') {
          return Promise.resolve({ metrics: mockMetrics })
        }
        return originalImport(module)
      })

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      
      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 10))
      
      global.import = originalImport
    })

    it('应该记录成功的认证指标', async () => {
      const metric: AuthMetrics = {
        operation: 'login',
        status: 'success',
        duration: 150,
        userId: 'test-user-id',
        timestamp: new Date(),
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: 'test-agent'
        }
      }

      await monitor.recordMetric(metric)

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        AUTH_METRICS.AUTH_OPERATIONS_TOTAL,
        expect.any(Object)
      )
      expect(mockMeter.createHistogram).toHaveBeenCalledWith(
        AUTH_METRICS.AUTH_OPERATION_DURATION,
        expect.any(Object)
      )
    })

    it('应该记录失败的认证指标', async () => {
      const metric: AuthMetrics = {
        operation: 'login',
        status: 'failure',
        duration: 50,
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Invalid username or password',
        timestamp: new Date()
      }

      await monitor.recordMetric(metric)

      // 验证指标创建调用
      expect(mockMeter.createCounter).toHaveBeenCalled()
      expect(mockMeter.createHistogram).toHaveBeenCalled()
    })

    it('应该记录错误指标', async () => {
      const metric: AuthMetrics = {
        operation: 'validate_token',
        status: 'error',
        duration: 25,
        errorCode: 'JWT_EXPIRED',
        errorMessage: 'Token has expired',
        timestamp: new Date()
      }

      await monitor.recordMetric(metric)

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        AUTH_METRICS.AUTH_ERRORS_TOTAL,
        expect.any(Object)
      )
    })

    it('应该在指标记录失败时记录错误日志', async () => {
      // Mock meter方法抛出错误
      mockMeter.createCounter.mockImplementation(() => {
        throw new Error('Meter error')
      })

      const metric: AuthMetrics = {
        operation: 'login',
        status: 'success',
        duration: 100,
        timestamp: new Date()
      }

      await monitor.recordMetric(metric)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to record OpenTelemetry metric',
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('应该在OpenTelemetry不可用时使用fallback', async () => {
      // 创建没有OpenTelemetry的监控器
      const originalImport = global.import
      global.import = mock(() => Promise.reject(new Error('OpenTelemetry not available')))

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)

      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 10))

      const metric: AuthMetrics = {
        operation: 'login',
        status: 'success',
        duration: 100,
        timestamp: new Date()
      }

      await monitor.recordMetric(metric)

      expect(mockFallbackMonitor.recordMetric).toHaveBeenCalledWith(metric)

      global.import = originalImport
    })
  })

  describe('计时器功能', () => {
    beforeEach(async () => {
      // Mock successful OpenTelemetry initialization
      const originalImport = global.import
      global.import = mock((module) => {
        if (module === '@opentelemetry/api') {
          return Promise.resolve({ metrics: mockMetrics })
        }
        return originalImport(module)
      })

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      await new Promise(resolve => setTimeout(resolve, 10))
      global.import = originalImport
    })

    it('应该创建有效的计时器', () => {
      const timer = monitor.startTimer('login', {
        ipAddress: '192.168.1.100'
      })

      expect(timer).toBeDefined()
      expect(timer.operation).toBe('login')
      expect(timer.startTime).toBeTypeOf('number')
      expect(timer.metadata).toEqual({
        ipAddress: '192.168.1.100'
      })
    })

    it('应该正确记录成功操作', async () => {
      const timer = monitor.startTimer('login')
      
      // 模拟一些处理时间
      await new Promise(resolve => setTimeout(resolve, 50))
      
      await timer.success('test-user-id', { sessionId: 'session-123' })

      // 验证指标记录被调用
      expect(mockMeter.createCounter).toHaveBeenCalled()
      expect(mockMeter.createHistogram).toHaveBeenCalled()
    })

    it('应该正确记录失败操作', async () => {
      const timer = monitor.startTimer('login')
      
      await timer.failure('INVALID_CREDENTIALS', 'Wrong password')

      // 验证指标记录被调用
      expect(mockMeter.createCounter).toHaveBeenCalled()
      expect(mockMeter.createHistogram).toHaveBeenCalled()
    })

    it('应该正确记录错误操作', async () => {
      const timer = monitor.startTimer('validate_token')
      
      const error = new Error('JWT verification failed')
      await timer.error(error)

      // 验证指标记录被调用
      expect(mockMeter.createCounter).toHaveBeenCalled()
      expect(mockMeter.createHistogram).toHaveBeenCalled()
    })
  })

  describe('性能统计', () => {
    it('应该委托给fallback监控器获取统计数据', async () => {
      const originalImport = global.import
      global.import = mock(() => Promise.reject(new Error('OpenTelemetry not available')))

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      await new Promise(resolve => setTimeout(resolve, 10))

      const stats = await monitor.getPerformanceStats(60)

      expect(mockFallbackMonitor.getPerformanceStats).toHaveBeenCalledWith(60)
      expect(stats.totalRequests).toBe(100)
      expect(stats.successRate).toBe(0.95)

      global.import = originalImport
    })

    it('应该在没有fallback时返回空统计', async () => {
      const originalImport = global.import
      global.import = mock((module) => {
        if (module === '@opentelemetry/api') {
          return Promise.resolve({ metrics: mockMetrics })
        }
        return originalImport(module)
      })

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      await new Promise(resolve => setTimeout(resolve, 10))

      const stats = await monitor.getPerformanceStats(60)

      expect(stats.totalRequests).toBe(0)
      expect(stats.successRequests).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.windowStart).toBeInstanceOf(Date)
      expect(stats.windowEnd).toBeInstanceOf(Date)

      global.import = originalImport
    })
  })

  describe('资源清理', () => {
    it('应该正确清理资源', async () => {
      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      
      await monitor.cleanup(24)

      // OpenTelemetry指标无需清理，但如果有fallback应该清理
      // 验证不会抛出错误
      expect(monitor).toBeDefined()
    })

    it('应该清理fallback监控器', async () => {
      const originalImport = global.import
      global.import = mock(() => Promise.reject(new Error('OpenTelemetry not available')))

      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      await new Promise(resolve => setTimeout(resolve, 10))

      await monitor.cleanup(48)

      expect(mockFallbackMonitor.cleanup).toHaveBeenCalledWith(48)

      global.import = originalImport
    })
  })

  describe('工厂函数', () => {
    it('应该通过工厂函数创建监控器', () => {
      const createdMonitor = createOpenTelemetryAuthPerformanceMonitor(config, mockLogger)

      expect(createdMonitor).toBeInstanceOf(OpenTelemetryAuthPerformanceMonitor)
    })

    it('应该使用默认配置', () => {
      expect(defaultOpenTelemetryConfig.serviceName).toBe('linchkit-auth')
      expect(defaultOpenTelemetryConfig.serviceVersion).toBe('2.0.3')
      expect(defaultOpenTelemetryConfig.enableMetrics).toBe(true)
      expect(defaultOpenTelemetryConfig.enableTraces).toBe(true)
      expect(defaultOpenTelemetryConfig.enableLogs).toBe(true)
    })

    it('应该正确设置环境变量默认值', () => {
      // 保存原始环境变量
      const originalNodeEnv = process.env.NODE_ENV

      // 测试开发环境
      process.env.NODE_ENV = 'development'
      expect(defaultOpenTelemetryConfig.environment).toBe('development')

      // 测试生产环境
      process.env.NODE_ENV = 'production'
      const prodConfig = {
        ...defaultOpenTelemetryConfig,
        environment: process.env.NODE_ENV || 'development'
      }
      expect(prodConfig.environment).toBe('production')

      // 恢复原始环境变量
      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('指标名称常量', () => {
    it('应该定义正确的指标名称', () => {
      expect(AUTH_METRICS.AUTH_OPERATIONS_TOTAL).toBe('linchkit_auth_operations_total')
      expect(AUTH_METRICS.AUTH_OPERATION_DURATION).toBe('linchkit_auth_operation_duration_milliseconds')
      expect(AUTH_METRICS.AUTH_SUCCESS_RATE).toBe('linchkit_auth_success_rate')
      expect(AUTH_METRICS.AUTH_ACTIVE_SESSIONS).toBe('linchkit_auth_active_sessions_total')
      expect(AUTH_METRICS.AUTH_ERRORS_TOTAL).toBe('linchkit_auth_errors_total')
    })

    it('应该使用LinchKit前缀', () => {
      Object.values(AUTH_METRICS).forEach(metricName => {
        expect(metricName).toMatch(/^linchkit_auth_/)
      })
    })
  })

  describe('配置验证', () => {
    it('应该处理最小配置', () => {
      const minimalConfig = {
        serviceName: 'minimal-service'
      }

      expect(() => {
        monitor = new OpenTelemetryAuthPerformanceMonitor(minimalConfig, mockLogger)
      }).not.toThrow()
    })

    it('应该处理完整配置', () => {
      const fullConfig: OpenTelemetryConfig = {
        serviceName: 'full-service',
        serviceVersion: '2.1.0',
        environment: 'staging',
        enableMetrics: true,
        enableTraces: false,
        enableLogs: true,
        attributes: {
          'service.namespace': 'linchkit',
          'service.instance.id': 'auth-instance-01',
          'deployment.environment': 'staging'
        }
      }

      expect(() => {
        monitor = new OpenTelemetryAuthPerformanceMonitor(fullConfig, mockLogger)
      }).not.toThrow()
    })

    it('应该正确处理禁用的功能', () => {
      const disabledConfig = {
        serviceName: 'disabled-service',
        enableMetrics: false,
        enableTraces: false,
        enableLogs: false
      }

      expect(() => {
        monitor = new OpenTelemetryAuthPerformanceMonitor(disabledConfig, mockLogger)
      }).not.toThrow()
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理计时器错误', async () => {
      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)
      const timer = monitor.startTimer('login')

      // 模拟记录指标时的错误
      const originalRecordMetric = monitor.recordMetric
      monitor.recordMetric = mock().mockRejectedValue(new Error('Record error'))

      await expect(timer.success('user-id')).resolves.toBeUndefined()
      await expect(timer.failure('INVALID', 'Error')).resolves.toBeUndefined()
      await expect(timer.error(new Error('Test'))).resolves.toBeUndefined()

      // 恢复原方法
      monitor.recordMetric = originalRecordMetric
    })

    it('应该处理无效的指标数据', async () => {
      monitor = new OpenTelemetryAuthPerformanceMonitor(config, mockLogger)

      const invalidMetric: AuthMetrics = {
        operation: 'login',
        status: 'success',
        duration: -1, // 无效持续时间
        timestamp: new Date('invalid'), // 无效时间戳
        metadata: {
          invalidKey: undefined,
          circularRef: {} as any
        }
      }

      // 设置循环引用
      invalidMetric.metadata!.circularRef = invalidMetric

      // 应该不抛出异常
      await expect(monitor.recordMetric(invalidMetric)).resolves.toBeUndefined()
    })
  })
})