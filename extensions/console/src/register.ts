/**
 * Console Extension 注册器
 * 用于在 LinchKit 应用中注册 Console 扩展
 */

import { clientExtensionManager } from '@linch-kit/core/client'
import { unifiedExtensionManager } from '@linch-kit/core/extension'
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
  // 同时注册到两个管理器以确保兼容性
  const clientResult = await clientExtensionManager.register(consoleExtension)
  
  if (!clientResult.success) {
    throw new Error(clientResult.error?.message ?? 'Failed to register console extension to clientExtensionManager')
  }
  
  // 同时注册到unifiedExtensionManager
  const unifiedResult = await unifiedExtensionManager.register(consoleExtension)
  
  if (!unifiedResult.success) {
    throw new Error(unifiedResult.error?.message ?? 'Failed to register console extension to unifiedExtensionManager')
  }
  
  return unifiedResult
}

/**
 * 注销 Console 扩展
 */
export async function unregisterConsoleExtension(): Promise<OperationResult> {
  // 从两个管理器中注销
  const clientResult = await clientExtensionManager.unregister('console')
  const unifiedResult = await unifiedExtensionManager.unregister('console')
  
  if (!clientResult.success && !unifiedResult.success) {
    throw new Error('Failed to unregister console extension from both managers')
  }
  
  return unifiedResult.success ? unifiedResult : clientResult
}