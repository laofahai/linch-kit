/**
 * Auth 包简化版入口文件
 * 
 * 使用简化的用户模板，避免复杂的 Schema API
 * 目标：实现快速 DTS 构建（< 30s）
 */

// 核心认证功能
export * from './core/auth'
export * from './core/permissions'
export * from './core/session'

// 简化用户模板（使用命名导出避免冲突）
export {
  SimpleUserSchema,
  StandardUserSchema,
  EnterpriseUserSchema as SimpleEnterpriseUserSchema,
  CreateSimpleUserSchema,
  CreateStandardUserSchema,
  CreateEnterpriseUserSchema,
  UpdateSimpleUserSchema,
  UpdateStandardUserSchema,
  UpdateEnterpriseUserSchema,
  QueryUserSchema,
  SimpleAuthKit,
  type SimpleUser,
  type StandardUser,
  type EnterpriseUser as SimpleEnterpriseUser,
  type CreateSimpleUser,
  type UpdateSimpleUser,
  type CreateStandardUser,
  type UpdateStandardUser,
  type CreateEnterpriseUser,
  type UpdateEnterpriseUser,
  type QueryUser,
} from './schemas/simple-user'

// 类型定义（使用命名导出避免冲突）
export type {
  AuthUser,
  AuthSession,
  AuthCoreConfig,
} from './types/auth'

export type {
  ModularPermissionChecker,
  PermissionRegistry,
} from './types/permissions'

// 提供者
export * from './providers/credentials'
export * from './providers/oauth'

// 国际化
export * from './i18n'

// CLI 插件
export * from './plugins/cli-plugin'
export * from './plugins/config-plugin'

/**
 * 默认导出 - 简化认证套件
 */
import SimpleAuthKit from './schemas/simple-user'

export { SimpleAuthKit as AuthKit }
export default SimpleAuthKit
