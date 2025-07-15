/**
 * Extension 配置文件
 * 基于规划文档中的扩展集成方案
 */

// 临时内联类型定义，避免导入问题
interface StarterIntegrationConfig {
  autoInitialize: boolean
  enableHotReload: boolean
  enableCommunication: boolean
  defaultExtensions: string[]
  routePrefix: string
  enablePermissionCheck: boolean
}

/**
 * Starter Extension 配置
 */
export const starterExtensionConfig: StarterIntegrationConfig = {
  // 自动初始化
  autoInitialize: true,
  
  // 启用热重载 (开发环境)
  enableHotReload: process.env.NODE_ENV === 'development',
  
  // 启用Extension通信
  enableCommunication: true,
  
  // 默认加载的扩展
  defaultExtensions: ['console'],
  
  // 路由前缀
  routePrefix: '/dashboard/ext',
  
  // 启用权限检查
  enablePermissionCheck: true,
}

/**
 * 扩展功能配置
 */
export const extensionFeatures = {
  console: {
    enabled: true,
    basePath: '/console',
    features: [
      'dashboard',
      'tenants', 
      'users',
      'monitoring',
      'extensions'
    ]
  },
  blog: {
    enabled: false,
    basePath: '/blog'
  }
} as const

/**
 * 平台配置
 */
export const platformConfig = {
  theme: 'enterprise',
  layout: 'dashboard'
} as const

export default starterExtensionConfig