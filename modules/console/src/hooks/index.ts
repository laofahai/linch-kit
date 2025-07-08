/**
 * Console Hooks 导出
 *
 * 提供所有 Console 模块的 React Hooks
 */

// 租户管理 hooks
export * from './useTenants'

// 插件管理 hooks
export * from './usePlugins'

// 通用 Console hooks
export * from './useConsole'

// 类型导出
export type {} from // 从各个 hook 文件中导出的类型会在这里重新导出
'./useTenants'

// 默认导出所有 hooks
export default {
  // 租户相关
  useTenants: require('./useTenants').useTenants,
  useTenant: require('./useTenants').useTenant,
  useTenantQuotas: require('./useTenants').useTenantQuotas,
  useTenantStats: require('./useTenants').useTenantStats,
  useTenantOperations: require('./useTenants').useTenantOperations,

  // 插件相关
  useMarketplacePlugins: require('./usePlugins').useMarketplacePlugins,
  usePlugin: require('./usePlugins').usePlugin,
  useInstalledPlugins: require('./usePlugins').useInstalledPlugins,
  usePluginStats: require('./usePlugins').usePluginStats,
  usePluginOperations: require('./usePlugins').usePluginOperations,
  usePluginStatus: require('./usePlugins').usePluginStatus,

  // Console 通用
  useDashboard: require('./useConsole').useDashboard,
  useSystemStats: require('./useConsole').useSystemStats,
  useSystemMonitoring: require('./useConsole').useSystemMonitoring,
  usePermissions: require('./useConsole').usePermissions,
  useCurrentTenant: require('./useConsole').useCurrentTenant,
  useConsoleStatus: require('./useConsole').useConsoleStatus,
}
