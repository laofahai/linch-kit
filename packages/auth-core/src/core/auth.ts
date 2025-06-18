import type { NextAuthOptions } from 'next-auth'
import type { AuthUser, AuthCoreConfig, AuthSession } from '../types/auth'
import { defaultMessages } from '../i18n/messages'

/**
 * 创建 Auth Core 配置
 * 
 * 这是 auth-core 的主要入口函数，用于创建完整的认证配置
 */
export function createAuthConfig(config: AuthCoreConfig): NextAuthOptions {
  const {
    providers = [],
    session = { strategy: 'jwt' },
    callbacks = {},
    pages = {},
    debug = false
  } = config

  return {
    providers,
    session: {
      strategy: session.strategy || 'jwt',
      maxAge: session.maxAge || 30 * 24 * 60 * 60, // 30 days
      updateAge: session.updateAge || 24 * 60 * 60, // 24 hours
      generateSessionToken: session.generateSessionToken
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (callbacks.signIn) {
          return await callbacks.signIn(user as AuthUser, account, profile)
        }
        return true
      },
      async session({ session, user, token }) {
        if (callbacks.session) {
          return await callbacks.session(session as AuthSession, user as AuthUser)
        }
        return session
      },
      async jwt({ token, user, account, profile }) {
        if (callbacks.jwt) {
          return await callbacks.jwt(token, user as AuthUser)
        }
        return token
      }
    },
    pages: {
      signIn: pages.signIn,
      signOut: pages.signOut,
      error: pages.error
    },
    debug
  }
}

/**
 * 创建简单的认证配置
 * 
 * 用于快速开始，只需要提供认证提供者
 */
export function createSimpleAuthConfig(providers: any[]): NextAuthOptions {
  return createAuthConfig({
    providers,
    session: { strategy: 'jwt' }
  })
}

/**
 * 默认的认证配置
 */
export const defaultAuthConfig: Partial<AuthCoreConfig> = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60     // 24 hours
  },
  debug: process.env.NODE_ENV === 'development'
}
