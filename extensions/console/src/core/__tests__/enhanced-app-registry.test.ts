/**
 * 增强应用注册器测试
 */
import { describe, it, expect, mock } from 'bun:test'

import { EnhancedAppRegistry } from '../enhanced-app-registry'

describe('EnhancedAppRegistry', () => {
  it('should create instance successfully', () => {
    const registry = new EnhancedAppRegistry()
    expect(registry).toBeDefined()
  })

  it('should register extension routes', () => {
    const registry = new EnhancedAppRegistry()

    const mockExtension = {
      name: 'test-extension',
      version: '1.0.0',
      metadata: {},
    }

    const routeConfig = {
      path: '/test',
      component: () => null,
      metadata: {
        title: 'Test Route',
        description: 'Test route description',
      },
    }

    expect(() => {
      registry.registerExtensionRoutes('test-extension', [routeConfig])
    }).not.toThrow()
  })

  it('should register extension components', () => {
    const registry = new EnhancedAppRegistry()

    const mockExtension = {
      name: 'test-extension',
      version: '1.0.0',
      metadata: {},
    }

    const TestComponent = () => null

    expect(() => {
      registry.registerExtensionComponent(mockExtension, 'TestComponent', TestComponent)
    }).not.toThrow()
  })

  it('should handle route registration', () => {
    const registry = new EnhancedAppRegistry()

    const routes = [
      {
        path: '/test',
        component: () => null,
        metadata: {
          title: 'Test Route',
        },
      },
    ]

    expect(() => {
      registry.registerExtensionRoutes('test-extension', routes)
    }).not.toThrow()
  })
})
