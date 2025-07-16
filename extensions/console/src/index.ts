'use client'

/**
 * Console 模块主入口
 *
 * LinchKit Console - 企业级管理控制台
 */

// 确保所有导出都是客户端安全的
// 对于包含React hooks的组件，在各自文件中标记'use client'

// 服务层 (纯JavaScript，无客户端依赖)
export * from './services'

// tRPC 路由器工厂
export { createConsoleRouter } from './trpc/router-factory'

// 暂时注释旧的路由导出以避免构建错误
// export { consoleRouter } from './routes/console.router'
// export type { ConsoleRouter } from './routes/console.router'

// export { tenantRouter, setTenantService } from './routes/tenant.router'
// export type { TenantRouter } from './routes/tenant.router'

// Provider和上下文 (已标记为客户端组件)
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

// 国际化 (纯JavaScript)
export * from './i18n'

// 核心注册器和加载器
export {
  EnhancedAppRegistry,
  createEnhancedAppRegistry,
  enhancedAppRegistry,
  type DynamicRouteConfig,
  type ExtensionRouteRegistration,
  type RouteUpdateListener,
} from './core/enhanced-app-registry'

export {
  ExtensionRouteLoader,
  ExtensionRouteContainer,
  useExtensionRoute,
  ExtensionRouteRegistry,
  createExtensionRouteRegistry,
} from './core/extension-route-loader'

// Extension 加载器和生命周期管理
export {
  ExtensionLoader,
  createExtensionLoader,
  extensionLoader,
  type ExtensionLoaderConfig,
  type ExtensionLoadStatus,
} from './core/extension-loader'

export {
  ExtensionLifecycleManager,
  createExtensionLifecycleManager,
  extensionLifecycleManager,
  type ExtensionLifecyclePhase,
  type ExtensionLifecycleEvent,
  type ExtensionLifecycleState,
} from './core/extension-lifecycle'

// Extension 通信机制
export {
  ExtensionCommunicationHub,
  createExtensionCommunicationHub,
  extensionCommunicationHub,
  ExtensionCommunicationAPI,
  createExtensionCommunicationAPI,
  type ExtensionMessage,
  type ExtensionMessageType,
  type ExtensionMessageHandler,
  type ExtensionMessageContext,
  type ExtensionMessageSubscription,
  type ExtensionMessageStats,
} from './core/extension-communication'

// Starter 集成管理
export {
  StarterIntegrationManager,
  createStarterIntegrationManager,
  starterIntegrationManager,
  type StarterIntegrationConfig,
  type StarterIntegrationState,
  type ExtensionStateSummary,
} from './core/starter-integration'

// React Hooks
export {
  useStarterIntegration,
  useExtensionMessages,
  useExtensionLifecycle,
  useDynamicRoutes,
  useExtensionState,
} from './hooks/useStarterIntegration'

// Extension 开发模板
export {
  createExtensionTemplate,
  exampleExtension,
  communicationExtension,
  ExtensionTemplateFactory,
  ExtensionDevTools,
  type ExtensionTemplate,
} from './templates/extension-template'

// 暂时只启用基础功能，逐步完善
// 1. 首先启用Dashboard页面
export { Dashboard } from './pages/Dashboard'

// 2. 基础组件 (暂时禁用以解决构建问题)
// export * from './components'

// 3. 布局组件 (已删除旧的布局)
// export * from './layouts'

// 3. 租户管理页面 (暂时禁用以解决构建问题)
// export { default as TenantList } from './pages/tenants/TenantList'
// export { default as TenantCreate } from './pages/tenants/TenantCreate'
// export { default as TenantDetail } from './pages/tenants/TenantDetail'

// 4. Hooks (暂时禁用以解决构建问题)
// export * from './hooks'

// Extension 注册器
export { registerConsoleExtension, unregisterConsoleExtension } from './register'

// 默认导出已在上面包含ConsoleProvider，不需要重复导出

// 导入需要的模块
import { ConsoleProvider } from './providers/ConsoleProvider'
import { consoleServices } from './services'
import { consoleI18nResource } from './i18n'

/**
 * Console 模块信息
 */
export const ConsoleModule = {
  name: '@linch-kit/console',
  version: '0.1.0',
  description: 'LinchKit 企业级管理控制台',

  // 主要导出
  Provider: ConsoleProvider,

  // 服务
  services: consoleServices,

  // 国际化资源
  i18n: consoleI18nResource,
} as const

export default ConsoleModule
