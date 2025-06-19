/**
 * @linch-kit/auth-core 与 tRPC 集成工具
 */

import { TRPCError } from '@trpc/server'

import { middleware } from '../server/router'
// 暂时注释掉 auth-core 导入，等待正确的模块解析
// import type {
//   ModularPermissionChecker,
//   PermissionRegistry
// } from '@linch-kit/auth-core'
// import {
//   createModularPermissionChecker,
//   createPermissionRegistry
// } from '@linch-kit/auth-core'

// 临时类型定义，等待 auth-core 集成
interface ModularPermissionChecker {
  hasPermission(userId: string, resource: string, action: string, context?: any): Promise<boolean>
  hasModulePermission(userId: string, module: string, resource: string, action: string, context?: any): Promise<boolean>
  hasRole(userId: string, role: string | string[], context?: any): Promise<boolean>
  getUserPermissions(userId: string, tenantId?: string): Promise<any>
  getUserModulePermissions(userId: string, module: string, tenantId?: string): Promise<any>
  getUserAccessibleModules(userId: string, tenantId?: string): Promise<string[]>
}

interface PermissionRegistry {
  registerModule(definition: any): Promise<void>
  getModulePermissions(moduleName: string): Promise<any>
  getRegisteredModules(): Promise<any[]>
}

// 临时实现函数
function createPermissionRegistry(): PermissionRegistry {
  return {
    async registerModule(definition: any) {
      console.log('Temporary: registerModule called', definition.moduleName)
    },
    async getModulePermissions(moduleName: string) {
      return null
    },
    async getRegisteredModules() {
      return []
    }
  }
}

function createModularPermissionChecker(registry: PermissionRegistry): ModularPermissionChecker {
  return {
    async hasPermission(userId: string, resource: string, action: string, context?: any) {
      console.log('Temporary: hasPermission called', { userId, resource, action })
      return true // 临时返回 true
    },
    async hasModulePermission(userId: string, module: string, resource: string, action: string, context?: any) {
      console.log('Temporary: hasModulePermission called', { userId, module, resource, action })
      return true // 临时返回 true
    },
    async hasRole(userId: string, role: string | string[], context?: any) {
      console.log('Temporary: hasRole called', { userId, role })
      return true // 临时返回 true
    },
    async getUserPermissions(userId: string, tenantId?: string) {
      return {}
    },
    async getUserModulePermissions(userId: string, module: string, tenantId?: string) {
      return {}
    },
    async getUserAccessibleModules(userId: string, tenantId?: string) {
      return []
    }
  }
}
import type { Context } from '../server/context'

/**
 * Auth Core 集成配置
 */
export interface AuthCoreIntegrationConfig {
  /** 权限注册表 */
  permissionRegistry?: PermissionRegistry
  /** 权限检查器 */
  permissionChecker?: ModularPermissionChecker
  /** 获取用户ID的函数 */
  getUserId?: (ctx: Context) => string | null
  /** 获取租户ID的函数 */
  getTenantId?: (ctx: Context) => string | null
  /** 是否在开发环境跳过权限检查 */
  skipInDevelopment?: boolean
  /** 权限检查失败时的错误消息 */
  unauthorizedMessage?: string
}

/**
 * 权限要求定义
 */
export interface PermissionRequirement {
  /** 模块名称 */
  module?: string
  /** 资源名称 */
  resource: string
  /** 操作名称 */
  action: string
  /** 是否可选（如果没有权限不会抛出错误） */
  optional?: boolean
}

/**
 * 创建 Auth Core 集成
 */
