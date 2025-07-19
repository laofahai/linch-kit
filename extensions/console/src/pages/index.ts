/**
 * Console 页面组件导出
 *
 * 统一导出所有 Console 页面组件
 */

// 主要页面
export { default as Dashboard } from './Dashboard'

// 租户管理页面
export { default as TenantList } from './tenants/TenantList'
export { default as TenantDetail } from './tenants/TenantDetail'
export { default as TenantCreate } from './tenants/TenantCreate'

// 用户管理页面
export { default as UserList } from './users/UserList'
export { default as UserDetail } from './users/UserDetail'

// Extension管理页面
export { default as ExtensionManager } from './ExtensionManager'

// 认证页面
export * from './auth'

// 重新导入组件用于默认导出
import Dashboard from './Dashboard'
import TenantList from './tenants/TenantList'
import TenantDetail from './tenants/TenantDetail'
import TenantCreate from './tenants/TenantCreate'
import UserList from './users/UserList'
import UserDetail from './users/UserDetail'
import ExtensionManager from './ExtensionManager'

// 默认导出已实现的页面
export default {
  // 主要页面
  Dashboard,

  // 租户管理
  TenantList,
  TenantDetail,
  TenantCreate,

  // 用户管理
  UserList,
  UserDetail,

  // Extension管理
  ExtensionManager,
}
