import { z } from 'zod'
import { nanoid } from 'nanoid'

import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db } from '../../../lib/db'
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateSessionExpiry,
  isValidEmail,
  validatePassword,
  generateUsername
} from '../../../lib/auth'

/**
 * Authentication Router
 *
 * Handles authentication operations including:
 * - User registration
 * - User login
 * - Session management
 * - Password reset
 *
 * @description 实现真实的数据库认证功能
 * @since 2025-06-20
 */

export const authRouter = router({
  /**
   * User registration
   * @description 用户注册，创建新用户账户和会话
   * @since 2025-06-20
   */
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
      password: z.string().min(6).max(100),
      globalUsername: z.string().min(1).max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      const { email, name, password, globalUsername } = input

      // 验证邮箱格式
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format')
      }

      // 验证密码强度
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
      }

      // 检查用户是否已存在
      const existingUser = await db.user.findFirst({
        where: {
          globalEmail: email,
          deletedAt: null,
        },
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // 生成用户名（如果未提供）
      const username = globalUsername || generateUsername(email)

      // 检查用户名是否已存在
      const existingUsername = await db.user.findFirst({
        where: {
          globalUsername: username,
          deletedAt: null,
        },
      })

      if (existingUsername) {
        throw new Error('Username already exists')
      }

      // 哈希密码
      const hashedPassword = await hashPassword(password)

      // 创建新用户
      const newUser = await db.user.create({
        data: {
          id: nanoid(),
          globalEmail: email,
          globalUsername: username,
          name,
          globalStatus: 'active',
          metadata: {
            registrationDate: new Date().toISOString(),
            registrationMethod: 'email',
            passwordHash: hashedPassword, // 临时存储在 metadata 中
            // TODO: 创建专门的认证表
          },
        },
      })

      // 创建会话
      const sessionToken = generateSessionToken()
      const sessionExpiry = generateSessionExpiry(30)

      const session = await db.session.create({
        data: {
          id: nanoid(),
          userId: newUser.id,
          sessionToken,
          expires: sessionExpiry,
          metadata: {
            userAgent: 'tRPC-Client',
            ipAddress: 'unknown',
            loginMethod: 'registration',
          },
        },
      })

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.globalEmail,
          name: newUser.name,
          username: newUser.globalUsername,
          status: newUser.globalStatus,
          roles: [], // 新注册用户默认没有角色
        },
        session: {
          token: session.sessionToken,
          expiresAt: session.expires,
        },
        message: 'Registration successful',
      }
    }),

  /**
   * User login
   * @description 用户登录，验证凭据并创建会话
   * @since 2025-06-20
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input

      // 查找用户
      const user = await db.user.findFirst({
        where: {
          globalEmail: email,
          deletedAt: null,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      })

      if (!user) {
        throw new Error('Invalid email or password')
      }

      // 检查用户状态
      if (user.globalStatus !== 'active') {
        throw new Error('Account is deactivated')
      }

      // TODO: 从专门的认证表中获取密码哈希
      // 暂时从 metadata 中获取（这是临时方案）
      const storedPasswordHash = user.metadata?.passwordHash as string
      if (!storedPasswordHash) {
        throw new Error('Account authentication not configured')
      }

      // 验证密码
      const isPasswordValid = await verifyPassword(password, storedPasswordHash)
      if (!isPasswordValid) {
        throw new Error('Invalid email or password')
      }

      // 创建会话
      const sessionToken = generateSessionToken()
      const sessionExpiry = generateSessionExpiry(30)

      const session = await db.session.create({
        data: {
          id: nanoid(),
          userId: user.id,
          sessionToken,
          expires: sessionExpiry,
          metadata: {
            userAgent: 'tRPC-Client',
            ipAddress: 'unknown',
            loginMethod: 'email',
            loginTime: new Date().toISOString(),
          },
        },
      })

      // 获取用户角色
      const roles = user.userRoles.map(ur => ur.role.name)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.globalEmail,
          name: user.name,
          username: user.globalUsername,
          status: user.globalStatus,
          roles,
        },
        session: {
          token: session.sessionToken,
          expiresAt: session.expires,
        },
        message: 'Login successful',
      }
    }),

  /**
   * User logout
   * @description 用户登出，删除当前会话
   * @since 2025-06-20
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // 删除当前会话
      if (ctx.session?.id) {
        await db.session.delete({
          where: {
            id: ctx.session.id,
          },
        })
      }

      return {
        success: true,
        message: 'Logout successful',
      }
    }),

  /**
   * Get current session info
   * @description 获取当前会话信息
   * @since 2025-06-20
   */
  session: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        user: {
          id: ctx.user.id,
          email: ctx.user.globalEmail,
          name: ctx.user.name,
          username: ctx.user.globalUsername,
          status: ctx.user.globalStatus,
        },
        session: ctx.session ? {
          id: ctx.session.id,
          expiresAt: ctx.session.expires,
          createdAt: ctx.session.createdAt,
        } : null,
      }
    }),

  /**
   * Refresh session
   * @description 刷新会话，延长过期时间
   * @since 2025-06-20
   */
  refresh: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.session) {
        throw new Error('No active session found')
      }

      // 延长会话过期时间
      const newExpiry = generateSessionExpiry(30)

      const updatedSession = await db.session.update({
        where: {
          id: ctx.session.id,
        },
        data: {
          expires: newExpiry,
          metadata: {
            ...ctx.session.metadata,
            lastRefreshed: new Date().toISOString(),
          },
        },
      })

      return {
        success: true,
        session: {
          token: updatedSession.sessionToken,
          expiresAt: updatedSession.expires,
        },
        message: 'Session refreshed',
      }
    }),
})
