/**
 * Console 路由组件
 * 
 * 用于在 Starter 应用中渲染 Console 路由
 */

'use client'

import { Suspense, useMemo } from 'react'
import { notFound } from 'next/navigation'

import { useConsoleTranslation } from '../i18n'

import { createConsoleRouter, type ConsoleConfig } from './index'
// TODO: import { LoadingSpinner } from '@linch-kit/ui'

export interface ConsoleRoutesProps {
  /** Console 配置 */
  config?: ConsoleConfig
  /** 当前路径（来自 Next.js params） */
  params?: {
    slug?: string[]
  }
  /** 用户权限 */
  permissions?: string[]
  /** 当前租户 ID */
  tenantId?: string
}

/**
 * Console 路由渲染组件
 */
export function ConsoleRoutes({
  config,
  params,
  permissions = [],
  tenantId
}: ConsoleRoutesProps) {
  const t = useConsoleTranslation()
  
  // 创建路由器实例
  const router = useMemo(() => createConsoleRouter(config), [config])
  
  // 构建当前路径
  const currentPath = useMemo(() => {
    const basePath = config?.basePath || '/admin'
    if (!params?.slug || params.slug.length === 0) {
      return basePath
    }
    return `${basePath}/${params.slug.join('/')}`
  }, [config?.basePath, params?.slug])
  
  // 匹配路由
  const route = useMemo(() => router.match(currentPath), [router, currentPath])
  
  // 如果没有匹配的路由，返回 404
  if (!route) {
    notFound()
  }
  
  // 检查权限
  const hasPermission = useMemo(
    () => router.checkPermissions(route, permissions),
    [router, route, permissions]
  )
  
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('error.permission.denied')}
          </h2>
          <p className="text-gray-600">
            {t('error.permission.description')}
          </p>
        </div>
      </div>
    )
  }
  
  // 提取路由参数
  const routeParams = useMemo(
    () => router.extractParams(route.path, currentPath),
    [router, route.path, currentPath]
  )
  
  // 渲染组件
  const Component = route.component
  
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <Component
        params={routeParams}
        tenantId={tenantId}
        permissions={permissions}
        {...route.meta?.props}
      />
    </Suspense>
  )
}

/**
 * Console 路由包装器
 * 提供完整的 Console 路由功能
 */
export interface ConsoleRouterProps extends ConsoleRoutesProps {
  /** 自定义加载组件 */
  fallback?: React.ReactNode
  /** 自定义错误边界 */
  errorBoundary?: React.ComponentType<{ error: Error; reset: () => void }>
  /** 是否显示面包屑 */
  showBreadcrumbs?: boolean
}

export function ConsoleRouter({
  fallback,
  errorBoundary: ErrorBoundary,
  showBreadcrumbs = true,
  ...props
}: ConsoleRouterProps) {
  const router = useMemo(() => createConsoleRouter(props.config), [props.config])
  
  const currentPath = useMemo(() => {
    const basePath = props.config?.basePath || '/admin'
    if (!props.params?.slug || props.params.slug.length === 0) {
      return basePath
    }
    return `${basePath}/${props.params.slug.join('/')}`
  }, [props.config?.basePath, props.params?.slug])
  
  const breadcrumbs = useMemo(
    () => showBreadcrumbs ? router.getBreadcrumbs(currentPath) : [],
    [router, currentPath, showBreadcrumbs]
  )
  
  const content = (
    <div className="console-router">
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <ConsoleBreadcrumbs items={breadcrumbs} />
      )}
      <ConsoleRoutes {...props} />
    </div>
  )
  
  if (ErrorBoundary) {
    // TODO: Implement proper error boundary wrapper
    // For now, just return the content without error boundary
    return content
  }
  
  return content
}

/**
 * 面包屑组件
 */
interface ConsoleBreadcrumbsProps {
  items: Array<{
    id: string
    title: string
    path: string
    icon?: string
  }>
}

function ConsoleBreadcrumbs({ items }: ConsoleBreadcrumbsProps) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={item.id} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-6 h-6 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {index === items.length - 1 ? (
              <span className="text-sm font-medium text-gray-500">
                {item.title}
              </span>
            ) : (
              <a
                href={item.path}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {item.icon && (
                  <span className="mr-2 w-4 h-4">{/* Icon component */}</span>
                )}
                {item.title}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// 默认导出
export default ConsoleRouter