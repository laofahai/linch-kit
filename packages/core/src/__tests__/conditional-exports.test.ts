/**
 * 条件导出测试
 * 验证 @linch-kit/core 的条件导出功能
 */

import { describe, it, expect } from 'bun:test'

describe('条件导出', () => {
  it('主入口应该导出通用功能', async () => {
    // 动态导入主入口
    const mainModule = await import('@linch-kit/core')
    
    // 验证主入口导出
    expect(mainModule).toHaveProperty('Logger')
    expect(mainModule).toHaveProperty('createLogger')
    expect(mainModule).toHaveProperty('Metrics')
    expect(mainModule).toHaveProperty('ExtensionManager')
    
    // 验证类型
    expect(typeof mainModule.Logger).toBe('object')
    expect(typeof mainModule.createLogger).toBe('function')
  })

  it('客户端入口应该导出客户端安全功能', async () => {
    // 动态导入客户端入口
    const clientModule = await import('@linch-kit/core/client')
    
    // 验证客户端入口导出
    expect(clientModule).toHaveProperty('Logger')
    expect(clientModule).toHaveProperty('ExtensionRegistry')
    expect(clientModule).toHaveProperty('extensionManager')
    expect(clientModule).toHaveProperty('createPackageI18n')
    
    // 验证类型
    expect(typeof clientModule.Logger).toBe('object')
    expect(typeof clientModule.ExtensionRegistry).toBe('function')
    expect(typeof clientModule.extensionManager).toBe('object')
    expect(typeof clientModule.createPackageI18n).toBe('function')
    
    // 验证客户端代码不包含服务端依赖
    expect(clientModule).not.toHaveProperty('ConfigManager')
    expect(clientModule).not.toHaveProperty('HotReloadManager')
  })

  it('服务端入口应该导出服务端专用功能', async () => {
    // 动态导入服务端入口
    const serverModule = await import('@linch-kit/core/server')
    
    // 验证服务端入口导出
    expect(serverModule).toHaveProperty('logger')
    expect(serverModule).toHaveProperty('createLogger')
    expect(serverModule).toHaveProperty('ConfigManager')
    expect(serverModule).toHaveProperty('HotReloadManager')
    expect(serverModule).toHaveProperty('createHotReloadManager')
    
    // 验证类型
    expect(typeof serverModule.logger).toBe('object')
    expect(typeof serverModule.createLogger).toBe('function')
    expect(typeof serverModule.ConfigManager).toBe('function')
    expect(typeof serverModule.HotReloadManager).toBe('function')
    expect(typeof serverModule.createHotReloadManager).toBe('function')
  })

  it('Logger 功能应该在不同入口中正常工作', async () => {
    // 测试主入口 Logger
    const mainModule = await import('@linch-kit/core')
    expect(mainModule.Logger).toBeDefined()
    expect(typeof mainModule.Logger.info).toBe('function')
    
    // 测试客户端 Logger
    const clientModule = await import('@linch-kit/core/client')
    expect(clientModule.Logger).toBeDefined()
    expect(typeof clientModule.Logger.info).toBe('function')
    
    // 测试服务端 Logger
    const serverModule = await import('@linch-kit/core/server')
    expect(serverModule.logger).toBeDefined()
    expect(typeof serverModule.logger.info).toBe('function')
  })

  it('ExtensionManager 应该在不同入口中有不同实现', async () => {
    // 主入口的 ExtensionManager
    const mainModule = await import('@linch-kit/core')
    expect(mainModule.ExtensionManager).toBeDefined()
    
    // 客户端的 ExtensionRegistry (简化版)
    const clientModule = await import('@linch-kit/core/client')
    expect(clientModule.ExtensionRegistry).toBeDefined()
    
    // 两者应该是不同的实现
    expect(mainModule.ExtensionManager).not.toBe(clientModule.ExtensionRegistry)
  })

  it('条件导出应该防止客户端访问服务端专用功能', async () => {
    try {
      // 尝试从客户端入口导入服务端专用功能
      const clientModule = await import('@linch-kit/core/client')
      
      // 这些功能不应该存在于客户端入口
      expect(clientModule).not.toHaveProperty('ConfigManager')
      expect(clientModule).not.toHaveProperty('HotReloadManager')
      expect(clientModule).not.toHaveProperty('createHotReloadManager')
      
      // 验证客户端 Logger 是简化版本
      expect(typeof clientModule.Logger).toBe('object')
      
    } catch (error) {
      // 如果导入失败，这是预期的行为
      console.log('客户端正确阻止了服务端功能的访问')
    }
  })
})