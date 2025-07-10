/**
 * Extension 开发模板
 * @module templates/extension-template
 */

import React from 'react'
import type { ExtensionInstance, ExtensionMetadata } from '@linch-kit/core/client'

import { createExtensionRouteRegistry } from '../core/extension-route-loader'
import { createExtensionCommunicationAPI } from '../core/extension-communication'

/**
 * Extension 基础模板
 */
export interface ExtensionTemplate {
  /** Extension 名称 */
  name: string
  /** Extension 元数据 */
  metadata: ExtensionMetadata
  /** 初始化函数 */
  initialize: (instance: ExtensionInstance) => Promise<void>
  /** 路由注册 */
  registerRoutes: (instance: ExtensionInstance) => Promise<void>
  /** 组件注册 */
  registerComponents: (instance: ExtensionInstance) => Promise<void>
  /** 清理函数 */
  cleanup: () => Promise<void>
}

/**
 * 创建基础 Extension 模板
 */
export function createExtensionTemplate(
  name: string,
  displayName: string,
  options: {
    hasUI?: boolean
    hasAPI?: boolean
    hasSchema?: boolean
    permissions?: string[]
    category?: string
    tags?: string[]
  } = {}
): ExtensionTemplate {
  const metadata: ExtensionMetadata = {
    id: name,
    name,
    displayName,
    version: '1.0.0',
    description: `${displayName} extension`,
    capabilities: {
      hasUI: options.hasUI ?? true,
      hasAPI: options.hasAPI ?? false,
      hasSchema: options.hasSchema ?? false,
      hasHooks: false,
      standalone: false,
    },
    category: options.category || 'general',
    tags: options.tags || [],
    permissions: options.permissions || ['ui:render', 'extension:communicate'],
  }

  // 创建路由注册器
  const routeRegistry = createExtensionRouteRegistry()

  // 通信API实例
  let communicationAPI: ReturnType<typeof createExtensionCommunicationAPI>

  const template: ExtensionTemplate = {
    name,
    metadata,

    async initialize(instance: ExtensionInstance) {
      console.log(`[${name}] Initializing extension...`)

      // 初始化通信API
      communicationAPI = createExtensionCommunicationAPI(name)

      // 注册基础消息处理器
      communicationAPI.onMessage('ping', async _message => {
        return { pong: true, timestamp: Date.now() }
      })

      // 注册状态查询处理器
      communicationAPI.onMessage('getStatus', async _message => {
        return {
          name,
          status: 'running',
          timestamp: Date.now(),
          metadata: instance.metadata,
        }
      })

      console.log(`[${name}] Extension initialized successfully`)
    },

    async registerRoutes(instance: ExtensionInstance) {
      if (!metadata.capabilities.hasUI) {
        return
      }

      // 主页路由
      routeRegistry.addRoute({
        path: '',
        component: React.lazy(() =>
          Promise.resolve({
            default: () =>
              React.createElement(
                'div',
                {
                  style: { padding: '20px' },
                },
                [
                  React.createElement('h1', { key: 'title' }, displayName),
                  React.createElement('p', { key: 'desc' }, `Welcome to ${displayName} extension!`),
                  React.createElement('div', { key: 'info' }, [
                    React.createElement('h3', { key: 'info-title' }, 'Extension Information:'),
                    React.createElement('ul', { key: 'info-list' }, [
                      React.createElement('li', { key: 'name' }, `Name: ${name}`),
                      React.createElement('li', { key: 'version' }, `Version: ${metadata.version}`),
                      React.createElement(
                        'li',
                        { key: 'category' },
                        `Category: ${metadata.category}`
                      ),
                      React.createElement(
                        'li',
                        { key: 'permissions' },
                        `Permissions: ${metadata.permissions.join(', ')}`
                      ),
                    ]),
                  ]),
                ]
              ),
          })
        ),
        metadata: {
          title: displayName,
          description: `Main page for ${displayName}`,
          permissions: metadata.permissions,
        },
        requireAuth: true,
      })

      // 设置页路由
      routeRegistry.addRoute({
        path: 'settings',
        component: React.lazy(() =>
          Promise.resolve({
            default: () =>
              React.createElement(
                'div',
                {
                  style: { padding: '20px' },
                },
                [
                  React.createElement('h1', { key: 'title' }, `${displayName} Settings`),
                  React.createElement(
                    'p',
                    { key: 'desc' },
                    'Configure your extension settings here.'
                  ),
                  React.createElement(
                    'div',
                    { key: 'placeholder' },
                    'Settings UI will be implemented here...'
                  ),
                ]
              ),
          })
        ),
        metadata: {
          title: `${displayName} Settings`,
          description: `Settings page for ${displayName}`,
          permissions: metadata.permissions,
        },
        requireAuth: true,
      })

      // 注册路由到系统
      await routeRegistry.register(instance)

      console.log(`[${name}] Routes registered successfully`)
    },

    async registerComponents(_instance: ExtensionInstance) {
      // 这里可以注册可复用的组件
      // 例如：
      // enhancedAppRegistry.registerExtensionComponent(instance, 'StatusWidget', StatusWidget)

      console.log(`[${name}] Components registered successfully`)
    },

    async cleanup() {
      console.log(`[${name}] Cleaning up extension...`)
      // 清理资源
      console.log(`[${name}] Extension cleaned up successfully`)
    },
  }

  return template
}

/**
 * 示例：简单的 Extension 实现
 */
export const exampleExtension = createExtensionTemplate('example-extension', 'Example Extension', {
  hasUI: true,
  hasAPI: false,
  hasSchema: false,
  permissions: ['ui:render', 'extension:communicate'],
  category: 'example',
  tags: ['example', 'template', 'demo'],
})

