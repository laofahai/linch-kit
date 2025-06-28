/**
 * Console 模块主入口
 * 
 * LinchKit Console - 企业级管理控制台
 */

// 实体和类型
export * from './entities'
export * from './validation'

// 服务层
export * from './services'

// 路由系统
export * from './routes'

// 组件
export * from './components'

// 页面组件
export * from './pages'

// Hooks
export * from './hooks'

// Providers 和上下文
export * from './providers/ConsoleProvider'

// 国际化
export * from './i18n'

// 默认导出 - 主要的 Console 功能
export { default as ConsoleRouter } from './routes/ConsoleRoutes'
export { ConsoleProvider } from './providers/ConsoleProvider'
export { Dashboard } from './pages/Dashboard'

/**
 * Console 模块信息
 */
export const ConsoleModule = {
  name: '@linch-kit/console',
  version: '0.1.0',
  description: 'LinchKit 企业级管理控制台',
  
  // 主要导出
  Router: require('./routes/ConsoleRoutes').default,
  Provider: require('./providers/ConsoleProvider').ConsoleProvider,
  
  // 创建路由配置
  createRoutes: require('./routes').createConsoleRoutes,
  createRouter: require('./routes').createConsoleRouter,
  
  // 实体集合
  entities: require('./entities').ConsoleEntities,
  
  // 验证器
  validators: require('./validation').consoleValidators,
  
  // 服务
  services: require('./services').consoleServices,
  
  // 国际化资源
  i18n: require('./i18n').consoleI18nResource
} as const

export default ConsoleModule