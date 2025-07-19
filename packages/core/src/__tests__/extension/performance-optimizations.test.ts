import { describe, it, expect, beforeEach } from 'bun:test'

import { ExtensionPerformanceMonitor } from '../../extension/performance-optimizations'

describe('ExtensionPerformanceMonitor', () => {
  let monitor: ExtensionPerformanceMonitor

  beforeEach(() => {
    monitor = new ExtensionPerformanceMonitor()
  })

  describe('基本指标记录', () => {
    it('应该记录Extension加载时间', () => {
      const extensionId = 'test-extension'
      const loadTime = 1500

      monitor.recordLoad(extensionId, loadTime)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.loadTime).toBe(loadTime)
    })

    it('应该记录Extension激活时间', () => {
      const extensionId = 'test-extension'
      const activationTime = 500

      monitor.recordActivation(extensionId, activationTime)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.activationTime).toBe(activationTime)
      expect(metrics!.lastActivity).toBeGreaterThan(0)
    })

    it('应该记录API调用', () => {
      const extensionId = 'test-extension'

      monitor.recordApiCall(extensionId)
      monitor.recordApiCall(extensionId)
      monitor.recordApiCall(extensionId)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.apiCalls).toBe(3)
    })

    it('应该记录错误', () => {
      const extensionId = 'test-extension'

      monitor.recordError(extensionId)
      monitor.recordError(extensionId)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.errors).toBe(2)
    })

    it('应该记录内存使用', () => {
      const extensionId = 'test-extension'
      const memoryUsage = 50 * 1024 * 1024 // 50MB

      monitor.recordMemoryUsage(extensionId, memoryUsage)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.memoryUsage).toBe(memoryUsage)
    })
  })

  describe('指标获取', () => {
    it('应该返回不存在Extension的null', () => {
      const metrics = monitor.getMetrics('non-existent')
      expect(metrics).toBeNull()
    })

    it('应该获取所有Extension的指标', () => {
      monitor.recordLoad('ext1', 1000)
      monitor.recordLoad('ext2', 1500)
      monitor.recordApiCall('ext1')

      const allMetrics = monitor.getAllMetrics()
      expect(Object.keys(allMetrics)).toHaveLength(2)
      expect(allMetrics['ext1']).toBeDefined()
      expect(allMetrics['ext2']).toBeDefined()
      expect(allMetrics['ext1'].loadTime).toBe(1000)
      expect(allMetrics['ext2'].loadTime).toBe(1500)
      expect(allMetrics['ext1'].apiCalls).toBe(1)
      expect(allMetrics['ext2'].apiCalls).toBe(0)
    })
  })

  describe('综合性能报告', () => {
    it('应该生成单个Extension的性能报告', () => {
      const extensionId = 'test-extension'
      
      monitor.recordLoad(extensionId, 1200)
      monitor.recordActivation(extensionId, 300)
      monitor.recordMemoryUsage(extensionId, 30 * 1024 * 1024)
      monitor.recordApiCall(extensionId)
      monitor.recordApiCall(extensionId)
      monitor.recordError(extensionId)

      const report = monitor.getPerformanceReport(extensionId)
      
      expect(report).toBeDefined()
      expect(report!.loadTime).toBe(1200)
      expect(report!.activationTime).toBe(300)
      expect(report!.memoryUsage).toBe(30 * 1024 * 1024)
      expect(report!.apiCalls).toBe(2)
      expect(report!.errors).toBe(1)
      expect(typeof report!.timestamp).toBe('number')
      expect(report!.timestamp).toBeGreaterThan(0)
    })

    it('应该为不存在的Extension返回null报告', () => {
      const report = monitor.getPerformanceReport('non-existent')
      expect(report).toBeNull()
    })

    it('应该生成所有Extension的汇总报告', () => {
      // 添加多个Extension的数据
      monitor.recordLoad('ext1', 1000)
      monitor.recordActivation('ext1', 200)
      monitor.recordApiCall('ext1')
      monitor.recordError('ext1')

      monitor.recordLoad('ext2', 1500)
      monitor.recordActivation('ext2', 300)
      monitor.recordApiCall('ext2')
      monitor.recordApiCall('ext2')

      monitor.recordLoad('ext3', 800)
      monitor.recordActivation('ext3', 150)

      const report = monitor.getPerformanceReport() // 不传extensionId获取汇总报告

      expect(report).toBeDefined()
      expect(report.totalExtensions).toBe(3)
      expect(report.averageLoadTime).toBe((1000 + 1500 + 800) / 3)
      expect(report.averageActivationTime).toBe((200 + 300 + 150) / 3)
      expect(report.totalApiCalls).toBe(3)
      expect(report.totalErrors).toBe(1)
      expect(report.extensions).toHaveLength(3)
    })

    it('应该处理空Extension列表的汇总报告', () => {
      const report = monitor.getPerformanceReport()

      expect(report).toBeDefined()
      expect(report.totalExtensions).toBe(0)
      expect(report.averageLoadTime).toBe(0)
      expect(report.averageActivationTime).toBe(0)
      expect(report.totalApiCalls).toBe(0)
      expect(report.totalErrors).toBe(0)
      expect(report.extensions).toHaveLength(0)
    })
  })

  describe('指标清理', () => {
    it('应该清除指定Extension的指标', () => {
      const extensionId = 'test-extension'
      
      monitor.recordLoad(extensionId, 1000)
      monitor.recordApiCall(extensionId)

      expect(monitor.getMetrics(extensionId)).toBeDefined()
      
      monitor.clearMetrics(extensionId)
      
      expect(monitor.getMetrics(extensionId)).toBeNull()
    })

    it('应该处理清除不存在Extension的情况', () => {
      // 不应该抛出错误
      expect(() => {
        monitor.clearMetrics('non-existent')
      }).not.toThrow()
    })
  })

  describe('边界情况和错误处理', () => {
    it('应该处理负数指标值', () => {
      const extensionId = 'test-extension'
      
      monitor.recordLoad(extensionId, -100)
      monitor.recordMemoryUsage(extensionId, -1024)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.loadTime).toBe(-100)
      expect(metrics!.memoryUsage).toBe(-1024)
    })

    it('应该处理极大的指标值', () => {
      const extensionId = 'test-extension'
      const largeValue = Number.MAX_SAFE_INTEGER
      
      monitor.recordLoad(extensionId, largeValue)
      monitor.recordMemoryUsage(extensionId, largeValue)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.loadTime).toBe(largeValue)
      expect(metrics!.memoryUsage).toBe(largeValue)
    })

    it('应该处理零值指标', () => {
      const extensionId = 'test-extension'
      
      monitor.recordLoad(extensionId, 0)
      monitor.recordActivation(extensionId, 0)
      monitor.recordMemoryUsage(extensionId, 0)

      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.loadTime).toBe(0)
      expect(metrics!.activationTime).toBe(0)
      expect(metrics!.memoryUsage).toBe(0)
    })
  })

  describe('时间戳和活动跟踪', () => {
    it('应该在记录活动时更新lastActivity', () => {
      const extensionId = 'test-extension'
      const startTime = Date.now()
      
      monitor.recordApiCall(extensionId)
      
      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.lastActivity).toBeGreaterThanOrEqual(startTime)
    })

    it('应该在记录错误时更新lastActivity', () => {
      const extensionId = 'test-extension'
      const startTime = Date.now()
      
      monitor.recordError(extensionId)
      
      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.lastActivity).toBeGreaterThanOrEqual(startTime)
    })

    it('应该在记录激活时更新lastActivity', () => {
      const extensionId = 'test-extension'
      const startTime = Date.now()
      
      monitor.recordActivation(extensionId, 500)
      
      const metrics = monitor.getMetrics(extensionId)
      expect(metrics).toBeDefined()
      expect(metrics!.lastActivity).toBeGreaterThanOrEqual(startTime)
    })
  })
})