/**
 * 示例：带通信功能的 Extension
 */
export const communicationExtension = createExtensionTemplate(
  'communication-example',
  'Communication Example',
  {
    hasUI: true,
    hasAPI: true,
    permissions: ['ui:render', 'extension:communicate', 'api:read'],
    category: 'communication',
    tags: ['communication', 'example', 'messaging'],
  }
)

// 为通信示例添加额外的消息处理器
communicationExtension.initialize = async function (_instance: ExtensionInstance) {
  console.log(`[${this.name}] Initializing communication extension...`)

  const communicationAPI = createExtensionCommunicationAPI(this.name)

  // 基础消息处理器
  communicationAPI.onMessage('ping', async _message => {
    return { pong: true, timestamp: Date.now() }
  })

  // 广播消息处理器
  communicationAPI.onMessage('broadcast', async message => {
    await communicationAPI.broadcast('broadcast-response', {
      from: this.name,
      originalMessage: message.payload,
      timestamp: Date.now(),
    })
  })

  // 请求其他Extension状态
  communicationAPI.onMessage('requestStatus', async message => {
    const targetExtension = (message.payload as { target?: string }).target
    if (targetExtension) {
      try {
        const status = await communicationAPI.request(targetExtension, 'getStatus', {})
        return { success: true, status }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
    return { success: false, error: 'No target extension specified' }
  })

  console.log(`[${this.name}] Communication extension initialized successfully`)
}

/**
 * Extension 模板工厂
 */
export class ExtensionTemplateFactory {
  /**
   * 创建简单的UI Extension
   */
  static createUIExtension(name: string, displayName: string): ExtensionTemplate {
    return createExtensionTemplate(name, displayName, {
      hasUI: true,
      hasAPI: false,
      hasSchema: false,
      permissions: ['ui:render'],
    })
  }

  /**
   * 创建带API的Extension
   */
  static createAPIExtension(name: string, displayName: string): ExtensionTemplate {
    return createExtensionTemplate(name, displayName, {
      hasUI: true,
      hasAPI: true,
      hasSchema: false,
      permissions: ['ui:render', 'api:read', 'api:write'],
    })
  }

  /**
   * 创建全功能Extension
   */
  static createFullExtension(name: string, displayName: string): ExtensionTemplate {
    return createExtensionTemplate(name, displayName, {
      hasUI: true,
      hasAPI: true,
      hasSchema: true,
      permissions: [
        'ui:render',
        'api:read',
        'api:write',
        'database:read',
        'database:write',
        'extension:communicate',
      ],
    })
  }

  /**
   * 创建通信Extension
   */
  static createCommunicationExtension(name: string, displayName: string): ExtensionTemplate {
    const template = createExtensionTemplate(name, displayName, {
      hasUI: true,
      hasAPI: false,
      hasSchema: false,
      permissions: ['ui:render', 'extension:communicate'],
    })

    // 添加通信功能
    const originalInitialize = template.initialize
    template.initialize = async function (instance: ExtensionInstance) {
      await originalInitialize.call(this, instance)

      const communicationAPI = createExtensionCommunicationAPI(name)

      // 添加广播监听
      communicationAPI.subscribe('global-broadcast', async message => {
        console.log(`[${name}] Received global broadcast:`, message.payload)
      })

      // 添加私有消息处理
      communicationAPI.onMessage('private-message', async message => {
        console.log(`[${name}] Received private message:`, message.payload)
        return { received: true, timestamp: Date.now() }
      })
    }

    return template
  }
}

/**
 * Extension 开发工具
 */
export const ExtensionDevTools = {
  /**
   * 验证 Extension 模板
   */
  validateTemplate(template: ExtensionTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.name || typeof template.name !== 'string') {
      errors.push('Extension name is required and must be a string')
    }

    if (!template.metadata) {
      errors.push('Extension metadata is required')
    } else {
      if (!template.metadata.displayName) {
        errors.push('Extension displayName is required')
      }
      if (!template.metadata.version) {
        errors.push('Extension version is required')
      }
      if (!template.metadata.permissions || !Array.isArray(template.metadata.permissions)) {
        errors.push('Extension permissions must be an array')
      }
    }

    if (typeof template.initialize !== 'function') {
      errors.push('Extension initialize must be a function')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  /**
   * 生成 Extension 文档
   */
  generateDocumentation(template: ExtensionTemplate): string {
    const { name, metadata } = template

    return `
# ${metadata.displayName} Extension

## Overview
- **Name**: ${name}
- **Version**: ${metadata.version}
- **Category**: ${metadata.category}
- **Description**: ${metadata.description}

## Capabilities
- **UI**: ${metadata.capabilities.hasUI ? 'Yes' : 'No'}
- **API**: ${metadata.capabilities.hasAPI ? 'Yes' : 'No'}
- **Schema**: ${metadata.capabilities.hasSchema ? 'Yes' : 'No'}
- **Hooks**: ${metadata.capabilities.hasHooks ? 'Yes' : 'No'}
- **Standalone**: ${metadata.capabilities.standalone ? 'Yes' : 'No'}

## Permissions
${metadata.permissions.map(p => `- ${p}`).join('\n')}

## Tags
${metadata.tags?.map(t => `- ${t}`).join('\n') || 'No tags'}

## Installation
1. Place the extension in the extensions directory
2. Restart the application
3. Enable the extension in the Extension Manager

## Usage
This extension provides the following features:
- Main interface accessible at /dashboard/ext/${name}
- Settings page at /dashboard/ext/${name}/settings
- Communication support for inter-extension messaging
`.trim()
  },
}
