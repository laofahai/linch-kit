/**
 * Console Provider
 *
 * 为 Console 模块提供统一的上下文和状态管理
 */

'use client'

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// TODO: Implement tRPC client integration
// import { createTRPCProxyClient, httpBatchLink } from '@linch-kit/trpc'
import { useState } from 'react'

// import { Toaster } from '@linch-kit/ui/server' // TODO: Add Toaster component to UI package
// import { useConsoleTranslation } from '../i18n'
import type { ConsoleConfig } from '../routes/types'

// Console 上下文类型
export interface ConsoleContextValue {
  /** Console 配置 */
  config: ConsoleConfig
  /** 当前租户 ID */
  tenantId?: string
  /** 用户权限 */
  permissions: string[]
  /** 是否为管理员 */
  isAdmin: boolean
  /** 是否为系统管理员 */
  isSystemAdmin: boolean
  /** 主题设置 */
  theme: {
    mode: 'light' | 'dark' | 'system'
    primary: string
  }
  /** 语言设置 */
  language: string
}

// 创建上下文
const ConsoleContext = createContext<ConsoleContextValue | null>(null)

// Console Provider Props
export interface ConsoleProviderProps {
  /** 子组件 */
  children: ReactNode
  /** Console 配置 */
  config?: ConsoleConfig
  /** 当前租户 ID */
  tenantId?: string
  /** 用户权限 */
  permissions?: string[]
  /** API 基础 URL */
  _apiUrl?: string
  /** 初始语言 */
  language?: string
  /** 是否显示开发工具 */
  devtools?: boolean
}

/**
 * Console Provider 组件
 */
export function ConsoleProvider({
  children,
  config = {},
  tenantId,
  permissions = [],
  // _apiUrl = '/api/trpc',
  language = 'zh-CN',
  devtools = process.env.NODE_ENV === 'development',
}: ConsoleProviderProps) {
  // TODO: 创建 tRPC 客户端
  // const [trpcClient] = useState(() =>
  //   createTRPCProxyClient({
  //     links: [
  //       httpBatchLink({
  //         url: apiUrl,
  //         headers() {
  //           return {
  //             'x-tenant-id': tenantId || '',
  //           }
  //         }
  //       })
  //     ]
  //   })
  // )

  // 创建 React Query 客户端
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分钟
            retry: (failureCount, error: Error) => {
              // 权限错误不重试
              if ((error as unknown as { status?: number })?.status === 403) return false
              // 最多重试2次
              return failureCount < 2
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  // Console 上下文值
  const contextValue = useMemo<ConsoleContextValue>(() => {
    const isAdmin = permissions.includes('console:admin')
    const isSystemAdmin = permissions.includes('system:admin')

    return {
      config: {
        basePath: '/admin',
        features: [
          'dashboard',
          'tenants',
          'users',
          'permissions',
          'plugins',
          'monitoring',
          'schemas',
          'settings',
        ],
        permissions: {
          access: ['console:access'],
          admin: ['console:admin'],
        },
        theme: {
          primary: '#3b82f6',
          darkMode: false,
        },
        ...config,
      },
      tenantId: tenantId || '',
      permissions,
      isAdmin,
      isSystemAdmin,
      theme: {
        mode: 'light',
        primary: config.theme?.primary || '#3b82f6',
      },
      language,
    }
  }, [config, tenantId, permissions, language])

  return (
    <QueryClientProvider client={queryClient}>
      <ConsoleContext.Provider value={contextValue}>
        {children}

        {/* TODO: Toast 通知 */}
        {/* <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
        /> */}

        {/* React Query 开发工具 */}
        {devtools && <ReactQueryDevtools initialIsOpen={false} />}
      </ConsoleContext.Provider>
    </QueryClientProvider>
  )
}

/**
 * 使用 Console 上下文
 */
export function useConsoleContext() {
  const context = useContext(ConsoleContext)

  if (!context) {
    throw new Error('useConsoleContext must be used within a ConsoleProvider')
  }

  return context
}

/**
 * 带权限检查的 Hook
 */
export function useConsolePermission(permission: string) {
  const { permissions, isAdmin, isSystemAdmin } = useConsoleContext()

  // 系统管理员拥有所有权限
  if (isSystemAdmin) return true

  // Console 管理员拥有所有 Console 权限
  if (isAdmin && permission.startsWith('console:')) return true

  // 检查具体权限
  return permissions.includes(permission)
}

/**
 * 带多权限检查的 Hook
 */
export function useConsolePermissions(requiredPermissions: string[], requireAll = false) {
  const { permissions, isAdmin, isSystemAdmin } = useConsoleContext()

  // 系统管理员拥有所有权限
  if (isSystemAdmin) return true

  const hasPermission = (permission: string) => {
    // Console 管理员拥有所有 Console 权限
    if (isAdmin && permission.startsWith('console:')) return true
    return permissions.includes(permission)
  }

  if (requireAll) {
    return requiredPermissions.every(hasPermission)
  } else {
    return requiredPermissions.some(hasPermission)
  }
}

/**
 * Console 主题 Hook
 */
export function useConsoleTheme() {
  const { theme } = useConsoleContext()

  return {
    mode: theme.mode,
    primary: theme.primary,
    isDark: theme.mode === 'dark',
    isLight: theme.mode === 'light',
    isSystem: theme.mode === 'system',
  }
}

/**
 * Console 配置 Hook
 */
export function useConsoleConfiguration() {
  const { config } = useConsoleContext()

  return {
    basePath: config.basePath || '/admin',
    features: config.features || [],
    permissions: config.permissions || {},
    theme: config.theme || {},
    customRoutes: config.customRoutes || [],
    disabledRoutes: config.disabledRoutes || [],

    // 便捷方法
    hasFeature: (feature: string) =>
      config.features?.includes(
        feature as
          | 'dashboard'
          | 'tenants'
          | 'users'
          | 'permissions'
          | 'plugins'
          | 'monitoring'
          | 'schemas'
          | 'settings'
      ) || false,
    isRouteDisabled: (route: string) => config.disabledRoutes?.includes(route) || false,
  }
}

/**
 * Console 租户 Hook
 */
export function useConsoleTenant() {
  const { tenantId } = useConsoleContext()

  return {
    tenantId,
    hasTenant: !!tenantId,
  }
}

/**
 * 权限保护组件
 */
export interface PermissionGuardProps {
  /** 需要的权限 */
  permission?: string
  /** 需要的多个权限 */
  permissions?: string[]
  /** 是否需要所有权限 */
  requireAll?: boolean
  /** 没有权限时的回退组件 */
  fallback?: ReactNode
  /** 子组件 */
  children: ReactNode
}

export function PermissionGuard({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const allPermissions = permission ? [permission, ...permissions] : permissions
  const hasPermission = useConsolePermissions(allPermissions, requireAll)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 功能保护组件
 */
export interface FeatureGuardProps {
  /** 需要的功能 */
  feature: string
  /** 没有功能时的回退组件 */
  fallback?: ReactNode
  /** 子组件 */
  children: ReactNode
}

export function FeatureGuard({ feature, fallback = null, children }: FeatureGuardProps) {
  const { hasFeature } = useConsoleConfiguration()

  if (!hasFeature(feature)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
