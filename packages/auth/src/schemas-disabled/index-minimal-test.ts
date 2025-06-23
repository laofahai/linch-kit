/**
 * Auth 包最小化测试入口文件
 * 
 * 只导出最基本的功能，用于测试 DTS 构建性能
 */

// 只导出最基本的用户模板
export { MinimalUserTemplate, BasicUserTemplate } from './schemas/user'
export { UltraMinimalUserTemplate } from './schemas/user-ultra-minimal'

// 基础类型导出
export type {
  AuthUser,
  AuthSession,
  AuthProvider,
  AuthCoreConfig,
} from './types/auth'

// 基础配置导出
export {
  createAuthConfig,
  createSimpleAuthConfig,
  defaultAuthConfig
} from './core/auth'

// 基础认证套件
export const MinimalAuthKit = {
  User: MinimalUserTemplate,
}

// 默认导出
export default MinimalAuthKit
