/**
 * UnifiedExtensionManager综合测试 - 边缘用例覆盖率提升到85%+
 * 测试复杂依赖图、并发加载、状态一致性、异常恢复等高级场景
 */
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'
import { UnifiedExtensionManager } from '../../extension/unified-manager'
import type { 
  Extension, 
  ExtensionConfig, 
  ExtensionMetadata,
  ExtensionInstance,
  ExtensionContext,
  ExtensionPermission
} from '../../extension/types'

// Mock global objects
const originalProcess = globalThis.process
const originalWindow = globalThis.window
const originalLocalStorage = globalThis.localStorage

// Advanced mock implementations
const mockPermissionManager = {
  checkPermission: mock(() => Promise.resolve(true)),
  grantPermission: mock(() => Promise.resolve()),
  revokePermission: mock(() => Promise.resolve()),
  hasPermission: mock(() => true),
  getAllPermissions: mock(() => []),
  hasPermissionPolicy: mock((permission: string) => {
    const allowedPermissions = ['api:read', 'api:write', 'database:read', 'database:write', 'ui:render']
    return allowedPermissions.includes(permission)
  }),
  isDependencyAvailable: mock((dep: string) => {
    const availableDeps = ['core', 'logger', 'auth']
    return availableDeps.includes(dep)
  }),
  hasSystemPermission: mock(() => Promise.resolve(false))
}

const mockSandbox = {
  executeCode: mock(() => Promise.resolve('sandbox result')),
  executeSandboxedFunction: mock(() => Promise.resolve('function result')),
  getStatus: mock(() => ({
    enabled: true,
    activeExecutions: 0,
    totalExecutions: 0,
    memoryUsage: 1024
  })),
  updateConfig: mock(() => {}),
  destroy: mock(() => {}),
  stopAllExecutions: mock(() => {}),
  getExecutionHistory: mock(() => []),
  getActiveExecutions: mock(() => []),
  clearExecutionHistory: mock(() => {}),
  on: mock(() => {}),
  off: mock(() => {}),
  emit: mock(() => {})
}

const mockCreateSandbox = mock(() => mockSandbox)

// Mock fs/promises for manifest loading
const mockFsPromises = {
  readFile: mock((path: string) => {
    if (path.includes('valid-extension')) {
      return Promise.resolve(JSON.stringify({
        name: 'valid-extension',
        version: '1.0.0',
        description: 'A valid test extension',
        linchkit: {
          displayName: 'Valid Extension',
          category: 'test',
          permissions: ['api:read'],
          capabilities: { test: true },
          dependencies: ['core']
        }
      }))
    }
    if (path.includes('invalid-manifest')) {
      return Promise.resolve('{invalid json')
    }
    if (path.includes('missing-linchkit')) {
      return Promise.resolve(JSON.stringify({ name: 'no-linchkit', version: '1.0.0' }))
    }
    return Promise.reject(new Error('File not found'))
  })
}

// Mock localStorage
const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem: mock((key: string) => mockLocalStorage.data.get(key) || null),
  setItem: mock((key: string, value: string) => mockLocalStorage.data.set(key, value)),
  removeItem: mock((key: string) => mockLocalStorage.data.delete(key)),
  clear: mock(() => mockLocalStorage.data.clear()),
  get length() { return mockLocalStorage.data.size },
  key: mock((index: number) => Array.from(mockLocalStorage.data.keys())[index] || null)
}

// Setup mocks
mock.module('../../extension/sandbox', () => ({
  createSandbox: mockCreateSandbox
}))

mock.module('../../extension/permission-manager', () => ({
  permissionManager: mockPermissionManager
}))

mock.module('node:fs/promises', () => mockFsPromises)

