/**
 * Console 路由配置
 * 
 * 定义 Console 模块的所有路由和导航结构
 */

import { lazy } from 'react'

import type { ConsoleRoute, ConsoleFeature } from './types'

// 懒加载页面组件 - 只包含已实现的
const DashboardPage = lazy(() => import('../pages/Dashboard'))
const TenantListPage = lazy(() => import('../pages/tenants/TenantList'))
const TenantDetailPage = lazy(() => import('../pages/tenants/TenantDetail'))
const TenantCreatePage = lazy(() => import('../pages/tenants/TenantCreate'))

/**
 * 默认路由配置 - 只包含已实现的功能
 */
export const defaultRoutes: Record<ConsoleFeature, ConsoleRoute[]> = {
  dashboard: [
    {
      path: '/',
      component: DashboardPage,
      meta: {
        title: 'console.nav.dashboard',
        icon: 'LayoutDashboard',
        requireAuth: true,
        permissions: ['console:dashboard:read'],
        order: 1
      }
    }
  ],

  tenants: [
    {
      path: '/tenants',
      component: TenantListPage,
      meta: {
        title: 'console.nav.tenants',
        icon: 'Building2',
        requireAuth: true,
        permissions: ['console:tenant:read'],
        order: 2
      }
    },
    {
      path: '/tenants/create',
      component: TenantCreatePage,
      meta: {
        title: 'console.tenants.createTenant',
        requireAuth: true,
        permissions: ['console:tenant:create'],
        hidden: true,
        parent: '/tenants'
      }
    },
    {
      path: '/tenants/:id',
      component: TenantDetailPage,
      meta: {
        title: 'console.tenants.tenantDetails',
        requireAuth: true,
        permissions: ['console:tenant:read'],
        hidden: true,
        parent: '/tenants'
      }
    }
  ],
  
  // 暂未实现的功能模块 - 空数组
  users: [],
  permissions: [],
  plugins: [],
  monitoring: [],
  schemas: [],
  settings: []
}

/**
 * 获取默认启用的功能 - 只包含已实现的
 */
export const defaultFeatures: ConsoleFeature[] = [
  'dashboard',
  'tenants'
]

/**
 * 权限映射 - 包含所有功能模块
 */
export const permissionMap: Record<ConsoleFeature, string[]> = {
  dashboard: ['console:dashboard:read'],
  tenants: ['console:tenant:read', 'console:tenant:create', 'console:tenant:update', 'console:tenant:delete'],
  users: [],
  permissions: [],
  plugins: [],
  monitoring: [],
  schemas: [],
  settings: []
}