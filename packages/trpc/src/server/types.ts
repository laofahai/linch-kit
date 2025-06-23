/**
 * tRPC 核心类型定义
 */

import type { inferRouterInputs, inferRouterOutputs, AnyRouter } from '@trpc/server'

import type { Context } from './context'

// 临时类型定义，等待 auth 正确集成
// TODO: 当 auth 模块解析正确后，替换为真实的导入

/**
 * 基础用户类型
 */
export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  roles?: string[]
  [key: string]: any
}

/**
 * 会话类型
 */
export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
  [key: string]: any
}

/**
 * 权限检查器接口
 */
export interface PermissionChecker {
  hasPermission(userId: string, resource: string, action: string, context?: any): Promise<boolean>
  hasRole(userId: string, role: string | string[], context?: any): Promise<boolean>
  getUserPermissions(userId: string, tenantId?: string): Promise<any>
}

/**
 * 基础上下文接口
 */
export interface BaseContext {
  user?: AuthUser | null
  session?: AuthSession | null
  permissions?: Record<string, boolean> | null // 存储权限检查结果
  permissionChecker?: PermissionChecker | null // 权限检查器实例
  tenant?: string | null
}

/**
 * 基础路由器类型
 * 使用泛型来支持任意路由结构
 */
export type AppRouter = AnyRouter

/**
 * 路由输入输出类型推导
 */
export type RouterInputs<T extends AnyRouter = AppRouter> = inferRouterInputs<T>
export type RouterOutputs<T extends AnyRouter = AppRouter> = inferRouterOutputs<T>

/**
 * tRPC 上下文类型
 */
export type TRPCContext = Context

/**
 * API 响应标准格式
 */
export interface APIResponse<T = any> {
  data: T
  success: boolean
  message?: string
  timestamp: string
  traceId?: string
}

/**
 * 错误响应格式
 */
export interface APIError {
  code: string
  message: string
  details?: any
  timestamp: string
  traceId?: string
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * 中间件函数类型
 */
export type MiddlewareFunction<TContext = BaseContext, TInput = any, TOutput = any> = (opts: {
  ctx: TContext
  input: TInput
  next: () => Promise<TOutput>
}) => Promise<TOutput>

/**
 * 认证中间件选项
 */
export interface AuthMiddlewareOptions {
  required?: boolean
  roles?: string[]
  permissions?: string[]
}

/**
 * 权限中间件选项
 */
export interface PermissionMiddlewareOptions {
  resource: string
  action: string
  checkTenant?: boolean
}
