/**
 * OAuth 提供者 - 直接使用 NextAuth 现成的提供者
 *
 * 不重复造轮子，只提供便捷的配置函数
 */

import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import MicrosoftProvider from 'next-auth/providers/microsoft'
import AppleProvider from 'next-auth/providers/apple'
import FacebookProvider from 'next-auth/providers/facebook'
import TwitterProvider from 'next-auth/providers/twitter'

/**
 * 简化的 OAuth 提供者配置
 */
export interface SimpleOAuthConfig {
  clientId: string
  clientSecret: string
  allowDangerousEmailAccountLinking?: boolean
}

/**
 * OAuth 提供者工厂 - 直接使用 NextAuth 提供者
 */
export const oauthProviders = {
  /**
   * Google OAuth 提供者
   */
  google: (config: SimpleOAuthConfig) => GoogleProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking
  }),

  /**
   * GitHub OAuth 提供者
   */
  github: (config: SimpleOAuthConfig) => GitHubProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking
  }),

  /**
   * Microsoft OAuth 提供者
   */
  microsoft: (config: SimpleOAuthConfig) => MicrosoftProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking
  }),

  /**
   * Apple OAuth 提供者
   */
  apple: (config: SimpleOAuthConfig) => AppleProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking
  }),

  /**
   * Facebook OAuth 提供者
   */
  facebook: (config: SimpleOAuthConfig) => FacebookProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking
  }),

  /**
   * Twitter OAuth 提供者
   */
  twitter: (config: SimpleOAuthConfig) => TwitterProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    version: '2.0',
    allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking
  })
}

/**
 * 从环境变量自动创建 OAuth 提供者
 */
export function createOAuthProvidersFromEnv() {
  const providers = []

  // Google
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(oauthProviders.google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }))
  }

  // GitHub
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(oauthProviders.github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }))
  }

  // Microsoft
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    providers.push(oauthProviders.microsoft({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET
    }))
  }

  return providers
}
