/**
 * @linch-kit/auth 核心功能导出
 *
 * 专注于新的条件导出架构的核心功能
 *
 * @module core
 */

// ==================== 核心JWT服务 ====================
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
} from './core-jwt-auth.service'

// ==================== 密钥提供者 ====================
export {
  IKeyProvider,
  BaseKeyProvider,
  type KeyValidationConfig,
  type BaseKeyProviderConfig,
  defaultKeyValidationConfig
} from './key-provider.interface'

// ==================== 核心类型重导出 ====================
export type {
  User,
  LinchKitUser,
  AuthRequest,
  AuthResult,
  Session,
  JWTPayload,
  IAuthService
} from '../types'
