import { describe, it, expect, beforeEach } from 'bun:test'
import { StarterIntegrationManager } from '../../integration/StarterIntegrationManager'
import type { StarterConfig, ExtensionIntegration } from '../../types'

describe('StarterIntegrationManager', () => {
  let manager: StarterIntegrationManager
  let config: StarterConfig

  beforeEach(() => {
    config = {
      appName: 'Test App',
      version: '1.0.0',
      extensions: [],
      auth: { enabled: true, provider: 'supabase' },
      database: { enabled: true, provider: 'prisma' },
      trpc: { enabled: true },
      ui: { theme: 'system', components: [] }
    }
    manager = new StarterIntegrationManager(config)
  })

  describe('initialize', () => {
    it('should initialize with basic config', async () => {
      await expect(manager.initialize(config)).resolves.toBeUndefined()
      
      const currentConfig = manager.getConfig()
      expect(currentConfig.appName).toBe('Test App')
      expect(manager.getInstalledExtensions()).toHaveLength(0)
    })

    it('should initialize with extensions', async () => {
      const configWithExtensions = {
        ...config,
        extensions: ['console', 'platform']
      }

      await manager.initialize(configWithExtensions)
      
      expect(manager.getInstalledExtensions()).toHaveLength(2)
      expect(manager.isExtensionInstalled('console')).toBe(true)
      expect(manager.isExtensionInstalled('platform')).toBe(true)
    })
  })

  describe('extension management', () => {
    it('should add extension', async () => {
      const extension: ExtensionIntegration = {
        name: 'test-extension',
        version: '1.0.0',
        enabled: true,
        config: {}
      }

      await manager.addExtension(extension)
      
      expect(manager.isExtensionInstalled('test-extension')).toBe(true)
      expect(manager.getInstalledExtensions()).toHaveLength(1)
      
      const installedExtension = manager.getExtensionConfig('test-extension')
      expect(installedExtension).toEqual(extension)
    })

    it('should remove extension', async () => {
      const extension: ExtensionIntegration = {
        name: 'test-extension',
        version: '1.0.0',
        enabled: true,
        config: {}
      }

      await manager.addExtension(extension)
      expect(manager.isExtensionInstalled('test-extension')).toBe(true)

      await manager.removeExtension('test-extension')
      expect(manager.isExtensionInstalled('test-extension')).toBe(false)
      expect(manager.getInstalledExtensions()).toHaveLength(0)
    })

    it('should update extension config', async () => {
      const extension: ExtensionIntegration = {
        name: 'test-extension',
        version: '1.0.0',
        enabled: true,
        config: { setting1: 'value1' }
      }

      await manager.addExtension(extension)

      await manager.updateExtensionConfig('test-extension', { 
        setting1: 'updated-value',
        setting2: 'new-value'
      })

      const updatedExtension = manager.getExtensionConfig('test-extension')
      expect(updatedExtension?.config).toEqual({
        setting1: 'updated-value',
        setting2: 'new-value'
      })
    })

    it('should handle duplicate extension addition', async () => {
      const extension: ExtensionIntegration = {
        name: 'duplicate-extension',
        version: '1.0.0',
        enabled: true,
        config: {}
      }

      await manager.addExtension(extension)
      await manager.addExtension({ ...extension, version: '2.0.0' })
      
      expect(manager.getInstalledExtensions()).toHaveLength(1)
      
      const installedExtension = manager.getExtensionConfig('duplicate-extension')
      expect(installedExtension?.version).toBe('2.0.0')
    })

    it('should handle removing non-existent extension', async () => {
      await expect(manager.removeExtension('non-existent')).resolves.toBeUndefined()
    })
  })

  describe('config management', () => {
    it('should update config', async () => {
      const newConfig = {
        appName: 'Updated App',
        version: '2.0.0'
      }

      await manager.updateConfig(newConfig)
      
      const currentConfig = manager.getConfig()
      expect(currentConfig.appName).toBe('Updated App')
      expect(currentConfig.version).toBe('2.0.0')
      expect(currentConfig.auth.enabled).toBe(true) // Should preserve existing values
    })

    it('should get current config', () => {
      const currentConfig = manager.getConfig()
      expect(currentConfig).toEqual(config)
    })
  })

  describe('error handling', () => {
    it('should throw error when updating non-existent extension config', async () => {
      await expect(
        manager.updateExtensionConfig('non-existent', { setting: 'value' })
      ).rejects.toThrow('Extension non-existent not found')
    })
  })
})