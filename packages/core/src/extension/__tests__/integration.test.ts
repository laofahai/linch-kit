/**
 * Extension系统集成测试
 * 测试完整的Extension生命周期：加载、卸载、热重载
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { EventEmitter } from 'eventemitter3'

import { ExtensionManager } from '../manager'
import { permissionManager } from '../permission-manager'
import { pluginRegistry } from '../../plugin/registry'
import type { Extension, ExtensionLoadResult, ExtensionInstance } from '../types'

// Mock Extension示例
const mockExtension: Extension = {
  metadata: {
    id: 'test-extension',
    name: 'Test Extension',
    version: '1.0.0',
    description: 'Test extension for integration tests',
    displayName: 'Test Extension',
    category: 'test',
    tags: ['test', 'integration'],
    permissions: ['database:read', 'api:read', 'ui:render'],
    capabilities: {
      hasSchema: true,
      hasAPI: true,
      hasUI: true,
      hasHooks: false,
    },
    entries: {
      schema: 'schema.ts',
      api: 'api.ts',
      components: 'components.ts',
    },
    configuration: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether the extension is enabled'
      },
      autoStart: {
        type: 'boolean', 
        default: true,
        description: 'Whether to auto-start the extension'
      },
    },
    dependencies: [],
  },
  defaultConfig: {
    enabled: true,
    priority: 1,
  },
  init: mock(async config => {
    console.log('Extension initialized with config:', config)
  }),
  setup: mock(async config => {
    console.log('Extension setup with config:', config)
  }),
  start: mock(async config => {
    console.log('Extension started with config:', config)
  }),
  ready: mock(async config => {
    console.log('Extension ready with config:', config)
  }),
  stop: mock(async config => {
    console.log('Extension stopped with config:', config)
  }),
  destroy: mock(async config => {
    console.log('Extension destroyed with config:', config)
  }),
}

describe('Extension System Integration Tests', () => {
  let extensionManager: ExtensionManager
  let originalImport: any
  let originalReadFile: unknown

  beforeEach(() => {
    // 创建新的ExtensionManager实例
    extensionManager = new ExtensionManager({
      extensionRoot: '/mock/extensions',
      enableSandbox: false, // 禁用沙箱以避免VM2在测试环境中的兼容问题
    })

    // 设置模块导入器mock
    extensionManager.setModuleImporter(
      mock(async (path: string) => {
        if (path.includes('test-extension')) {
          return { default: mockExtension }
        }
        throw new Error(`Module not found: ${path}`)
      })
    )

    // 设置文件读取器mock
    extensionManager.setFileReader(
      mock(async (path: string) => {
        if (path.includes('test-extension/package.json')) {
          return JSON.stringify({
            name: 'test-extension',
            version: '1.0.0',
            description: 'Test extension for integration tests',
            linchkit: {
              displayName: 'Test Extension',
              category: 'test',
              tags: ['test', 'integration'],
              permissions: ['database:read', 'api:read', 'ui:render'],
              capabilities: {
                hasSchema: true,
                hasAPI: true,
                hasUI: true,
                hasHooks: false,
              },
              entries: {
                main: 'index.ts',
                schema: 'schema.ts',
                api: 'api.ts',
                components: 'components.ts',
              },
              configuration: {
                enabled: true,
                autoStart: true,
              },
            },
          })
        }
        throw new Error(`File not found: ${path}`)
      })
    )
  })

  afterEach(async () => {
    // 清理所有Extension
    const extensions = extensionManager.getAllExtensions()
    for (const ext of extensions) {
      if (ext.name) {
        await extensionManager.unloadExtension(ext.name)
      }
    }

    // 强制清理所有插件（防止测试间状态泄漏）
    const allPlugins = pluginRegistry.getAll()
    for (const plugin of allPlugins) {
      await pluginRegistry.unregister(plugin.plugin.metadata.id)
    }

    // 重置所有mock到原始状态
    mockExtension.init = mock(async config => {
      console.log('Extension initialized with config:', config)
    })
    mockExtension.setup = mock(async config => {
      console.log('Extension setup with config:', config)
    })
    mockExtension.start = mock(async config => {
      console.log('Extension started with config:', config)
    })
    mockExtension.ready = mock(async config => {
      console.log('Extension ready with config:', config)
    })
    mockExtension.stop = mock(async config => {
      console.log('Extension stopped with config:', config)
    })
    mockExtension.destroy = mock(async config => {
      console.log('Extension destroyed with config:', config)
    })

    // 清理事件监听器
    extensionManager.removeAllListeners()
  })

  describe('Extension Loading', () => {
    it('应该成功加载Extension', async () => {
      const result = await extensionManager.loadExtension('test-extension')

      if (!result.success) {
        console.error('Extension load failed:', result.error)
      }

      expect(result.success).toBe(true)
      expect(result.instance).toBeDefined()
      expect(result.instance?.name).toBe('test-extension')
      expect(result.instance?.initialized).toBe(true)
      expect(result.instance?.running).toBe(true)

      // 验证生命周期方法被调用
      expect(mockExtension.init).toHaveBeenCalledTimes(1)
      expect(mockExtension.start).toHaveBeenCalledTimes(1)
    })

    it('应该阻止重复加载同一Extension', async () => {
      // 第一次加载
      const firstResult = await extensionManager.loadExtension('test-extension')
      expect(firstResult.success).toBe(true)

      // 重置mock计数以清除第一次加载的调用
      const initCallCount = mockExtension.init.mock.calls.length
      const startCallCount = mockExtension.start.mock.calls.length

      // 第二次加载应该返回现有实例
      const secondResult = await extensionManager.loadExtension('test-extension')
      expect(secondResult.success).toBe(true)
      expect(secondResult.instance).toBe(firstResult.instance)

      // 生命周期方法不应该再次被调用
      expect(mockExtension.init).toHaveBeenCalledTimes(initCallCount)
      expect(mockExtension.start).toHaveBeenCalledTimes(startCallCount)
    })

    it('应该处理权限不足的情况', async () => {
      // Mock权限管理器拒绝权限
      const originalGrantPermissions = permissionManager.grantExtensionPermissions
      permissionManager.grantExtensionPermissions = mock(async () => ({
        granted: [],
        denied: ['database:read'],
      }))

      const result = await extensionManager.loadExtension('test-extension')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('PERMISSIONS_DENIED')
      expect(result.error?.message).toContain('database:read')

      // 恢复原始方法
      permissionManager.grantExtensionPermissions = originalGrantPermissions
    })

    it('应该处理Extension导入失败的情况', async () => {
      // 创建新的ExtensionManager并设置失败的导入器
      const failingManager = new ExtensionManager({
        extensionRoot: '/mock/extensions',
        enableSandbox: false,
      })

      failingManager.setFileReader(
        mock(async (path: string) => {
          if (path.includes('test-extension/package.json')) {
            return JSON.stringify({
              name: 'test-extension',
              version: '1.0.0',
              description: 'Test extension for integration tests',
              linchkit: {
                displayName: 'Test Extension',
                category: 'test',
                tags: ['test', 'integration'],
                permissions: ['database:read', 'api:read', 'ui:render'],
                capabilities: {
                  hasSchema: true,
                  hasAPI: true,
                  hasUI: true,
                  hasHooks: false,
                },
                entries: {
                  main: 'index.ts',
                  schema: 'schema.ts',
                  api: 'api.ts',
                  components: 'components.ts',
                },
                configuration: {
                  enabled: true,
                  autoStart: true,
                },
              },
            })
          }
          throw new Error(`File not found: ${path}`)
        })
      )
      failingManager.setModuleImporter(
        mock(async () => {
          throw new Error('Import failed')
        })
      )

      const result = await failingManager.loadExtension('test-extension')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('IMPORT_FAILED')
    })

    it('应该处理manifest不存在的情况', async () => {
      const result = await extensionManager.loadExtension('nonexistent-extension')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MANIFEST_NOT_FOUND')
    })
  })

  describe('Extension Unloading', () => {
    it('应该成功卸载Extension', async () => {
      // 先加载Extension
      const loadResult = await extensionManager.loadExtension('test-extension')
      expect(loadResult.success).toBe(true)

      // 卸载Extension
      const unloadResult = await extensionManager.unloadExtension('test-extension')
      expect(unloadResult).toBe(true)

      // 验证生命周期方法被调用 (destroy可能被调用多次是正常的，因为afterEach也会清理)
      expect(mockExtension.destroy).toHaveBeenCalled()

      // 验证Extension已被移除
      expect(extensionManager.hasExtension('test-extension')).toBe(false)
      expect(extensionManager.getExtension('test-extension')).toBeUndefined()
    })

    it('应该处理卸载不存在的Extension', async () => {
      const result = await extensionManager.unloadExtension('nonexistent-extension')
      expect(result).toBe(false)
    })

    it('应该处理Extension停止过程中的错误', async () => {
      // Mock停止方法抛出错误
      mockExtension.destroy = mock(async () => {
        throw new Error('Stop failed')
      })

      // 先加载Extension
      await extensionManager.loadExtension('test-extension')

      // 卸载Extension（应该处理错误但不抛出）
      const result = await extensionManager.unloadExtension('test-extension')
      expect(result).toBe(false)
    })
  })

  describe('Extension Hot Reload', () => {
    it('应该成功热重载Extension', async () => {
      // 先加载Extension
      const loadResult = await extensionManager.loadExtension('test-extension')
      expect(loadResult.success).toBe(true)

      // 重置mock计数
      mockExtension.init.mockClear()
      mockExtension.start.mockClear()
      mockExtension.destroy.mockClear()

      // 热重载Extension
      const reloadResult = await extensionManager.reloadExtension('test-extension')
      expect(reloadResult.success).toBe(true)

      // 验证先卸载再加载
      expect(mockExtension.destroy).toHaveBeenCalledTimes(1)
      expect(mockExtension.init).toHaveBeenCalledTimes(1)
      expect(mockExtension.start).toHaveBeenCalledTimes(1)
    })

    it('应该能够热重载未加载的Extension', async () => {
      // 直接热重载未加载的Extension
      const result = await extensionManager.reloadExtension('test-extension')
      expect(result.success).toBe(true)

      // 验证Extension被加载
      expect(extensionManager.hasExtension('test-extension')).toBe(true)
    })

    it('应该处理热重载过程中的错误', async () => {
      // 先加载Extension
      await extensionManager.loadExtension('test-extension')

      // Mock卸载失败
      mockExtension.destroy = mock(async () => {
        throw new Error('Unload failed')
      })

      const result = await extensionManager.reloadExtension('test-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('UNLOAD_FAILED')
    })
  })

  describe('Extension State Management', () => {
    it('应该正确跟踪Extension状态', async () => {
      // 初始状态
      expect(extensionManager.hasExtension('test-extension')).toBe(false)
      expect(extensionManager.getExtensionStatus('test-extension')).toBeUndefined()

      // 加载后状态
      await extensionManager.loadExtension('test-extension')
      expect(extensionManager.hasExtension('test-extension')).toBe(true)
      expect(extensionManager.getExtensionStatus('test-extension')).toBe('running')

      // 卸载后状态
      await extensionManager.unloadExtension('test-extension')
      expect(extensionManager.hasExtension('test-extension')).toBe(false)
      expect(extensionManager.getExtensionStatus('test-extension')).toBeUndefined()
    })

    it('应该返回所有Extension实例', async () => {
      // 初始状态
      expect(extensionManager.getAllExtensions()).toHaveLength(0)

      // 加载Extension
      await extensionManager.loadExtension('test-extension')
      const extensions = extensionManager.getAllExtensions()
      expect(extensions).toHaveLength(1)
      expect(extensions[0]?.name).toBe('test-extension')

      // 卸载Extension
      await extensionManager.unloadExtension('test-extension')
      expect(extensionManager.getAllExtensions()).toHaveLength(0)
    })

    it('应该正确处理Extension错误状态', async () => {
      // Mock初始化失败
      mockExtension.init = mock(async () => {
        throw new Error('Init failed')
      })

      const result = await extensionManager.loadExtension('test-extension')
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('LOAD_ERROR')

      // Extension应该在错误状态
      expect(extensionManager.getExtensionStatus('test-extension')).toBe('error')
    })
  })

  describe('Extension Events', () => {
    it('应该触发Extension生命周期事件', async () => {
      const loadedHandler = mock()
      const unloadedHandler = mock()
      const errorHandler = mock()

      extensionManager.on('extensionLoaded', loadedHandler)
      extensionManager.on('extensionUnloaded', unloadedHandler)
      extensionManager.on('extensionError', errorHandler)

      // 加载Extension
      await extensionManager.loadExtension('test-extension')
      expect(loadedHandler).toHaveBeenCalledTimes(1)
      expect(loadedHandler).toHaveBeenCalledWith({
        name: 'test-extension',
        instance: expect.any(Object),
      })

      // 卸载Extension
      await extensionManager.unloadExtension('test-extension')
      expect(unloadedHandler).toHaveBeenCalledTimes(1)
      expect(unloadedHandler).toHaveBeenCalledWith({
        name: 'test-extension',
      })
    })

    it('应该触发Extension错误事件', async () => {
      const errorHandler = mock()
      extensionManager.on('extensionError', errorHandler)

      // Mock初始化失败
      mockExtension.init = mock(async () => {
        throw new Error('Init failed')
      })

      await extensionManager.loadExtension('test-extension')
      expect(errorHandler).toHaveBeenCalledTimes(1)
      expect(errorHandler).toHaveBeenCalledWith({
        name: 'test-extension',
        error: expect.any(Error),
      })
    })
  })

  describe('Extension Context', () => {
    it('应该为Extension提供隔离的上下文', async () => {
      const result = await extensionManager.loadExtension('test-extension')
      expect(result.success).toBe(true)

      const instance = result.instance as ExtensionInstance
      expect(instance.context).toBeDefined()
      expect(instance.context.name).toBe('Test Extension')
      expect(instance.context.permissions).toEqual(['database:read', 'api:read', 'ui:render'])
      expect(instance.context.config).toBeDefined()
      expect(instance.context.logger).toBeDefined()
      expect(instance.context.events).toBeDefined()
      expect(instance.context.storage).toBeDefined()
    })

    it('应该为Extension提供隔离的存储', async () => {
      const result = await extensionManager.loadExtension('test-extension')
      expect(result.success).toBe(true)

      const instance = result.instance as ExtensionInstance
      const storage = instance.context.storage

      // 测试存储操作
      await storage.set('testKey', 'testValue')
      const value = await storage.get('testKey')
      expect(value).toBe('testValue')

      // 测试删除
      await storage.delete('testKey')
      const deletedValue = await storage.get('testKey')
      expect(deletedValue).toBeNull()
    })

    it('应该为Extension提供事件总线', async () => {
      const result = await extensionManager.loadExtension('test-extension')
      expect(result.success).toBe(true)

      const instance = result.instance as ExtensionInstance
      const events = instance.context.events

      const handler = mock()
      events.on('testEvent', handler)

      // 触发事件
      events.emit('testEvent', { data: 'test' })
      expect(handler).toHaveBeenCalledWith({ data: 'test' })

      // 取消监听
      events.off('testEvent', handler)
      events.emit('testEvent', { data: 'test2' })
      expect(handler).toHaveBeenCalledTimes(1) // 仍然只被调用一次
    })
  })
})
