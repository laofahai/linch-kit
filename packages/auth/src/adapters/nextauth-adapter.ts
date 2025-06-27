/**
 * @linch-kit/auth NextAuth.js 适配器
 *
 * 遵循 LinchKit "不重复造轮子" 原则
 * 基于成熟的 NextAuth.js 解决方案，添加企业级特性
 *
 * @description 创建 LinchKit 定制的 NextAuth.js 配置
 * @since 0.1.0
 */

import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

import type { LinchKitAuthConfig } from '../types'

/**
 * 创建 LinchKit 定制的 NextAuth.js 配置
 *
 * @description 基于 NextAuth.js 创建企业级认证配置
 * @param config LinchKit 认证配置
 * @returns NextAuth.js 配置对象
 * @example
 * ```typescript
 * import { createLinchKitAuthConfig } from '@linch-kit/auth'
 *
 * const authConfig = createLinchKitAuthConfig({
 *   providers: {
 *     github: {
 *       clientId: process.env.GITHUB_CLIENT_ID,
 *       clientSecret: process.env.GITHUB_CLIENT_SECRET
 *     },
 *     google: {
 *       clientId: process.env.GOOGLE_CLIENT_ID,
 *       clientSecret: process.env.GOOGLE_CLIENT_SECRET
 *     }
 *   },
 *   database: {
 *     url: process.env.DATABASE_URL
 *   }
 * })
 * ```
 */
export function createLinchKitAuthConfig(config: LinchKitAuthConfig): NextAuthConfig {
  const providers = []

  // GitHub OAuth 提供商
  if (config.providers?.github) {
    providers.push(
      GitHub({
        clientId: config.providers.github.clientId,
        clientSecret: config.providers.github.clientSecret,
        allowDangerousEmailAccountLinking: true,
      })
    )
  }

  // Google OAuth 提供商
  if (config.providers?.google) {
    providers.push(
      Google({
        clientId: config.providers.google.clientId,
        clientSecret: config.providers.google.clientSecret,
        allowDangerousEmailAccountLinking: true,
      })
    )
  }

  // 凭据认证提供商
  if (config.providers?.credentials) {
    providers.push(
      Credentials({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(_credentials) {
          if (!_credentials?.email || !_credentials?.password) {
            return null
          }

          // 使用配置的认证函数
          if (config.providers?.credentials?.authorize) {
            return await config.providers.credentials.authorize(_credentials)
          }

          return null
        },
      })
    )
  }

  return {
    providers,
    // 注意：数据库适配器已移至 @linch-kit/trpc 包
    session: {
      strategy: 'jwt',
      maxAge: config.session?.maxAge || 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
      maxAge: config.jwt?.maxAge || 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
      signIn: config.pages?.signIn || '/auth/sign-in',
      signOut: config.pages?.signOut || '/auth/sign-out',
      error: config.pages?.error || '/auth/error',
      verifyRequest: config.pages?.verifyRequest || '/auth/verify-request',
      newUser: config.pages?.newUser || '/auth/new-user',
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        // 企业级登录前置检查
        if (config.callbacks?.beforeSignIn) {
          const allowed = await config.callbacks.beforeSignIn({
            user: user as any,
            account,
            profile,
          })
          if (!allowed) return false
        }

        return true
      },
      async session({ session, token }) {
        // 扩展会话信息
        if (token.sub && session.user) {
          ;(session.user as any).id = token.sub
        }

        // 添加企业级会话扩展
        if (config.callbacks?.extendSession) {
          const extendedSession = await config.callbacks.extendSession(session as any, token)
          return extendedSession as any
        }

        return session
      },
      async jwt({ token, user, account }) {
        // 首次登录时保存用户信息
        if (user && user.id) {
          token.sub = user.id
        }

        // 添加企业级 JWT 扩展
        if (config.callbacks?.extendJWT) {
          token = await config.callbacks.extendJWT(token, user as any, account)
        }

        return token
      },
    },
    events: {
      async signIn({ user, account, profile }) {
        // 企业级登录事件处理
        if (config.events?.onSignIn) {
          await config.events.onSignIn({ user: user as any, account, profile })
        }
      },
      async signOut(message) {
        // 企业级登出事件处理
        if (config.events?.onSignOut) {
          await config.events.onSignOut({
            session: 'session' in message ? (message.session as any) : undefined,
            token: 'token' in message ? message.token || undefined : undefined,
          })
        }
      },
    },
    debug: config.debug || false,
  }
}

/**
 * 默认的 LinchKit 认证配置
 *
 * @description 提供开箱即用的认证配置
 * @returns 默认的 NextAuth.js 配置
 */
export function createDefaultLinchKitAuthConfig(): NextAuthConfig {
  return createLinchKitAuthConfig({
    providers: {
      credentials: {
        authorize: async _credentials => {
          // 默认的凭据验证逻辑
          // 在实际使用中应该连接到数据库
          console.warn('Using default credentials provider - implement your own authorize function')
          return null
        },
      },
    },
    session: {
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: process.env.NODE_ENV === 'development',
  })
}
