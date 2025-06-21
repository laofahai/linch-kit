/**
 * tRPC 权限中间件
 * 
 * 为 tRPC 提供权限检查中间件，支持模块化权限
 */

import type { ModularPermissionChecker } from '../types/permissions'

/**
 * tRPC 权限中间件配置
 */
export interface TRPCPermissionMiddlewareConfig {
  /** 权限检查器 */
  permissionChecker: ModularPermissionChecker
  /** 获取用户ID的函数 */
  getUserId: (ctx: any) => string | null
  /** 获取租户ID的函数 */
  getTenantId?: (ctx: any) => string | null
  /** 权限检查失败时的错误消息 */
  unauthorizedMessage?: string
  /** 是否在开发环境跳过权限检查 */
  skipInDevelopment?: boolean
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
 * 创建 tRPC 权限中间件
 */
export function createTRPCPermissionMiddleware(config: TRPCPermissionMiddlewareConfig) {
  return function permissionMiddleware(requirement: PermissionRequirement | PermissionRequirement[]) {
    return async function middleware(opts: any) {
      const { ctx, next } = opts
      
      // 开发环境跳过检查
      if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
        return next()
      }
      
      // 获取用户ID
      const userId = config.getUserId(ctx)
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      // 获取租户ID
      const tenantId = config.getTenantId?.(ctx)
      
      // 标准化权限要求
      const requirements = Array.isArray(requirement) ? requirement : [requirement]
      
      // 检查权限
      for (const req of requirements) {
        const hasPermission = req.module
          ? await config.permissionChecker.hasModulePermission(
              userId,
              req.module,
              req.resource,
              req.action,
              { tenantId, ctx }
            )
          : await config.permissionChecker.hasPermission(
              userId,
              req.resource,
              req.action,
              { tenantId, ctx }
            )
        
        if (!hasPermission && !req.optional) {
          const resourceName = req.module ? `${req.module}.${req.resource}` : req.resource
          throw new Error(
            config.unauthorizedMessage || 
            `Insufficient permissions: ${resourceName}:${req.action}`
          )
        }
        
        // 将权限检查结果添加到上下文
        ctx.permissions = ctx.permissions || {}
        const permissionKey = req.module 
          ? `${req.module}.${req.resource}.${req.action}`
          : `${req.resource}.${req.action}`
        ctx.permissions[permissionKey] = hasPermission
      }
      
      return next()
    }
  }
}

/**
 * 权限装饰器工厂
 */
export function createPermissionDecorator(config: TRPCPermissionMiddlewareConfig) {
  const middleware = createTRPCPermissionMiddleware(config)
  
  return {
    /**
     * 要求特定权限
     */
    requirePermission: (requirement: PermissionRequirement | PermissionRequirement[]) => {
      return middleware(requirement)
    },
    
    /**
     * 要求模块权限
     */
    requireModulePermission: (module: string, resource: string, action: string) => {
      return middleware({ module, resource, action })
    },
    
    /**
     * 要求任一权限
     */
    requireAnyPermission: (requirements: PermissionRequirement[]) => {
      return async function middleware(opts: any) {
        const { ctx, next } = opts
        
        // 开发环境跳过检查
        if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
          return next()
        }
        
        const userId = config.getUserId(ctx)
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        const tenantId = config.getTenantId?.(ctx)
        
        // 检查是否有任一权限
        let hasAnyPermission = false
        for (const req of requirements) {
          const hasPermission = req.module
            ? await config.permissionChecker.hasModulePermission(
                userId,
                req.module,
                req.resource,
                req.action,
                { tenantId, ctx }
              )
            : await config.permissionChecker.hasPermission(
                userId,
                req.resource,
                req.action,
                { tenantId, ctx }
              )
          
          if (hasPermission) {
            hasAnyPermission = true
            break
          }
        }
        
        if (!hasAnyPermission) {
          const resourceNames = requirements.map(req => 
            req.module ? `${req.module}.${req.resource}:${req.action}` : `${req.resource}:${req.action}`
          ).join(', ')
          throw new Error(
            config.unauthorizedMessage || 
            `Insufficient permissions. Required any of: ${resourceNames}`
          )
        }
        
        return next()
      }
    },
    
    /**
     * 要求所有权限
     */
    requireAllPermissions: (requirements: PermissionRequirement[]) => {
      return middleware(requirements)
    },
    
    /**
     * 要求角色
     */
    requireRole: (role: string | string[]) => {
      return async function middleware(opts: any) {
        const { ctx, next } = opts
        
        // 开发环境跳过检查
        if (config.skipInDevelopment && process.env.NODE_ENV === 'development') {
          return next()
        }
        
        const userId = config.getUserId(ctx)
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        const tenantId = config.getTenantId?.(ctx)
        
        const hasRole = await config.permissionChecker.hasRole(userId, role, { tenantId, ctx })
        
        if (!hasRole) {
          const roleNames = Array.isArray(role) ? role.join(', ') : role
          throw new Error(
            config.unauthorizedMessage || 
            `Insufficient role permissions. Required: ${roleNames}`
          )
        }
        
        return next()
      }
    }
  }
}

/**
 * 权限上下文助手
 */
export function createPermissionContext(config: TRPCPermissionMiddlewareConfig) {
  return {
    /**
     * 检查当前用户权限
     */
    async checkPermission(
      ctx: any,
      resource: string,
      action: string,
      module?: string
    ): Promise<boolean> {
      const userId = config.getUserId(ctx)
      if (!userId) {
        return false
      }
      
      const tenantId = config.getTenantId?.(ctx)
      
      return module
        ? config.permissionChecker.hasModulePermission(userId, module, resource, action, { tenantId, ctx })
        : config.permissionChecker.hasPermission(userId, resource, action, { tenantId, ctx })
    },
    
    /**
     * 获取用户权限摘要
     */
    async getUserPermissions(ctx: any, module?: string) {
      const userId = config.getUserId(ctx)
      if (!userId) {
        return {}
      }
      
      const tenantId = config.getTenantId?.(ctx)
      
      return module
        ? config.permissionChecker.getUserModulePermissions(userId, module, tenantId || undefined)
        : config.permissionChecker.getUserPermissions(userId, tenantId || undefined)
    },
    
    /**
     * 获取用户可访问的模块
     */
    async getUserAccessibleModules(ctx: any) {
      const userId = config.getUserId(ctx)
      if (!userId) {
        return []
      }
      
      const tenantId = config.getTenantId?.(ctx)
      
      return config.permissionChecker.getUserAccessibleModules(userId, tenantId || undefined)
    }
  }
}

/**
 * 使用示例的类型定义
 */
export interface TRPCPermissionHelpers {
  requirePermission: ReturnType<typeof createPermissionDecorator>['requirePermission']
  requireModulePermission: ReturnType<typeof createPermissionDecorator>['requireModulePermission']
  requireAnyPermission: ReturnType<typeof createPermissionDecorator>['requireAnyPermission']
  requireAllPermissions: ReturnType<typeof createPermissionDecorator>['requireAllPermissions']
  requireRole: ReturnType<typeof createPermissionDecorator>['requireRole']
  checkPermission: ReturnType<typeof createPermissionContext>['checkPermission']
  getUserPermissions: ReturnType<typeof createPermissionContext>['getUserPermissions']
  getUserAccessibleModules: ReturnType<typeof createPermissionContext>['getUserAccessibleModules']
}
