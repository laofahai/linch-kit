/**
 * 通用基础类型定义
 * @module types/common
 */

/**
 * 基础配置项接口
 */
export interface BaseConfig {
  [key: string]: unknown
}

/**
 * 环境类型
 */
export type Environment = 'development' | 'production' | 'test'

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * 生命周期阶段
 */
export type LifecyclePhase = 'init' | 'setup' | 'start' | 'ready' | 'stop' | 'destroy'

/**
 * 多租户上下文
 */
export interface TenantContext {
  tenantId: string
  userId?: string
  permissions?: string[]
  metadata?: Record<string, unknown>
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  code: string
  message: string
  details?: Record<string, unknown>
  stack?: string
}

/**
 * 健康检查结果
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message?: string
  details?: Record<string, unknown>
  timestamp: number
}

/**
 * 操作结果
 */
export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: ErrorInfo
  message?: string
}

/**
 * 异步操作结果
 */
export type AsyncOperationResult<T = unknown> = Promise<OperationResult<T>>