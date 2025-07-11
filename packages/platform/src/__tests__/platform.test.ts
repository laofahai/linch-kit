/**
 * Platform package integration tests
 */

import { describe, it, expect } from 'bun:test'

describe('Platform Package', () => {
  it('should export all main modules', async () => {
    const platform = await import('../index')

    // 检查主要导出
    expect(platform).toBeDefined()
    expect(typeof platform).toBe('object')
  })

  it('should export Extension functionality', async () => {
    const { CRUDExtension, createCRUDExtension } = await import('../extensions')

    expect(CRUDExtension).toBeDefined()
    expect(createCRUDExtension).toBeDefined()
    expect(typeof CRUDExtension).toBe('function')
    expect(typeof createCRUDExtension).toBe('function')
  })

  it('should export tRPC functionality', async () => {
    const { createExtensionRouter } = await import('../trpc')

    expect(createExtensionRouter).toBeDefined()
    expect(typeof createExtensionRouter).toBe('function')
  })

  it('should export Schema functionality', async () => {
    const schema = await import('../schema')

    expect(schema).toBeDefined()
    expect(typeof schema).toBe('object')
  })

  it('should export Validation functionality', async () => {
    const validation = await import('../validation')

    expect(validation).toBeDefined()
    expect(typeof validation).toBe('object')
  })

  it('should export Platform Manager', async () => {
    const { PlatformManager } = await import('../platform-manager')

    expect(PlatformManager).toBeDefined()
    expect(typeof PlatformManager).toBe('function')
  })
})

describe('CRUDExtension', () => {
  it('should create CRUD extension instance', async () => {
    const { CRUDExtension } = await import('../extensions')

    const mockContext = {
      logger: {
        info: () => {},
        debug: () => {},
        error: () => {},
      },
      events: {
        emit: async () => {},
        on: () => {},
      },
    }

    const extension = new CRUDExtension({
      extensionContext: mockContext as any,
    })

    expect(extension).toBeDefined()
    expect(typeof extension.createEntityOperations).toBe('function')
    expect(typeof extension.registerEventHandlers).toBe('function')
  })
})
