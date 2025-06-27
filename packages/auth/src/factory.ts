/**
 * @linch-kit/auth 工厂函数
 * 提供便捷的实例创建方法
 */

import type { TranslationFunction } from '@linch-kit/core'

import { AuthManager } from './auth-manager'
import { JWTSessionManager } from './session/jwt-manager'
import { TOTPManager, type TOTPConfig } from './mfa/totp-manager'
import { createSimpleAuditLogger } from './audit/simple-logger'
import type { IAuditLogger } from './types'
import { CASLPermissionEngine } from './permissions/casl-engine'
import type { AuthConfig } from './types'

/**
 * 创建认证管理器
 */
export function createAuthManager(
  config?: Partial<AuthConfig>,
  userT?: TranslationFunction
): AuthManager {
  return new AuthManager(config, userT)
}

/**
 * 创建JWT会话管理器
 */
export function createJWTSessionManager(config: AuthConfig['jwt']): JWTSessionManager {
  return new JWTSessionManager(config)
}

/**
 * 创建TOTP管理器
 */
export function createTOTPManager(config: TOTPConfig): TOTPManager {
  return new TOTPManager(config)
}

/**
 * 创建审计日志记录器
 */
export function createAuditLogger(): IAuditLogger {
  return createSimpleAuditLogger()
}

/**
 * 创建权限引擎
 */
export function createPermissionEngine(options?: {
  cacheSize?: number
  cacheTTL?: number
}): CASLPermissionEngine {
  return new CASLPermissionEngine(options)
}

/**
 * 创建完整的认证系统
 */
export function createAuthSystem(config: {
  auth?: Partial<AuthConfig>
  totp?: TOTPConfig
  permission?: {
    cacheSize?: number
    cacheTTL?: number
  }
  userT?: TranslationFunction
}): {
  authManager: AuthManager
  sessionManager: JWTSessionManager
  totpManager: TOTPManager
  auditLogger: IAuditLogger
  permissionEngine: CASLPermissionEngine
} {
  const authConfig = config.auth || {}
  const authManager = createAuthManager(authConfig, config.userT)
  
  // 从auth配置中提取JWT配置
  const jwtConfig = authConfig.jwt || {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256' as const
  }
  
  const sessionManager = createJWTSessionManager(jwtConfig)
  const totpManager = createTOTPManager(config.totp || {
    serviceName: 'LinchKit',
    issuer: 'LinchKit Auth'
  })
  const auditLogger = createAuditLogger()
  const permissionEngine = createPermissionEngine(config.permission)

  return {
    authManager,
    sessionManager,
    totpManager,
    auditLogger,
    permissionEngine
  }
}