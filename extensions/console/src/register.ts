/**
 * Console Extension 注册器
 * 用于在 LinchKit 应用中注册 Console 扩展
 */

import { clientExtensionManager } from '@linch-kit/core/client'
import type { Extension, ExtensionConfig, OperationResult } from '@linch-kit/core/client'

/**
 * Console 扩展实现
 */
const consoleExtension: Extension = {
  metadata: {
    id: 'console',
    name: 'console',
    displayName: 'Console Dashboard',
    version: '0.1.0',
    description: 'LinchKit 企业级管理控制台',
    icon: '🎛️',
    author: 'LinchKit Team',
    color: 'blue',
    capabilities: {
      hasUI: true,
      hasAPI: true,
      hasSchema: true,
      hasHooks: true,
      standalone: false,
    },
    permissions: ['ui:render', 'api:read', 'api:write'],
    tags: ['management', 'dashboard', 'enterprise'],
    category: 'system',
  },
  defaultConfig: {
    enabled: true,
    priority: 100,
  },
  // 生命周期钩子
  init: async (config: ExtensionConfig) => {
    console.log('Console extension initializing...', config)
  },
  start: async (config: ExtensionConfig) => {
    console.log('Console extension starting...', config)
  },
  stop: async (config: ExtensionConfig) => {
    console.log('Console extension stopping...', config)
  },
  destroy: async (config: ExtensionConfig) => {
    console.log('Console extension destroying...', config)
  },
}

/**
 * 注册 Console 扩展
 */
export async function registerConsoleExtension(): Promise<OperationResult> {
  const result = await clientExtensionManager.register(consoleExtension)
  
  if (!result.success) {
    throw new Error(result.error?.message ?? 'Failed to register console extension')
  }
  
  return result
}

/**
 * 注销 Console 扩展
 */
export async function unregisterConsoleExtension(): Promise<OperationResult> {
  const result = await clientExtensionManager.unregister('console')
  
  if (!result.success) {
    throw new Error(result.error?.message ?? 'Failed to unregister console extension')
  }
  
  return result
}