/**
 * Extension 自动加载器
 * 在应用启动时自动注册和初始化扩展
 */

import { Logger, clientExtensionManager } from '@linch-kit/core/client'

import { extensionFeatures, starterExtensionConfig } from '../config/extensions.config'

import { extensionUIRegistry } from './extension-ui-registry'

/**
 * 初始化所有扩展
 * @param force - 是否强制重新初始化（用于页面刷新后的恢复）
 */
export async function initializeExtensions(force = false) {
  try {
    Logger.info(`Initializing extensions... (force: ${force})`)
    
    // 检查是否启用自动初始化
    if (!starterExtensionConfig.autoInitialize && !force) {
      Logger.info('Extension auto-initialization is disabled')
      return
    }
    
    // 如果是强制重新初始化，清理状态
    if (force) {
      Logger.info('Force reinitializing - clearing extension UI registry')
      extensionUIRegistry.forceReinitialization()
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
            Logger.info(`Starting console extension registration... (Registry debug: ${JSON.stringify(extensionUIRegistry.getDebugInfo())})`)
            
            // 动态导入console extension
            const { registerConsoleExtension, ConsoleAppWrapper } = await import('@linch-kit/console')
            
            // 检查是否已经注册过，避免重复注册
            const existingRegistration = clientExtensionManager.getRegistration('console')
            if (!existingRegistration || force) {
              await registerConsoleExtension()
              Logger.info('Console extension registered')
            } else {
              Logger.info('Console extension already registered, skipping...')
            }
            
            // UI组件总是重新注册（解决页面刷新问题）
            Logger.info('Registering console UI components...')
            extensionUIRegistry.registerExtensionUI('console', {
              components: [
                {
                  name: 'ConsoleApp',
                  component: ConsoleAppWrapper,
                  path: '/',
                  isDefault: true
                }
              ],
              defaultComponent: 'ConsoleApp'
            })
            
            // 验证注册是否成功
            const verifyComponent = extensionUIRegistry.getDefaultComponent('console')
            if (verifyComponent) {
              Logger.info(`✓ Console extension UI registration verified successfully`)
            } else {
              Logger.error(`✗ Console extension UI registration verification failed`)
            }
            
            Logger.info(`Console extension setup complete. Registry debug: ${JSON.stringify(extensionUIRegistry.getDebugInfo())}`)
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
    
    // 最终验证
    const finalDebugInfo = extensionUIRegistry.getDebugInfo()
    Logger.info('Extensions initialized successfully')
    Logger.info(`Final registry state: ${JSON.stringify(finalDebugInfo)}`)
    
    // 返回初始化结果
    return {
      success: true,
      extensionsCount: finalDebugInfo.registrySize,
      extensions: finalDebugInfo.extensions
    }
  } catch (error) {
    Logger.error('Failed to initialize extensions:', error instanceof Error ? error : new Error(String(error)))
    return {
      success: false,
      extensionsCount: 0,
      extensions: [],
      error: error instanceof Error ? error.message : String(error)
    }
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