export function createAuthCoreIntegration(config: AuthCoreIntegrationConfig = {}) {
  // 使用提供的或创建默认的权限注册表
  const registry = config.permissionRegistry || createPermissionRegistry()
  
  // 使用提供的或创建默认的权限检查器
  const permissionChecker = config.permissionChecker || createModularPermissionChecker(registry)
  
  // 默认的用户ID获取函数
  const getUserId = config.getUserId || ((ctx: Context) => ctx.user?.id || null)
  
  // 默认的租户ID获取函数
  const getTenantId = config.getTenantId || ((ctx: Context) => ctx.tenant || null)

  /**
   * 模块权限中间件
   */
  const modulePermissionMiddleware = (
    moduleName: string,
    resource: string,
    action: string,
    optional: boolean = false
  ) => middleware(async ({ ctx, next }) => {
    // 开发环境跳过检查
    if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next()
    }

    const userId = getUserId(ctx)
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    const tenantId = getTenantId(ctx)
    
    const hasPermission = await permissionChecker.hasModulePermission(
      userId,
      moduleName,
      resource,
      action,
      { tenantId, ctx }
    )

    if (!hasPermission && !optional) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: config.unauthorizedMessage || 
          `Insufficient permissions: ${moduleName}.${resource}:${action}`
      })
    }

    // 将权限检查结果添加到上下文
    ctx.permissions = ctx.permissions || {}
    ctx.permissions[`${moduleName}.${resource}.${action}`] = hasPermission

    return next()
  })

  /**
   * 基础权限中间件
   */
  const permissionMiddleware = (
    resource: string,
    action: string,
    optional: boolean = false
  ) => middleware(async ({ ctx, next }) => {
    // 开发环境跳过检查
    if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next()
    }

    const userId = getUserId(ctx)
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    const tenantId = getTenantId(ctx)
    
    const hasPermission = await permissionChecker.hasPermission(
      userId,
      resource,
      action,
      { tenantId, ctx }
    )

    if (!hasPermission && !optional) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: config.unauthorizedMessage || 
          `Insufficient permissions: ${resource}:${action}`
      })
    }

    // 将权限检查结果添加到上下文
    ctx.permissions = ctx.permissions || {}
    ctx.permissions[`${resource}.${action}`] = hasPermission

    return next()
  })

  /**
   * 角色中间件
   */
  const roleMiddleware = (roles: string | string[]) => middleware(async ({ ctx, next }) => {
    // 开发环境跳过检查
    if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next()
    }

    const userId = getUserId(ctx)
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    const tenantId = getTenantId(ctx)
    
    const hasRole = await permissionChecker.hasRole(userId, roles, { tenantId, ctx })

    if (!hasRole) {
      const roleNames = Array.isArray(roles) ? roles.join(', ') : roles
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: config.unauthorizedMessage || 
          `Insufficient role permissions. Required: ${roleNames}`
      })
    }

    return next()
  })

  /**
   * 复合权限中间件 - 支持多种权限要求
   */
  const requirePermissions = (requirements: PermissionRequirement | PermissionRequirement[]) => 
    middleware(async ({ ctx, next }) => {
      // 开发环境跳过检查
      if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
        return next()
      }

      const userId = getUserId(ctx)
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        })
      }

      const tenantId = getTenantId(ctx)
      const reqs = Array.isArray(requirements) ? requirements : [requirements]

      // 检查所有权限要求
      for (const req of reqs) {
        const hasPermission = req.module
          ? await permissionChecker.hasModulePermission(
              userId,
              req.module,
              req.resource,
              req.action,
              { tenantId, ctx }
            )
          : await permissionChecker.hasPermission(
              userId,
              req.resource,
              req.action,
              { tenantId, ctx }
            )

        if (!hasPermission && !req.optional) {
          const resourceName = req.module ? `${req.module}.${req.resource}` : req.resource
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: config.unauthorizedMessage || 
              `Insufficient permissions: ${resourceName}:${req.action}`
          })
        }

        // 将权限检查结果添加到上下文
        ctx.permissions = ctx.permissions || {}
        const permissionKey = req.module 
          ? `${req.module}.${req.resource}.${req.action}`
          : `${req.resource}.${req.action}`
        ctx.permissions[permissionKey] = hasPermission
      }

      return next()
    })

  /**
   * 权限上下文助手
   */
  const permissionHelpers = {
    /**
     * 检查当前用户权限
     */
    async checkPermission(
      ctx: Context,
      resource: string,
      action: string,
      module?: string
    ): Promise<boolean> {
      const userId = getUserId(ctx)
      if (!userId) return false

      const tenantId = getTenantId(ctx)
      
      return module
        ? permissionChecker.hasModulePermission(userId, module, resource, action, { tenantId, ctx })
        : permissionChecker.hasPermission(userId, resource, action, { tenantId, ctx })
    },

    /**
     * 获取用户权限摘要
     */
    async getUserPermissions(ctx: Context, module?: string) {
      const userId = getUserId(ctx)
      if (!userId) return {}

      const tenantId = getTenantId(ctx)
      
      return module
        ? permissionChecker.getUserModulePermissions(userId, module, tenantId || undefined)
        : permissionChecker.getUserPermissions(userId, tenantId || undefined)
    },

    /**
     * 获取用户可访问的模块
     */
    async getUserAccessibleModules(ctx: Context) {
      const userId = getUserId(ctx)
      if (!userId) return []

      const tenantId = getTenantId(ctx)
      
      return permissionChecker.getUserAccessibleModules(userId, tenantId || undefined)
    }
  }

  return {
    // 权限注册表
    registry,
    
    // 权限检查器
    permissionChecker,
    
    // 中间件
    middleware: {
      modulePermission: modulePermissionMiddleware,
      permission: permissionMiddleware,
      role: roleMiddleware,
      requirePermissions
    },
    
    // 权限助手
    helpers: permissionHelpers,
    
    // 便捷方法
    requireModulePermission: modulePermissionMiddleware,
    requirePermission: permissionMiddleware,
    requireRole: roleMiddleware,
    requirePermissions
  }
}
