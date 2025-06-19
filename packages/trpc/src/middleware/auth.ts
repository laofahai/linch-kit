/**
 * 认证相关中间件
 */

import { TRPCError } from '@trpc/server'

import { middleware } from '../server/router'
import type { AuthMiddlewareOptions } from '../server/types'

/**
 * 基础认证中间件
 * 检查用户是否已登录
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in to continue.'
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user // 确保类型安全
    }
  })
})

/**
 * 可选认证中间件
 * 不强制要求用户登录，但会传递用户信息
 */
export const optionalAuthMiddleware = middleware(async ({ ctx, next }) => {
  // 不检查用户是否存在，直接传递上下文
  return next({ ctx })
})

/**
 * 会话验证中间件
 * 验证会话是否有效且未过期
 */
export const sessionMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Valid session required'
    })
  }

  // 检查会话是否过期
  if (ctx.session.expiresAt && new Date() > ctx.session.expiresAt) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Session has expired. Please log in again.'
    })
  }

  return next()
})

/**
 * 创建带选项的认证中间件
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  return middleware(async ({ ctx, next }) => {
    // 检查是否需要认证
    if (options.required !== false && !ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    // 检查角色要求
    if (options.roles && options.roles.length > 0) {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for role check'
        })
      }

      const userRoles = ctx.user.roles || []
      const hasRequiredRole = options.roles.some(role => userRoles.includes(role))

      if (!hasRequiredRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Required roles: ${options.roles.join(', ')}`
        })
      }
    }

    // 检查权限要求
    if (options.permissions && options.permissions.length > 0) {
      if (!ctx.user || !ctx.permissionChecker) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication and permission system required'
        })
      }

      // 检查是否有任一所需权限
      const hasPermission = await Promise.all(
        options.permissions.map(permission => {
          const [resource, action] = permission.split(':')
          return ctx.permissionChecker!.hasPermission(ctx.user!.id, resource, action)
        })
      )

      if (!hasPermission.some(Boolean)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Required permissions: ${options.permissions.join(', ')}`
        })
      }
    }

    return next()
  })
}

/**
 * 管理员认证中间件
 */
export const adminAuthMiddleware = createAuthMiddleware({
  required: true,
  roles: ['admin', 'super_admin']
})

/**
 * 超级管理员认证中间件
 */
export const superAdminAuthMiddleware = createAuthMiddleware({
  required: true,
  roles: ['super_admin']
})
