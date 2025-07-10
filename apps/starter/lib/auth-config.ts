/**
 * LinchKit 认证配置
 * 使用 @linch-kit/auth 包提供的企业级认证功能
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
 * 凭据认证逻辑
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

    // 查找用户
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

    if (!user) {
      Logger.warn('User not found during login attempt', { email })
      return null
    }

    if (user.status !== 'ACTIVE') {
      Logger.warn('User account not active', { userId: user.id, status: user.status })
      return null
    }

    if (!user.password) {
      Logger.warn('User has no password set', { userId: user.id })
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

    // 转换为 LinchKitUser 格式
    const linchKitUser: LinchKitUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatar,
      status: user.status.toLowerCase() as LinchKitUser['status'],
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
 * LinchKit 认证配置
 */
const authConfig: LinchKitAuthConfig = {
  providers: {
    credentials: {
      authorize: authenticateCredentials,
    },
    // 可以在这里添加 GitHub 和 Google OAuth 提供商
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!
    // },
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    // }
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
      // 可以在这里添加登录前的检查逻辑
      Logger.info('User attempting to sign in', {
        userId: user.id,
        provider: account?.provider,
      })
      return true
    },
    async extendSession(session, token) {
      // 扩展会话信息
      if (token.sub && session.user) {
        session.user.id = token.sub

        // 从 metadata 中获取角色信息
        if (session.user.metadata?.role) {
          session.roles = [session.user.metadata.role as string]
        }
      }
      return session
    },
    async extendJWT(token, user) {
      // 扩展 JWT
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

      // 注意：这里不能直接操作localStorage，因为这是服务器端
      // 客户端Token缓存将在useTokenCache hook中处理
    },
    async onSignOut({ session, token }) {
      Logger.info('User signed out', {
        userId: session?.user?.id || token?.sub,
      })
    },
  },
  debug: process.env.NODE_ENV === 'development', // 开发环境启用debug
}

/**
 * 导出 NextAuth.js 配置
 */
export const nextAuthConfig = createLinchKitAuthConfig(authConfig)

/**
 * 导出 LinchKit 配置供其他地方使用
 */
export { authConfig }
