/**
 * @linch-kit/auth - 超级最小化版本
 *
 * 只包含最基本的导出，不依赖任何复杂的类型或模块
 */

// 只导出最基本的 Schema
export { UltraMinimalUserTemplate, UltraMinimalAuthKit } from './schemas/user-ultra-minimal'

// 简单的类型定义
export interface SimpleAuthUser {
  id: string
  name?: string
  email?: string
}

export interface SimpleAuthConfig {
  userEntity?: string
  providers: any[]
}

// 简单的函数
export function createSimpleAuth(config: SimpleAuthConfig) {
  return {
    config,
    userEntity: config.userEntity || 'basic',
  }
}
