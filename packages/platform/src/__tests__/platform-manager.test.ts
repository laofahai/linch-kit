/**
 * Platform Manager 测试套件
 * @module platform/__tests__/platform-manager.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import type { ExtensionContext } from '@linch-kit/core'

import { PlatformManager, createPlatformManager, type PlatformConfig } from '../platform-manager'
import { CRUDExtension } from '../extensions/crud-extension'
import { RuntimeValidator } from '../validation'

// Mock dependencies
const mockExtensionContext: ExtensionContext = {
  logger: {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {}),
  },
  config: {},
  registry: new Map(),
  hooks: new Map(),
  eventBus: {
    emit: mock(() => {}),
    on: mock(() => {}),
    off: mock(() => {}),
  },
  metrics: {
    increment: mock(() => {}),
    histogram: mock(() => {}),
    gauge: mock(() => {}),
  },
  performance: {
    mark: mock(() => {}),
    measure: mock(() => {}),
  },
} as ExtensionContext

describe('PlatformManager', () => {
  let platformManager: PlatformManager

  beforeEach(() => {
    // Reset all mocks
    mock.restore()
  })

  afterEach(async () => {
    if (platformManager) {
      await platformManager.destroy()
    }
  })

  describe('构造函数和配置', () => {
    it('应该使用默认配置创建平台管理器', () => {
      platformManager = new PlatformManager()
      
      const status = platformManager.getStatus()
      expect(status.config.enableCrud).toBe(true)
      expect(status.config.enableTrpc).toBe(true)
      expect(status.config.enableValidation).toBe(true)
      expect(status.initialized).toBe(false)
    })

    it('应该使用自定义配置创建平台管理器', () => {
      const config: PlatformConfig = {
        enableCrud: false,
        enableTrpc: true,
        enableValidation: false,
        customOption: 'test'
      }
      
      platformManager = new PlatformManager(config)
      
      const status = platformManager.getStatus()
      expect(status.config.enableCrud).toBe(false)
      expect(status.config.enableValidation).toBe(false)
      expect(status.config.customOption).toBe('test')
    })

    it('应该通过工厂函数创建平台管理器', () => {
      const config = { enableCrud: false }
      platformManager = createPlatformManager(config)
      
      expect(platformManager).toBeInstanceOf(PlatformManager)
      const status = platformManager.getStatus()
      expect(status.config.enableCrud).toBe(false)
    })
  })

  describe('初始化', () => {
    beforeEach(() => {
      platformManager = new PlatformManager()
    })

    it('应该成功初始化所有启用的组件', async () => {
      await platformManager.initialize(mockExtensionContext)
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.capabilities.crud).toBe(true)
      expect(status.capabilities.validation).toBe(true)
      
      expect(mockExtensionContext.logger.info).toHaveBeenCalledWith(
        'Platform manager initialized',
        {
          crud: true,
          trpc: true,
          validation: true,
        }
      )
    })

    it('应该在没有ExtensionContext时抛出错误', async () => {
      await expect(platformManager.initialize()).rejects.toThrow(
        'ExtensionContext is required for Platform Manager'
      )
    })

    it('应该根据配置只初始化启用的组件', async () => {
      platformManager = new PlatformManager({
        enableCrud: true,
        enableValidation: false
      })
      
      await platformManager.initialize(mockExtensionContext)
      
      const status = platformManager.getStatus()
      expect(status.capabilities.crud).toBe(true)
      expect(status.capabilities.validation).toBe(false)
    })

    it('应该在配置禁用所有组件时仍能正常初始化', async () => {
      platformManager = new PlatformManager({
        enableCrud: false,
        enableValidation: false
      })
      
      await platformManager.initialize(mockExtensionContext)
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(false)
      expect(status.capabilities.crud).toBe(false)
      expect(status.capabilities.validation).toBe(false)
    })
  })

  describe('组件访问', () => {
    beforeEach(async () => {
      platformManager = new PlatformManager()
      await platformManager.initialize(mockExtensionContext)
    })

    it('应该返回CRUD Extension实例', () => {
      const crudExtension = platformManager.getCrudExtension()
      expect(crudExtension).toBeInstanceOf(CRUDExtension)
    })

    it('应该在CRUD Extension未初始化时抛出错误', () => {
      platformManager = new PlatformManager({ enableCrud: false })
      
      expect(() => platformManager.getCrudExtension()).toThrow(
        'CRUD extension not initialized or disabled'
      )
    })

    it('应该返回验证器实例', () => {
      const validator = platformManager.getValidator()
      expect(validator).toBeInstanceOf(RuntimeValidator)
    })

    it('应该在验证器未初始化时抛出错误', () => {
      platformManager = new PlatformManager({ enableValidation: false })
      
      expect(() => platformManager.getValidator()).toThrow(
        'Validator not initialized or disabled'
      )
    })
  })

  describe('上下文更新', () => {
    let newContext: ExtensionContext

    beforeEach(async () => {
      platformManager = new PlatformManager()
      await platformManager.initialize(mockExtensionContext)
      
      newContext = {
        ...mockExtensionContext,
        config: { updated: true }
      }
    })

    it('应该更新ExtensionContext并重新初始化组件', () => {
      const originalCrud = platformManager.getCrudExtension()
      const originalValidator = platformManager.getValidator()
      
      platformManager.updateExtensionContext(newContext)
      
      const newCrud = platformManager.getCrudExtension()
      const newValidator = platformManager.getValidator()
      
      expect(newCrud).not.toBe(originalCrud)
      expect(newValidator).not.toBe(originalValidator)
      expect(newCrud).toBeInstanceOf(CRUDExtension)
      expect(newValidator).toBeInstanceOf(RuntimeValidator)
    })

    it('应该只更新已初始化的组件', async () => {
      platformManager = new PlatformManager({ 
        enableCrud: true, 
        enableValidation: false 
      })
      await platformManager.initialize(mockExtensionContext)
      
      const originalCrud = platformManager.getCrudExtension()
      
      platformManager.updateExtensionContext(newContext)
      
      const newCrud = platformManager.getCrudExtension()
      expect(newCrud).not.toBe(originalCrud)
      expect(() => platformManager.getValidator()).toThrow()
    })
  })

  describe('资源销毁', () => {
    beforeEach(async () => {
      platformManager = new PlatformManager()
      await platformManager.initialize(mockExtensionContext)
    })

    it('应该成功销毁所有资源', async () => {
      expect(platformManager.getStatus().initialized).toBe(true)
      
      await platformManager.destroy()
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(false)
      expect(status.capabilities.crud).toBe(false)
      expect(status.capabilities.validation).toBe(false)
    })

    it('应该在销毁后无法访问组件', async () => {
      await platformManager.destroy()
      
      expect(() => platformManager.getCrudExtension()).toThrow(
        'CRUD extension not initialized or disabled'
      )
      expect(() => platformManager.getValidator()).toThrow(
        'Validator not initialized or disabled'
      )
    })

    it('应该能够重复调用销毁方法', async () => {
      await platformManager.destroy()
      await platformManager.destroy() // 不应该抛出错误
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(false)
    })
  })

  describe('状态查询', () => {
    it('应该返回正确的未初始化状态', () => {
      platformManager = new PlatformManager()
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(false)
      expect(status.capabilities.crud).toBe(false)
      expect(status.capabilities.validation).toBe(false)
      expect(status.config).toEqual({
        enableCrud: true,
        enableTrpc: true,
        enableValidation: true,
      })
    })

    it('应该返回正确的已初始化状态', async () => {
      platformManager = new PlatformManager({ customKey: 'customValue' })
      await platformManager.initialize(mockExtensionContext)
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.capabilities.crud).toBe(true)
      expect(status.capabilities.validation).toBe(true)
      expect(status.config.customKey).toBe('customValue')
    })

    it('应该反映部分组件的初始化状态', async () => {
      platformManager = new PlatformManager({
        enableCrud: false,
        enableValidation: true
      })
      await platformManager.initialize(mockExtensionContext)
      
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.capabilities.crud).toBe(false)
      expect(status.capabilities.validation).toBe(true)
    })
  })

  describe('错误处理和边界情况', () => {
    beforeEach(() => {
      platformManager = new PlatformManager()
    })

    it('应该处理初始化过程中的错误', async () => {
      // 使用无效的context来触发错误
      const invalidContext = null as unknown as ExtensionContext
      
      await expect(platformManager.initialize(invalidContext)).rejects.toThrow()
    })

    it('应该在未初始化时正确报告状态', () => {
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(false)
      expect(status.capabilities.crud).toBe(false)
      expect(status.capabilities.validation).toBe(false)
    })

    it('应该处理空配置对象', () => {
      platformManager = new PlatformManager({})
      
      const status = platformManager.getStatus()
      expect(status.config.enableCrud).toBe(true)
      expect(status.config.enableTrpc).toBe(true)
      expect(status.config.enableValidation).toBe(true)
    })
  })

  describe('集成测试', () => {
    it('应该完成完整的生命周期', async () => {
      platformManager = createPlatformManager({
        enableCrud: true,
        enableValidation: true,
        customConfig: 'test'
      })
      
      // 初始化
      await platformManager.initialize(mockExtensionContext)
      
      // 验证组件可访问
      const crud = platformManager.getCrudExtension()
      const validator = platformManager.getValidator()
      expect(crud).toBeInstanceOf(CRUDExtension)
      expect(validator).toBeInstanceOf(RuntimeValidator)
      
      // 更新上下文
      const newContext = { ...mockExtensionContext, updated: true }
      platformManager.updateExtensionContext(newContext)
      
      // 验证组件已更新
      const newCrud = platformManager.getCrudExtension()
      expect(newCrud).not.toBe(crud)
      
      // 销毁
      await platformManager.destroy()
      
      // 验证清理完成
      const status = platformManager.getStatus()
      expect(status.initialized).toBe(false)
    })
  })
})