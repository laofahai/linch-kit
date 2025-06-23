/**
 * Auth 包优化版入口文件
 * 
 * 使用性能优化的 Schema API，验证 DTS 构建性能改进
 */

// 核心认证功能
export * from './core/auth'
export * from './core/permissions'
export * from './core/session'

// 优化版用户模板
export * from './schemas/user-optimized'

// 类型定义
export * from './types/auth'
export * from './types/permissions'
export * from './types/user'

// 提供者
export * from './providers/credentials'
export * from './providers/oauth'

// 国际化
export * from './i18n'

// CLI 插件
export * from './plugins/cli-plugin'
export * from './plugins/config-plugin'

/**
 * 默认导出 - 优化版认证套件
 */
import { OptimizedAuthKit } from './schemas/user-optimized'

export { OptimizedAuthKit as AuthKit }
export default OptimizedAuthKit
