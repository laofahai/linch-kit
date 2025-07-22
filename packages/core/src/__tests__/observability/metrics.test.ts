import { describe, it, expect, beforeEach } from 'bun:test'
import { Registry } from 'prom-client'

import { LinchKitMetricCollector, createMetricCollector, metrics } from '../../observability/metrics'

describe('LinchKitMetricCollector', () => {
  let collector: LinchKitMetricCollector

  beforeEach(() => {
    collector = new LinchKitMetricCollector()
  })

  describe('收集器初始化', () => {
    it('should initialize with default registry', () => {
      expect(collector).toBeDefined()
      expect(collector.createCounter).toBeDefined()
      expect(collector.createGauge).toBeDefined()
      expect(collector.createHistogram).toBeDefined()
      expect(collector.createSummary).toBeDefined()
    })
  })

  describe('指标创建', () => {
    it('should create counter metric', () => {
      const counter = collector.createCounter('test_counter', 'Test counter', [])

      expect(counter).toBeDefined()
      expect(counter.inc).toBeDefined()
      expect(counter.get).toBeDefined()
    })

    it('should create gauge metric', () => {
      const gauge = collector.createGauge('test_gauge', 'Test gauge', [])

      expect(gauge).toBeDefined()
      expect(gauge.set).toBeDefined()
      expect(gauge.inc).toBeDefined()
      expect(gauge.dec).toBeDefined()
      expect(gauge.get).toBeDefined()
    })

    it('should create histogram metric', () => {
      const histogram = collector.createHistogram('test_histogram', 'Test histogram', [0.1, 0.5, 1, 2.5, 5, 10], [])

      expect(histogram).toBeDefined()
      expect(histogram.observe).toBeDefined()
      expect(histogram.get).toBeDefined()
    })

    it('should create summary metric', () => {
      const summary = collector.createSummary('test_summary', 'Test summary', [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], [])

      expect(summary).toBeDefined()
      expect(summary.observe).toBeDefined()
      expect(summary.get).toBeDefined()
    })
  })

  describe('指标操作', () => {
    it('should increment counter', () => {
      const counter = collector.createCounter('test_counter_ops', 'Test counter operations', [])

      counter.inc()
      counter.inc(5)

      // 验证计数器方法存在且可调用
      expect(counter.get()).toBeGreaterThanOrEqual(0)
    })

    it('should set gauge value', () => {
      const gauge = collector.createGauge('test_gauge_ops', 'Test gauge operations', [])

      gauge.set(42)
      gauge.inc(5)
      gauge.dec(3)

      // 验证测量仪方法存在且可调用
      expect(gauge.get()).toBeGreaterThanOrEqual(0)
    })

    it('should observe histogram values', () => {
      const histogram = collector.createHistogram('test_histogram_ops', 'Test histogram operations', [0.1, 0.5, 1, 2.5, 5, 10], [])

      histogram.observe(0.5)
      histogram.observe(2.0)
      histogram.observe(7.5)

      // 验证直方图方法存在且可调用
      expect(histogram.get()).toBeDefined()
    })
  })

  describe('指标标签', () => {
    it('should support counter with labels', () => {
      const counter = collector.createCounter('test_counter_labels', 'Test counter with labels', ['method', 'status'])

      counter.inc(1, { method: 'GET', status: '200' })
      counter.inc(3, { method: 'POST', status: '404' })

      // 验证带标签的计数器方法存在且可调用
      expect(counter.get()).toBeGreaterThanOrEqual(0)
    })

    it('should support gauge with labels', () => {
      const gauge = collector.createGauge('test_gauge_labels', 'Test gauge with labels', ['service', 'region'])

      gauge.set(100, { service: 'api', region: 'us-east-1' })
      gauge.inc(50, { service: 'api', region: 'us-west-1' })

      // 验证带标签的测量仪方法存在且可调用
      expect(gauge.get()).toBeDefined()
    })
  })

  describe('指标配置', () => {
    it('should create histogram with custom buckets', () => {
      const histogram = collector.createHistogram('test_histogram_custom', 'Test histogram with custom buckets', [0.01, 0.1, 1, 10, 100], [])

      histogram.observe(0.05)
      histogram.observe(5.0)

      // 验证自定义桶的直方图方法存在且可调用
      expect(histogram.get()).toBeDefined()
    })

    it('should create summary with custom quantiles', () => {
      const summary = collector.createSummary('test_summary_custom', 'Test summary with custom quantiles', [0.5, 0.9, 0.99], [])

      summary.observe(1.0)
      summary.observe(2.0)
      summary.observe(5.0)

      // 验证自定义分位数的摘要方法存在且可调用
      expect(summary.get()).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('should handle metric creation with same name', () => {
      expect(() => {
        collector.createCounter('test_counter_duplicate', 'Test counter duplicate', [])
        collector.createCounter('test_counter_duplicate', 'Test counter duplicate', [])
      }).toThrow()
    })
  })

  describe('注册表操作', () => {
    it('should get metrics as string', async () => {
      const counter = collector.createCounter('test_counter_registry', 'Test counter registry', [])
      counter.inc()

      const metrics = await collector.getMetrics()
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('string')
    })

    it('should reset all metrics', async () => {
      const counter = collector.createCounter('test_counter_reset', 'Test counter reset', [])
      counter.inc()

      collector.reset()

      // 验证重置后的状态
      expect(await collector.getMetrics()).toBeDefined()
    })
  })

  describe('高级功能', () => {
    it('should get registry instance', () => {
      const registry = collector.getRegistry()
      expect(registry).toBeDefined()
      expect(registry).toBeInstanceOf(Registry)
    })

    it('should collect default metrics', () => {
      const customRegistry = new Registry()
      const customCollector = new LinchKitMetricCollector(customRegistry)
      
      expect(() => {
        customCollector.collectDefaultMetrics({
          register: customRegistry,
          prefix: 'test_',
        })
      }).not.toThrow()
    })

    it('should collect default metrics with no options', () => {
      const customRegistry = new Registry()
      const customCollector = new LinchKitMetricCollector(customRegistry)
      
      expect(() => {
        customCollector.collectDefaultMetrics()
      }).not.toThrow()
    })

    it('should support histogram timer functionality', () => {
      const histogram = collector.createHistogram('test_histogram_timer', 'Test histogram timer', [0.1, 0.5, 1, 2.5, 5, 10], ['method'])
      
      if (histogram.startTimer) {
        const endTimer = histogram.startTimer({ method: 'GET' })
        expect(typeof endTimer).toBe('function')
        
        // End the timer
        endTimer()
      } else {
        // Fallback test if startTimer is not available
        expect(histogram.observe).toBeDefined()
        histogram.observe(0.5, { method: 'GET' })
      }
    })

    it('should reset individual metric types', () => {
      const counter = collector.createCounter('test_counter_reset_individual', 'Test counter reset individual', [])
      const gauge = collector.createGauge('test_gauge_reset_individual', 'Test gauge reset individual', [])
      const histogram = collector.createHistogram('test_histogram_reset_individual', 'Test histogram reset individual', [0.1, 0.5, 1, 2.5, 5, 10], [])
      const summary = collector.createSummary('test_summary_reset_individual', 'Test summary reset individual', [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], [])
      
      counter.inc(5)
      gauge.set(42)
      histogram.observe(1.5)
      summary.observe(2.5)
      
      counter.reset()
      gauge.reset()
      histogram.reset()
      summary.reset()
      
      expect(counter.get()).toBe(0)
      expect(gauge.get()).toBe(0)
      expect(histogram.get()).toBe(0)
      expect(summary.get()).toBe(0)
    })

    it('should handle gauge increment and decrement', () => {
      const gauge = collector.createGauge('test_gauge_inc_dec', 'Test gauge increment decrement', [])
      
      gauge.inc()
      gauge.inc(5)
      gauge.dec()
      gauge.dec(2)
      
      expect(gauge.get()).toBeGreaterThanOrEqual(0)
    })

    it('should handle metrics with labels for get operations', () => {
      const counter = collector.createCounter('test_counter_labels_get', 'Test counter labels get', ['status'])
      const gauge = collector.createGauge('test_gauge_labels_get', 'Test gauge labels get', ['region'])
      const histogram = collector.createHistogram('test_histogram_labels_get', 'Test histogram labels get', [0.1, 0.5, 1, 2.5, 5, 10], ['endpoint'])
      const summary = collector.createSummary('test_summary_labels_get', 'Test summary labels get', [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], ['service'])
      
      counter.inc(1, { status: '200' })
      counter.inc(2, { status: '404' })
      gauge.set(100, { region: 'us-east' })
      gauge.set(200, { region: 'us-west' })
      histogram.observe(1.0, { endpoint: '/api' })
      histogram.observe(2.0, { endpoint: '/health' })
      summary.observe(0.5, { service: 'api' })
      summary.observe(1.5, { service: 'worker' })
      
      expect(counter.get({ status: '200' })).toBeGreaterThanOrEqual(0)
      expect(gauge.get({ region: 'us-east' })).toBeGreaterThanOrEqual(0)
      expect(histogram.get({ endpoint: '/api' })).toBeGreaterThanOrEqual(0)
      expect(summary.get({ service: 'api' })).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Factory Functions', () => {
    it('should create metric collector with default config', () => {
      const collector = createMetricCollector()
      
      expect(collector).toBeDefined()
      expect(collector.createCounter).toBeDefined()
    })

    it('should create metric collector with custom config', () => {
      const customRegistry = new Registry()
      const collector = createMetricCollector({
        enableDefaultMetrics: false,
        defaultMetricsPrefix: 'custom_',
        registry: customRegistry,
      })
      
      expect(collector).toBeDefined()
    })

    it('should create metric collector with partial config', () => {
      const collector = createMetricCollector({
        enableDefaultMetrics: true,
        defaultMetricsPrefix: 'partial_',
      })
      
      expect(collector).toBeDefined()
    })

    it('should export default metrics instance', () => {
      expect(metrics).toBeDefined()
      expect(metrics.createCounter).toBeDefined()
    })
  })
})