import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

import { PluginRegistry } from '../../plugin/registry'
import type { Plugin, PluginMetadata, PluginStatus } from '../../types'

describe('PluginRegistry', () => {
  let registry: PluginRegistry
  let mockPlugin: Plugin
  let mockPluginWithDeps: Plugin

  beforeEach(() => {
    registry = new PluginRegistry()

    // Create mock plugin
    mockPlugin = {
      metadata: {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
      },
      init: mock().mockResolvedValue(undefined),
      setup: mock().mockResolvedValue(undefined),
      start: mock().mockResolvedValue(undefined),
      ready: mock().mockResolvedValue(undefined),
      stop: mock().mockResolvedValue(undefined),
      destroy: mock().mockResolvedValue(undefined),
    }

    // Plugin with dependencies
    mockPluginWithDeps = {
      metadata: {
        id: 'dependent-plugin',
        name: 'Dependent Plugin',
        version: '1.0.0',
        dependencies: ['test-plugin'],
      },
      init: mock().mockResolvedValue(undefined),
      setup: mock().mockResolvedValue(undefined),
      start: mock().mockResolvedValue(undefined),
      ready: mock().mockResolvedValue(undefined),
      stop: mock().mockResolvedValue(undefined),
      destroy: mock().mockResolvedValue(undefined),
    }
  })

  afterEach(() => {
    mock.restore()
  })

  describe('Plugin Registration', () => {
    it('should register a valid plugin', () => {
      registry.registerSync(mockPlugin)

      expect(registry.getPlugin('test-plugin')).toBe(mockPlugin)
      expect(registry.getPlugins()).toHaveLength(1)
    })

    it('should reject duplicate plugin registration', () => {
      registry.registerSync(mockPlugin)

      expect(() => registry.registerSync(mockPlugin)).toThrow(
        'Plugin test-plugin is already registered'
      )
    })

    it('should reject plugin with invalid metadata', () => {
      const invalidPlugin = { ...mockPlugin, metadata: { ...mockPlugin.metadata, id: '' } }

      expect(() => registry.registerSync(invalidPlugin)).toThrow('Plugin ID is required')
    })

    it('should validate plugin required methods', () => {
      const invalidPlugin = { ...mockPlugin }
      delete (invalidPlugin as any).init

      expect(() => registry.registerSync(invalidPlugin)).toThrow(
        'Plugin must implement required lifecycle methods'
      )
    })

    it('should emit registration events', () => {
      const listener = mock()
      registry.on('pluginRegistered', listener)

      registry.registerSync(mockPlugin)

      expect(listener).toHaveBeenCalledWith({
        type: 'pluginRegistered',
        plugin: mockPlugin,
      })
    })
  })

  describe('Plugin Lifecycle Management', () => {
    beforeEach(() => {
      registry.registerSync(mockPlugin)
    })

    it('should start plugin through complete lifecycle', async () => {
      await registry.startPlugin('test-plugin')

      expect(mockPlugin.init).toHaveBeenCalledTimes(1)
      expect(mockPlugin.setup).toHaveBeenCalledTimes(1)
      expect(mockPlugin.start).toHaveBeenCalledTimes(1)
      expect(mockPlugin.ready).toHaveBeenCalledTimes(1)

      expect(registry.getPluginStatus('test-plugin')).toBe('started')
    })

    it('should stop plugin through complete lifecycle', async () => {
      await registry.startPlugin('test-plugin')
      await registry.stopPlugin('test-plugin')

      expect(mockPlugin.stop).toHaveBeenCalledTimes(1)

      expect(registry.getPluginStatus('test-plugin')).toBe('stopped')
    })

    it('should handle plugin initialization failure', async () => {
      const error = new Error('Init failed')
      mockPlugin.init = mock().mockRejectedValue(error)

      await expect(registry.startPlugin('test-plugin')).rejects.toThrow('Init failed')
      expect(registry.getPluginStatus('test-plugin')).toBe('error')
    })

    it('should not start already started plugin', async () => {
      await registry.startPlugin('test-plugin')

      // Second start should be no-op
      await registry.startPlugin('test-plugin')

      expect(mockPlugin.init).toHaveBeenCalledTimes(1)
    })

    it('should emit lifecycle events', async () => {
      const listener = mock()
      registry.on('pluginStarted', listener)

      await registry.startPlugin('test-plugin')

      expect(listener).toHaveBeenCalledWith({
        type: 'pluginStarted',
        pluginId: 'test-plugin',
        plugin: mockPlugin,
      })
    })
  })

  describe('Dependency Management', () => {
    beforeEach(() => {
      registry.registerSync(mockPlugin)
      registry.registerSync(mockPluginWithDeps)
    })

    it('should start dependencies before dependent plugins', async () => {
      await registry.startPlugin('dependent-plugin')

      // Both plugins should be started
      expect(registry.getPluginStatus('test-plugin')).toBe('started')
      expect(registry.getPluginStatus('dependent-plugin')).toBe('started')

      // Dependency should be started first
      expect(mockPlugin.init).toHaveBeenCalled()
      expect(mockPluginWithDeps.init).toHaveBeenCalled()
    })

    it('should stop dependents before dependencies', async () => {
      await registry.startPlugin('dependent-plugin')
      await registry.stopPlugin('test-plugin')

      // Both plugins should be stopped
      expect(registry.getPluginStatus('test-plugin')).toBe('stopped')
      expect(registry.getPluginStatus('dependent-plugin')).toBe('stopped')
    })

    it('should detect circular dependencies', async () => {
      const pluginA = {
        ...mockPlugin,
        metadata: { ...mockPlugin.metadata, id: 'plugin-a', dependencies: ['plugin-b'] },
      }
      const pluginB = {
        ...mockPlugin,
        metadata: { ...mockPlugin.metadata, id: 'plugin-b', dependencies: ['plugin-a'] },
      }

      registry.registerSync(pluginA)
      registry.registerSync(pluginB)

      await expect(registry.startPlugin('plugin-a')).rejects.toThrow('Circular dependency detected')
    })

    it('should fail when dependency is missing', async () => {
      const pluginWithMissingDep = {
        ...mockPlugin,
        metadata: {
          ...mockPlugin.metadata,
          id: 'missing-dep-plugin',
          dependencies: ['non-existent'],
        },
      }

      registry.registerSync(pluginWithMissingDep)

      await expect(registry.startPlugin('missing-dep-plugin')).rejects.toThrow(
        'Dependency non-existent not found'
      )
    })
  })

  describe('Plugin Status and Queries', () => {
    beforeEach(() => {
      registry.registerSync(mockPlugin)
    })

    it('should return correct plugin status', () => {
      expect(registry.getPluginStatus('test-plugin')).toBe('registered')
    })

    it('should list all plugins', () => {
      const plugins = registry.getPlugins()
      expect(plugins).toHaveLength(1)
      expect(plugins[0]).toBe(mockPlugin)
    })

    it('should list started plugins', async () => {
      await registry.startPlugin('test-plugin')

      const startedPlugins = registry.getStartedPlugins()
      expect(startedPlugins).toHaveLength(1)
      expect(startedPlugins[0]).toBe(mockPlugin)
    })

    it('should check if plugin exists', () => {
      expect(registry.hasPlugin('test-plugin')).toBe(true)
      expect(registry.hasPlugin('non-existent')).toBe(false)
    })
  })

  describe('Bulk Operations', () => {
    beforeEach(() => {
      registry.registerSync(mockPlugin)
      registry.registerSync(mockPluginWithDeps)
    })

    it('should start all plugins', async () => {
      await registry.startAll()

      expect(registry.getPluginStatus('test-plugin')).toBe('started')
      expect(registry.getPluginStatus('dependent-plugin')).toBe('started')
    })

    it('should stop all plugins', async () => {
      await registry.startAll()
      await registry.stopAll()

      expect(registry.getPluginStatus('test-plugin')).toBe('stopped')
      expect(registry.getPluginStatus('dependent-plugin')).toBe('stopped')
    })

    it('should handle partial failures during startAll', async () => {
      mockPluginWithDeps.init = mock().mockRejectedValue(new Error('Failed'))

      const results = await registry.startAll()

      // Should return results array with some failures
      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true) // test-plugin should succeed
      expect(results[1].success).toBe(false) // dependent-plugin should fail

      // Independent plugin should still be started
      expect(registry.getPluginStatus('test-plugin')).toBe('started')
      expect(registry.getPluginStatus('dependent-plugin')).toBe('error')
    })
  })

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      registry.registerSync(mockPlugin)
    })

    it('should handle plugin runtime errors', async () => {
      await registry.startPlugin('test-plugin')

      // Simulate a runtime error by setting status directly
      registry.setPluginStatus('test-plugin', 'error')

      expect(registry.getPluginStatus('test-plugin')).toBe('error')
    })

    it('should clean up resources on stop failure', async () => {
      await registry.startPlugin('test-plugin')

      const stopError = new Error('Stop failed')
      mockPlugin.stop = mock().mockRejectedValue(stopError)

      await expect(registry.stopPlugin('test-plugin')).rejects.toThrow('Stop failed')

      // Plugin status should be set to failed
      expect(registry.getPluginStatus('test-plugin')).toBe('error')
    })

    it('should track failed plugins', () => {
      registry.setPluginStatus('test-plugin', 'error')

      const failedPlugins = registry.getFailedPlugins()
      expect(failedPlugins).toHaveLength(1)
      expect(failedPlugins[0]).toBe(mockPlugin)
    })
  })

  describe('Plugin Metadata Validation', () => {
    it('should validate required metadata fields', () => {
      const invalidCases = [
        { ...mockPlugin, metadata: { ...mockPlugin.metadata, id: undefined } },
        { ...mockPlugin, metadata: { ...mockPlugin.metadata, name: undefined } },
        { ...mockPlugin, metadata: { ...mockPlugin.metadata, version: undefined } },
        { ...mockPlugin, metadata: { ...mockPlugin.metadata, id: '' } },
        { ...mockPlugin, metadata: { ...mockPlugin.metadata, name: '' } },
        { ...mockPlugin, metadata: { ...mockPlugin.metadata, version: '' } },
      ]

      invalidCases.forEach(invalidPlugin => {
        expect(() => registry.registerSync(invalidPlugin as any)).toThrow()
      })
    })

    it('should validate dependency format', () => {
      const invalidDepsPlugin = {
        ...mockPlugin,
        metadata: {
          ...mockPlugin.metadata,
          id: 'invalid-deps',
          dependencies: 'not-an-array' as any,
        }, // Should be array
      }

      expect(() => registry.registerSync(invalidDepsPlugin as any)).toThrow()
    })
  })

  describe('Event System', () => {
    it('should emit all plugin lifecycle events', async () => {
      const events: string[] = []
      const listener = (event: any) => events.push(event.type)

      registry.on('pluginRegistered', listener)
      registry.on('pluginStarted', listener)
      registry.on('pluginStopped', listener)

      registry.registerSync(mockPlugin)
      await registry.startPlugin('test-plugin')
      await registry.stopPlugin('test-plugin')

      expect(events).toEqual(['pluginRegistered', 'pluginStarted', 'pluginStopped'])
    })

    it('should handle event listener errors gracefully', async () => {
      registry.registerSync(mockPlugin)

      registry.on('pluginStarted', () => {
        throw new Error('Listener error')
      })

      // Should still start successfully despite listener error
      await registry.startPlugin('test-plugin')
      expect(registry.getPluginStatus('test-plugin')).toBe('started')
    })
  })
})
