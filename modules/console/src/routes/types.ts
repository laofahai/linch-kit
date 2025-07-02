/**
 * Console 路由系统类型定义
 */

import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * 路由配置接口
 */
export interface ConsoleRoute {
  /** 路由路径 */
  path: string
  /** 页面组件 */
  component: ComponentType<Record<string, unknown>> | LazyExoticComponent<ComponentType<Record<string, unknown>>>
  /** 路由元数据 */
  meta?: {
    /** 页面标题 */
    title?: string
    /** 图标名称 */
    icon?: string
    /** 是否需要认证 */
    requireAuth?: boolean
    /** 需要的权限 */
    permissions?: string[]
    /** 是否隐藏在导航中 */
    hidden?: boolean
    /** 排序权重 */
    order?: number
    /** 父级路由路径 */
    parent?: string
    /** 自定义 props */
    props?: Record<string, unknown>
  }
  /** 子路由 */
  children?: ConsoleRoute[]
}

/**
 * 导航项接口
 */
export interface NavigationItem {
  /** 唯一标识 */
  id: string
  /** 显示文本 */
  title: string
  /** 路由路径 */
  path: string
  /** 图标名称 */
  icon?: string
  /** 排序权重 */
  order?: number
  /** 是否是外部链接 */
  external?: boolean
  /** 子导航项 */
  children?: NavigationItem[]
  /** 需要的权限 */
  permissions?: string[]
  /** 是否激活 */
  active?: boolean
}

/**
 * Console 配置接口
 */
export interface ConsoleConfig {
  /** 基础路径 */
  basePath?: string
  /** 启用的功能模块 */
  features?: ConsoleFeature[]
  /** 权限配置 */
  permissions?: {
    /** 访问 Console 的权限 */
    access?: string[]
    /** 管理员权限 */
    admin?: string[]
  }
  /** 主题配置 */
  theme?: {
    /** 主色调 */
    primary?: string
    /** 暗色模式 */
    darkMode?: boolean
  }
  /** 自定义路由 */
  customRoutes?: ConsoleRoute[]
  /** 禁用的默认路由 */
  disabledRoutes?: string[]
}

/**
 * Console 功能模块
 */
export type ConsoleFeature = 
  | 'dashboard'
  | 'tenants'
  | 'users'
  | 'permissions'
  | 'plugins'
  | 'monitoring'
  | 'schemas'
  | 'settings'

/**
 * 路由上下文接口
 */
export interface RouteContext {
  /** 当前路径 */
  currentPath: string
  /** 路由参数 */
  params: Record<string, string>
  /** 查询参数 */
  query: Record<string, string>
  /** 用户权限 */
  permissions: string[]
  /** 当前租户 */
  tenantId?: string
}

/**
 * Console 路由配置结果
 */
export interface ConsoleRouteConfig {
  /** 基础路径 */
  basePath: string
  /** 所有路由 */
  routes: ConsoleRoute[]
  /** 导航项 */
  navigation: NavigationItem[]
  /** 需要的权限 */
  permissions: string[]
  /** 路由映射表 */
  routeMap: Map<string, ConsoleRoute>
}