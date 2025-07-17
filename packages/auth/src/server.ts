/**
 * @linch-kit/auth 服务端导出
 * 
 * 服务端完整的Auth功能导出
 * 包含Node.js专用依赖和服务端功能
 * 
 * @author LinchKit Team
 * @since 0.2.0
 */

// ==================== NextAuth.js 服务端核心 ====================
export { default as NextAuth } from 'next-auth'
export type { NextAuthConfig, Session, User } from 'next-auth'

// ==================== LinchKit 适配器导出 ====================
export { createLinchKitAuthConfig } from './adapters/nextauth-adapter'

// ==================== 权限引擎导出 ====================
export { CASLPermissionEngine } from './permissions/casl-engine'
export {
  EnhancedPermissionEngine,
  createEnhancedPermissionEngine,
  type EnhancedPermissionResult,
} from './permissions/enhanced-permission-engine'

// ==================== 服务导出 ====================
export * from './services'
export type { IAuthService } from './types'

// ==================== 中间件导出 ====================
export * from './middleware'

// ==================== 企业级扩展导出 ====================
export { EnterpriseAuthExtensions } from './extensions/enterprise'
export { MFAManager } from './extensions/mfa'

// ==================== 安全组件导出 ====================
export { JWTBlacklistManager, type BlacklistStorage } from './security/jwt-blacklist-manager'
export { RateLimiter, type RateLimitStorage } from './security/rate-limiter'
export { MultiDeviceSessionManager, type DeviceSessionStorage } from './security/multi-device-session-manager'

// ==================== 增强JWT服务导出 ====================
export { EnhancedJWTAuthService } from './services/enhanced-jwt-auth.service'

// ==================== tRPC路由工厂导出 ====================
export { createAuthRouter } from './trpc/router-factory'

// ==================== 类型定义导出 ====================
export type * from './types'
export { UserSchema } from './types'

// ==================== 版本信息 ====================
export const VERSION = '0.2.0'