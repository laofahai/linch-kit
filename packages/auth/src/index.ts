// === 🎯 Linch Kit Auth 包 ===

// 核心类型
export type {
  User,
  Session,
  Permission,
  Role,
  AuthConfig,
  AuthProvider,
  OAuthProvider,
  CredentialsProvider,
  SharedTokenProvider,
  UseAuthReturn,
  UsePermissionsReturn,
  PermissionCheck,
  RoleCheck,
  AuthError,
  PermissionError
} from './types'

// 配置函数
export {
  createAuthConfig,
  googleProvider,
  githubProvider,
  credentialsProvider,
  sharedTokenProvider,
  defaultPermissionCheck,
  roleBasedPermissionCheck,
  hasPermission,
  hasRole,
  hasAnyRole,
  hasAllRoles
} from './config'

// React Hooks
export {
  useAuth,
  usePermissions,
  useRole,
  useResourcePermissions,
  useUser,
  useSession,
  useAuthActions,
  useAuthState,
  usePermissionGuard,
  useAuthStats
} from './hooks'

// React 组件
export {
  PermissionGuard,
  RoleGuard,
  AuthGuard,
  UserAvatar,
  UserInfo,
  SignInButton,
  SignOutButton,
  ConditionalRender,
  withPermission,
  withRole,
  withAuth
} from './components'

// 向后兼容
export type {
  LegacyUser,
  LegacySession,
  JWT
} from './types'

// 旧的导出（向后兼容）
export * from './utils/session'
export * from './utils/env'
export * from '../react/sso'
