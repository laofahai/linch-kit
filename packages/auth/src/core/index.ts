/**
 * @linch-kit/auth 核心功能导出
 * 
 * 导出Auth包的核心业务逻辑，包括认证管理、权限引擎、会话管理等
 * 
 * @module core
 */

// ==================== 认证管理 ====================
/**
 * 认证管理器和相关功能
 */
export { AuthManager } from '../auth-manager'

// ==================== 认证提供商 ====================
/**
 * 认证提供商基类和具体实现
 */
export { BaseAuthProvider } from '../providers/base'
export { CredentialsAuthProvider } from '../providers/credentials'
export { GitHubAuthProvider, type GitHubAuthConfig } from '../providers/github'
export { GoogleAuthProvider, type GoogleAuthConfig } from '../providers/google'

// ==================== 权限引擎 ====================
/**
 * 权限检查和控制引擎
 */
export { CASLPermissionEngine } from '../permissions/casl-engine'

// ==================== 会话管理 ====================
/**
 * 会话管理器和相关功能
 */
export { JWTSessionManager } from '../session/jwt-manager'

// ==================== MFA系统 ====================
/**
 * 多因子认证系统
 */
export { TOTPManager, type TOTPConfig } from '../mfa/totp-manager'

// ==================== 审计日志 ====================
/**
 * 审计日志记录器
 */
export { SimpleAuditLogger, createSimpleAuditLogger } from '../audit/simple-logger'

// ==================== 工厂函数 ====================
/**
 * 便捷的实例创建函数
 */
export {
  createAuditLogger,
  createAuthManager,
  createJWTSessionManager,
  createPermissionEngine,
  createTOTPManager
} from '../factory'

// ==================== 核心类型重导出 ====================
/**
 * 核心类型定义（为了便于使用）
 */
export type {
  User,
  AuthRequest,
  AuthResult,
  AuthProvider,
  IAuthProvider,
  AuthConfig,
  SessionData,
  PermissionRule,
  AuditEvent,
  IAuditLogger
} from '../types'
