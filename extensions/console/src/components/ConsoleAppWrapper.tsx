/**
 * Console App Wrapper
 * 
 * 为 Console Extension 提供必要的 Provider 包装
 */

'use client'

import React from 'react'
import type { ClientExtensionRegistration } from '@linch-kit/core/client'

import { ConsoleProvider } from '../providers/ConsoleProvider'
import { Dashboard } from '../pages/Dashboard'
import type { ConsoleConfig, ConsoleFeature } from '../routes/types'

interface ConsoleAppWrapperProps {
  extensionName: string
  subPath: string
  fullPath: string
  registration: ClientExtensionRegistration
}

/**
 * Console 应用包装器
 * 提供 ConsoleProvider 上下文和路由处理
 */
export function ConsoleAppWrapper(props: ConsoleAppWrapperProps) {
  // 默认配置
  const defaultConfig: ConsoleConfig = {
    basePath: '/console',
    features: ['dashboard', 'tenants', 'users', 'plugins'] as ConsoleFeature[],
    permissions: {
      access: ['console:view'],
      admin: ['console:admin']
    },
    theme: {
      primary: '#3b82f6',
      darkMode: false
    }
  }

  return (
    <ConsoleProvider 
      config={defaultConfig}
      tenantId={undefined}
      permissions={['console:view', 'console:admin']}
      language="zh-CN"
    >
      <Dashboard {...props} />
    </ConsoleProvider>
  )
}

export default ConsoleAppWrapper