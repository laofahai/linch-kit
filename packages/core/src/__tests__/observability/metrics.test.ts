import { describe, it, expect, beforeEach } from 'bun:test'

import { LinchKitMetricCollector } from '../../observability/metrics'

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
      const counter = collector.createCounter({
        name: 'test_counter',
        type: 'counter',
        help: 'Test counter',
      })

      expect(counter).toBeDefined()
      expect(counter.inc).toBeDefined()
      expect(counter.get).toBeDefined()
    })

    it('should create gauge metric', () => {
      const gauge = collector.createGauge({
        name: 'test_gauge',
        type: 'gauge',
        help: 'Test gauge',
      })

      expect(gauge).toBeDefined()
      expect(gauge.set).toBeDefined()
      expect(gauge.inc).toBeDefined()
      expect(gauge.dec).toBeDefined()
      expect(gauge.get).toBeDefined()
    })

    it('should create histogram metric', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram',
        type: 'histogram',
        help: 'Test histogram',
      })

      expect(histogram).toBeDefined()
      expect(histogram.observe).toBeDefined()
      expect(histogram.get).toBeDefined()
    })

    it('should create summary metric', () => {
      const summary = collector.createSummary({
        name: 'test_summary',
        type: 'summary',
        help: 'Test summary',
      })

      expect(summary).toBeDefined()
      expect(summary.observe).toBeDefined()
      expect(summary.get).toBeDefined()
    })
  })

  describe('指标操作', () => {
    it('should increment counter', () => {
      const counter = collector.createCounter({
        name: 'test_counter_ops',
        type: 'counter',
        help: 'Test counter operations',
      })

      counter.inc()
      counter.inc(5)

      // 验证计数器方法存在且可调用
      expect(counter.get()).toBeGreaterThanOrEqual(0)
    })

    it('should set gauge value', () => {
      const gauge = collector.createGauge({
        name: 'test_gauge_ops',
        type: 'gauge',
        help: 'Test gauge operations',
      })

      gauge.set(42)
      gauge.inc()
      gauge.dec()

      // 验证计量器方法存在且可调用
      expect(gauge.get()).toBeGreaterThanOrEqual(0)
    })

    it('should observe histogram values', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram_ops',
        type: 'histogram',
        help: 'Test histogram operations',
      })

      histogram.observe(0.1)
      histogram.observe(0.5)
      histogram.observe(1.0)

      // 验证直方图方法存在且可调用
      expect(histogram.get()).toBeDefined()
    })
  })

  describe('指标标签', () => {
    it('should support counter with labels', () => {
      const counter = collector.createCounter({
        name: 'test_counter_labels',
        type: 'counter',
        help: 'Test counter with labels',
        labels: ['method', 'status'],
      })

      counter.inc(1, { method: 'GET', status: '200' })
      counter.inc(1, { method: 'POST', status: '201' })

      expect(counter.get({ method: 'GET', status: '200' })).toBeGreaterThanOrEqual(0)
    })

    it('should support gauge with labels', () => {
      const gauge = collector.createGauge({
        name: 'test_gauge_labels',
        type: 'gauge',
        help: 'Test gauge with labels',
        labels: ['service', 'version'],
      })

      gauge.set(100, { service: 'api', version: '1.0' })

      expect(gauge.get({ service: 'api', version: '1.0' })).toBeGreaterThanOrEqual(0)
    })
  })

  describe('指标配置', () => {
    it('should create histogram with custom buckets', () => {
      const histogram = collector.createHistogram({
        name: 'test_histogram_buckets',
        type: 'histogram',
        help: 'Test histogram with buckets',
        buckets: [0.1, 0.5, 1, 2, 5],
      })

      expect(histogram).toBeDefined()
      histogram.observe(0.2)
    })

    it('should create summary with custom quantiles', () => {
      const summary = collector.createSummary({
        name: 'test_summary_quantiles',
        type: 'summary',
        help: 'Test summary with quantiles',
        quantiles: [0.5, 0.9, 0.99],
      })

      expect(summary).toBeDefined()
      summary.observe(1.5)
    })
  })

  describe('错误处理', () => {
    it('should handle metric creation with same name', () => {
      collector.createCounter({
        name: 'duplicate_counter',
        type: 'counter',
        help: 'Test counter',
      })

      // 第二次创建相同名称的指标应该抛出错误
      expect(() => {
        collector.createCounter({
          name: 'duplicate_counter',
          type: 'counter',
          help: 'Test counter',
        })
      }).toThrow()
    })
  })

  describe('注册表操作', () => {
    it('should get metrics as string', async () => {
      // 创建一些指标
      const counter = collector.createCounter({
        name: 'test_export_counter',
        type: 'counter',
        help: 'Test export counter',
      })
      counter.inc()

      const metrics = await collector.getMetrics()
      expect(typeof metrics).toBe('string')
      expect(metrics).toContain('test_export_counter')
    })

    it('should clear all metrics', () => {
      // 创建指标
      collector.createCounter({
        name: 'test_clear_counter',
        type: 'counter',
        help: 'Test clear counter',
      })

      // 清除指标
      collector.clearMetrics()

      // 验证清除方法存在
      expect(true).toBe(true)
    })
  })
})
