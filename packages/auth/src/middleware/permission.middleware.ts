/**
 * @linch-kit/auth 权限中间件
 * 提供便捷的权限检查功能
 */

// 使用通用的 Request 类型避免依赖 Next.js
type Request = any
import { EnhancedPermissionEngine } from '../permissions/enhanced-permission-engine'
import type { LinchKitUser, PermissionContext } from '../types'

/**
 * 权限中间件配置
 */
export interface PermissionMiddlewareConfig {
  /**
   * 获取当前用户的函数
   */
  getUser: (request: Request) => Promise<LinchKitUser | null>
  
  /**
   * 权限引擎实例
   */
  permissionEngine?: EnhancedPermissionEngine
  
  /**
   * 获取权限上下文的函数
   */
  getContext?: (request: Request) => Promise<PermissionContext | undefined>
  
  /**
   * 未认证时的重定向路径
   */
  unauthorizedRedirect?: string
  
  /**
   * 无权限时的重定向路径
   */
  forbiddenRedirect?: string
  
  /**
   * 是否返回 JSON 响应而不是重定向
   */
  jsonResponse?: boolean
}

/**
 * 权限检查选项
 */
export interface PermissionCheckOptions {
  action: string
  subject: string | any
  /**
   * 是否检查字段级权限
   */
  checkFields?: boolean
  /**
   * 需要的字段列表
   */
  requiredFields?: string[]
}

/**
 * 创建权限检查中间件
 */
export function createPermissionMiddleware(config: PermissionMiddlewareConfig) {
  const engine = config.permissionEngine || new EnhancedPermissionEngine()
  
  return async function checkPermission(
    request: Request,
    options: PermissionCheckOptions
  ): Promise<{
    allowed: boolean
    user?: LinchKitUser
    reason?: string
    allowedFields?: string[]
    deniedFields?: string[]
  }> {
    // 获取当前用户
    const user = await config.getUser(request)
    
    if (!user) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      }
    }
    
    // 获取权限上下文
    const context = config.getContext ? await config.getContext(request) : undefined
    
    // 执行权限检查
    const result = await engine.checkEnhanced(
      user,
      options.action,
      options.subject,
      context
    )
    
    // 检查字段级权限
    if (options.checkFields && options.requiredFields && result.granted) {
      const hasAllFields = options.requiredFields.every(field => 
        result.allowedFields?.includes(field) && 
        !result.deniedFields?.includes(field)
      )
      
      if (!hasAllFields) {
        return {
          allowed: false,
          user,
          reason: 'Missing required field permissions',
          allowedFields: result.allowedFields,
          deniedFields: result.deniedFields
        }
      }
    }
    
    return {
      allowed: result.granted,
      user,
      reason: result.reason,
      allowedFields: result.allowedFields,
      deniedFields: result.deniedFields
    }
  }
}

/**
 * Express/Connect 风格的中间件
 */
export function permissionMiddleware(
  config: PermissionMiddlewareConfig & PermissionCheckOptions
) {
  const checkPermission = createPermissionMiddleware(config)
  
  return async (req: any, res: any, next: any) => {
    const result = await checkPermission(req, {
      action: config.action,
      subject: config.subject,
      checkFields: config.checkFields,
      requiredFields: config.requiredFields
    })
    
    if (!result.allowed) {
      if (config.jsonResponse) {
        return res.status(result.user ? 403 : 401).json({
          error: result.reason || 'Permission denied',
          allowedFields: result.allowedFields,
          deniedFields: result.deniedFields
        })
      }
      
      const redirectPath = result.user 
        ? config.forbiddenRedirect || '/forbidden'
        : config.unauthorizedRedirect || '/login'
      
      return res.redirect(redirectPath)
    }
    
    // 将权限结果附加到请求对象
    req.permission = result
    next()
  }
}

/**
 * 装饰器风格的权限检查（用于 tRPC 路由）
 */
export function requirePermission(options: PermissionCheckOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const ctx = args[0] // tRPC context
      
      if (!ctx.user) {
        throw new Error('Unauthorized')
      }
      
      const engine = new EnhancedPermissionEngine()
      const result = await engine.checkEnhanced(
        ctx.user,
        options.action,
        options.subject,
        ctx.permissionContext
      )
      
      if (!result.granted) {
        throw new Error(result.reason || 'Permission denied')
      }
      
      // 将权限结果添加到上下文
      ctx.permission = result
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

/**
 * React Hook 风格的权限检查
 */
export function createUsePermission(config: {
  getUser: () => LinchKitUser | null
  permissionEngine?: EnhancedPermissionEngine
  getContext?: () => PermissionContext | undefined
}) {
  const engine = config.permissionEngine || new EnhancedPermissionEngine()
  
  return function usePermission(options: PermissionCheckOptions) {
    const [result, setResult] = useState({
      loading: true,
      allowed: false,
      allowedFields: undefined as string[] | undefined,
      deniedFields: undefined as string[] | undefined
    })
    
    useEffect(() => {
      const checkPermission = async () => {
        const user = config.getUser()
        
        if (!user) {
          setResult({ loading: false, allowed: false })
          return
        }
        
        const context = config.getContext?.()
        const permissionResult = await engine.checkEnhanced(
          user,
          options.action,
          options.subject,
          context
        )
        
        setResult({
          loading: false,
          allowed: permissionResult.granted,
          allowedFields: permissionResult.allowedFields,
          deniedFields: permissionResult.deniedFields
        })
      }
      
      checkPermission()
    }, [options.action, options.subject])
    
    return result
  }
}

// React imports for hook (will be tree-shaken if not used)
let useState: any
let useEffect: any

try {
  const React = require('react')
  useState = React.useState
  useEffect = React.useEffect
} catch {
  // React not available, hooks won't work
}