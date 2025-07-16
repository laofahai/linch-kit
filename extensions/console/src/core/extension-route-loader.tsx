/**
 * Extension路由加载器 - 用于Next.js动态路由
 * @module core/extension-route-loader
 */

import React, { useEffect, useState, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import type { Extension as ExtensionInstance } from '@linch-kit/core/client'

import { enhancedAppRegistry } from './enhanced-app-registry'
import type { DynamicRouteConfig } from './enhanced-app-registry'

/**
 * Extension路由加载器Props
 */
interface ExtensionRouteLoaderProps {
  /** 当前路径 */
  pathname: string
  /** 默认加载组件 */
  fallback?: React.ReactNode
  /** 404组件 */
  notFound?: React.ComponentType
  /** 错误边界组件 */
  errorBoundary?: React.ComponentType<{ error: Error }>
}

/**
 * 路由匹配结果
 */
interface RouteMatch {
  route: DynamicRouteConfig
  params: Record<string, string>
}

/**
 * Extension路由加载器
 *
 * 功能：
 * - 动态匹配Extension路由
 * - 懒加载路由组件
 * - 权限验证
 * - 错误处理
 */
export const ExtensionRouteLoader: React.FC<ExtensionRouteLoaderProps> = ({
  pathname,
  fallback = <div>Loading...</div>,
  notFound: NotFoundComponent = () => <div>404 - Page not found</div>,
  errorBoundary: ErrorBoundary = DefaultErrorBoundary,
}) => {
  const [routeMatch, setRouteMatch] = useState<RouteMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 监听路由变化
  useEffect(() => {
    const unsubscribe = enhancedAppRegistry.onRouteUpdate(() => {
      // 路由更新时重新匹配
      matchRoute()
    })

    // 初始匹配
    matchRoute()

    return unsubscribe
  }, [pathname])

  // 匹配路由
  const matchRoute = () => {
    try {
      setLoading(true)
      setError(null)

      const allRoutes = enhancedAppRegistry.getAllDynamicRoutes()
      const match = findRouteMatch(pathname, allRoutes)

      setRouteMatch(match)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // 渲染内容
  if (loading) {
    return <>{fallback}</>
  }

  if (error) {
    return <ErrorBoundary error={error} />
  }

  if (!routeMatch) {
    return <NotFoundComponent />
  }

  const { route, params } = routeMatch
  const Component = route.component

  // 应用布局
  if (route.layout) {
    const Layout = route.layout as React.ComponentType<{ children: React.ReactNode }>
    return (
      <Layout>
        <Suspense fallback={fallback}>
          <Component {...params} />
        </Suspense>
      </Layout>
    )
  }

  return (
    <Suspense fallback={fallback}>
      <Component {...params} />
    </Suspense>
  )
}

/**
 * 查找匹配的路由
 */
function findRouteMatch(pathname: string, routes: DynamicRouteConfig[]): RouteMatch | null {
  for (const route of routes) {
    const params = matchPath(pathname, route.path)
    if (params) {
      return { route, params }
    }
  }
  return null
}

/**
 * 路径匹配
 */
function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  // 简单的路径匹配实现
  // 支持 :param 和 * 通配符

  const patternParts = pattern.split('/')
  const pathParts = pathname.split('/')

  if (patternParts.length !== pathParts.length && !pattern.includes('*')) {
    return null
  }

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart === '*') {
      // 通配符匹配剩余所有部分
      params['*'] = pathParts.slice(i).join('/')
      return params
    }

    if (patternPart?.startsWith(':')) {
      // 参数匹配
      const paramName = patternPart.slice(1)
      if (pathPart !== undefined) {
        params[paramName] = pathPart
      }
    } else if (patternPart !== pathPart) {
      // 静态部分不匹配
      return null
    }
  }

  return params
}

/**
 * 默认错误边界
 */
const DefaultErrorBoundary: React.FC<{ error: Error }> = ({ error }) => (
  <div style={{ padding: '20px', color: 'red' }}>
    <h2>Error loading extension route</h2>
    <pre>{error.message}</pre>
  </div>
)

/**
 * Extension路由容器组件
 * 用于Next.js的catch-all路由
 */
export const ExtensionRouteContainer: React.FC = () => {
  const pathname = usePathname()

  return (
    <ExtensionRouteLoader
      pathname={pathname}
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
      notFound={() => (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Extension Not Found</h2>
            <p className="text-muted-foreground">
              The requested extension page could not be found.
            </p>
          </div>
        </div>
      )}
    />
  )
}

/**
 * Hook: 使用Extension路由
 */
export function useExtensionRoute() {
  const pathname = usePathname()
  const [currentExtension, setCurrentExtension] = useState<string | null>(null)

  useEffect(() => {
    const match = pathname.match(/\/dashboard\/ext\/([^/]+)/)

    if (match) {
      setCurrentExtension(match[1] || null)
    } else {
      setCurrentExtension(null)
    }
  }, [pathname])

  const navigateToExtension = async (extensionName: string, routePath?: string) => {
    return enhancedAppRegistry.navigateToExtension(extensionName, routePath)
  }

  return {
    currentExtension,
    navigateToExtension,
    extensionRoutes: currentExtension
      ? enhancedAppRegistry.getExtensionRoutes(currentExtension)
      : [],
  }
}

/**
 * Extension路由注册器
 * 用于Extension内部注册路由
 */
export class ExtensionRouteRegistry {
  private routes: DynamicRouteConfig[] = []

  /**
   * 添加路由
   */
  addRoute(config: DynamicRouteConfig): this {
    this.routes.push(config)
    return this
  }

  /**
   * 添加多个路由
   */
  addRoutes(configs: DynamicRouteConfig[]): this {
    this.routes.push(...configs)
    return this
  }

  /**
   * 注册到应用
   */
  async register(extension: ExtensionInstance): Promise<void> {
    await enhancedAppRegistry.registerExtensionRoutes(extension, this.routes)
  }

  /**
   * 获取所有路由
   */
  getRoutes(): DynamicRouteConfig[] {
    return [...this.routes]
  }
}

/**
 * 创建Extension路由注册器
 */
export function createExtensionRouteRegistry(): ExtensionRouteRegistry {
  return new ExtensionRouteRegistry()
}
