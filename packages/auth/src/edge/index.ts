/**
 * @linch-kit/auth Edge Runtime 入口
 * 
 * 专为Edge Runtime环境优化的认证包入口点
 * 仅包含Edge Runtime兼容的功能和依赖
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

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
  type IKeyProvider,
  BaseKeyProvider,
  type KeyValidationConfig,
  type BaseKeyProviderConfig,
  defaultKeyValidationConfig
} from '../core/key-provider.interface'

export {
  EdgeKeyProvider,
  createEdgeKeyProvider,
  defaultEdgeKeyProviderConfig,
  type EdgeKeyProviderConfig
} from './edge-key-provider'

// 导入必要的函数
import {
  createCoreJWTAuthService,
  defaultCoreJWTAuthServiceConfig,
  type CoreJWTAuthServiceConfig
} from '../core/core-jwt-auth.service'

import { createEdgeKeyProvider } from './edge-key-provider'

// ==================== 便利创建函数 ====================
/**
 * 创建Edge环境JWT认证服务
 */
export function createEdgeJWTAuthService(config?: Partial<CoreJWTAuthServiceConfig>) {
  const keyProvider = createEdgeKeyProvider()
  
  return createCoreJWTAuthService({
    ...defaultCoreJWTAuthServiceConfig,
    ...config
  }, keyProvider)
}

/**
 * 从环境变量创建Edge环境JWT认证服务
 */
export function createEdgeJWTAuthServiceFromEnv(config?: Partial<CoreJWTAuthServiceConfig>) {
  const keyProvider = createEdgeKeyProvider()
  
  return createCoreJWTAuthService(
    {
      ...defaultCoreJWTAuthServiceConfig,
      ...config
    },
    keyProvider
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