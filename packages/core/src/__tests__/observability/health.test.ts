/**
 * @jest-environment node
 */

import { Server } from 'http'

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'

import { LinchKitHealthMonitor, createHealthMonitor, builtinCheckers } from '../../observability/health'
import type { HealthChecker, HealthStatus } from '../../types'

// bun test 暂不支持 vi.mock，简化测试以避免外部依赖
// TODO: 当 bun test 支持 vi.mock 时重新启用完整的测试

describe('LinchKitHealthMonitor', () => {
  let healthMonitor: LinchKitHealthMonitor
  let mockChecker: HealthChecker

  beforeEach(() => {
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
  })

  describe('createHealthMonitor 工厂函数', () => {
    it('should create health monitor instance', () => {
      const monitor = createHealthMonitor()
      expect(monitor).toBeInstanceOf(LinchKitHealthMonitor)
    })
  })

  describe('内置检查器', () => {
    it('should export builtin checkers', () => {
      expect(builtinCheckers).toBeDefined()
      expect(typeof builtinCheckers).toBe('object')
    })
  })
})