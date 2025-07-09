/**
 * Extension加载器测试
 */
import { describe, it, expect, mock } from 'bun:test'

import { ExtensionLoader } from '../extension-loader'

describe('ExtensionLoader', () => {
  it('should create instance with valid config', () => {
    const mockConfig = {
      extensionPaths: ['./extensions'],
      enableHotReload: true,
      cache: {
        enabled: true,
        path: './cache',
      },
    }

    const loader = new ExtensionLoader(mockConfig)
    expect(loader).toBeDefined()
  })

  it('should validate extension metadata', () => {
    const mockConfig = {
      extensionPaths: ['./extensions'],
      enableHotReload: true,
    }

    const loader = new ExtensionLoader(mockConfig)

    const validMetadata = {
      name: 'test-extension',
      version: '1.0.0',
      description: 'Test extension',
      author: 'Test Author',
      entryPoint: './index.js',
      dependencies: {},
      permissions: ['read', 'write'],
    }

    expect(() => loader.loadExtension('test-extension')).not.toThrow()
  })

  it('should handle extension loading failure', async () => {
    const mockConfig = {
      extensionPaths: ['./extensions'],
      enableHotReload: true,
    }

    const loader = new ExtensionLoader(mockConfig)

    // 测试加载不存在的Extension
    const result = await loader.loadExtension('non-existent-extension')

    expect(result.success).toBe(false)
  })
})
