/**
 * tRPC 路由器创建工具
 */

import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

import type { Context } from './context'
import type { AuthMiddlewareOptions } from './types'

/**
 * 创建 tRPC 实例
 */
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      code: error.code,
      timestamp: new Date().toISOString(),
      traceId: generateTraceId(),
      details: error.cause
    }
  })
})

/**
 * 导出路由器和过程创建器
 */
export const router = t.router
export const procedure = t.procedure
export const middleware = t.middleware

/**
 * 认证中间件
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user // 确保用户已认证
    }
  })
})

/**
 * 权限检查中间件
 */
export const permissionMiddleware = (resource: string, action: string) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    if (!ctx.permissionChecker) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Permission checker not available'
      })
    }

    const hasPermission = await ctx.permissionChecker.hasPermission(
      ctx.user.id,
      resource,
      action
    )

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission denied: ${resource}:${action}`
      })
    }

    return next()
  })

/**
 * 角色检查中间件
 */
export const roleMiddleware = (roles: string[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    const userRoles = ctx.user.roles || []
    const hasRole = roles.some(role => userRoles.includes(role))

    if (!hasRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Required roles: ${roles.join(', ')}`
      })
    }

    return next()
  })

/**
 * 租户检查中间件 (多租户支持)
 */
export const tenantMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tenant context required'
    })
  }

  return next()
})

/**
 * 受保护的过程 (需要认证)
 */
export const protectedProcedure = procedure.use(authMiddleware)

/**
 * 管理员过程 (需要管理员角色)
 */
export const adminProcedure = procedure
  .use(authMiddleware)
  .use(roleMiddleware(['admin']))

/**
 * 创建带权限检查的过程
 */
export const createPermissionProcedure = (resource: string, action: string) =>
  procedure
    .use(authMiddleware)
    .use(permissionMiddleware(resource, action))

/**
 * 创建多租户过程
 */
export const tenantProcedure = procedure
  .use(authMiddleware)
  .use(tenantMiddleware)

/**
 * 生成追踪 ID
 */
function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * 创建 tRPC 路由器的便捷函数
 */
export function createTRPCRouter() {
  return {
    router,
    procedure,
    protectedProcedure,
    adminProcedure,
    tenantProcedure,
    createPermissionProcedure,
    middleware: {
      auth: authMiddleware,
      permission: permissionMiddleware,
      role: roleMiddleware,
      tenant: tenantMiddleware
    }
  }
}
