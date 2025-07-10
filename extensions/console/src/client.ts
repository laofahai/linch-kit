/**
 * Console 模块客户端专用导出
 *
 * 仅包含客户端安全的功能，不包含服务端代码
 */

'use client'

// Provider和上下文 (客户端组件)
export {
  ConsoleProvider,
  useConsoleContext,
  useConsolePermission,
  useConsolePermissions,
  useConsoleTheme,
  useConsoleConfiguration,
  useConsoleTenant,
  PermissionGuard,
  FeatureGuard,
} from './providers/ConsoleProvider'

export type {
  ConsoleProviderProps,
  PermissionGuardProps,
  FeatureGuardProps,
} from './providers/ConsoleProvider'

// Starter 集成 Hooks
export {
  useStarterIntegration,
  useExtensionMessages,
  useExtensionLifecycle,
  useDynamicRoutes,
  useExtensionState,
} from './hooks/useStarterIntegration'

// Extension 管理页面组件
export { ExtensionManager as ExtensionManagement } from './pages/ExtensionManager'

// Dashboard 页面
export { Dashboard } from './pages/Dashboard'

// 核心客户端功能
export {
  StarterIntegrationManager,
  createStarterIntegrationManager,
  starterIntegrationManager,
  type StarterIntegrationConfig,
  type StarterIntegrationState,
  type ExtensionStateSummary,
} from './core/starter-integration'

// Extension 系统
export {
  ExtensionRouteLoader,
  ExtensionRouteContainer,
  useExtensionRoute,
  ExtensionRouteRegistry,
  createExtensionRouteRegistry,
} from './core/extension-route-loader'
