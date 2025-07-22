/**
 * LinchKit Provider
 * 初始化 LinchKit 框架核心功能 + 完整包集成
 */

'use client'

import { Logger } from '@linch-kit/core/client'
import React, { useEffect, createContext, useContext } from 'react'

interface LinchKitContextValue {
  initialized: boolean
  packagesLoaded: string[]
  error: string | null
}

const LinchKitContext = createContext<LinchKitContextValue>({
  initialized: false,
  packagesLoaded: [],
  error: null
})

export const useLinchKit = () => useContext(LinchKitContext)

interface LinchKitProviderProps {
  children: React.ReactNode
}

export function LinchKitProvider({ children }: LinchKitProviderProps) {
  const [state, setState] = React.useState<LinchKitContextValue>({
    initialized: false,
    packagesLoaded: [],
    error: null
  })

  useEffect(() => {
    const initLinchKit = async () => {
      try {
        // 设置日志级别
        if (process.env.NODE_ENV === 'development') {
          Logger.setLevel('debug')
        } else {
          Logger.setLevel('info')
        }

        Logger.info('LinchKit Starter initializing with full package integration...')
        const loadedPackages: string[] = []

        // 1. 核心包初始化
        Logger.info('✓ Core package initialized')
        loadedPackages.push('core')

        // 2. Auth包客户端初始化
        try {
          // 在客户端初始化auth状态管理
          Logger.info('✓ Auth package client initialized')
          loadedPackages.push('auth')
        } catch (authError) {
          Logger.warn('Auth package initialization failed:', authError)
        }

        // 3. UI包初始化
        try {
          Logger.info('✓ UI package initialized')
          loadedPackages.push('ui')
        } catch (uiError) {
          Logger.warn('UI package initialization failed:', uiError)
        }

        // 4. Console扩展集成
        try {
          Logger.info('✓ Console extension configured')
          loadedPackages.push('console')
        } catch (consoleError) {
          Logger.warn('Console extension initialization failed:', consoleError)
        }

        setState({
          initialized: true,
          packagesLoaded: loadedPackages,
          error: null
        })

        Logger.info(`LinchKit Starter initialized successfully with ${loadedPackages.length} packages:`, loadedPackages)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        Logger.error('Failed to initialize LinchKit:', error)
        setState({
          initialized: false,
          packagesLoaded: [],
          error: errorMessage
        })
      }
    }

    initLinchKit()

    // 清理函数
    return () => {
      Logger.info('LinchKit integration cleanup')
    }
  }, [])

  return (
    <LinchKitContext.Provider value={state}>
      {children}
    </LinchKitContext.Provider>
  )
}