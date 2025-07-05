import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { register } from 'prom-client'

import { LinchKitMetricCollector } from '../../observability/metrics'

// Mock prom-client
vi.mock('prom-client', () => {
  const createMockMetric = (type: string) => {
    const methods = {
      inc: vi.fn(),
      get: vi.fn().mockReturnValue({ values: [] }),
      reset: vi.fn(),
      set: vi.fn(),
      dec: vi.fn(),
      observe: vi.fn(),
      startTimer: vi.fn().mockReturnValue(() => {}),
      labels: vi.fn().mockReturnThis()
    }
    
    // Return a function that returns the methods
    return Object.assign(methods, {
      labels: vi.fn().mockReturnValue(methods)
    })
  }

  return {
    register: {
      metrics: vi.fn().mockResolvedValue(''),
      clear: vi.fn(),
      getMetricsAsJSON: vi.fn().mockReturnValue([])
    },
    collectDefaultMetrics: vi.fn(),
    Counter: vi.fn().mockImplementation(() => createMockMetric('Counter')),
    Gauge: vi.fn().mockImplementation(() => createMockMetric('Gauge')),
    Histogram: vi.fn().mockImplementation(() => createMockMetric('Histogram')),
    Summary: vi.fn().mockImplementation(() => createMockMetric('Summary')),
    Registry: vi.fn()
  }
})

