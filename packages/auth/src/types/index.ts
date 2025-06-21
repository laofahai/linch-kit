/**
 * Auth Core 类型定义入口
 */

// 认证相关类型
export type {
  AuthUser,
  AuthSession,
  AuthProvider,
  OAuthProvider,
  CredentialsProvider,
  SharedTokenProvider,
  PermissionCheck,
  RoleCheck,
  MultiTenantConfig,
  PermissionConfig,
  SessionConfig,
  AuthCoreConfig,
  NextAuthAdapter
} from './auth'

export { AuthError, PermissionError } from './auth'

// 用户相关类型
export type {
  BaseUser,
  UserRole,
  UserPermission,
  UserSession,
  UserAccount,
  TenantUser,
  UserProfile,
  EnterpriseUser,
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
  UserSort,
  PaginatedUsers
} from './user'

// 权限相关类型
export type {
  PermissionAction,
  PermissionResource,
  Permission,
  PermissionCondition,
  Role,
  RBACContext,
  ABACContext,
  PermissionResult,
  PermissionPolicy,
  PermissionRule,
  ResourcePermissions,
  UserPermissionSummary,
  PermissionChecker,
  PermissionManager,
  TenantPermissionContext
} from './permissions'
