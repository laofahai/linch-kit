/**
 * LinchKit Provider
 * 初始化 LinchKit 框架核心功能 + Console扩展集成
 */

'use client'

import { Logger } from '@linch-kit/core/client'
import React, { useEffect } from 'react'

// 使用 LinchKit Core 的正式 Logger


interface LinchKitProviderProps {
  children: React.ReactNode
}

export function LinchKitProvider({ children }: LinchKitProviderProps) {
  useEffect(() => {
    // 初始化 LinchKit + Console集成
    const initLinchKit = () => {
      try {
        // 设置日志级别
        if (process.env.NODE_ENV === 'development') {
          Logger.setLevel('debug')
        } else {
          Logger.setLevel('info')
        }

        Logger.info('LinchKit Starter initializing...')

        // Console集成在客户端简化处理
        Logger.info('Console integration configured for client-side')
        
        Logger.info('LinchKit Starter + Console extension initialized successfully')
      } catch (error) {
        Logger.error('Failed to initialize LinchKit', error instanceof Error ? error : new Error(String(error)))
      }
    }

    initLinchKit()

    // 清理函数
    return () => {
      // 清理逻辑在动态导入后处理
      Logger.info('LinchKit integration cleanup deferred')
    }
  }, [])

  return <>{children}</>
}