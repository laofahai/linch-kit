/**
 * @linch-kit/auth Server Runtime 入口
 * 
 * 专为Node.js Server环境优化的认证包入口点
 * 包含完整的服务器端功能和Node.js专用依赖
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import { logger } from '@linch-kit/core/server'

import {
  createCoreJWTAuthService,
  defaultCoreJWTAuthServiceConfig,
  type CoreJWTAuthServiceConfig,
  type ILogger
} from '../core/core-jwt-auth.service'

// ==================== 核心功能 ====================
export {
  CoreJWTAuthService,
  createCoreJWTAuthService,
  defaultCoreJWTAuthServiceConfig,
  type CoreJWTAuthServiceConfig,
  type ISessionStorage,
  type IRefreshTokenStorage,
  type IUserProvider,
  type ILogger,
  InMemorySessionStorage,
  InMemoryRefreshTokenStorage,
  MockUserProvider,
  ConsoleLogger
} from '../core/core-jwt-auth.service'

// ==================== 密钥提供者 ====================
export {
  IKeyProvider,
  BaseKeyProvider,
  type KeyValidationConfig,
  type BaseKeyProviderConfig,
  defaultKeyValidationConfig
} from '../core/key-provider.interface'

export {
  ServerKeyProvider,
  createServerKeyProvider,
  createEnvServerKeyProvider,
  createFileServerKeyProvider,
  defaultServerKeyProviderConfig,
  type ServerKeyProviderConfig,
  type KeySource,
  type FileKeyConfig,
  type VaultKeyConfig
} from './server-key-provider'

// 导入以便在函数中使用
import { createEnvServerKeyProvider } from './server-key-provider'

// ==================== 核心功能导出 ====================
export * from '../core'

// ==================== 原有JWT服务（临时保持兼容） ====================
export {
  JWTAuthService,
  createJWTAuthService,
  defaultJWTAuthServiceConfig,
  type JWTAuthServiceConfig
} from '../services/jwt-auth.service'

// ==================== Server Logger集成 ====================
/**
 * 服务器端Logger实现（集成LinchKit Core Logger）
 */
export class ServerLogger implements ILogger {
  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, meta)
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    logger.error(message, error, meta)
  }
}

// ==================== 便利创建函数 ====================
/**
 * 创建服务器端JWT认证服务（使用LinchKit Core Logger）
 */
export function createServerJWTAuthService(config?: Partial<CoreJWTAuthServiceConfig>) {
  const keyProvider = createEnvServerKeyProvider()
  
  return createCoreJWTAuthService({
    ...defaultCoreJWTAuthServiceConfig,
    ...config
  }, keyProvider, {
    logger: new ServerLogger()
  })
}

/**
 * 从环境变量创建服务器端JWT认证服务
 */
export function createServerJWTAuthServiceFromEnv(config?: Partial<CoreJWTAuthServiceConfig>) {
  const keyProvider = createEnvServerKeyProvider()
  
  return createCoreJWTAuthService(
    {
      ...defaultCoreJWTAuthServiceConfig,
      ...config
    },
    keyProvider,
    {
      logger: new ServerLogger()
    }
  )
}

// ==================== 类型定义 ====================
export type {
  User,
  LinchKitUser,
  AuthRequest,
  AuthResult,
  Session,
  JWTPayload,
  IAuthService
} from '../types'