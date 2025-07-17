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
const ExtensionManagerPage = lazy(() => import('../pages/ExtensionManager'))

// 认证页面组件
const AuthPageLazy = lazy(() => import('../pages/auth/AuthPage').then(m => ({ default: m.AuthPage })))
const LoginPageLazy = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPageLazy = lazy(() => import('../pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))

/**
 * 认证路由配置 - 不需要认证保护的路由
 */
export const authRoutes: ConsoleRoute[] = [
  {
    path: '/auth',
    component: AuthPageLazy,
    meta: {
      title: 'console.auth.title',
      requireAuth: false,
      hidden: true,
    },
  },
  {
    path: '/auth/login',
    component: LoginPageLazy,
    meta: {
      title: 'console.auth.login',
      requireAuth: false,
      hidden: true,
    },
  },
  {
    path: '/auth/register',
    component: RegisterPageLazy,
    meta: {
      title: 'console.auth.register',
      requireAuth: false,
      hidden: true,
    },
  },
]

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
        order: 1,
      },
    },
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
        order: 2,
      },
    },
    {
      path: '/tenants/create',
      component: TenantCreatePage,
      meta: {
        title: 'console.tenants.createTenant',
        requireAuth: true,
        permissions: ['console:tenant:create'],
        hidden: true,
        parent: '/tenants',
      },
    },
    {
      path: '/tenants/:id',
      component: TenantDetailPage,
      meta: {
        title: 'console.tenants.tenantDetails',
        requireAuth: true,
        permissions: ['console:tenant:read'],
        hidden: true,
        parent: '/tenants',
      },
    },
  ],

  // Extension管理功能
  extensions: [
    {
      path: '/extensions',
      component: ExtensionManagerPage,
      meta: {
        title: 'console.nav.extensions',
        icon: 'Puzzle',
        requireAuth: true,
        permissions: ['console:extension:view'],
        order: 10,
      },
    },
  ],

  // 暂未实现的功能模块 - 空数组
  users: [],
  permissions: [],
  plugins: [],
  monitoring: [],
  schemas: [],
  settings: [],
}

/**
 * 获取默认启用的功能 - 只包含已实现的
 */
export const defaultFeatures: ConsoleFeature[] = ['dashboard', 'tenants', 'extensions']

/**
 * 权限映射 - 包含所有功能模块
 */
export const permissionMap: Record<ConsoleFeature, string[]> = {
  dashboard: ['console:dashboard:read'],
  tenants: [
    'console:tenant:read',
    'console:tenant:create',
    'console:tenant:update',
    'console:tenant:delete',
  ],
  extensions: [
    'console:extension:view',
    'console:extension:manage',
    'console:extension:install',
    'console:extension:uninstall',
  ],
  users: [],
  permissions: [],
  plugins: [],
  monitoring: [],
  schemas: [],
  settings: [],
}
