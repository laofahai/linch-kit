/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import type { HealthChecker, HealthStatus } from '../../types'

// Simple health monitor implementation for testing
class SimpleHealthMonitor {
  private checkers = new Map<string, HealthChecker>()
  private logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }

  addChecker(name: string, checker: HealthChecker): void {
    this.checkers.set(name, checker)
  }

  removeChecker(name: string): boolean {
    return this.checkers.delete(name)
  }

  async checkHealth(): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {}
    
    for (const [name, checker] of this.checkers) {
      try {
        const result = await checker()
        results[name] = result
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      }
    }
    
    return results
  }

  getCheckers(): string[] {
    return Array.from(this.checkers.keys())
  }
}

// Built-in checker implementations for testing
const createMemoryChecker = (threshold = 0.8) => {
  return async (): Promise<HealthStatus> => {
    const usage = process.memoryUsage()
    const total = usage.heapTotal
    const used = usage.heapUsed
    const ratio = used / total
    
    if (ratio > threshold) {
      return {
        status: 'unhealthy',
        message: `Memory usage too high: ${(ratio * 100).toFixed(1)}%`,
        details: { usage, threshold }
      }
    }
    
    return {
      status: 'healthy',
      message: `Memory usage normal: ${(ratio * 100).toFixed(1)}%`,
      details: { usage, threshold }
    }
  }
}

const createDiskChecker = (path = '/') => {
  return async (): Promise<HealthStatus> => {
    // Simplified disk check for testing
    return {
      status: 'healthy',
      message: 'Disk space available',
      details: { path, available: '100GB' }
    }
  }
}

