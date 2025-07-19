import { describe, it, expect, beforeEach, mock } from 'bun:test'

import { ExtensionPerformanceAnalyzer, type PerformanceReport } from '../../extension/performance-analytics'
import { ExtensionPerformanceMonitor } from '../../extension/performance-optimizations'

// Mock Extension Manager
class MockExtensionManager {
  private performanceMonitor: ExtensionPerformanceMonitor
  private extensions: Array<{ getId: () => string; isActive: () => boolean }> = []

  constructor() {
    this.performanceMonitor = new ExtensionPerformanceMonitor()
  }

  getPerformanceMonitor() {
    return this.performanceMonitor
  }

  getAllExtensions() {
    return this.extensions
  }

  addMockExtension(id: string, isActive = true) {
    this.extensions.push({
      getId: () => id,
      isActive: () => isActive,
    })
  }
}

describe('ExtensionPerformanceAnalyzer', () => {
  let analyzer: ExtensionPerformanceAnalyzer
  let mockExtensionManager: MockExtensionManager

  beforeEach(() => {
    mockExtensionManager = new MockExtensionManager()
    analyzer = new ExtensionPerformanceAnalyzer(mockExtensionManager as any)
  })

  describe('generatePerformanceReport', () => {
    it('应该生成健康Extension的性能报告', async () => {
      // 设置测试数据
      const extensionId = 'test-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      monitor.recordLoad(extensionId, 500) // 500ms 加载时间
      monitor.recordActivation(extensionId, 200) // 200ms 激活时间
      monitor.recordMemoryUsage(extensionId, 10 * 1024 * 1024) // 10MB
      monitor.recordApiCall(extensionId)
      monitor.recordApiCall(extensionId)

      // 生成报告
      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report).toBeDefined()
      expect(report.extensionId).toBe(extensionId)
      expect(report.health).toBe('healthy')
      expect(report.metrics.loadTime).toBe(500)
      expect(report.metrics.activationTime).toBe(200)
      expect(report.metrics.memoryUsage).toBe(10 * 1024 * 1024)
      expect(report.metrics.apiCalls).toBe(2)
      expect(report.metrics.errors).toBe(0)
      expect(report.issues).toHaveLength(0)
      expect(report.recommendations).toHaveLength(0)
    })

    it('应该检测到警告状态的Extension', async () => {
      const extensionId = 'warning-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      monitor.recordLoad(extensionId, 1500) // 超过警告阈值
      monitor.recordActivation(extensionId, 600) // 超过警告阈值
      monitor.recordMemoryUsage(extensionId, 60 * 1024 * 1024) // 超过警告阈值

      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report.health).toBe('warning')
      expect(report.issues.length).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('应该检测到关键状态的Extension', async () => {
      const extensionId = 'critical-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      monitor.recordLoad(extensionId, 4000) // 超过关键阈值
      monitor.recordMemoryUsage(extensionId, 150 * 1024 * 1024) // 超过关键阈值
      
      // 模拟高错误率
      for (let i = 0; i < 10; i++) {
        monitor.recordApiCall(extensionId)
      }
      for (let i = 0; i < 3; i++) {
        monitor.recordError(extensionId)
      }

      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report.health).toBe('critical')
      expect(report.issues.length).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('应该为不存在的Extension抛出错误', async () => {
      expect(async () => {
        await analyzer.generatePerformanceReport('non-existent')
      }).toThrow('Extension non-existent metrics not found')
    })
  })

  describe('getSystemPerformanceSnapshot', () => {
    it('应该生成系统性能快照', async () => {
      // 添加模拟Extension
      mockExtensionManager.addMockExtension('ext1', true)
      mockExtensionManager.addMockExtension('ext2', true)
      mockExtensionManager.addMockExtension('ext3', false)

      const snapshot = await analyzer.getSystemPerformanceSnapshot()

      expect(snapshot).toBeDefined()
      expect(snapshot.totalExtensions).toBe(3)
      expect(snapshot.activeExtensions).toBe(2)
      expect(snapshot.memoryUsage).toBeDefined()
      expect(snapshot.memoryUsage.total).toBeGreaterThan(0)
      expect(snapshot.cpuUsage).toBeGreaterThanOrEqual(0)
      expect(snapshot.healthScore).toBeGreaterThanOrEqual(0)
      expect(snapshot.healthScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(snapshot.criticalIssues)).toBe(true)
    })

    it('应该处理没有Extension的情况', async () => {
      const snapshot = await analyzer.getSystemPerformanceSnapshot()

      expect(snapshot.totalExtensions).toBe(0)
      expect(snapshot.activeExtensions).toBe(0)
      expect(snapshot.healthScore).toBe(100) // 没有Extension时应该是100分
    })
  })

  describe('性能阈值检测', () => {
    it('应该正确识别加载时间问题', async () => {
      const extensionId = 'slow-load-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      monitor.recordLoad(extensionId, 2000) // 超过警告阈值但未达到关键阈值

      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report.health).toBe('warning')
      expect(report.issues.some(issue => issue.includes('加载时间'))).toBe(true)
      expect(report.recommendations.some(rec => rec.includes('延迟加载'))).toBe(true)
    })

    it('应该正确识别内存使用问题', async () => {
      const extensionId = 'memory-heavy-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      monitor.recordMemoryUsage(extensionId, 80 * 1024 * 1024) // 80MB

      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report.health).toBe('warning')
      expect(report.issues.some(issue => issue.includes('内存使用'))).toBe(true)
      expect(report.recommendations.some(rec => rec.includes('内存泄漏'))).toBe(true)
    })

    it('应该正确识别错误率问题', async () => {
      const extensionId = 'error-prone-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      // 创建10%错误率 (超过5%警告阈值)
      for (let i = 0; i < 10; i++) {
        monitor.recordApiCall(extensionId)
      }
      monitor.recordError(extensionId) // 1/10 = 10%

      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report.health).toBe('warning')
      expect(report.issues.some(issue => issue.includes('错误率'))).toBe(true)
      expect(report.recommendations.some(rec => rec.includes('错误处理'))).toBe(true)
    })
  })

  describe('建议生成', () => {
    it('应该为不同类型的问题生成相应建议', async () => {
      const extensionId = 'multi-issue-extension'
      const monitor = mockExtensionManager.getPerformanceMonitor()
      
      // 创建多种性能问题
      monitor.recordLoad(extensionId, 2000) // 加载慢
      monitor.recordActivation(extensionId, 800) // 激活慢
      monitor.recordMemoryUsage(extensionId, 80 * 1024 * 1024) // 内存高

      const report = await analyzer.generatePerformanceReport(extensionId)

      expect(report.recommendations.length).toBeGreaterThan(3)
      expect(report.recommendations.some(rec => rec.includes('延迟加载'))).toBe(true)
      expect(report.recommendations.some(rec => rec.includes('异步激活'))).toBe(true)
      expect(report.recommendations.some(rec => rec.includes('内存泄漏'))).toBe(true)
    })
  })
})