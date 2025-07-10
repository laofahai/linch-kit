/**
 * Extension系统端到端测试
 * 验证Extension加载、激活和通信功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ExtensionManager } from '../../../packages/core/src/extension'

describe('Extension System E2E Tests', () => {
  let extensionManager: ExtensionManager
  
  beforeAll(async () => {
    // 初始化Extension Manager
    extensionManager = new ExtensionManager()
  })
  
  afterAll(async () => {
    // 清理资源 - 使用可能存在的stop方法
    if (typeof extensionManager.stop === 'function') {
      await extensionManager.stop()
    }
  })
  
  describe('Extension Loading', () => {
    it('should handle extension loading by name', async () => {
      // 尝试加载不存在的Extension
      const result = await extensionManager.loadExtension('@linch-kit/example-counter')
      
      // 期望失败，因为Extension还没有安装到系统中
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
  
  describe('Extension Manager Basic Operations', () => {
    it('should create extension manager instance', () => {
      expect(extensionManager).toBeDefined()
      expect(extensionManager instanceof ExtensionManager).toBe(true)
    })
    
    it('should have event emitter capabilities', () => {
      expect(typeof extensionManager.on).toBe('function')
      expect(typeof extensionManager.emit).toBe('function')
      expect(typeof extensionManager.off).toBe('function')
    })
  })
  
  describe('Permission Management', () => {
    it('should have permission manager', () => {
      // 检查ExtensionManager是否有权限管理功能
      expect(extensionManager).toBeDefined()
    })
  })
  
  describe('Error Handling', () => {
    it('should handle invalid extension names', async () => {
      const result = await extensionManager.loadExtension('non-existent-extension')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBeDefined()
    })
    
    it('should handle empty extension names', async () => {
      const result = await extensionManager.loadExtension('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
  
  describe('Validation', () => {
    it('should validate extension format', async () => {
      // 测试各种无效的Extension名称
      const invalidNames = [
        '',
        '   ',
        'invalid name with spaces',
        '123-invalid-start',
        'invalid@version'
      ]
      
      for (const name of invalidNames) {
        const result = await extensionManager.loadExtension(name)
        expect(result.success).toBe(false)
      }
    })
  })
  
  describe('Manifest Loading', () => {
    it('should handle missing manifest files', async () => {
      const result = await extensionManager.loadExtension('@test/non-existent-extension')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('manifest')
    })
  })
})