/**
 * LinchKit Provider
 * 初始化 LinchKit 框架核心功能 + Console扩展集成
 */

'use client'

import { useEffect } from 'react'
import { Logger } from '@linch-kit/core/client'
import { starterIntegrationManager } from '@linch-kit/console'

import { starterExtensionConfig } from '@/config/extensions.config'

interface LinchKitProviderProps {
  children: React.ReactNode
}

export function LinchKitProvider({ children }: LinchKitProviderProps) {
  useEffect(() => {
    // 初始化 LinchKit + Console集成
    const initLinchKit = async () => {
      try {
        // 设置日志级别
        if (process.env.NODE_ENV === 'development') {
          Logger.setLevel('debug')
        } else {
          Logger.setLevel('info')
        }

        Logger.info('LinchKit Starter initializing...')

        // 更新StarterIntegrationManager配置
        starterIntegrationManager.updateConfig(starterExtensionConfig)
        
        // 初始化扩展集成管理器
        await starterIntegrationManager.initialize()
        
        Logger.info('LinchKit Starter + Console extension initialized successfully')
      } catch (error) {
        Logger.error('Failed to initialize LinchKit:', error)
      }
    }

    initLinchKit()

    // 清理函数
    return () => {
      try {
        starterIntegrationManager.destroy()
        Logger.info('LinchKit integration cleaned up')
      } catch (error) {
        Logger.error('Failed to cleanup LinchKit integration:', error)
      }
    }
  }, [])

  return <>{children}</>
}