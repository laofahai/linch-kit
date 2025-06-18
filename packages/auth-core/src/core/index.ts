/**
 * Auth Core 核心模块
 */

// 认证配置
export {
  createAuthConfig,
  createSimpleAuthConfig,
  defaultAuthConfig
} from './auth'

// 权限管理
export {
  BasePermissionChecker,
  BaseHierarchicalPermissionChecker,
  createPermissionChecker,
  createHierarchicalPermissionChecker,
  permissionUtils
} from './permissions'

// 模块化权限管理
export {
  BasePermissionRegistry,
  createPermissionRegistry,
  getGlobalPermissionRegistry,
  setGlobalPermissionRegistry
} from './permission-registry'

export {
  BaseModularPermissionChecker,
  createModularPermissionChecker
} from './modular-permission-checker'

// 注意: 会话管理已移除，请直接使用 NextAuth.js 的会话功能
// 如需自定义会话逻辑，请在 NextAuth 配置的 callbacks 中实现
