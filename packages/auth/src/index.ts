/**
 * @linch-kit/auth 认证权限包主入口
 * 企业级认证和权限管理解决方案
 */

// 类型导出
export * from './types'

// 认证管理器
export { AuthManager } from './auth-manager'

// 认证提供商
export { BaseAuthProvider } from './providers/base'
export { CredentialsAuthProvider } from './providers/credentials'
export { GoogleAuthProvider, type GoogleAuthConfig } from './providers/google'
export { GitHubAuthProvider, type GitHubAuthConfig } from './providers/github'

// 权限引擎
export { CASLPermissionEngine } from './permissions/casl-engine'

// 会话管理
export { JWTSessionManager } from './session/jwt-manager'

// MFA系统
export { TOTPManager, type TOTPConfig } from './mfa/totp-manager'

// 审计日志
export { SimpleAuditLogger, createSimpleAuditLogger } from './audit/simple-logger'

// 便捷创建函数
export {
  createAuthManager,
  createJWTSessionManager,
  createTOTPManager,
  createAuditLogger,
  createPermissionEngine
} from './factory'

// 国际化支持
export { authI18n, useAuthTranslation } from './i18n'