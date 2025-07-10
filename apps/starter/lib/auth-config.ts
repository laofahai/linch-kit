/**
 * LinchKit 认证配置 - 重构版本
 * 使用 @linch-kit/auth 包的标准配置，消除重复实现
 */

import {
  createLinchKitAuthConfig,
  type LinchKitUser,
  type LinchKitAuthConfig,
} from '@linch-kit/auth'
import { Logger } from '@linch-kit/core'
import bcrypt from 'bcryptjs'

import { prisma } from './prisma'

/**
 * 凭据认证逻辑 - 简化版本
 * 重点关注业务逻辑，其他由 @linch-kit/auth 处理
 */
async function authenticateCredentials(
  credentials: Record<string, unknown>
): Promise<LinchKitUser | null> {
  try {
    const { email, password } = credentials

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      Logger.warn('Invalid credentials provided')
      return null
    }

    // 查找用户 - 使用统一的数据查询
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user || user.status !== 'ACTIVE' || !user.password) {
      Logger.warn('Authentication failed', {
        email,
        reason: !user
          ? 'user_not_found'
          : user.status !== 'ACTIVE'
            ? 'account_disabled'
            : 'no_password',
      })
      return null
    }

    // 验证密码
    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      Logger.warn('Invalid password for user', { userId: user.id })
      return null
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // 转换为标准 LinchKitUser 格式
    const linchKitUser: LinchKitUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatar,
      status: user.status.toLowerCase() as 'active' | 'inactive' | 'disabled' | 'pending',
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      metadata: {
        role: user.role,
      },
    }

    Logger.info('User successfully authenticated', { userId: user.id, email: user.email })
    return linchKitUser
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    Logger.error(`Authentication error: ${errorMessage}`)
    return null
  }
}

/**
 * LinchKit 认证配置 - 使用标准配置选项
 */
const authConfig: LinchKitAuthConfig = {
  providers: {
    credentials: {
      authorize: authenticateCredentials,
    },
    // 支持 OAuth 提供商（可选）
    ...(process.env.GITHUB_CLIENT_ID && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    error: '/auth/error',
  },
  callbacks: {
    async beforeSignIn({ user, account }) {
      Logger.info('User attempting to sign in', {
        userId: user.id,
        provider: account?.provider,
      })
      return true
    },
    async extendSession(session, token) {
      // 使用标准的会话扩展
      if (token.sub && session.user) {
        session.user.id = token.sub

        // 添加角色信息到会话
        if (session.user.metadata?.role) {
          session.roles = [session.user.metadata.role as string]
        }
      }
      return session
    },
    async extendJWT(token, user) {
      // 标准的 JWT 扩展
      if (user) {
        token.sub = user.id
        token.role = user.metadata?.role as string
      }
      return token
    },
  },
  events: {
    async onSignIn({ user, account }) {
      Logger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
      })
    },
    async onSignOut({ session, token }) {
      Logger.info('User signed out', {
        userId: session?.user?.id || token?.sub,
      })
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

/**
 * 导出 NextAuth.js 配置
 */
export const nextAuthConfig = createLinchKitAuthConfig(authConfig)

/**
 * 导出 LinchKit 配置供其他地方使用
 */
export { authConfig }
