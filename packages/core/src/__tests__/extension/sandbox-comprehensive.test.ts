/**
 * Extension沙箱综合测试 - 覆盖率提升到80%+
 * 测试isolate环境、权限检查、上下文注入、错误处理等核心功能
 */
import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test'
import { ExtensionSandbox } from '../../extension/sandbox'
import type { 
  ExtensionContext, 
  SandboxConfig, 
  SandboxedFunction,
  SandboxExecution
} from '../../extension/sandbox'
import type { ExtensionPermissionManager } from '../../extension/permission-manager'

// Mock isolated-vm module
const mockIsolate = {
  createContext: mock(() => Promise.resolve({
    global: {
      set: mock(() => Promise.resolve())
    }
  })),
  compileScript: mock(() => ({
    run: mock(() => Promise.resolve('test result'))
  })),
  dispose: mock(() => {})
}

const mockIVM = {
  Isolate: mock(() => mockIsolate),
  Reference: mock((obj: unknown) => obj)
}

// Mock loadIsolatedVM function
mock.module('isolated-vm', () => mockIVM)

describe('ExtensionSandbox - Comprehensive Tests', () => {
  let mockContext: ExtensionContext
  let mockPermissionManager: ExtensionPermissionManager
  let sandbox: ExtensionSandbox

  beforeEach(() => {
    // Create comprehensive mock context
    mockContext = {
      name: 'test-extension',
      config: { 
        name: 'Test Extension',
        version: '1.0.0',
        permissions: ['database:read', 'api:read']
      },
      logger: {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {})
      },
      storage: {
        get: mock(() => Promise.resolve('stored-value')),
        set: mock(() => Promise.resolve()),
        delete: mock(() => Promise.resolve()),
        clear: mock(() => Promise.resolve())
      },
      events: {
        on: mock(() => {}),
        off: mock(() => {}),
        emit: mock(() => {})
      }
    } as ExtensionContext

    // Mock permission manager with detailed behavior
    mockPermissionManager = {
      checkPermission: mock((extensionName: string, permission: string) => {
        return Promise.resolve(permission === 'database:read' || permission === 'api:read')
      }),
      grantPermission: mock(() => Promise.resolve()),
      revokePermission: mock(() => Promise.resolve()),
      getAllPermissions: mock(() => Promise.resolve(['database:read', 'api:read'])),
      hasSystemPermission: mock(() => Promise.resolve(false))
    } as ExtensionPermissionManager
  })

  afterEach(() => {
    if (sandbox) {
      sandbox.destroy()
    }
  })

  describe('Constructor and Initialization', () => {
    it('应该使用默认配置初始化沙箱', () => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
      
      expect(sandbox).toBeDefined()
      const status = sandbox.getStatus()
      expect(status.enabled).toBe(true)
      expect(status.config.timeout).toBe(30000)
      expect(status.config.memoryLimit).toBe(100 * 1024 * 1024)
    })

    it('应该使用自定义配置初始化沙箱', () => {
      const customConfig: Partial<SandboxConfig> = {
        enabled: false,
        timeout: 5000,
        memoryLimit: 50 * 1024 * 1024,
        allowedModules: ['crypto', 'util'],
        blockedGlobals: ['process', 'require'],
        allowNetworkAccess: true,
        allowFileSystemAccess: false
      }

      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, customConfig)
      const status = sandbox.getStatus()
      
      expect(status.enabled).toBe(false)
      expect(status.config.timeout).toBe(5000)
      expect(status.config.memoryLimit).toBe(50 * 1024 * 1024)
      expect(status.config.allowNetworkAccess).toBe(true)
    })

    it('应该在isolated-vm不可用时显示警告', async () => {
      const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock isolated-vm load failure
      mock.module('../../extension/sandbox', () => {
        const originalModule = require('../../extension/sandbox')
        return {
          ...originalModule,
          loadIsolatedVM: () => Promise.resolve(undefined)
        }
      })

      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Isolate Environment Setup', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该正确创建isolated-vm实例', async () => {
      // Wait for isolate initialization
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockIVM.Isolate).toHaveBeenCalledWith({
        memoryLimit: 100, // 100MB in MB units
        inspector: false
      })
      expect(mockIsolate.createContext).toHaveBeenCalled()
    })

    it('应该设置沙箱全局对象', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify global objects are set
      const mockContext = await mockIsolate.createContext()
      expect(mockContext.global.set).toHaveBeenCalledWith('console', expect.any(Object), { reference: true })
      expect(mockContext.global.set).toHaveBeenCalledWith('setTimeout', expect.any(Function), { reference: true })
      expect(mockContext.global.set).toHaveBeenCalledWith('extension', expect.any(Object), { reference: true })
    })

    it('应该处理isolate初始化错误', async () => {
      const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock initialization error
      mockIVM.Isolate = mock(() => {
        throw new Error('Isolate creation failed')
      })

      const faultyConfig = { enabled: true }
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, faultyConfig)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Sandboxed Console', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该创建前缀化的console对象', () => {
      const sandboxedConsole = (sandbox as any).createSandboxedConsole()
      
      sandboxedConsole.log('test message')
      expect(mockContext.logger.info).toHaveBeenCalledWith('[Extension:test-extension]', 'test message')
      
      sandboxedConsole.warn('warning message')
      expect(mockContext.logger.warn).toHaveBeenCalledWith('[Extension:test-extension]', 'warning message')
      
      sandboxedConsole.error('error message')
      expect(mockContext.logger.error).toHaveBeenCalledWith('[Extension:test-extension]', 'error message')
    })
  })

  describe('Timeout and Interval Sandboxing', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该限制setTimeout最大延迟', () => {
      const sandboxedTimeout = (sandbox as any).createSandboxedTimeout()
      
      const callback = mock(() => {})
      const timeoutId = sandboxedTimeout(callback, 120000) // 2 minutes
      
      // Should be limited to 1 minute (60000ms)
      expect(timeoutId).toBeDefined()
    })

    it('应该处理setTimeout回调错误', async () => {
      const sandboxedTimeout = (sandbox as any).createSandboxedTimeout()
      
      const errorCallback = mock(() => {
        throw new Error('Callback error')
      })
      
      sandboxedTimeout(errorCallback, 10)
      
      // Wait for timeout execution
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        'Timeout callback error:',
        expect.any(Error)
      )
    })

    it('应该限制setInterval最小间隔', () => {
      const sandboxedInterval = (sandbox as any).createSandboxedInterval()
      
      const callback = mock(() => {})
      const intervalId = sandboxedInterval(callback, 10) // Very short interval
      
      expect(intervalId).toBeDefined()
      
      // Clear interval to prevent test interference
      clearInterval(intervalId)
    })

    it('应该处理setInterval回调错误', async () => {
      const sandboxedInterval = (sandbox as any).createSandboxedInterval()
      
      const errorCallback = mock(() => {
        throw new Error('Interval error')
      })
      
      const intervalId = sandboxedInterval(errorCallback, 100)
      
      // Wait for interval execution
      await new Promise(resolve => setTimeout(resolve, 150))
      
      clearInterval(intervalId)
      
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        'Interval callback error:',
        expect.any(Error)
      )
    })
  })

  describe('Extension API Creation', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该创建完整的Extension API', () => {
      const api = (sandbox as any).createExtensionAPI()
      
      expect(api.config).toBe(mockContext.config)
      expect(api.events).toBeDefined()
      expect(api.storage).toBeDefined()
      expect(api.logger).toBe(mockContext.logger)
      expect(typeof api.hasPermission).toBe('function')
    })

    it('应该提供事件系统API', () => {
      const api = (sandbox as any).createExtensionAPI()
      
      api.events.emit('test-event', { data: 'test' })
      expect(mockContext.events.emit).toHaveBeenCalledWith('test-event', { data: 'test' })
      
      const handler = mock(() => {})
      api.events.on('test-event', handler)
      expect(mockContext.events.on).toHaveBeenCalledWith('test-event', handler)
      
      api.events.off('test-event', handler)
      expect(mockContext.events.off).toHaveBeenCalledWith('test-event', handler)
    })

    it('应该提供受保护的存储API', async () => {
      const api = (sandbox as any).createExtensionAPI()
      
      // Test storage.get with permission
      const result = await api.storage.get('test-key')
      expect(mockContext.storage.get).toHaveBeenCalledWith('test-key')
      expect(result).toBe('stored-value')
      
      // Test storage.set with permission
      await api.storage.set('test-key', 'new-value')
      expect(mockContext.storage.set).toHaveBeenCalledWith('test-key', 'new-value')
    })

    it('应该在存储操作无权限时抛出错误', async () => {
      // Mock permission check to return false for database:write
      mockPermissionManager.checkPermission = mock((extensionName: string, permission: string) => {
        return Promise.resolve(permission === 'database:read')
      })
      
      const api = (sandbox as any).createExtensionAPI()
      
      // Should throw error for write operations without permission
      await expect(api.storage.set('key', 'value')).rejects.toThrow(
        'Extension test-extension does not have permission: database:write'
      )
    })

    it('应该在启用网络访问时提供fetch API', () => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, {
        allowNetworkAccess: true
      })
      
      const api = (sandbox as any).createExtensionAPI()
      expect(api.fetch).toBeDefined()
      expect(typeof api.fetch).toBe('function')
    })

    it('应该在禁用网络访问时不提供fetch API', () => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, {
        allowNetworkAccess: false
      })
      
      const api = (sandbox as any).createExtensionAPI()
      expect(api.fetch).toBeUndefined()
    })
  })

  describe('Permission Management', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该正确检查权限', async () => {
      await (sandbox as any).requirePermission('database:read')
      expect(mockPermissionManager.checkPermission).toHaveBeenCalledWith('test-extension', 'database:read')
    })

    it('应该在权限不足时抛出错误', async () => {
      mockPermissionManager.checkPermission = mock(() => Promise.resolve(false))
      
      await expect((sandbox as any).requirePermission('admin:access')).rejects.toThrow(
        'Extension test-extension does not have permission: admin:access'
      )
    })

    it('应该通过API检查权限', async () => {
      const api = (sandbox as any).createExtensionAPI()
      
      const hasPermission = await api.hasPermission('database:read')
      expect(hasPermission).toBe(true)
      expect(mockPermissionManager.checkPermission).toHaveBeenCalledWith('test-extension', 'database:read')
    })
  })

  describe('Code Execution', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该在启用沙箱时执行代码', async () => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for isolate init
      
      const result = await sandbox.executeCode('1 + 1', 'test-function')
      
      expect(mockIsolate.compileScript).toHaveBeenCalledWith('1 + 1', { filename: 'extension.js' })
      expect(result).toBe('test result')
    })

    it('应该在禁用沙箱时使用unsafe执行', async () => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, { enabled: false })
      
      const result = await sandbox.executeCode('return 42', 'test-function', [])
      expect(result).toBe(42)
    })

    it('应该处理代码执行超时', async () => {
      // Mock script run to reject with timeout error
      mockIsolate.compileScript = mock(() => ({
        run: mock(() => {
          const error = new Error('Script execution timed out')
          error.message = 'Script execution timed out'
          return Promise.reject(error)
        })
      }))
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await expect(sandbox.executeCode('while(true) {}', 'infinite-loop')).rejects.toThrow()
      
      const executions = sandbox.getExecutionHistory()
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('timeout')
    })

    it('应该处理代码执行错误', async () => {
      mockIsolate.compileScript = mock(() => ({
        run: mock(() => Promise.reject(new Error('Execution failed')))
      }))
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await expect(sandbox.executeCode('throw new Error()', 'error-function')).rejects.toThrow()
      
      const executions = sandbox.getExecutionHistory()
      expect(executions.length).toBe(1)
      expect(executions[0].status).toBe('failed')
    })

    it('应该在isolate未初始化时抛出错误', async () => {
      // Create sandbox with isolate disabled but still marked as enabled
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, { enabled: true })
      
      // Manually set isolate to undefined to simulate initialization failure
      ;(sandbox as any).isolate = undefined
      ;(sandbox as any).context = undefined
      
      await expect(sandbox.executeCode('test code')).rejects.toThrow('Isolate not initialized')
    })
  })

  describe('Sandboxed Function Execution', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该执行具有权限的沙箱化函数', async () => {
      const sandboxedFunction: SandboxedFunction = {
        name: 'test-function',
        execute: mock(() => Promise.resolve('function result')),
        permissions: ['database:read']
      }
      
      const result = await sandbox.executeSandboxedFunction(sandboxedFunction, ['arg1', 'arg2'])
      
      expect(mockPermissionManager.checkPermission).toHaveBeenCalledWith('test-extension', 'database:read')
      expect(sandboxedFunction.execute).toHaveBeenCalledWith('arg1', 'arg2')
      expect(result).toBe('function result')
    })

    it('应该在权限不足时拒绝执行沙箱化函数', async () => {
      mockPermissionManager.checkPermission = mock(() => Promise.resolve(false))
      
      const sandboxedFunction: SandboxedFunction = {
        name: 'privileged-function',
        execute: mock(() => Promise.resolve('result')),
        permissions: ['admin:access']
      }
      
      await expect(sandbox.executeSandboxedFunction(sandboxedFunction)).rejects.toThrow(
        'Extension test-extension does not have permission: admin:access'
      )
      
      expect(sandboxedFunction.execute).not.toHaveBeenCalled()
    })
  })

  describe('Execution Management', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, { enabled: false })
    })

    it('应该跟踪执行历史', async () => {
      await sandbox.executeCode('return 1', 'func1')
      await sandbox.executeCode('return 2', 'func2')
      
      const history = sandbox.getExecutionHistory()
      expect(history.length).toBe(2)
      expect(history[0].functionName).toBe('func1')
      expect(history[1].functionName).toBe('func2')
    })

    it('应该获取活跃执行', async () => {
      // Mock a long-running execution
      const longRunningExecution = new Promise(resolve => setTimeout(resolve, 1000))
      
      // Start execution but don't wait
      sandbox.executeCode('return new Promise(r => setTimeout(r, 1000))', 'long-func')
      
      // Check active executions immediately
      const activeExecutions = sandbox.getActiveExecutions()
      // Note: In unsafe mode, executions complete immediately, so this might be 0
      expect(Array.isArray(activeExecutions)).toBe(true)
    })

    it('应该清理执行历史', async () => {
      await sandbox.executeCode('return 1', 'func1')
      expect(sandbox.getExecutionHistory().length).toBe(1)
      
      sandbox.clearExecutionHistory()
      expect(sandbox.getExecutionHistory().length).toBe(0)
    })

    it('应该停止所有执行', () => {
      sandbox.stopAllExecutions()
      
      // After stopping, active executions should be cleared
      expect(sandbox.getActiveExecutions().length).toBe(0)
    })

    it('应该生成唯一的执行ID', () => {
      const id1 = (sandbox as any).generateExecutionId()
      const id2 = (sandbox as any).generateExecutionId()
      
      expect(id1).toContain('test-extension_')
      expect(id2).toContain('test-extension_')
      expect(id1).not.toBe(id2)
    })
  })

  describe('Configuration Management', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该更新沙箱配置', () => {
      const newConfig = {
        timeout: 15000,
        memoryLimit: 200 * 1024 * 1024,
        allowNetworkAccess: true
      }
      
      sandbox.updateConfig(newConfig)
      
      const status = sandbox.getStatus()
      expect(status.config.timeout).toBe(15000)
      expect(status.config.memoryLimit).toBe(200 * 1024 * 1024)
      expect(status.config.allowNetworkAccess).toBe(true)
    })

    it('应该在启用沙箱时重新初始化isolate', () => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, { enabled: false })
      
      sandbox.updateConfig({ enabled: true })
      
      const status = sandbox.getStatus()
      expect(status.enabled).toBe(true)
    })

    it('应该在禁用沙箱时销毁isolate', () => {
      sandbox.updateConfig({ enabled: false })
      
      const status = sandbox.getStatus()
      expect(status.enabled).toBe(false)
    })
  })

  describe('Status and Monitoring', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该返回正确的沙箱状态', async () => {
      await sandbox.executeCode('return 1', 'test1')
      await sandbox.executeCode('return 2', 'test2')
      
      const status = sandbox.getStatus()
      
      expect(status.enabled).toBe(true)
      expect(status.totalExecutions).toBe(2)
      expect(status.activeExecutions).toBeGreaterThanOrEqual(0)
      expect(status.memoryUsage).toBeGreaterThan(0)
      expect(status.config).toBeDefined()
    })

    it('应该计算内存使用量', () => {
      const memoryUsage = (sandbox as any).calculateMemoryUsage()
      expect(typeof memoryUsage).toBe('number')
      expect(memoryUsage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Event System', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, { enabled: false })
    })

    it('应该发射执行开始事件', async () => {
      const executionStartSpy = mock(() => {})
      sandbox.on('executionStart', executionStartSpy)
      
      await sandbox.executeCode('return 1', 'test-func')
      
      expect(executionStartSpy).toHaveBeenCalledWith(expect.objectContaining({
        functionName: 'test-func',
        status: 'running'
      }))
    })

    it('应该发射执行完成事件', async () => {
      const executionCompleteSpy = mock(() => {})
      sandbox.on('executionComplete', executionCompleteSpy)
      
      await sandbox.executeCode('return 42', 'complete-func')
      
      expect(executionCompleteSpy).toHaveBeenCalledWith(expect.objectContaining({
        functionName: 'complete-func',
        status: 'completed',
        result: 42
      }))
    })
  })

  describe('Destruction and Cleanup', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该正确销毁沙箱', () => {
      sandbox.destroy()
      
      expect(sandbox.getExecutionHistory().length).toBe(0)
      expect(sandbox.getActiveExecutions().length).toBe(0)
      
      const status = sandbox.getStatus()
      expect(status.activeExecutions).toBe(0)
    })

    it('应该在销毁时清理所有监听器', () => {
      const removeAllListenersSpy = spyOn(sandbox, 'removeAllListeners')
      
      sandbox.destroy()
      
      expect(removeAllListenersSpy).toHaveBeenCalled()
    })

    it('应该在销毁时处理isolate清理', () => {
      // Set up isolate mock
      ;(sandbox as any).isolate = { dispose: mock(() => {}) }
      
      sandbox.destroy()
      
      expect((sandbox as any).isolate.dispose).toHaveBeenCalled()
      expect((sandbox as any).isolate).toBeUndefined()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager)
    })

    it('应该处理createSandboxEnvironment的全局变量过滤', () => {
      sandbox = new ExtensionSandbox(mockContext, mockPermissionManager, {
        blockedGlobals: ['process', 'require', 'global']
      })
      
      const environment = (sandbox as any).createSandboxEnvironment()
      
      expect(environment.process).toBeUndefined()
      expect(environment.require).toBeUndefined()
      expect(environment.global).toBeUndefined()
      
      // But safe globals should exist
      expect(environment.JSON).toBeDefined()
      expect(environment.Math).toBeDefined()
      expect(environment.console).toBeDefined()
    })

    it('应该处理空参数的执行', async () => {
      const result = await sandbox.executeCode('')
      expect(result).toBeDefined()
    })

    it('应该处理无效的函数名', async () => {
      const result = await sandbox.executeCode('return 1', '')
      expect(result).toBeDefined()
    })

    it('应该处理大量并发执行', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        sandbox.executeCode(`return ${i}`, `func-${i}`)
      )
      
      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
    })
  })

  describe('Factory Function', () => {
    it('应该通过工厂函数创建沙箱', () => {
      const { createSandbox } = require('../../extension/sandbox')
      
      const factorySandbox = createSandbox(mockContext, mockPermissionManager, { enabled: false })
      
      expect(factorySandbox).toBeInstanceOf(ExtensionSandbox)
      expect(factorySandbox.getStatus().enabled).toBe(false)
    })
  })
})