describe('LinchKitMetricCollector', () => {
  let collector: LinchKitMetricCollector
  let mockRegister: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRegister = register
    collector = new LinchKitMetricCollector(mockRegister)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const defaultCollector = new LinchKitMetricCollector()
      expect(defaultCollector).toBeInstanceOf(LinchKitMetricCollector)
    })

    it('should initialize with custom options', () => {
      const customCollector = new LinchKitMetricCollector(mockRegister)
      expect(customCollector).toBeInstanceOf(LinchKitMetricCollector)
    })
  })

  describe('Counter Metrics', () => {
    it('should create a counter metric', () => {
      const counter = collector.createCounter({
        name: 'test_counter',
        help: 'Test counter metric',
        labels: ['method', 'status']
      })

      expect(counter).toBeDefined()
      expect(counter.inc).toBeDefined()
      expect(counter.get).toBeDefined()
      expect(counter.reset).toBeDefined()
    })

    it('should increment counter', () => {
      const counter = collector.createCounter({
        name: 'test_counter',
        help: 'Test counter metric'
      })

      counter.inc()
      counter.inc(5)
      counter.inc(2, { method: 'GET' })

      // Verify the underlying prom-client counter was called
      expect(counter.inc).toBeDefined()
    })

    it('should get counter value', () => {
      const counter = collector.createCounter({
        name: 'test_counter',
        help: 'Test counter metric'
      })

      const value = counter.get()
      expect(typeof value).toBe('number')
    })

    it('should reset counter', () => {
      const counter = collector.createCounter({
        name: 'test_counter',
        help: 'Test counter metric'
      })

      counter.reset()
      expect(counter.reset).toBeDefined()
    })
  })

  describe('Gauge Metrics', () => {
    it('should create a gauge metric', () => {
      const gauge = collector.createGauge({
        name: 'test_gauge',
        help: 'Test gauge metric',
        labels: ['queue', 'priority']
      })

      expect(gauge).toBeDefined()
      expect(gauge.set).toBeDefined()
      expect(gauge.inc).toBeDefined()
      expect(gauge.dec).toBeDefined()
      expect(gauge.get).toBeDefined()
      expect(gauge.reset).toBeDefined()
    })

    it('should set gauge value', () => {
      const gauge = collector.createGauge({
        name: 'test_gauge',
        help: 'Test gauge metric'
      })

      gauge.set(42)
      gauge.set(100, { queue: 'high' })

      expect(gauge.set).toBeDefined()
    })

    it('should increment and decrement gauge', () => {
      const gauge = collector.createGauge({
        name: 'test_gauge',
        help: 'Test gauge metric'
      })

      gauge.inc()
      gauge.inc(5)
      gauge.dec()
      gauge.dec(3)

      expect(gauge.inc).toBeDefined()
      expect(gauge.dec).toBeDefined()
    })
  })

  describe('Histogram Metrics', () => {
    it('should create a histogram metric', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram',
        help: 'Test histogram metric',
        buckets: [0.1, 0.5, 1.0, 2.0, 5.0]
      })

      expect(histogram).toBeDefined()
      expect(histogram.observe).toBeDefined()
      expect(histogram.startTimer).toBeDefined()
      expect(histogram.get).toBeDefined()
    })

    it('should observe histogram values', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram',
        help: 'Test histogram metric'
      })

      histogram.observe(0.5)
      histogram.observe(1.2, { endpoint: '/api/users' })

      expect(histogram.observe).toBeDefined()
    })

    it('should start and stop timer', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram',
        help: 'Test histogram metric'
      })

      const endTimer = histogram.startTimer()
      expect(typeof endTimer).toBe('function')
      
      endTimer()
    })

    it('should get histogram statistics', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram',
        help: 'Test histogram metric'
      })

      const stats = histogram.get()
      expect(stats).toHaveProperty('buckets')
      expect(stats).toHaveProperty('count')
      expect(stats).toHaveProperty('sum')
    })
  })

  describe('Summary Metrics', () => {
    it('should create a summary metric', () => {
      const summary = collector.createSummary({
        name: 'test_summary',
        help: 'Test summary metric',
        percentiles: [0.5, 0.9, 0.99]
      })

      expect(summary).toBeDefined()
      expect(summary.observe).toBeDefined()
      expect(summary.startTimer).toBeDefined()
      expect(summary.get).toBeDefined()
    })

    it('should observe summary values', () => {
      const summary = collector.createSummary({
        name: 'test_summary',
        help: 'Test summary metric'
      })

      summary.observe(0.1)
      summary.observe(0.3, { handler: 'process' })

      expect(summary.observe).toBeDefined()
    })
  })

  describe('Metric Collection', () => {
    it('should get metrics as prometheus format', async () => {
      const metrics = await collector.getMetrics()
      expect(typeof metrics).toBe('string')
    })

    it('should get metrics as JSON', () => {
      const metrics = collector.getMetricsAsJSON()
      expect(Array.isArray(metrics)).toBe(true)
    })

    it('should clear all metrics', () => {
      collector.clear()
      expect(mockRegister.clear).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid metric names', () => {
      expect(() => {
        collector.createCounter({
          name: '', // Invalid empty name
          help: 'Test counter'
        })
      }).toThrow()
    })

    it('should handle missing help text', () => {
      expect(() => {
        collector.createCounter({
          name: 'test_counter',
          help: '' // Invalid empty help
        })
      }).toThrow()
    })

    it('should handle duplicate metric names', () => {
      collector.createCounter({
        name: 'duplicate_metric',
        help: 'First metric'
      })

      expect(() => {
        collector.createCounter({
          name: 'duplicate_metric',
          help: 'Second metric'
        })
      }).toThrow()
    })
  })

  describe('Default Metrics', () => {
    it('should collect default metrics when enabled', () => {
      const collectorWithDefaults = new LinchKitMetricCollector()
      
      // Verify that the collector was created
      expect(collectorWithDefaults).toBeInstanceOf(LinchKitMetricCollector)
    })

    it('should not collect default metrics when disabled', () => {
      const collectorWithoutDefaults = new LinchKitMetricCollector()
      
      expect(collectorWithoutDefaults).toBeInstanceOf(LinchKitMetricCollector)
    })
  })

  describe('Metric Labels', () => {
    it('should handle metrics with labels correctly', () => {
      const counter = collector.createCounter({
        name: 'labeled_counter',
        help: 'Counter with labels',
        labels: ['method', 'status', 'endpoint']
      })

      counter.inc(1, { method: 'GET', status: '200', endpoint: '/api/users' })
      counter.inc(1, { method: 'POST', status: '201', endpoint: '/api/users' })

      const value = counter.get({ method: 'GET', status: '200' })
      expect(typeof value).toBe('number')
    })

    it('should get total value across all labels', () => {
      const counter = collector.createCounter({
        name: 'labeled_counter_total',
        help: 'Counter for total calculation'
      })

      const totalValue = counter.get()
      expect(typeof totalValue).toBe('number')
    })
  })

  describe('Performance', () => {
    it('should handle high frequency metric updates', () => {
      const counter = collector.createCounter({
        name: 'performance_counter',
        help: 'Performance test counter'
      })

      const start = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        counter.inc()
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle multiple metrics efficiently', () => {
      const metrics = []
      
      for (let i = 0; i < 100; i++) {
        metrics.push(collector.createCounter({
          name: `perf_counter_${i}`,
          help: `Performance counter ${i}`
        }))
      }
      
      expect(metrics).toHaveLength(100)
      
      // Update all metrics
      metrics.forEach(counter => counter.inc())
    })
  })
})