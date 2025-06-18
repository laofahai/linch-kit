/**
 * Auth Core 认证提供者
 */

// Shared Token 提供者（保留现有功能）
export {
  createSharedTokenProvider,
  createLegacySharedTokenProvider,
  createSharedTokenProviderFromEnv,
  createAdvancedSharedTokenProvider,
  sharedTokenProvider
} from './shared-token'

// 凭据认证提供者
export {
  createCredentialsProvider,
  createEmailPasswordProvider,
  createPhonePasswordProvider,
  createUsernamePasswordProvider,
  createPhoneCodeProvider
} from './credentials'

// OAuth 提供者（简化版，直接使用 NextAuth）
export {
  oauthProviders,
  createOAuthProvidersFromEnv
} from './oauth'

// 类型导出
export type { SharedTokenSource, SharedTokenOptions } from './shared-token'
export type { CredentialsOptions } from './credentials'
export type { SimpleOAuthConfig } from './oauth'
