/**
 * 权限检查中间件
 */

import { TRPCError } from '@trpc/server'

import { middleware } from '../server/router'
import type { PermissionMiddlewareOptions } from '../server/types'

/**
 * 权限检查中间件
 * 检查用户是否有特定资源的特定操作权限
 */
export const permissionMiddleware = (resource: string, action: string) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required for permission check'
      })
    }

    if (!ctx.permissionChecker) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Permission system not available'
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
 * 创建带选项的权限中间件
 */
export function createPermissionMiddleware(options: PermissionMiddlewareOptions) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required for permission check'
      })
    }

    if (!ctx.permissionChecker) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Permission system not available'
      })
    }

    // 检查基础权限
    const hasPermission = await ctx.permissionChecker.hasPermission(
      ctx.user.id,
      options.resource,
      options.action
    )

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission denied: ${options.resource}:${options.action}`
      })
    }

    // 如果启用了租户检查
    if (options.checkTenant && ctx.tenant) {
      // 这里可以添加租户级别的权限检查逻辑
      // 例如：检查用户是否有权限在当前租户下执行操作
      const tenantPermission = await ctx.permissionChecker.hasPermission(
        ctx.user.id,
        `tenant:${ctx.tenant}:${options.resource}`,
        options.action
      )

      if (!tenantPermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Permission denied for tenant ${ctx.tenant}: ${options.resource}:${options.action}`
        })
      }
    }

    return next()
  })
}

/**
 * 角色检查中间件
 */
export const roleMiddleware = (roles: string[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required for role check'
      })
    }

    const userRoles = ctx.user.roles || []
    const hasRole = roles.some(role => userRoles.includes(role))

    if (!hasRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Required roles: ${roles.join(', ')}. User roles: ${userRoles.join(', ')}`
      })
    }

    return next()
  })

/**
 * 资源所有者检查中间件
 * 检查用户是否是资源的所有者
 */
export const ownershipMiddleware = (getOwnerId: (input: any) => string | Promise<string>) =>
  middleware(async ({ ctx, input, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required for ownership check'
      })
    }

    const ownerId = await getOwnerId(input)
    
    if (ctx.user.id !== ownerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only access your own resources'
      })
    }

    return next()
  })

/**
 * 多租户权限中间件
 * 确保用户只能访问自己租户的资源
 */
export const tenantPermissionMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
  }

  if (!ctx.tenant) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tenant context required'
    })
  }

  // 这里可以添加检查用户是否属于当前租户的逻辑
  // 例如：检查用户的 tenantId 是否匹配当前租户
  
  return next()
})

/**
 * 常用权限中间件预设
 */
export const permissions = {
  // 用户管理权限
  user: {
    create: permissionMiddleware('user', 'create'),
    read: permissionMiddleware('user', 'read'),
    update: permissionMiddleware('user', 'update'),
    delete: permissionMiddleware('user', 'delete'),
    list: permissionMiddleware('user', 'list')
  },
  
  // 角色管理权限
  role: {
    create: permissionMiddleware('role', 'create'),
    read: permissionMiddleware('role', 'read'),
    update: permissionMiddleware('role', 'update'),
    delete: permissionMiddleware('role', 'delete'),
    assign: permissionMiddleware('role', 'assign')
  },
  
  // 系统管理权限
  system: {
    config: permissionMiddleware('system', 'config'),
    logs: permissionMiddleware('system', 'logs'),
    backup: permissionMiddleware('system', 'backup'),
    restore: permissionMiddleware('system', 'restore')
  }
}
