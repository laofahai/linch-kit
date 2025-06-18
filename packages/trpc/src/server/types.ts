/**
 * tRPC 核心类型定义
 */

import type { inferRouterInputs, inferRouterOutputs, AnyRouter } from '@trpc/server'
import type { Context } from './context'

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
