/**
 * Console 模块主入口
 * 
 * LinchKit Console - 企业级管理控制台
 */

// 确保所有导出都是客户端安全的
// 对于包含React hooks的组件，在各自文件中标记'use client'

// 服务层 (纯JavaScript，无客户端依赖)
export * from './services'

// tRPC 路由器
export { consoleRouter } from './routes/console.router'
export type { ConsoleRouter } from './routes/console.router'

// 导出租户路由器及其配置函数
export { tenantRouter, setTenantService } from './routes/tenant.router'
export type { TenantRouter } from './routes/tenant.router'

// Provider和上下文 (已标记为客户端组件)
export { ConsoleProvider } from './providers/ConsoleProvider'

// 国际化 (纯JavaScript)
export * from './i18n'

// 暂时只启用基础功能，逐步完善
// 1. 首先启用Dashboard页面
export { Dashboard } from './pages/Dashboard'

// 2. 基础组件 (暂时禁用以解决构建问题)
// export * from './components'

// 3. 租户管理页面 (暂时禁用以解决构建问题)
// export { default as TenantList } from './pages/tenants/TenantList'
// export { default as TenantCreate } from './pages/tenants/TenantCreate'  
// export { default as TenantDetail } from './pages/tenants/TenantDetail'

// 4. Hooks (暂时禁用以解决构建问题)
// export * from './hooks'

// 默认导出已在上面包含ConsoleProvider，不需要重复导出

/**
 * Console 模块信息
 */
export const ConsoleModule = {
  name: '@linch-kit/console',
  version: '0.1.0',
  description: 'LinchKit 企业级管理控制台',
  
  // 主要导出 (暂时只保留Provider)
  // Router: require('./routes/ConsoleRoutes').default,
  Provider: require('./providers/ConsoleProvider').ConsoleProvider,
  
  // 创建路由配置 (暂时禁用)
  // createRoutes: require('./routes').createConsoleRoutes,
  // createRouter: require('./routes').createConsoleRouter,
  
  // 实体集合 (暂时禁用)
  // entities: require('./entities').ConsoleEntities,
  
  // 验证器 (暂时禁用) 
  // validators: require('./validation').consoleValidators,
  
  // 服务
  services: require('./services').consoleServices,
  
  // 国际化资源
  i18n: require('./i18n').consoleI18nResource
} as const

export default ConsoleModule