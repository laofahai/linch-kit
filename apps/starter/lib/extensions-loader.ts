/**
 * Extension 自动加载器
 * 在应用启动时自动注册和初始化扩展
 */

import { Logger, clientExtensionManager } from '@linch-kit/core/client'

import { extensionFeatures, starterExtensionConfig } from '../config/extensions.config'

import { extensionUIRegistry } from './extension-ui-registry'

/**
 * 初始化所有扩展
 */
export async function initializeExtensions() {
  try {
    Logger.info('Initializing extensions...')
    
    // 检查是否启用自动初始化
    if (!starterExtensionConfig.autoInitialize) {
      Logger.info('Extension auto-initialization is disabled')
      return
    }
    
    // 注册默认扩展
    for (const extensionName of starterExtensionConfig.defaultExtensions) {
      if (!(extensionName in extensionFeatures)) {
        Logger.warn(`Extension ${extensionName} not found in configuration`)
        continue
      }
      
      const extensionConfig = extensionFeatures[extensionName as keyof typeof extensionFeatures]
      
      if (!extensionConfig.enabled) {
        Logger.info(`Extension ${extensionName} is disabled`)
        continue
      }
      
      switch (extensionName) {
        case 'console':
          // 动态导入 console extension 的注册函数
          try {
            const { registerConsoleExtension, Dashboard } = await import('@linch-kit/console')
            await registerConsoleExtension()
            
            // 注册 UI 组件
            extensionUIRegistry.registerExtensionUI('console', {
              components: [
                {
                  name: 'Dashboard',
                  component: Dashboard,
                  path: '/',
                  isDefault: true
                }
              ],
              defaultComponent: 'Dashboard'
            })
            
            Logger.info('Console extension UI components registered')
          } catch (error) {
            Logger.error(`Failed to import console extension:`, error instanceof Error ? error : new Error(String(error)))
          }
          break
        // 未来可以添加更多扩展
        default:
          Logger.warn(`Unknown extension: ${extensionName}`)
      }
    }
    
    // 自动启动所有已注册的扩展
    const extensions = clientExtensionManager.getExtensions()
    for (const [name, registration] of extensions) {
      if (registration.config.enabled && registration.status !== 'running') {
        Logger.info(`Starting extension: ${name}`)
        const result = await clientExtensionManager.start(name)
        if (!result.success) {
          Logger.error(`Failed to start extension ${name}:`, result.error instanceof Error ? result.error : new Error(String(result.error)))
        }
      }
    }
    
    Logger.info('Extensions initialized successfully')
  } catch (error) {
    Logger.error('Failed to initialize extensions:', error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * 获取扩展加载状态
 */
export function getExtensionsLoadStatus() {
  const extensions = clientExtensionManager.getExtensions()
  const status = {
    total: extensions.size,
    running: 0,
    stopped: 0,
    error: 0,
  }
  
  for (const registration of extensions.values()) {
    if (registration.status === 'running') {
      status.running++
    } else if (registration.status === 'stopped') {
      status.stopped++
    } else if (registration.status === 'error') {
      status.error++
    }
  }
  
  return status
}