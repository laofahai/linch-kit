/**
 * Auth Router Factory - 简化版本避免循环依赖
 * @module platform/trpc/auth-router-factory
 */

import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

import type { TRPCContext } from './types'

/**
 * 认证路由工厂配置
 */
export interface AuthRouterFactoryOptions {
  /** Extension 上下文 */
  extensionContext?: ExtensionContext
  /** JWT 密钥 */
  jwtSecret?: string
  /** 会话配置 */
  session?: {
    ttl: number
    refreshThreshold: number
  }
}

/**
 * 创建认证路由器工厂
 *
 * 注意：这是简化实现，避免与 @linch-kit/auth 循环依赖
 * 完整的认证功能应使用 @linch-kit/auth 包
 */
export function createAuthRouterFactory(options: AuthRouterFactoryOptions = {}) {
  const { extensionContext, session = { ttl: 3600, refreshThreshold: 300 } } = options
  const t = initTRPC.context<TRPCContext>().create()

  return t.router({
    /**
     * 获取当前用户信息
     */
    me: t.procedure.query(({ ctx }) => {
      if (!ctx.user) {
        throw new Error('Not authenticated')
      }

      extensionContext?.logger.info('User info requested', { userId: ctx.user.id })
      return {
        success: true,
        data: ctx.user,
      }
    }),

    /**
     * 刷新令牌
     */
    refresh: t.procedure
      .input(
        z.object({
          refreshToken: z.string(),
        })
      )
      .mutation(async ({ ctx }) => {
        try {
          // 简化的令牌刷新逻辑
          // 实际应用中应该验证 refreshToken

          if (!ctx.user) {
            throw new Error('Invalid refresh token')
          }

          // 生成新的访问令牌（简化版本）
          const newToken = `new-token-${Date.now()}`

          extensionContext?.logger.info('Token refreshed', { userId: ctx.user.id })

          return {
            success: true,
            data: {
              accessToken: newToken,
              expiresIn: session.ttl,
              user: ctx.user,
            },
          }
        } catch (error) {
          extensionContext?.logger.error('Token refresh failed', error)
          throw new Error('Token refresh failed')
        }
      }),

    /**
     * 登出
     */
    logout: t.procedure.mutation(async ({ ctx }) => {
      if (ctx.session) {
        await ctx.session.destroy()
      }

      extensionContext?.logger.info('User logged out', { userId: ctx.user?.id })

      return {
        success: true,
        message: 'Logged out successfully',
      }
    }),

    /**
     * 检查会话状态
     */
    session: t.procedure.query(({ ctx }) => {
      const isAuthenticated = !!ctx.user

      return {
        success: true,
        data: {
          isAuthenticated,
          user: ctx.user || null,
          sessionId: ctx.session?.id || null,
        },
      }
    }),

    /**
     * 获取用户权限
     */
    permissions: t.procedure.query(({ ctx }) => {
      if (!ctx.user) {
        throw new Error('Not authenticated')
      }

      return {
        success: true,
        data: {
          permissions: ctx.user.permissions || [],
          role: ctx.user.role,
        },
      }
    }),
  })
}

/**
 * 简化的认证中间件
 */
export function createAuthMiddleware(options: AuthRouterFactoryOptions = {}) {
  const { extensionContext } = options
  const t = initTRPC.context<TRPCContext>().create()

  return t.middleware(({ ctx, next }) => {
    // 简化的认证检查
    const authHeader = ctx.req?.headers['authorization']

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)

      // 简化的令牌验证（实际应该调用真正的认证服务）
      if (token && token !== 'invalid') {
        ctx.user = {
          id: 'user-from-token',
          role: 'user',
          permissions: ['read', 'write'],
        }

        extensionContext?.logger.debug('User authenticated via token')
      }
    }

    return next()
  })
}