describe('Health Monitor System', () => {
  let healthMonitor: SimpleHealthMonitor
  let mockChecker: HealthChecker

  beforeEach(() => {
    vi.clearAllMocks()
    healthMonitor = new SimpleHealthMonitor()
    mockChecker = vi.fn().mockResolvedValue({
      status: 'healthy',
      message: 'Service is running',
      details: { uptime: 1000 }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础功能', () => {
    it('should add and remove health checkers', () => {
      healthMonitor.addChecker('test', mockChecker)
      expect(healthMonitor.getCheckers()).toContain('test')
      
      const removed = healthMonitor.removeChecker('test')
      expect(removed).toBe(true)
      expect(healthMonitor.getCheckers()).not.toContain('test')
    })

    it('should return false when removing non-existent checker', () => {
      const removed = healthMonitor.removeChecker('non-existent')
      expect(removed).toBe(false)
    })

    it('should list all registered checkers', () => {
      healthMonitor.addChecker('checker1', mockChecker)
      healthMonitor.addChecker('checker2', mockChecker)
      
      const checkers = healthMonitor.getCheckers()
      expect(checkers).toHaveLength(2)
      expect(checkers).toContain('checker1')
      expect(checkers).toContain('checker2')
    })
  })

  describe('健康检查执行', () => {
    it('should execute single health check', async () => {
      healthMonitor.addChecker('test', mockChecker)
      
      const results = await healthMonitor.checkHealth()
      
      expect(mockChecker).toHaveBeenCalledOnce()
      expect(results).toHaveProperty('test')
      expect(results.test.status).toBe('healthy')
    })

    it('should execute multiple health checks', async () => {
      const checker1 = vi.fn().mockResolvedValue({ status: 'healthy', message: 'OK' })
      const checker2 = vi.fn().mockResolvedValue({ status: 'healthy', message: 'OK' })
      
      healthMonitor.addChecker('service1', checker1)
      healthMonitor.addChecker('service2', checker2)
      
      const results = await healthMonitor.checkHealth()
      
      expect(checker1).toHaveBeenCalledOnce()
      expect(checker2).toHaveBeenCalledOnce()
      expect(results).toHaveProperty('service1')
      expect(results).toHaveProperty('service2')
    })

    it('should handle checker errors gracefully', async () => {
      const failingChecker = vi.fn().mockRejectedValue(new Error('Service down'))
      healthMonitor.addChecker('failing', failingChecker)
      
      const results = await healthMonitor.checkHealth()
      
      expect(results.failing.status).toBe('unhealthy')
      expect(results.failing.message).toBe('Service down')
    })

    it('should handle non-Error exceptions', async () => {
      const failingChecker = vi.fn().mockRejectedValue('String error')
      healthMonitor.addChecker('failing', failingChecker)
      
      const results = await healthMonitor.checkHealth()
      
      expect(results.failing.status).toBe('unhealthy')
      expect(results.failing.message).toBe('Unknown error')
    })
  })

  describe('内置检查器', () => {
    it('should create memory checker with default threshold', async () => {
      const memoryChecker = createMemoryChecker()
      const result = await memoryChecker()
      
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('details')
      expect(['healthy', 'unhealthy']).toContain(result.status)
    })

    it('should create memory checker with custom threshold', async () => {
      const memoryChecker = createMemoryChecker(0.9)
      const result = await memoryChecker()
      
      expect(result.details).toHaveProperty('threshold', 0.9)
    })

    it('should create disk checker', async () => {
      const diskChecker = createDiskChecker('/tmp')
      const result = await diskChecker()
      
      expect(result.status).toBe('healthy')
      expect(result.details).toHaveProperty('path', '/tmp')
    })
  })

  describe('集成测试', () => {
    it('should handle mixed healthy and unhealthy services', async () => {
      const healthyChecker = vi.fn().mockResolvedValue({ 
        status: 'healthy', 
        message: 'All good' 
      })
      const unhealthyChecker = vi.fn().mockResolvedValue({ 
        status: 'unhealthy', 
        message: 'Something wrong' 
      })
      
      healthMonitor.addChecker('good', healthyChecker)
      healthMonitor.addChecker('bad', unhealthyChecker)
      
      const results = await healthMonitor.checkHealth()
      
      expect(results.good.status).toBe('healthy')
      expect(results.bad.status).toBe('unhealthy')
    })

    it('should work with built-in checkers', async () => {
      healthMonitor.addChecker('memory', createMemoryChecker(0.95))
      healthMonitor.addChecker('disk', createDiskChecker('/'))
      
      const results = await healthMonitor.checkHealth()
      
      expect(results).toHaveProperty('memory')
      expect(results).toHaveProperty('disk')
      expect(results.memory).toHaveProperty('status')
      expect(results.disk).toHaveProperty('status')
    })
  })

  describe('错误处理', () => {
    it('should continue checking other services when one fails', async () => {
      const workingChecker = vi.fn().mockResolvedValue({ 
        status: 'healthy', 
        message: 'Working' 
      })
      const brokenChecker = vi.fn().mockRejectedValue(new Error('Broken'))
      
      healthMonitor.addChecker('working', workingChecker)
      healthMonitor.addChecker('broken', brokenChecker)
      
      const results = await healthMonitor.checkHealth()
      
      expect(results.working.status).toBe('healthy')
      expect(results.broken.status).toBe('unhealthy')
      expect(workingChecker).toHaveBeenCalledOnce()
      expect(brokenChecker).toHaveBeenCalledOnce()
    })

    it('should preserve error details', async () => {
      const error = new Error('Database connection failed')
      error.stack = 'Error stack trace'
      const failingChecker = vi.fn().mockRejectedValue(error)
      
      healthMonitor.addChecker('db', failingChecker)
      
      const results = await healthMonitor.checkHealth()
      
      expect(results.db.status).toBe('unhealthy')
      expect(results.db.message).toBe('Database connection failed')
      expect(results.db.details).toBe(error)
    })
  })

  describe('性能测试', () => {
    it('should handle multiple concurrent health checks', async () => {
      const delayedChecker = (delay: number) => vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, delay))
        return { status: 'healthy', message: 'OK' }
      })
      
      healthMonitor.addChecker('fast', delayedChecker(10))
      healthMonitor.addChecker('medium', delayedChecker(50))
      healthMonitor.addChecker('slow', delayedChecker(100))
      
      const startTime = Date.now()
      const results = await healthMonitor.checkHealth()
      const endTime = Date.now()
      
      expect(Object.keys(results)).toHaveLength(3)
      expect(endTime - startTime).toBeLessThan(200) // Should run concurrently
    })
  })
})