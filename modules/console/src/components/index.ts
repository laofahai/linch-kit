/**
 * Console 组件导出
 *
 * 提供所有 Console 模块的 React 组件
 */

// 共享组件
export * from './shared/ConsoleLayout'
export * from './shared/StatCard'
export * from './shared/DataTable'

// 页面组件（懒加载，通过路由系统使用）
// export * from './dashboard'
// export * from './tenants'
// export * from './users'
// export * from './permissions'
// export * from './plugins'
// export * from './monitoring'
// export * from './schemas'
// export * from './settings'

// 默认导出所有共享组件
export default {
  // 布局
  ConsoleLayout: require('./shared/ConsoleLayout').ConsoleLayout,
  ConsolePageHeader: require('./shared/ConsoleLayout').ConsolePageHeader,
  ConsoleContent: require('./shared/ConsoleLayout').ConsoleContent,
  ConsoleSidebarLayout: require('./shared/ConsoleLayout').ConsoleSidebarLayout,

  // 统计
  StatCard: require('./shared/StatCard').StatCard,
  StatGrid: require('./shared/StatGrid').StatGrid,
  MiniStatCard: require('./shared/StatCard').MiniStatCard,

  // 表格
  DataTable: require('./shared/DataTable').DataTable,
  SimpleDataTable: require('./shared/DataTable').SimpleDataTable,
}
