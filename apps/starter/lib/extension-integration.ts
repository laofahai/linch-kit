/**
 * Extension 集成工具库
 * 基于LinchKit Extension Manager的真正动态扩展系统
 */

import { Logger } from '@linch-kit/core/client'
import { unifiedExtensionManager } from '@linch-kit/core/extension'

interface StarterIntegrationState {
  initialized: boolean
  loadedExtensions: number
  registeredRoutes: number
  registeredComponents: number
  initializationTime?: number
  lastUpdated: number
}

interface ExtensionStateSummary {
  name: string
  loadStatus: string
  lifecyclePhase: string
  routeCount: number
  componentCount: number
  error?: string
}

/**
 * 获取扩展集成状态
 */
export function getIntegrationState(): StarterIntegrationState {
  const extensions = unifiedExtensionManager.getExtensions()
  const runningExtensions = Array.from(extensions.values()).filter(ext => ext.status === 'running')
  
  return {
    initialized: true,
    loadedExtensions: extensions.size,
    registeredRoutes: runningExtensions.length, // 简化计算
    registeredComponents: runningExtensions.length, // 简化计算
    lastUpdated: Date.now(),
  }
}

/**
 * 获取扩展状态摘要
 */
export function getExtensionStateSummary(): ExtensionStateSummary[] {
  const extensions = unifiedExtensionManager.getExtensions()
  
  return Array.from(extensions.values()).map(registration => ({
    name: registration.metadata.name,
    loadStatus: registration.status,
    lifecyclePhase: registration.status === 'running' ? 'running' : 'stopped',
    routeCount: 1, // 简化计算
    componentCount: 1, // 简化计算
    ...(registration.error && { error: registration.error.message }),
  }))
}

/**
 * 获取所有路由
 */
export function getAllRoutes() {
  const extensions = unifiedExtensionManager.getExtensions()
  
  return Array.from(extensions.values()).map(registration => ({
    path: `/${registration.metadata.name}`,
    extension: registration.metadata.name,
    name: registration.metadata.displayName || registration.metadata.name,
    enabled: registration.config.enabled,
  }))
}

/**
 * 获取菜单树
 */
export function getMenuTree() {
  const extensions = unifiedExtensionManager.getExtensions()
  
  return Array.from(extensions.values())
    .filter(registration => registration.config.enabled && registration.status === 'running')
    .map(registration => ({
      id: registration.id,
      name: registration.metadata.displayName ?? registration.metadata.name,
      path: `/${registration.metadata.name}`,
      icon: registration.metadata.icon ?? 'puzzle-piece',
      children: [],
    }))
}

/**
 * 手动加载扩展
 */
export async function loadExtension(extensionName: string): Promise<void> {
  try {
    const result = await unifiedExtensionManager.start(extensionName)
    if (!result.success) {
      throw new Error(result.error?.message ?? 'Failed to start extension')
    }
    Logger.info(`Extension ${extensionName} loaded successfully`)
  } catch (error) {
    Logger.error(`Failed to load extension ${extensionName}:`, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * 手动卸载扩展
 */
export async function unloadExtension(extensionName: string): Promise<void> {
  try {
    const result = await unifiedExtensionManager.stop(extensionName)
    if (!result.success) {
      throw new Error(result.error?.message ?? 'Failed to stop extension')
    }
    Logger.info(`Extension ${extensionName} unloaded successfully`)
  } catch (error) {
    Logger.error(`Failed to unload extension ${extensionName}:`, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * 重载扩展
 */
export async function reloadExtension(extensionName: string): Promise<void> {
  try {
    // 先停止再启动实现重载
    const stopResult = await unifiedExtensionManager.stop(extensionName)
    if (!stopResult.success) {
      throw new Error(stopResult.error?.message ?? 'Failed to stop extension for reload')
    }
    
    const startResult = await unifiedExtensionManager.start(extensionName)
    if (!startResult.success) {
      throw new Error(startResult.error?.message ?? 'Failed to start extension after reload')
    }
    
    Logger.info(`Extension ${extensionName} reloaded successfully`)
  } catch (error) {
    Logger.error(`Failed to reload extension ${extensionName}:`, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * 获取完整状态报告
 */
export function getStatusReport() {
  return {
    integrationState: getIntegrationState(),
    extensionSummary: getExtensionStateSummary(),
    routes: getAllRoutes(),
    menu: getMenuTree(),
  }
}

/**
 * 监听集成事件
 */
export function onIntegrationEvent(
  event: string, 
  handler: (...args: unknown[]) => void
): void {
  unifiedExtensionManager.on(event as keyof typeof unifiedExtensionManager.listenerCount, handler)
}

/**
 * 移除集成事件监听
 */
export function offIntegrationEvent(
  event: string, 
  handler: (...args: unknown[]) => void
): void {
  unifiedExtensionManager.off(event as keyof typeof unifiedExtensionManager.listenerCount, handler)
}