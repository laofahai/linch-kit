/**
 * Console Hooks 导出
 *
 * 提供所有 Console 模块的 React Hooks
 */

// 租户管理 hooks
export * from './useTenants'

// 用户管理 hooks
export * from './useUsers'

// 插件管理 hooks
export * from './usePlugins'

// 通用 Console hooks
export * from './useConsole'

// 类型导出
export type {} from // 从各个 hook 文件中导出的类型会在这里重新导出
'./useTenants'

// 导入所有hooks（避免使用require）
import {
  useTenants,
  useTenant,
  useTenantQuotas,
  useTenantStats,
  useTenantOperations,
} from './useTenants'
import {
  useUsers,
  useUser,
  useUserActivities,
  useUserStats,
  useUserOperations,
  useBatchUserOperations,
  useUserPermissions,
  useUserExport,
} from './useUsers'
import {
  useMarketplacePlugins,
  usePlugin,
  useInstalledPlugins,
  usePluginStats,
  usePluginOperations,
  usePluginStatus,
} from './usePlugins'
import {
  useDashboard,
  useSystemStats,
  useSystemMonitoring,
  usePermissions,
  useCurrentTenant,
  useConsoleStatus,
} from './useConsole'

// 默认导出所有 hooks
export default {
  // 租户相关
  useTenants,
  useTenant,
  useTenantQuotas,
  useTenantStats,
  useTenantOperations,

  // 用户相关
  useUsers,
  useUser,
  useUserActivities,
  useUserStats,
  useUserOperations,
  useBatchUserOperations,
  useUserPermissions,
  useUserExport,

  // 插件相关
  useMarketplacePlugins,
  usePlugin,
  useInstalledPlugins,
  usePluginStats,
  usePluginOperations,
  usePluginStatus,

  // Console 通用
  useDashboard,
  useSystemStats,
  useSystemMonitoring,
  usePermissions,
  useCurrentTenant,
  useConsoleStatus,
}
