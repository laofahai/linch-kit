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
import { AuthPage } from '../pages/auth/AuthPage'
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
  const { subPath } = props
  
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

  // 简单路由处理
  const renderContent = () => {
    if (subPath.startsWith('auth')) {
      return <AuthPage />
    }
    // 默认显示Dashboard
    return <Dashboard {...props} />
  }

  return (
    <ConsoleProvider 
      config={defaultConfig}
      tenantId=""
      permissions={['console:view', 'console:admin']}
      language="zh-CN"
    >
      {renderContent()}
    </ConsoleProvider>
  )
}

export default ConsoleAppWrapper