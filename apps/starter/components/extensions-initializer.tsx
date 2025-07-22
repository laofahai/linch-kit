'use client'

import { Logger } from '@linch-kit/core/client'
import { ExtensionInitializer } from '@linch-kit/starter/client'
import { useEffect } from 'react'

import { initializeExtensions } from '../lib/extensions-loader'

export function ExtensionsInitializer() {
  // Legacy initialization (existing functionality)
  useEffect(() => {
    // 每次组件挂载都重新初始化扩展，确保页面刷新后UI组件重新注册
    const init = async () => {
      try {
        Logger.info('ExtensionsInitializer: Starting initialization...')
        // 总是强制初始化，确保页面刷新后组件正常
        await initializeExtensions(true)
        Logger.info('ExtensionsInitializer: Extensions initialized successfully')
      } catch (error) {
        Logger.error('ExtensionsInitializer: Failed to initialize extensions:', error instanceof Error ? error : new Error(String(error)))
      }
    }
    
    init().catch(error => { 
      Logger.error('ExtensionsInitializer: Extension initialization error:', error); 
    })
  }, []) // 每次组件挂载都执行
  
  return (
    <>
      {/* New LinchKit Starter Extension Initializer */}
      <ExtensionInitializer
        onExtensionsLoaded={(extensions) => {
          Logger.info(`LinchKit Starter: Extensions loaded: ${extensions.map(e => e.name).join(', ')}`)
        }}
        onError={(error) => {
          Logger.error('LinchKit Starter: Extension error:', error)
        }}
      />
    </>
  )
}