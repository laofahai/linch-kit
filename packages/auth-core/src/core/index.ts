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

// 会话管理
export {
  MemorySessionManager,
  createSessionManager,
  sessionUtils
} from './session'

// 类型导出
export type { SessionManager } from './session'
