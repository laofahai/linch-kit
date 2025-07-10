/**
 * Extension测试工具
 */

import type { Extension, ExtensionContext } from '@linch-kit/core/extension'

/**
 * 创建模拟的Extension上下文
 */
export function createMockExtensionContext(overrides: Partial<ExtensionContext> = {}): ExtensionContext {
  return {
    name: 'blog-extension',
    permissions: ['database:read', 'database:write', 'api:read', 'api:write', 'ui:render', 'system:hooks'],
    config: { enabled: true },
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    events: {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    },
    storage: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
    ...overrides,
  }
}

/**
 * 创建模拟的Extension实例
 */
export function createMockExtension(overrides: Partial<Extension> = {}): Extension {
  return {
    metadata: {
      id: 'test-extension',
      name: 'Test Extension',
      version: '0.1.0',
      description: 'Test Extension',
      displayName: 'Test Extension',
      category: 'test',
      capabilities: {
        hasSchema: true,
        hasAPI: true,
        hasUI: true,
        hasHooks: true,
      },
      permissions: ['database:read', 'database:write'],
      entries: {
        schema: 'schema.ts',
        api: 'api.ts',
        components: 'components.ts',
        hooks: 'hooks.ts',
      },
      dependencies: ['@linch-kit/core', '@linch-kit/platform'],
    },
    init: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    ...overrides,
  }
}

/**
 * 模拟Extension沙箱环境
 */
export class MockExtensionSandbox {
  private context: ExtensionContext
  
  constructor(context: ExtensionContext) {
    this.context = context
  }
  
  async execute<T>(fn: () => T): Promise<T> {
    // 模拟沙箱执行
    try {
      return await fn()
    } catch (error) {
      this.context.logger.error('Sandbox execution failed:', error)
      throw error
    }
  }
  
  validatePermissions(requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      this.context.permissions.includes(permission)
    )
  }
}

/**
 * 模拟Extension管理器
 */
export class MockExtensionManager {
  private extensions = new Map<string, Extension>()
  private instances = new Map<string, unknown>()
  
  async loadExtension(name: string, extension: Extension): Promise<void> {
    this.extensions.set(name, extension)
    
    const context = createMockExtensionContext({ name })
    const sandbox = new MockExtensionSandbox(context)
    
    // 模拟Extension加载过程
    if (extension.init) {
      await extension.init(context.config)
    }
    
    if (extension.start) {
      await extension.start(context.config)
    }
    
    this.instances.set(name, {
      extension,
      context,
      sandbox,
    })
  }
  
  async unloadExtension(name: string): Promise<void> {
    const instance = this.instances.get(name)
    if (instance) {
      const { extension, context } = instance
      
      if (extension.stop) {
        await extension.stop(context.config)
      }
      
      if (extension.destroy) {
        await extension.destroy(context.config)
      }
      
      this.extensions.delete(name)
      this.instances.delete(name)
    }
  }
  
  getExtension(name: string): Extension | undefined {
    return this.extensions.get(name)
  }
  
  getInstance(name: string): unknown {
    return this.instances.get(name)
  }
  
  getAllExtensions(): string[] {
    return Array.from(this.extensions.keys())
  }
}

/**
 * 测试Extension生命周期
 */
export async function testExtensionLifecycle(extension: Extension): Promise<void> {
  const context = createMockExtensionContext()
  
  // 测试初始化
  if (extension.init) {
    await extension.init(context.config)
  }
  
  // 测试启动
  if (extension.start) {
    await extension.start(context.config)
  }
  
  // 测试停止
  if (extension.stop) {
    await extension.stop(context.config)
  }
  
  // 测试销毁
  if (extension.destroy) {
    await extension.destroy(context.config)
  }
}

/**
 * 测试Extension权限
 */
export function testExtensionPermissions(
  extension: Extension,
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(permission =>
    extension.metadata.permissions.includes(permission)
  )
}

/**
 * 测试Extension能力
 */
export function testExtensionCapabilities(
  extension: Extension,
  requiredCapabilities: string[]
): boolean {
  return requiredCapabilities.every(capability =>
    extension.metadata.capabilities[capability] === true
  )
}

/**
 * 创建测试数据
 */
export function createTestData() {
  return {
    blogPost: {
      id: 'test-post-1',
      title: 'Test Blog Post',
      slug: 'test-blog-post',
      content: 'This is a test blog post content',
      status: 'published' as const,
      publishedAt: new Date(),
      categoryId: 'test-category-1',
      tags: ['test', 'blog'],
      authorId: 'test-author-1',
      viewCount: 100,
      likeCount: 10,
      commentCount: 5,
      featured: false,
      allowComments: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    blogCategory: {
      id: 'test-category-1',
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
      color: '#ff0000',
      sortOrder: 1,
      postCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    blogTag: {
      id: 'test-tag-1',
      name: 'Test Tag',
      slug: 'test-tag',
      description: 'Test tag description',
      color: '#00ff00',
      postCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    blogComment: {
      id: 'test-comment-1',
      postId: 'test-post-1',
      authorId: 'test-author-1',
      authorName: 'Test Author',
      authorEmail: 'test@example.com',
      content: 'This is a test comment',
      status: 'approved' as const,
      likeCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}

/**
 * 等待异步操作完成
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟异步操作
 */
export async function mockAsyncOperation<T>(
  result: T,
  delay: number = 100
): Promise<T> {
  await waitFor(delay)
  return result
}

/**
 * 模拟异步错误
 */
export async function mockAsyncError(
  error: Error,
  delay: number = 100
): Promise<never> {
  await waitFor(delay)
  throw error
}