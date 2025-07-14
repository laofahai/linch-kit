/**
 * Extension 集成工具库
 * 基于规划文档中的集成架构
 */

import { starterIntegrationManager } from '@linch-kit/console'
import { Logger } from '@linch-kit/core/client'
// 使用 LinchKit Core 的正式 Logger (未使用但保留以便未来扩展)
// 临时内联类型定义，避免导入问题
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
  return starterIntegrationManager.getState()
}

/**
 * 获取扩展状态摘要
 */
export function getExtensionStateSummary(): ExtensionStateSummary[] {
  return starterIntegrationManager.getExtensionStateSummary()
}

/**
 * 获取所有路由
 */
export function getAllRoutes() {
  return starterIntegrationManager.getAllRoutes()
}

/**
 * 获取菜单树
 */
export function getMenuTree() {
  return starterIntegrationManager.getMenuTree()
}

/**
 * 手动加载扩展
 */
export async function loadExtension(extensionName: string): Promise<void> {
  try {
    await starterIntegrationManager.loadExtension(extensionName)
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
    await starterIntegrationManager.unloadExtension(extensionName)
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
    await starterIntegrationManager.reloadExtension(extensionName)
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
  return starterIntegrationManager.getStatusReport()
}

/**
 * 监听集成事件
 */
export function onIntegrationEvent(
  event: string, 
  handler: (...args: unknown[]) => void
): void {
  starterIntegrationManager.on(event, handler)
}

/**
 * 移除集成事件监听
 */
export function offIntegrationEvent(
  event: string, 
  handler: (...args: unknown[]) => void
): void {
  starterIntegrationManager.off(event, handler)
}