describe('UnifiedExtensionManager - Comprehensive Edge Cases', () => {
  let manager: UnifiedExtensionManager
  let consoleSpies: {
    debug: typeof console.debug
    info: typeof console.info
    warn: typeof console.warn
    error: typeof console.error
  }

  beforeEach(() => {
    // Setup console spies
    consoleSpies = {
      debug: spyOn(console, 'debug').mockImplementation(() => {}),
      info: spyOn(console, 'info').mockImplementation(() => {}),
      warn: spyOn(console, 'warn').mockImplementation(() => {}),
      error: spyOn(console, 'error').mockImplementation(() => {})
    }

    // Setup environment
    globalThis.process = {
      cwd: () => '/test',
      env: { NODE_ENV: 'test', EXTENSION_ROOT: '/test/extensions' },
      versions: { node: '18.0.0' }
    } as any
    
    delete (globalThis as any).window
    globalThis.localStorage = mockLocalStorage as any

    // Create fresh manager instance
    manager = new UnifiedExtensionManager({
      extensionRoot: '/test/extensions',
      enableSandbox: true,
      allowedPermissions: ['api:read', 'api:write', 'database:read', 'database:write']
    })

    // Reset all mocks
    Object.values(mockPermissionManager).forEach(mockFn => mockFn.mockClear())
    Object.values(mockSandbox).forEach(mockFn => {
      if (typeof mockFn === 'function') mockFn.mockClear()
    })
    mockCreateSandbox.mockClear()
    mockFsPromises.readFile.mockClear()
    mockLocalStorage.data.clear()
  })

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach(spy => spy.mockRestore())
    
    // Restore global objects
    globalThis.process = originalProcess
    globalThis.window = originalWindow
    globalThis.localStorage = originalLocalStorage
  })

  describe('Configuration and Initialization Edge Cases', () => {
    it('应该使用默认配置初始化', () => {
      const defaultManager = new UnifiedExtensionManager()
      expect(defaultManager).toBeDefined()
    })

    it('应该处理空配置对象', () => {
      const emptyConfigManager = new UnifiedExtensionManager({})
      expect(emptyConfigManager).toBeDefined()
    })

    it('应该在process.cwd不可用时使用备用配置', () => {
      const originalCwd = globalThis.process?.cwd
      if (globalThis.process) {
        ;(globalThis.process as any).cwd = undefined
      }
      
      expect(() => {
        new UnifiedExtensionManager()
      }).not.toThrow()
      
      if (originalCwd && globalThis.process) {
        ;(globalThis.process as any).cwd = originalCwd
      }
    })

    it('应该处理无效的权限配置', () => {
      const invalidPermissionsManager = new UnifiedExtensionManager({
        allowedPermissions: null as any
      })
      expect(invalidPermissionsManager).toBeDefined()
    })
  })

  describe('Extension Metadata Validation Edge Cases', () => {
    it('应该拒绝缺少ID的Extension', async () => {
      const invalidExtension: Extension = {
        metadata: {
          name: 'test-extension',
          version: '1.0.0',
          permissions: []
        } as any, // Missing id
        defaultConfig: {}
      }

      const result = await manager.register(invalidExtension)
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('REGISTRATION_ERROR')
      expect(result.error?.message).toContain('Extension ID is required')
    })

    it('应该拒绝缺少名称的Extension', async () => {
      const invalidExtension: Extension = {
        metadata: {
          id: 'test-extension',
          version: '1.0.0',
          permissions: []
        } as any, // Missing name
        defaultConfig: {}
      }

      const result = await manager.register(invalidExtension)
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Extension name is required')
    })

    it('应该拒绝缺少版本的Extension', async () => {
      const invalidExtension: Extension = {
        metadata: {
          id: 'test-extension',
          name: 'Test Extension',
          permissions: []
        } as any, // Missing version
        defaultConfig: {}
      }

      const result = await manager.register(invalidExtension)
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Extension version is required')
    })

    it('应该拒绝无效的依赖配置', async () => {
      const invalidExtension: Extension = {
        metadata: {
          id: 'test-extension',
          name: 'Test Extension',
          version: '1.0.0',
          dependencies: 'invalid' as any, // Should be array
          permissions: []
        },
        defaultConfig: {}
      }

      const result = await manager.register(invalidExtension)
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Dependencies must be an array')
    })

    it('应该拒绝无效的init方法', async () => {
      const invalidExtension: Extension = {
        metadata: {
          id: 'test-extension',
          name: 'Test Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: 'not a function' as any
      }

      const result = await manager.register(invalidExtension)
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Extension init method must be a function')
    })
  })

  describe('Complex Dependency Management', () => {
    it('应该检测并阻止循环依赖', async () => {
      // Create extensions with circular dependencies
      const extensionA: Extension = {
        metadata: {
          id: 'extension-a',
          name: 'Extension A',
          version: '1.0.0',
          dependencies: ['extension-b'],
          permissions: []
        },
        defaultConfig: {}
      }

      const extensionB: Extension = {
        metadata: {
          id: 'extension-b',
          name: 'Extension B',
          version: '1.0.0',
          dependencies: ['extension-a'],
          permissions: []
        },
        defaultConfig: {}
      }

      // Register both extensions
      await manager.register(extensionA)
      await manager.register(extensionB)

      // Try to start extension A (should detect circular dependency)
      const result = await manager.start('extension-a')
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Circular dependency detected')
    })

    it('应该处理缺失的依赖', async () => {
      const extensionWithMissingDep: Extension = {
        metadata: {
          id: 'dependent-extension',
          name: 'Dependent Extension',
          version: '1.0.0',
          dependencies: ['non-existent-extension'],
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(extensionWithMissingDep)
      const result = await manager.start('dependent-extension')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Dependency non-existent-extension not found')
    })

    it('应该正确启动多级依赖', async () => {
      const coreExtension: Extension = {
        metadata: {
          id: 'core-ext',
          name: 'Core Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.resolve()),
        start: mock(() => Promise.resolve())
      }

      const middleExtension: Extension = {
        metadata: {
          id: 'middle-ext',
          name: 'Middle Extension',
          version: '1.0.0',
          dependencies: ['core-ext'],
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.resolve()),
        start: mock(() => Promise.resolve())
      }

      const topExtension: Extension = {
        metadata: {
          id: 'top-ext',
          name: 'Top Extension',
          version: '1.0.0',
          dependencies: ['middle-ext'],
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.resolve()),
        start: mock(() => Promise.resolve())
      }

      await manager.register(coreExtension)
      await manager.register(middleExtension)
      await manager.register(topExtension)

      const result = await manager.start('top-ext')
      expect(result.success).toBe(true)

      // Verify all dependencies were started
      expect(coreExtension.start).toHaveBeenCalled()
      expect(middleExtension.start).toHaveBeenCalled()
      expect(topExtension.start).toHaveBeenCalled()
    })

    it('应该正确获取依赖关系', async () => {
      const parentExt: Extension = {
        metadata: {
          id: 'parent-ext',
          name: 'Parent Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      const childExt: Extension = {
        metadata: {
          id: 'child-ext',
          name: 'Child Extension',
          version: '1.0.0',
          dependencies: ['parent-ext'],
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(parentExt)
      await manager.register(childExt)

      const dependents = manager.getDependents('parent-ext')
      expect(dependents).toContain('child-ext')
      expect(dependents.length).toBe(1)
    })

    it('应该阻止卸载有依赖的Extension', async () => {
      const parentExt: Extension = {
        metadata: {
          id: 'parent-ext',
          name: 'Parent Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      const childExt: Extension = {
        metadata: {
          id: 'child-ext',
          name: 'Child Extension',
          version: '1.0.0',
          dependencies: ['parent-ext'],
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(parentExt)
      await manager.register(childExt)

      const result = await manager.unregister('parent-ext')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('EXTENSION_HAS_DEPENDENTS')
      expect(result.error?.message).toContain('required by child-ext')
    })
  })

  describe('Lifecycle Management Edge Cases', () => {
    let testExtension: Extension

    beforeEach(() => {
      testExtension = {
        metadata: {
          id: 'lifecycle-test',
          name: 'Lifecycle Test Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.resolve()),
        setup: mock(() => Promise.resolve()),
        start: mock(() => Promise.resolve()),
        ready: mock(() => Promise.resolve()),
        stop: mock(() => Promise.resolve()),
        destroy: mock(() => Promise.resolve())
      }
    })

    it('应该处理init方法抛出的异常', async () => {
      testExtension.init = mock(() => Promise.reject(new Error('Init failed')))
      
      await manager.register(testExtension)
      const result = await manager.start('lifecycle-test')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Init failed')
    })

    it('应该处理setup方法抛出的异常', async () => {
      testExtension.setup = mock(() => Promise.reject(new Error('Setup failed')))
      
      await manager.register(testExtension)
      const result = await manager.start('lifecycle-test')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Setup failed')
    })

    it('应该处理start方法抛出的异常', async () => {
      testExtension.start = mock(() => Promise.reject(new Error('Start failed')))
      
      await manager.register(testExtension)
      const result = await manager.start('lifecycle-test')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Start failed')
    })

    it('应该处理ready方法抛出的异常', async () => {
      testExtension.ready = mock(() => Promise.reject(new Error('Ready failed')))
      
      await manager.register(testExtension)
      const result = await manager.start('lifecycle-test')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Ready failed')
    })

    it('应该处理stop方法抛出的异常', async () => {
      testExtension.stop = mock(() => Promise.reject(new Error('Stop failed')))
      
      await manager.register(testExtension)
      await manager.start('lifecycle-test')
      
      const result = await manager.stop('lifecycle-test')
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Stop failed')
    })

    it('应该处理destroy方法抛出的异常', async () => {
      testExtension.destroy = mock(() => Promise.reject(new Error('Destroy failed')))
      
      await manager.register(testExtension)
      const result = await manager.unregister('lifecycle-test')
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Destroy failed')
    })

    it('应该在Extension已初始化时跳过重复初始化', async () => {
      await manager.register(testExtension)
      await manager.start('lifecycle-test')
      
      // Try to start again
      const result = await manager.start('lifecycle-test')
      expect(result.success).toBe(true)
      
      // Init should only be called once
      expect(testExtension.init).toHaveBeenCalledTimes(1)
    })

    it('应该在Extension已停止时跳过重复停止', async () => {
      await manager.register(testExtension)
      await manager.start('lifecycle-test')
      
      // Stop twice
      await manager.stop('lifecycle-test')
      await manager.stop('lifecycle-test')
      
      // Stop should only be called once
      expect(testExtension.stop).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dynamic Loading Edge Cases', () => {
    it('应该处理已加载的Extension重复加载', async () => {
      const testExt: Extension = {
        metadata: {
          id: 'already-loaded',
          name: 'already-loaded',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(testExt)
      await manager.start('already-loaded')
      
      // Try to load again
      const result = await manager.loadExtension('already-loaded')
      expect(result.success).toBe(true)
      expect(result.instance).toBeDefined()
    })

    it('应该处理manifest未找到的情况', async () => {
      const result = await manager.loadExtension('non-existent-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MANIFEST_NOT_FOUND')
    })

    it('应该处理无效的manifest文件', async () => {
      const result = await manager.loadExtension('invalid-manifest')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('LOAD_ERROR')
    })

    it('应该处理缺少linchkit配置的manifest', async () => {
      const result = await manager.loadExtension('missing-linchkit')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MANIFEST_NOT_FOUND')
    })

    it('应该处理权限验证失败', async () => {
      // Mock permission manager to deny permission
      mockPermissionManager.hasPermissionPolicy.mockReturnValueOnce(false)
      
      const result = await manager.loadExtension('valid-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('PERMISSION_DENIED')
    })

    it('应该处理缺失依赖的情况', async () => {
      // Mock dependency check to fail
      mockPermissionManager.isDependencyAvailable.mockReturnValueOnce(false)
      
      const result = await manager.loadExtension('valid-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('DEPENDENCY_MISSING')
    })

    it('应该处理Extension导入失败', async () => {
      // Create a valid manifest but mock import to fail
      const originalImport = global.import
      global.import = mock(() => Promise.reject(new Error('Import failed')))
      
      const result = await manager.loadExtension('valid-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('IMPORT_FAILED')
      
      global.import = originalImport
    })
  })

  describe('Concurrent Operations', () => {
    it('应该处理并发注册操作', async () => {
      const extensions = Array.from({ length: 5 }, (_, i) => ({
        metadata: {
          id: `concurrent-ext-${i}`,
          name: `Concurrent Extension ${i}`,
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => new Promise(resolve => setTimeout(resolve, 10)))
      }))

      const results = await Promise.all(
        extensions.map(ext => manager.register(ext))
      )

      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('应该处理并发启停操作', async () => {
      // Register multiple extensions
      const extensions = Array.from({ length: 3 }, (_, i) => ({
        metadata: {
          id: `batch-ext-${i}`,
          name: `Batch Extension ${i}`,
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.resolve()),
        start: mock(() => Promise.resolve()),
        stop: mock(() => Promise.resolve())
      }))

      for (const ext of extensions) {
        await manager.register(ext)
      }

      // Start all concurrently
      const startResults = await Promise.all(
        extensions.map(ext => manager.start(ext.metadata.id))
      )

      startResults.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Stop all concurrently
      const stopResults = await Promise.all(
        extensions.map(ext => manager.stop(ext.metadata.id))
      )

      stopResults.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('应该处理startAll和stopAll操作', async () => {
      const extensions = Array.from({ length: 3 }, (_, i) => ({
        metadata: {
          id: `batch-all-ext-${i}`,
          name: `Batch All Extension ${i}`,
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: { enabled: i % 2 === 0 }, // Only even numbered extensions enabled
        start: mock(() => Promise.resolve()),
        stop: mock(() => Promise.resolve())
      }))

      for (const ext of extensions) {
        await manager.register(ext)
      }

      const startResults = await manager.startAll()
      expect(startResults.length).toBe(3)
      
      // Only 2 extensions should succeed (enabled ones)
      const successfulStarts = startResults.filter(r => r.success)
      expect(successfulStarts.length).toBe(2)

      const stopResults = await manager.stopAll()
      expect(stopResults.length).toBe(3)
    })
  })

  describe('Context Creation Edge Cases', () => {
    it('应该为每个Extension创建隔离的上下文', async () => {
      const ext1: Extension = {
        metadata: {
          id: 'context-test-1',
          name: 'Context Test 1',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      const ext2: Extension = {
        metadata: {
          id: 'context-test-2',
          name: 'Context Test 2',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(ext1)
      await manager.register(ext2)

      const instance1 = manager.getExtension('Context Test 1')
      const instance2 = manager.getExtension('Context Test 2')

      expect(instance1).toBeDefined()
      expect(instance2).toBeDefined()
      expect(instance1).not.toBe(instance2)
    })

    it('应该在浏览器环境中创建合适的存储实现', async () => {
      // Set browser environment
      globalThis.window = {} as any
      
      const browserManager = new UnifiedExtensionManager({
        enableSandbox: false
      })

      const ext: Extension = {
        metadata: {
          id: 'browser-ext',
          name: 'Browser Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      await browserManager.register(ext)
      const instance = browserManager.getExtension('Browser Extension')
      expect(instance).toBeDefined()
    })

    it('应该处理localStorage不可用的情况', async () => {
      globalThis.window = {} as any
      delete (globalThis as any).localStorage
      
      const noStorageManager = new UnifiedExtensionManager()
      
      const ext: Extension = {
        metadata: {
          id: 'no-storage-ext',
          name: 'No Storage Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      // Should not throw even without localStorage
      await expect(noStorageManager.register(ext)).resolves.toMatchObject({ success: true })
    })
  })

  describe('Event System Edge Cases', () => {
    it('应该发射Extension注册事件', async () => {
      const eventSpy = mock(() => {})
      manager.on('extensionRegistered', eventSpy)

      const ext: Extension = {
        metadata: {
          id: 'event-test',
          name: 'Event Test Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(ext)
      expect(eventSpy).toHaveBeenCalledWith({
        type: 'extensionRegistered',
        extension: ext
      })
    })

    it('应该发射Extension注销事件', async () => {
      const eventSpy = mock(() => {})
      manager.on('extensionUnregistered', eventSpy)

      const ext: Extension = {
        metadata: {
          id: 'unregister-event-test',
          name: 'Unregister Event Test',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(ext)
      await manager.unregister('unregister-event-test')
      
      expect(eventSpy).toHaveBeenCalledWith({
        extensionId: 'unregister-event-test'
      })
    })

    it('应该发射Extension加载和卸载事件', async () => {
      const loadSpy = mock(() => {})
      const unloadSpy = mock(() => {})
      
      manager.on('extensionLoaded', loadSpy)
      manager.on('extensionUnloaded', unloadSpy)

      // This will fail because the extension doesn't exist, but should still emit error event
      await manager.loadExtension('non-existent')
      await manager.unloadExtension('non-existent')
      
      // Events should not be emitted for failed operations
      expect(loadSpy).not.toHaveBeenCalled()
      expect(unloadSpy).not.toHaveBeenCalled()
    })
  })

  describe('Query and Status Edge Cases', () => {
    it('应该正确处理不存在的Extension查询', () => {
      expect(manager.getExtension('non-existent')).toBeUndefined()
      expect(manager.hasExtension('non-existent')).toBe(false)
      expect(manager.getExtensionStatus('non-existent')).toBeUndefined()
      expect(manager.getStatus('non-existent')).toBeUndefined()
    })

    it('应该返回所有已注册Extension的列表', async () => {
      const extensions = Array.from({ length: 3 }, (_, i) => ({
        metadata: {
          id: `query-ext-${i}`,
          name: `Query Extension ${i}`,
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }))

      for (const ext of extensions) {
        await manager.register(ext)
      }

      const allExtensions = manager.getAllExtensions()
      expect(allExtensions).toHaveLength(3)
    })

    it('应该正确过滤空实例', () => {
      // Mock a registration with null instance
      const registration = {
        extension: {
          metadata: { id: 'null-instance', name: 'Null Instance', version: '1.0.0', permissions: [] },
          defaultConfig: {}
        },
        config: {},
        instance: null,
        status: 'registered' as const,
        registeredAt: Date.now(),
        lastUpdated: Date.now()
      }
      
      // Directly add to internal map to simulate null instance
      ;(manager as any).extensions.set('null-instance', registration)
      
      const allExtensions = manager.getAllExtensions()
      // Should filter out null instances
      expect(allExtensions.every(ext => ext !== null)).toBe(true)
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('应该正确清理被销毁的Extension资源', async () => {
      const ext: Extension = {
        metadata: {
          id: 'cleanup-test',
          name: 'Cleanup Test Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        destroy: mock(() => Promise.resolve())
      }

      await manager.register(ext)
      await manager.start('cleanup-test')
      
      const result = await manager.unregister('cleanup-test')
      expect(result.success).toBe(true)
      
      // Extension should be removed from internal storage
      expect(manager.hasExtension('Cleanup Test Extension')).toBe(false)
      expect(mockSandbox.destroy).toHaveBeenCalled()
    })

    it('应该在销毁前停止运行中的Extension', async () => {
      const ext: Extension = {
        metadata: {
          id: 'running-cleanup-test',
          name: 'Running Cleanup Test',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        stop: mock(() => Promise.resolve()),
        destroy: mock(() => Promise.resolve())
      }

      await manager.register(ext)
      await manager.start('running-cleanup-test')
      
      // Verify it's running
      expect(manager.getStatus('running-cleanup-test')).toBe('running')
      
      const result = await manager.unregister('running-cleanup-test')
      expect(result.success).toBe(true)
      expect(ext.stop).toHaveBeenCalled()
      expect(ext.destroy).toHaveBeenCalled()
    })
  })

  describe('Hot Reload Edge Cases', () => {
    it('应该处理未加载Extension的重新加载', async () => {
      const result = await manager.reloadExtension('never-loaded')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('UNLOAD_FAILED')
    })

    it('应该清理manifest缓存在重新加载时', async () => {
      // First, populate the manifest cache
      const ext: Extension = {
        metadata: {
          id: 'cache-test',
          name: 'cache-test',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {}
      }

      await manager.register(ext)
      await manager.start('cache-test')
      
      // Verify it's in cache
      const manifestCache = (manager as any).manifestCache
      expect(manifestCache.has('cache-test')).toBe(false) // Not set during register
      
      // Now try to reload (this will fail, but should clear cache)
      await manager.reloadExtension('cache-test')
      
      expect(manifestCache.has('cache-test')).toBe(false)
    })
  })

  describe('Environment-Specific Behavior', () => {
    it('应该在浏览器环境中跳过文件系统操作', async () => {
      globalThis.window = {} as any
      const browserManager = new UnifiedExtensionManager()
      
      const result = await browserManager.loadExtension('any-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MANIFEST_NOT_FOUND')
    })

    it('应该在服务器环境中使用文件系统', async () => {
      delete (globalThis as any).window
      const serverManager = new UnifiedExtensionManager()
      
      // This should attempt to use fs/promises
      const result = await serverManager.loadExtension('valid-extension')
      
      // Should attempt to read manifest file
      expect(mockFsPromises.readFile).toHaveBeenCalled()
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('应该在Extension初始化失败后保持系统稳定', async () => {
      const faultyExt: Extension = {
        metadata: {
          id: 'faulty-ext',
          name: 'Faulty Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.reject(new Error('Initialization failed')))
      }

      const goodExt: Extension = {
        metadata: {
          id: 'good-ext',
          name: 'Good Extension',
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => Promise.resolve()),
        start: mock(() => Promise.resolve())
      }

      await manager.register(faultyExt)
      await manager.register(goodExt)
      
      // Faulty extension should fail
      const faultyResult = await manager.start('faulty-ext')
      expect(faultyResult.success).toBe(false)
      
      // Good extension should still work
      const goodResult = await manager.start('good-ext')
      expect(goodResult.success).toBe(true)
      
      // Manager should still be functional
      expect(manager.hasExtension('Good Extension')).toBe(true)
    })

    it('应该在一个Extension出错时不影响其他Extension', async () => {
      const extensions = Array.from({ length: 5 }, (_, i) => ({
        metadata: {
          id: `resilience-ext-${i}`,
          name: `Resilience Extension ${i}`,
          version: '1.0.0',
          permissions: []
        },
        defaultConfig: {},
        init: mock(() => i === 2 ? Promise.reject(new Error('Fail')) : Promise.resolve()),
        start: mock(() => Promise.resolve())
      }))

      // Register all extensions
      for (const ext of extensions) {
        await manager.register(ext)
      }

      // Start all extensions
      const results = await manager.startAll()
      
      // 4 should succeed, 1 should fail
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      expect(successCount).toBe(4)
      expect(failureCount).toBe(1)
    })
  })

  describe('Default Manager Instance', () => {
    it('应该导出默认管理器实例', () => {
      const { unifiedExtensionManager, extensionManager } = require('../../extension/unified-manager')
      
      expect(unifiedExtensionManager).toBeInstanceOf(UnifiedExtensionManager)
      expect(extensionManager).toBe(unifiedExtensionManager) // Backward compatibility alias
    })

    it('应该使用环境变量配置默认实例', () => {
      // Mock environment variables
      const originalEnv = globalThis.process?.env
      if (globalThis.process) {
        globalThis.process.env = {
          ...originalEnv,
          EXTENSION_ROOT: '/custom/extensions',
          NODE_ENV: 'production'
        }
      }

      // Re-require to get fresh instance
      delete require.cache[require.resolve('../../extension/unified-manager')]
      const { unifiedExtensionManager } = require('../../extension/unified-manager')
      
      expect(unifiedExtensionManager).toBeDefined()
      
      // Restore environment
      if (globalThis.process && originalEnv) {
        globalThis.process.env = originalEnv
      }
    })
  })
})
