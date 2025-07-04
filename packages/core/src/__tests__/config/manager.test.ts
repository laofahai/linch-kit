import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

import { ConfigManager } from '../../config/manager'
import type { ConfigSource } from '../../types'

// Mock fs/promises
const mockReadFile = mock()
mock.module('fs/promises', () => ({
  readFile: mockReadFile
}))

// Mock yaml
const mockYamlParse = mock()
mock.module('yaml', () => ({
  parse: mockYamlParse
}))

// Mock fetch for remote configs
global.fetch = mock()

describe('ConfigManager', () => {
  let manager: ConfigManager
  beforeEach(() => {
    manager = new ConfigManager()
    
    // Clear all mocks
    mockReadFile.mockClear()
    mockYamlParse.mockClear()
    global.fetch.mockClear()
  })

  afterEach(() => {
    // Mocks are automatically restored by Bun
  })

  describe('Basic Configuration Management', () => {
    it('should set and get configuration values', () => {
      manager.set('app.name', 'TestApp')
      manager.set('app.version', '1.0.0')
      manager.set('app.debug', true)

      expect(manager.get('app.name')).toBe('TestApp')
      expect(manager.get('app.version')).toBe('1.0.0')
      expect(manager.get('app.debug')).toBe(true)
    })

    it('should return default value for non-existent keys', () => {
      expect(manager.get('non.existent')).toBeUndefined()
      expect(manager.get('non.existent', 'default')).toBe('default')
      expect(manager.get('non.existent', 42)).toBe(42)
      expect(manager.get('non.existent', { foo: 'bar' })).toEqual({ foo: 'bar' })
    })

    it('should check if configuration exists', () => {
      manager.set('exists', 'value')
      
      expect(manager.has('exists')).toBe(true)
      expect(manager.has('does.not.exist')).toBe(false)
    })

    it('should delete configuration values', () => {
      manager.set('to.delete', 'value')
      expect(manager.has('to.delete')).toBe(true)

      const deleted = manager.delete('to.delete')
      expect(deleted).toBe(true)
      expect(manager.has('to.delete')).toBe(false)

      // Deleting non-existent key should return false
      const notDeleted = manager.delete('non.existent')
      expect(notDeleted).toBe(false)
    })

    it('should get all configuration values', () => {
      manager.set('key1', 'value1')
      manager.set('key2', 42)
      manager.set('key3', true)

      const all = manager.getAll()
      expect(all).toEqual({
        key1: 'value1',
        key2: 42,
        key3: true
      })
    })

    it('should clear all configuration', () => {
      manager.set('key1', 'value1')
      manager.set('key2', 'value2')

      const listener = mock()
      manager.on('config:cleared', listener)

      manager.clear()

      expect(manager.getAll()).toEqual({})
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('Configuration Events', () => {
    it('should emit config:changed event when value changes', () => {
      const listener = mock()
      manager.on('config:changed', listener)

      manager.set('test.key', 'initial')
      expect(listener).toHaveBeenCalledWith({
        key: 'test.key',
        oldValue: undefined,
        newValue: 'initial'
      })

      manager.set('test.key', 'updated')
      expect(listener).toHaveBeenCalledWith({
        key: 'test.key',
        oldValue: 'initial',
        newValue: 'updated'
      })
    })

    it('should not emit config:changed event when value is the same', () => {
      const listener = mock()
      manager.on('config:changed', listener)

      manager.set('test.key', 'value')
      manager.set('test.key', 'value') // Same value

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should emit config:deleted event when value is deleted', () => {
      const listener = mock()
      manager.on('config:deleted', listener)

      manager.set('test.key', 'value')
      manager.delete('test.key')

      expect(listener).toHaveBeenCalledWith({
        key: 'test.key',
        oldValue: 'value'
      })
    })
  })

  describe('Configuration Watching', () => {
    it('should watch for configuration changes', () => {
      const callback = mock()
      const unwatch = manager.watch('test.key', callback)

      manager.set('test.key', 'value1')
      expect(callback).toHaveBeenCalledWith('value1')

      manager.set('test.key', 'value2')
      expect(callback).toHaveBeenCalledWith('value2')

      unwatch()
      manager.set('test.key', 'value3')
      expect(callback).toHaveBeenCalledTimes(2) // Should not be called after unwatch
    })

    it('should support deep watching', () => {
      const callback = mock()
      manager.watch('app.name', callback, { deep: true })

      manager.set('app', { name: 'TestApp' })
      manager.set('app.name', 'TestApp')

      // The callback is called twice: once for 'app' and once for 'app.name'
      expect(callback).toHaveBeenCalledTimes(2)
      // Both calls should be with the value 'TestApp' since setting 'app.name' to 'TestApp'
      expect(callback).toHaveBeenLastCalledWith('TestApp')
    })

    it('should manage watchers with IDs', () => {
      const callback = mock()
      manager.watch('test.key', callback, { watchId: 'watcher1' })

      manager.set('test.key', 'value')
      expect(callback).toHaveBeenCalledTimes(1)

      manager.unwatch('watcher1')
      manager.set('test.key', 'new-value')
      expect(callback).toHaveBeenCalledTimes(1) // Should not be called after unwatch
    })
  })

  describe('Configuration Sources', () => {
    describe('Object Source', () => {
      it('should load configuration from object source', async () => {
        const source: ConfigSource = {
          id: 'test-object',
          type: 'object',
          data: {
            app: {
              name: 'TestApp',
              version: '1.0.0'
            },
            database: {
              host: 'localhost',
              port: 5432
            }
          }
        }

        const listener = mock()
        manager.on('config:loaded', listener)

        await manager.loadConfig(source)

        expect(manager.get('app')).toEqual({ name: 'TestApp', version: '1.0.0' })
        expect(manager.get('database')).toEqual({ host: 'localhost', port: 5432 })
        expect(listener).toHaveBeenCalledWith({
          sourceId: 'test-object',
          config: source.data
        })
      })
    })

    describe('File Source', () => {
      it('should load JSON configuration from file', async () => {
        const configData = { app: { name: 'FileApp' }, port: 3000 }
        mockReadFile.mockResolvedValue(JSON.stringify(configData))

        const source: ConfigSource = {
          id: 'json-config',
          type: 'file',
          path: '/path/to/config.json'
        }

        await manager.loadConfig(source)

        expect(mockReadFile).toHaveBeenCalledWith('/path/to/config.json', 'utf-8')
        expect(manager.get('app')).toEqual({ name: 'FileApp' })
        expect(manager.get('port')).toBe(3000)
      })

      it('should load YAML configuration from file', async () => {
        const configData = { app: { name: 'YamlApp' }, enabled: true }
        mockReadFile.mockResolvedValue('app:\n  name: YamlApp\nenabled: true')
        mockYamlParse.mockReturnValue(configData)

        const source: ConfigSource = {
          id: 'yaml-config',
          type: 'file',
          path: '/path/to/config.yaml'
        }

        await manager.loadConfig(source)

        expect(mockReadFile).toHaveBeenCalledWith('/path/to/config.yaml', 'utf-8')
        expect(mockYamlParse).toHaveBeenCalledWith('app:\n  name: YamlApp\nenabled: true')
        expect(manager.get('app')).toEqual({ name: 'YamlApp' })
        expect(manager.get('enabled')).toBe(true)
      })

      it('should handle file loading errors', async () => {
        mockReadFile.mockRejectedValue(new Error('File not found'))

        const source: ConfigSource = {
          id: 'error-config',
          type: 'file',
          path: '/nonexistent/config.json'
        }

        const errorListener = mock()
        manager.on('config:error', errorListener)

        await expect(manager.loadConfig(source)).rejects.toThrow('Failed to load config from /nonexistent/config.json')
        expect(errorListener).toHaveBeenCalledWith({
          sourceId: 'error-config',
          error: expect.stringContaining('Failed to load config from /nonexistent/config.json')
        })
      })

      it('should reject unsupported file formats', async () => {
        const source: ConfigSource = {
          id: 'unsupported-config',
          type: 'file',
          path: '/path/to/config.txt'
        }

        await expect(manager.loadConfig(source)).rejects.toThrow('Unsupported file format: /path/to/config.txt')
      })
    })

    describe('Environment Source', () => {
      const originalEnv = process.env

      beforeEach(() => {
        process.env = { ...originalEnv }
      })

      afterEach(() => {
        process.env = originalEnv
      })

      it('should load configuration from environment variables', async () => {
        process.env.APP_NAME = 'EnvApp'
        process.env.APP_PORT = '8080'
        process.env.APP_DEBUG = 'true'
        process.env.OTHER_VAR = 'ignored'

        const source: ConfigSource = {
          id: 'env-config',
          type: 'env',
          prefix: 'APP_'
        }

        await manager.loadConfig(source)

        expect(manager.get('name')).toBe('EnvApp')
        expect(manager.get('port')).toBe(8080)
        expect(manager.get('debug')).toBe(true)
        expect(manager.has('other_var')).toBe(false)
      })

      it('should load all environment variables when no prefix', async () => {
        process.env.TEST_VAR = 'test-value'
        process.env.ANOTHER_VAR = '42'

        const source: ConfigSource = {
          id: 'all-env-config',
          type: 'env'
        }

        await manager.loadConfig(source)

        expect(manager.get('test_var')).toBe('test-value')
        expect(manager.get('another_var')).toBe(42)
      })

      it('should parse different value types from environment', async () => {
        process.env.STRING_VAL = 'hello'
        process.env.INT_VAL = '123'
        process.env.FLOAT_VAL = '12.34'
        process.env.TRUE_VAL = 'true'
        process.env.FALSE_VAL = 'false'
        process.env.JSON_VAL = '{"key":"value"}'
        process.env.ARRAY_VAL = '[1,2,3]'

        const source: ConfigSource = {
          id: 'typed-env-config',
          type: 'env'
        }

        await manager.loadConfig(source)

        expect(manager.get('string_val')).toBe('hello')
        expect(manager.get('int_val')).toBe(123)
        expect(manager.get('float_val')).toBe(12.34)
        expect(manager.get('true_val')).toBe(true)
        expect(manager.get('false_val')).toBe(false)
        expect(manager.get('json_val')).toEqual({ key: 'value' })
        expect(manager.get('array_val')).toEqual([1, 2, 3])
      })
    })

    describe('Remote Source', () => {
      it('should load JSON configuration from remote URL', async () => {
        const configData = { app: { name: 'RemoteApp' }, version: '2.0.0' }
        
        // @ts-ignore
        global.fetch.mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(configData)
        })

        const source: ConfigSource = {
          id: 'remote-config',
          type: 'remote',
          url: 'https://config.example.com/config.json'
        }

        await manager.loadConfig(source)

        expect(fetch).toHaveBeenCalledWith('https://config.example.com/config.json')
        expect(manager.get('app')).toEqual({ name: 'RemoteApp' })
        expect(manager.get('version')).toBe('2.0.0')
      })

      it('should load YAML configuration from remote URL', async () => {
        const configData = { app: { name: 'RemoteYamlApp' } }
        mockYamlParse.mockReturnValue(configData)
        
        // @ts-ignore
        global.fetch.mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'application/yaml']]),
          text: () => Promise.resolve('app:\n  name: RemoteYamlApp')
        })

        const source: ConfigSource = {
          id: 'remote-yaml-config',
          type: 'remote',
          url: 'https://config.example.com/config.yaml'
        }

        await manager.loadConfig(source)

        expect(manager.get('app')).toEqual({ name: 'RemoteYamlApp' })
      })

      it('should handle remote loading errors', async () => {
        // @ts-ignore
        global.fetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })

        const source: ConfigSource = {
          id: 'remote-error-config',
          type: 'remote',
          url: 'https://config.example.com/nonexistent.json'
        }

        await expect(manager.loadConfig(source)).rejects.toThrow('Failed to load remote config from https://config.example.com/nonexistent.json: HTTP 404: Not Found')
      })

      it('should reject unsupported remote content types', async () => {
        // @ts-ignore
        global.fetch.mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'text/plain']]),
          text: () => Promise.resolve('plain text')
        })

        const source: ConfigSource = {
          id: 'unsupported-remote-config',
          type: 'remote',
          url: 'https://config.example.com/config.txt'
        }

        await expect(manager.loadConfig(source)).rejects.toThrow('Failed to load remote config from https://config.example.com/config.txt: Unsupported remote content type: text/plain')
      })
    })

    it('should reject unsupported source types', async () => {
      const source = {
        id: 'unsupported-source',
        type: 'unknown' as never
      }

      await expect(manager.loadConfig(source)).rejects.toThrow('Unsupported config source type: unknown')
    })
  })

  describe('Configuration Priority and Merging', () => {
    it('should merge configurations with priority', async () => {
      // Low priority source
      await manager.loadConfig({
        id: 'low-priority',
        type: 'object',
        priority: 0,
        data: { app: { name: 'LowPriorityApp' }, port: 3000 }
      })

      // High priority source
      await manager.loadConfig({
        id: 'high-priority',
        type: 'object',
        priority: 10,
        data: { app: { name: 'HighPriorityApp' }, timeout: 5000 }
      })

      expect(manager.get('app')).toEqual({ name: 'HighPriorityApp' })
      expect(manager.get('port')).toBe(3000) // From low priority
      expect(manager.get('timeout')).toBe(5000) // From high priority
    })
  })

  describe('Configuration Reload', () => {
    it('should reload specific configuration source', async () => {
      // Load initial config
      await manager.loadConfig({
        id: 'reload-test',
        type: 'object',
        data: { version: '1.0.0' }
      })

      expect(manager.get('version')).toBe('1.0.0')

      // For object sources, reloading will reload the same data
      // This test verifies that reload doesn't fail
      await manager.reload('reload-test')

      // Value should remain the same for object sources
      expect(manager.get('version')).toBe('1.0.0')
    })

    it('should reload all configuration sources', async () => {
      await manager.loadConfig({
        id: 'source1',
        type: 'object',
        data: { key1: 'value1' }
      })

      await manager.loadConfig({
        id: 'source2',
        type: 'object',
        data: { key2: 'value2' }
      })

      expect(manager.get('key1')).toBe('value1')
      expect(manager.get('key2')).toBe('value2')

      await manager.reload()

      // Values should still be there after reload
      expect(manager.get('key1')).toBe('value1')
      expect(manager.get('key2')).toBe('value2')
    })

    it('should handle reload of non-existent source', async () => {
      await expect(manager.reload('non-existent-source')).resolves.toBeUndefined()
    })
  })
})