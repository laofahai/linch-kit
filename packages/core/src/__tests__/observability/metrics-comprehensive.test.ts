/**
 * Metrics系统综合测试 - 边缘用例覆盖率提升
 * 测试高级指标收集、聚合、导出等功能
 */
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'
import { MetricsCollector, createMetrics } from '../../observability/metrics'

// Mock performance for testing
const mockPerformance = {
  now: mock(() => Date.now()),
  mark: mock(() => {}),
  measure: mock(() => ({ duration: 100 }))
}

// Mock process.hrtime for high resolution timing
const mockHrtime = mock(() => [1, 234567890]) // 1.234567890 seconds
mock.module('process', () => ({
  hrtime: mockHrtime
}))

describe('Metrics System - Comprehensive Edge Cases', () => {
  let metricsCollector: MetricsCollector
  let consoleSpies: {
    warn: typeof console.warn
    error: typeof console.error
  }

  beforeEach(() => {
    // Setup console spies
    consoleSpies = {
      warn: spyOn(console, 'warn').mockImplementation(() => {}),
      error: spyOn(console, 'error').mockImplementation(() => {})
    }

    metricsCollector = new MetricsCollector()
    
    // Reset mocks
    mockPerformance.now.mockClear()
    mockPerformance.mark.mockClear()
    mockPerformance.measure.mockClear()
    mockHrtime.mockClear()
    
    // Mock global performance if available
    if (typeof globalThis.performance !== 'undefined') {
      Object.assign(globalThis.performance, mockPerformance)
    }
  })

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach(spy => spy.mockRestore())
    
    metricsCollector.reset()
  })

  describe('Counter Edge Cases', () => {
    it('应该处理负数增量', () => {
      metricsCollector.incrementCounter('test-counter', -5)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.counters['test-counter']).toBe(-5)
    })

    it('应该处理非数字增量', () => {
      metricsCollector.incrementCounter('test-counter', NaN)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.counters['test-counter']).toBeNaN()
    })

    it('应该处理Infinity增量', () => {
      metricsCollector.incrementCounter('test-counter', Infinity)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.counters['test-counter']).toBe(Infinity)
    })

    it('应该累加多次增量', () => {
      metricsCollector.incrementCounter('cumulative-counter', 1)
      metricsCollector.incrementCounter('cumulative-counter', 2.5)
      metricsCollector.incrementCounter('cumulative-counter', -0.5)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.counters['cumulative-counter']).toBe(3)
    })

    it('应该处理特殊字符Counter名称', () => {
      const specialNames = ['', '  ', '中文名称', 'name-with-special-chars!@#$%^&*()']
      
      specialNames.forEach(name => {
        metricsCollector.incrementCounter(name, 1)
      })
      
      const metrics = metricsCollector.getMetrics()
      specialNames.forEach(name => {
        expect(metrics.counters[name]).toBe(1)
      })
    })
  })

  describe('Gauge Edge Cases', () => {
    it('应该处理极端值', () => {
      metricsCollector.setGauge('extreme-gauge', Number.MAX_SAFE_INTEGER)
      metricsCollector.setGauge('min-gauge', Number.MIN_SAFE_INTEGER)
      metricsCollector.setGauge('tiny-gauge', Number.EPSILON)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.gauges['extreme-gauge']).toBe(Number.MAX_SAFE_INTEGER)
      expect(metrics.gauges['min-gauge']).toBe(Number.MIN_SAFE_INTEGER)
      expect(metrics.gauges['tiny-gauge']).toBe(Number.EPSILON)
    })

    it('应该处理特殊数字值', () => {
      metricsCollector.setGauge('nan-gauge', NaN)
      metricsCollector.setGauge('pos-inf-gauge', Infinity)
      metricsCollector.setGauge('neg-inf-gauge', -Infinity)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.gauges['nan-gauge']).toBeNaN()
      expect(metrics.gauges['pos-inf-gauge']).toBe(Infinity)
      expect(metrics.gauges['neg-inf-gauge']).toBe(-Infinity)
    })

    it('应该覆盖相同名称的Gauge', () => {
      metricsCollector.setGauge('overwrite-gauge', 10)
      metricsCollector.setGauge('overwrite-gauge', 20)
      metricsCollector.setGauge('overwrite-gauge', 30)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.gauges['overwrite-gauge']).toBe(30)
    })
  })

  describe('Histogram Edge Cases', () => {
    it('应该处理负数记录', () => {
      metricsCollector.recordHistogram('negative-histogram', -100)
      metricsCollector.recordHistogram('negative-histogram', -50)
      metricsCollector.recordHistogram('negative-histogram', -200)
      
      const metrics = metricsCollector.getMetrics()
      const histogram = metrics.histograms['negative-histogram']
      
      expect(histogram.count).toBe(3)
      expect(histogram.sum).toBe(-350)
      expect(histogram.min).toBe(-200)
      expect(histogram.max).toBe(-50)
      expect(histogram.avg).toBeCloseTo(-116.67, 2)
    })

    it('应该处理单个值的Histogram', () => {
      metricsCollector.recordHistogram('single-value', 42)
      
      const metrics = metricsCollector.getMetrics()
      const histogram = metrics.histograms['single-value']
      
      expect(histogram.count).toBe(1)
      expect(histogram.sum).toBe(42)
      expect(histogram.min).toBe(42)
      expect(histogram.max).toBe(42)
      expect(histogram.avg).toBe(42)
    }

    it('应该处理数值溢出', () => {
      // Add many large values to test potential overflow
      for (let i = 0; i < 1000; i++) {
        metricsCollector.recordHistogram('overflow-test', Number.MAX_SAFE_INTEGER / 1000)
      }
      
      const metrics = metricsCollector.getMetrics()
      const histogram = metrics.histograms['overflow-test']
      
      expect(histogram.count).toBe(1000)
      expect(histogram.sum).toBeCloseTo(Number.MAX_SAFE_INTEGER)
      expect(histogram.avg).toBeCloseTo(Number.MAX_SAFE_INTEGER / 1000)
    })

    it('应该处理NaN和Infinity值', () => {
      metricsCollector.recordHistogram('special-values', NaN)
      metricsCollector.recordHistogram('special-values', Infinity)
      metricsCollector.recordHistogram('special-values', -Infinity)
      metricsCollector.recordHistogram('special-values', 100)
      
      const metrics = metricsCollector.getMetrics()
      const histogram = metrics.histograms['special-values']
      
      expect(histogram.count).toBe(4)
      // Sum and avg behavior with NaN/Infinity depends on implementation
      expect(typeof histogram.sum).toBe('number')
      expect(typeof histogram.avg).toBe('number')
    })

    it('应该处理微小数精度', () => {
      const preciseValues = [0.1, 0.2, 0.3] // Known floating point precision issues
      
      preciseValues.forEach(value => {
        metricsCollector.recordHistogram('precision-test', value)
      })
      
      const metrics = metricsCollector.getMetrics()
      const histogram = metrics.histograms['precision-test']
      
      expect(histogram.count).toBe(3)
      expect(histogram.sum).toBeCloseTo(0.6, 10)
      expect(histogram.avg).toBeCloseTo(0.2, 10)
    })
  })

  describe('Timing Edge Cases', () => {
    it('应该处理未启动的计时器停止', () => {
      const duration = metricsCollector.stopTimer('non-existent-timer')
      
      expect(duration).toBe(0)
      expect(consoleSpies.warn).toHaveBeenCalledWith(
        'Timer non-existent-timer not found'
      )
    })

    it('应该处理重复启动的计时器', () => {
      metricsCollector.startTimer('duplicate-timer')
      metricsCollector.startTimer('duplicate-timer') // Second start should replace first
      
      const duration = metricsCollector.stopTimer('duplicate-timer')
      
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(consoleSpies.warn).toHaveBeenCalledWith(
        'Timer duplicate-timer already started, replacing'
      )
    })

    it('应该处理长时间运行的计时器', async () => {
      metricsCollector.startTimer('long-timer')
      
      // Simulate long duration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const duration = metricsCollector.stopTimer('long-timer')
      
      expect(duration).toBeGreaterThan(0)
      
      // Should be recorded as histogram
      const metrics = metricsCollector.getMetrics()
      expect(metrics.histograms['long-timer']).toBeDefined()
      expect(metrics.histograms['long-timer'].count).toBe(1)
    })

    it('应该处理同步的极短计时', () => {
      metricsCollector.startTimer('instant-timer')
      const duration = metricsCollector.stopTimer('instant-timer')
      
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(typeof duration).toBe('number')
    })

    it('应该允许多个独立的计时器', () => {
      const timerNames = ['timer-1', 'timer-2', 'timer-3']
      
      // Start all timers
      timerNames.forEach(name => metricsCollector.startTimer(name))
      
      // Stop them in different order
      const durations = [
        metricsCollector.stopTimer('timer-2'),
        metricsCollector.stopTimer('timer-1'),
        metricsCollector.stopTimer('timer-3')
      ]
      
      durations.forEach(duration => {
        expect(duration).toBeGreaterThanOrEqual(0)
      })
      
      const metrics = metricsCollector.getMetrics()
      timerNames.forEach(name => {
        expect(metrics.histograms[name]).toBeDefined()
        expect(metrics.histograms[name].count).toBe(1)
      })
    })
  })

  describe('Reset and Cleanup', () => {
    it('应该清除所有指标类型', () => {
      // Add various metrics
      metricsCollector.incrementCounter('test-counter', 5)
      metricsCollector.setGauge('test-gauge', 10)
      metricsCollector.recordHistogram('test-histogram', 15)
      metricsCollector.startTimer('test-timer')
      
      // Verify metrics exist
      let metrics = metricsCollector.getMetrics()
      expect(Object.keys(metrics.counters)).toContain('test-counter')
      expect(Object.keys(metrics.gauges)).toContain('test-gauge')
      expect(Object.keys(metrics.histograms)).toContain('test-histogram')
      
      // Reset and verify empty
      metricsCollector.reset()
      metrics = metricsCollector.getMetrics()
      
      expect(Object.keys(metrics.counters)).toHaveLength(0)
      expect(Object.keys(metrics.gauges)).toHaveLength(0)
      expect(Object.keys(metrics.histograms)).toHaveLength(0)
    })

    it('应该清除活跃的计时器', () => {
      metricsCollector.startTimer('active-timer')
      
      // Verify timer is active (stopping it should work)
      expect(() => metricsCollector.stopTimer('active-timer')).not.toThrow()
      
      // Start another timer and reset
      metricsCollector.startTimer('another-timer')
      metricsCollector.reset()
      
      // Trying to stop the reset timer should warn
      const duration = metricsCollector.stopTimer('another-timer')
      expect(duration).toBe(0)
      expect(consoleSpies.warn).toHaveBeenCalledWith(
        'Timer another-timer not found'
      )
    })
  })

  describe('Metrics Retrieval and Formatting', () => {
    it('应该返回正确的指标结构', () => {
      metricsCollector.incrementCounter('test-counter', 1)
      metricsCollector.setGauge('test-gauge', 2)
      metricsCollector.recordHistogram('test-histogram', 3)
      
      const metrics = metricsCollector.getMetrics()
      
      expect(metrics).toHaveProperty('counters')
      expect(metrics).toHaveProperty('gauges')
      expect(metrics).toHaveProperty('histograms')
      
      expect(typeof metrics.counters).toBe('object')
      expect(typeof metrics.gauges).toBe('object')
      expect(typeof metrics.histograms).toBe('object')
    })

    it('应该返回空对象当无指标时', () => {
      const metrics = metricsCollector.getMetrics()
      
      expect(metrics.counters).toEqual({})
      expect(metrics.gauges).toEqual({})
      expect(metrics.histograms).toEqual({})
    })

    it('应该保持数据不可变性', () => {
      metricsCollector.incrementCounter('immutable-test', 10)
      
      const metrics1 = metricsCollector.getMetrics()
      const metrics2 = metricsCollector.getMetrics()
      
      // Should return different object instances
      expect(metrics1).not.toBe(metrics2)
      expect(metrics1.counters).not.toBe(metrics2.counters)
      
      // But same values
      expect(metrics1.counters['immutable-test']).toBe(metrics2.counters['immutable-test'])
    })
  })

  describe('Large Scale Performance', () => {
    it('应该处理大量指标', () => {
      const metricCount = 1000
      const recordsPerMetric = 100
      
      // Create many different metrics
      for (let i = 0; i < metricCount; i++) {
        metricsCollector.incrementCounter(`counter-${i}`, i)
        metricsCollector.setGauge(`gauge-${i}`, i * 2)
        
        for (let j = 0; j < recordsPerMetric; j++) {
          metricsCollector.recordHistogram(`histogram-${i}`, i + j)
        }
      }
      
      const metrics = metricsCollector.getMetrics()
      
      expect(Object.keys(metrics.counters)).toHaveLength(metricCount)
      expect(Object.keys(metrics.gauges)).toHaveLength(metricCount)
      expect(Object.keys(metrics.histograms)).toHaveLength(metricCount)
      
      // Verify some values
      expect(metrics.counters['counter-500']).toBe(500)
      expect(metrics.gauges['gauge-500']).toBe(1000)
      expect(metrics.histograms['histogram-500'].count).toBe(recordsPerMetric)
    })

    it('应该在高频率更新下保持性能', () => {
      const iterations = 10000
      
      const start = Date.now()
      
      for (let i = 0; i < iterations; i++) {
        metricsCollector.incrementCounter('high-frequency-counter', 1)
        metricsCollector.setGauge('high-frequency-gauge', i)
        metricsCollector.recordHistogram('high-frequency-histogram', Math.random() * 100)
      }
      
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.counters['high-frequency-counter']).toBe(iterations)
      expect(metrics.gauges['high-frequency-gauge']).toBe(iterations - 1)
      expect(metrics.histograms['high-frequency-histogram'].count).toBe(iterations)
    })
  })

  describe('Factory Function', () => {
    it('应该创建新的指标收集器实例', () => {
      const metrics1 = createMetrics()
      const metrics2 = createMetrics()
      
      expect(metrics1).toBeInstanceOf(MetricsCollector)
      expect(metrics2).toBeInstanceOf(MetricsCollector)
      expect(metrics1).not.toBe(metrics2)
    })

    it('应该创建独立的实例', () => {
      const metrics1 = createMetrics()
      const metrics2 = createMetrics()
      
      metrics1.incrementCounter('isolation-test', 10)
      
      expect(metrics1.getMetrics().counters['isolation-test']).toBe(10)
      expect(metrics2.getMetrics().counters['isolation-test']).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('应该处理非number类型的Counter值', () => {
      // TypeScript would catch this, but test runtime behavior
      metricsCollector.incrementCounter('type-test', '10' as any)
      metricsCollector.incrementCounter('type-test', true as any)
      metricsCollector.incrementCounter('type-test', {} as any)
      metricsCollector.incrementCounter('type-test', [] as any)
      
      const metrics = metricsCollector.getMetrics()
      
      // Implementation should handle these gracefully
      expect(typeof metrics.counters['type-test']).toBe('number')
    })

    it('应该处理非number类型的Gauge值', () => {
      metricsCollector.setGauge('type-gauge', '20' as any)
      metricsCollector.setGauge('type-gauge', null as any)
      metricsCollector.setGauge('type-gauge', undefined as any)
      
      const metrics = metricsCollector.getMetrics()
      expect(typeof metrics.gauges['type-gauge']).toBe('number')
    })

    it('应该处理非number类型的Histogram值', () => {
      metricsCollector.recordHistogram('type-histogram', 'value' as any)
      metricsCollector.recordHistogram('type-histogram', false as any)
      
      const metrics = metricsCollector.getMetrics()
      expect(metrics.histograms['type-histogram']).toBeDefined()
      expect(typeof metrics.histograms['type-histogram'].count).toBe('number')
    })
  })

  describe('Memory Management', () => {
    it('应该正确清理内存引用', () => {
      // Create many metrics
      for (let i = 0; i < 100; i++) {
        metricsCollector.incrementCounter(`temp-counter-${i}`, i)
      }
      
      expect(Object.keys(metricsCollector.getMetrics().counters)).toHaveLength(100)
      
      // Reset should clear all references
      metricsCollector.reset()
      
      expect(Object.keys(metricsCollector.getMetrics().counters)).toHaveLength(0)
      
      // Should be able to reuse names without conflicts
      metricsCollector.incrementCounter('temp-counter-0', 999)
      expect(metricsCollector.getMetrics().counters['temp-counter-0']).toBe(999)
    })
  })
})
