/**
 * Console 路由系统
 * 
 * 提供路由配置和导航生成功能，供 Starter 应用集成使用
 */

import { useConsoleTranslation } from '../i18n'

import type { 
  ConsoleConfig, 
  ConsoleRoute, 
  ConsoleRouteConfig, 
  NavigationItem,
  ConsoleFeature 
} from './types'
import { defaultRoutes, defaultFeatures, permissionMap } from './config'

/**
 * 创建 Console 路由配置
 */
export function createConsoleRoutes(config?: ConsoleConfig): ConsoleRouteConfig {
  const {
    basePath = '/admin',
    features = defaultFeatures,
    _permissions = {},
    customRoutes = [],
    disabledRoutes = []
  } = config || {}

  // 获取启用功能的路由
  const enabledRoutes = features.reduce<ConsoleRoute[]>((acc, feature) => {
    const featureRoutes = defaultRoutes[feature] || []
    return [...acc, ...featureRoutes]
  }, [])

  // 添加自定义路由
  const allRoutes = [...enabledRoutes, ...customRoutes]

  // 过滤被禁用的路由
  const filteredRoutes = allRoutes.filter(route => 
    !disabledRoutes.includes(route.path)
  )

  // 标准化路由路径（添加 basePath 前缀）
  const normalizedRoutes = normalizeRoutePaths(filteredRoutes, basePath)

  // 创建路由映射表
  const routeMap = createRouteMap(normalizedRoutes)

  // 生成导航项
  const navigation = generateNavigation(normalizedRoutes)

  // 收集所有需要的权限
  const allPermissions = collectPermissions(features)

  return {
    basePath,
    routes: normalizedRoutes,
    navigation,
    permissions: allPermissions,
    routeMap
  }
}

/**
 * 标准化路由路径
 */
function normalizeRoutePaths(routes: ConsoleRoute[], basePath: string): ConsoleRoute[] {
  return routes.map(route => ({
    ...route,
    path: route.path === '/' ? basePath : `${basePath}${route.path}`,
    meta: {
      ...route.meta,
      parent: route.meta?.parent 
        ? route.meta.parent === '/' 
          ? basePath 
          : `${basePath}${route.meta.parent}`
        : undefined
    },
    children: route.children 
      ? normalizeRoutePaths(route.children, basePath)
      : undefined
  }))
}

/**
 * 创建路由映射表
 */
function createRouteMap(routes: ConsoleRoute[]): Map<string, ConsoleRoute> {
  const map = new Map<string, ConsoleRoute>()
  
  function addRoutes(routeList: ConsoleRoute[]) {
    routeList.forEach(route => {
      map.set(route.path, route)
      if (route.children) {
        addRoutes(route.children)
      }
    })
  }
  
  addRoutes(routes)
  return map
}

/**
 * 生成导航项
 */
function generateNavigation(routes: ConsoleRoute[]): NavigationItem[] {
  const t = useConsoleTranslation()
  
  // 只包含不隐藏的路由
  const visibleRoutes = routes.filter(route => !route.meta?.hidden)
  
  // 按 order 排序
  const sortedRoutes = visibleRoutes.sort((a, b) => {
    const orderA = a.meta?.order || 999
    const orderB = b.meta?.order || 999
    return orderA - orderB
  })
  
  return sortedRoutes.map(route => ({
    id: route.path,
    title: route.meta?.title ? t(route.meta.title) : route.path,
    path: route.path,
    icon: route.meta?.icon,
    order: route.meta?.order,
    permissions: route.meta?.permissions,
    children: route.children ? generateNavigation(route.children) : undefined
  }))
}

/**
 * 收集权限
 */
function collectPermissions(features: ConsoleFeature[]): string[] {
  const permissions = new Set<string>()
  
  features.forEach(feature => {
    const featurePermissions = permissionMap[feature] || []
    featurePermissions.forEach(permission => permissions.add(permission))
  })
  
  return Array.from(permissions)
}

/**
 * 路由匹配器
 */
export class ConsoleRouter {
  private config: ConsoleRouteConfig

  constructor(config: ConsoleRouteConfig) {
    this.config = config
  }

  /**
   * 匹配路由
   */
  match(path: string): ConsoleRoute | null {
    // 精确匹配
    if (this.config.routeMap.has(path)) {
      return this.config.routeMap.get(path)!
    }

    // 动态路由匹配
    for (const [routePath, route] of this.config.routeMap) {
      const match = this.matchDynamicRoute(routePath, path)
      if (match) {
        return route
      }
    }

    return null
  }

  /**
   * 匹配动态路由
   */
  private matchDynamicRoute(routePath: string, currentPath: string): boolean {
    const routeSegments = routePath.split('/')
    const pathSegments = currentPath.split('/')

    if (routeSegments.length !== pathSegments.length) {
      return false
    }

    return routeSegments.every((segment, index) => {
      if (segment.startsWith(':')) {
        return true // 动态参数匹配
      }
      return segment === pathSegments[index]
    })
  }

  /**
   * 提取路由参数
   */
  extractParams(routePath: string, currentPath: string): Record<string, string> {
    const routeSegments = routePath.split('/')
    const pathSegments = currentPath.split('/')
    const params: Record<string, string> = {}

    routeSegments.forEach((segment, index) => {
      if (segment.startsWith(':')) {
        const paramName = segment.slice(1)
        params[paramName] = pathSegments[index]
      }
    })

    return params
  }

  /**
   * 检查权限
   */
  checkPermissions(route: ConsoleRoute, userPermissions: string[]): boolean {
    if (!route.meta?.permissions || route.meta.permissions.length === 0) {
      return true
    }

    return route.meta.permissions.some(permission => 
      userPermissions.includes(permission)
    )
  }

  /**
   * 获取面包屑导航
   */
  getBreadcrumbs(path: string): NavigationItem[] {
    const breadcrumbs: NavigationItem[] = []
    const route = this.match(path)
    
    if (!route) return breadcrumbs

    // 构建面包屑路径
    let currentPath = route.meta?.parent
    while (currentPath) {
      const parentRoute = this.config.routeMap.get(currentPath)
      if (parentRoute && !parentRoute.meta?.hidden) {
        breadcrumbs.unshift({
          id: parentRoute.path,
          title: parentRoute.meta?.title || parentRoute.path,
          path: parentRoute.path,
          icon: parentRoute.meta?.icon
        })
      }
      currentPath = parentRoute?.meta?.parent
    }

    // 添加当前路由
    if (!route.meta?.hidden) {
      breadcrumbs.push({
        id: route.path,
        title: route.meta?.title || route.path,
        path: route.path,
        icon: route.meta?.icon
      })
    }

    return breadcrumbs
  }
}

/**
 * 创建路由器实例
 */
export function createConsoleRouter(config?: ConsoleConfig): ConsoleRouter {
  const routeConfig = createConsoleRoutes(config)
  return new ConsoleRouter(routeConfig)
}

// 导出类型和配置
export * from './types'
export * from './config'

// 导出 tRPC 路由器
export * from './console.router'
export * from './tenant.router'