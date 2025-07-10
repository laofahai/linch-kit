/**
 * Type definitions for platform tRPC module
 * @module platform/trpc/types
 */

import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * tRPC操作类型
 */
export type TRPCOperation = 'query' | 'mutation' | 'subscription'

/**
 * tRPC上下文
 */
export interface TRPCContext {
  req?: {
    headers: Record<string, string>
    url: string
    method: string
    body?: unknown
    ip?: string
    userAgent?: string
  }
  res?: {
    headers: Record<string, string>
    status: number
    setHeader: (name: string, value: string) => void
    json: (data: unknown) => void
  }
  user?: {
    id: string
    email?: string
    role: string
    permissions: string[]
    metadata?: Record<string, unknown>
  }
  session?: {
    id: string
    data: Record<string, unknown>
    save: () => Promise<void>
    destroy: () => Promise<void>
  }
  extensionContext?: ExtensionContext
  metadata: Record<string, unknown>
}

/**
 * tRPC错误代码
 */
export type TRPCErrorCode =
  | 'PARSE_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR'

/**
 * tRPC错误
 */
export interface TRPCError {
  code: TRPCErrorCode
  message: string
  data?: {
    code?: string
    httpStatus?: number
    stack?: string
    path?: string
    [key: string]: unknown
  }
}

/**
 * tRPC输入验证器
 */
export interface TRPCInputValidator<T = unknown> {
  parse: (input: unknown) => T
  safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: unknown }
}

/**
 * tRPC输出转换器
 */
export interface TRPCOutputTransformer<T = unknown, R = unknown> {
  serialize: (data: T) => R
  deserialize: (data: R) => T
}

/**
 * tRPC过程定义
 */
export interface TRPCProcedure<
  TInput = unknown,
  TOutput = unknown,
  TContext extends TRPCContext = TRPCContext,
> {
  type: TRPCOperation
  input?: TRPCInputValidator<TInput>
  output?: TRPCOutputTransformer<TOutput>
  meta?: {
    description?: string
    tags?: string[]
    deprecated?: boolean
    version?: string
    examples?: Array<{
      input: TInput
      output: TOutput
      description?: string
    }>
  }
  resolve: (options: {
    input: TInput
    ctx: TContext
    type: TRPCOperation
    path: string
  }) => Promise<TOutput> | TOutput
}

/**
 * tRPC路由定义
 */
export interface TRPCRouter {
  [key: string]: TRPCProcedure | TRPCRouter
}

/**
 * tRPC路由器配置
 */
export interface TRPCRouterConfig {
  prefix?: string
  middleware?: Array<(ctx: TRPCContext, next: () => Promise<unknown>) => Promise<unknown>>
  errorHandler?: (error: TRPCError, ctx: TRPCContext) => TRPCError
  transformer?: {
    input?: TRPCOutputTransformer
    output?: TRPCOutputTransformer
  }
  meta?: {
    description?: string
    version?: string
    tags?: string[]
  }
}

/**
 * tRPC批量请求
 */
export interface TRPCBatchRequest {
  id: string
  method: string
  params: {
    path: string
    input?: unknown
  }
}

/**
 * tRPC批量响应
 */
export interface TRPCBatchResponse {
  id: string
  result?: {
    data: unknown
  }
  error?: TRPCError
}

/**
 * tRPC订阅配置
 */
export interface TRPCSubscriptionConfig {
  interval?: number
  bufferSize?: number
  onConnect?: (ctx: TRPCContext) => void | Promise<void>
  onDisconnect?: (ctx: TRPCContext) => void | Promise<void>
  onError?: (error: Error, ctx: TRPCContext) => void
}

/**
 * tRPC WebSocket消息
 */
export interface TRPCWebSocketMessage {
  id: string
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'complete'
  payload?: {
    path?: string
    input?: unknown
    data?: unknown
    error?: TRPCError
  }
}

/**
 * tRPC客户端选项
 */
export interface TRPCClientOptions {
  url: string
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  retryDelay?: number
  transformer?: {
    serialize: (data: unknown) => string
    deserialize: (data: string) => unknown
  }
  batch?: {
    enabled: boolean
    maxSize?: number
    timeout?: number
  }
  subscription?: {
    enabled: boolean
    websocketUrl?: string
    reconnect?: boolean
    reconnectDelay?: number
    maxReconnectAttempts?: number
  }
}

/**
 * tRPC服务器选项
 */
export interface TRPCServerOptions {
  router: TRPCRouter
  createContext?: (req: unknown, res: unknown) => TRPCContext | Promise<TRPCContext>
  onError?: (opts: {
    error: TRPCError
    type: TRPCOperation
    path: string
    input: unknown
    ctx: TRPCContext
    req: unknown
  }) => void
  batching?: {
    enabled: boolean
    maxBatchSize?: number
  }
  allowMethodOverride?: boolean
  responseMeta?: (opts: {
    data: unknown[]
    ctx: TRPCContext
    paths: string[]
    type: TRPCOperation
    errors: TRPCError[]
  }) => Record<string, string>
}

/**
 * tRPC中间件选项
 */
export interface TRPCMiddlewareOptions {
  auth?: {
    required?: boolean
    roles?: string[]
    permissions?: string[]
  }
  rateLimit?: {
    maxRequests: number
    windowMs: number
    keyGenerator?: (ctx: TRPCContext) => string
  }
  cache?: {
    enabled: boolean
    ttl: number
    keyGenerator?: (ctx: TRPCContext, input: unknown) => string
    storage?: 'memory' | 'redis'
  }
  cors?: {
    origin: string | string[]
    credentials?: boolean
    methods?: string[]
    headers?: string[]
  }
  logging?: {
    enabled: boolean
    level?: 'debug' | 'info' | 'warn' | 'error'
    includeInput?: boolean
    includeOutput?: boolean
  }
}

/**
 * tRPC路由元数据
 */
export interface TRPCRouteMetadata {
  path: string
  type: TRPCOperation
  description?: string
  tags?: string[]
  deprecated?: boolean
  version?: string
  auth?: {
    required: boolean
    roles?: string[]
    permissions?: string[]
  }
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  cache?: {
    enabled: boolean
    ttl: number
  }
  examples?: Array<{
    name: string
    input: unknown
    output: unknown
    description?: string
  }>
}

/**
 * tRPC性能指标
 */
export interface TRPCMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  byPath: Record<
    string,
    {
      count: number
      errors: number
      averageTime: number
      lastCalled: Date
    }
  >
  byUser: Record<
    string,
    {
      count: number
      errors: number
      lastActive: Date
    }
  >
}

/**
 * tRPC健康检查结果
 */
export interface TRPCHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: Date
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  routes: {
    total: number
    healthy: number
    unhealthy: number
  }
  errors: string[]
  warnings: string[]
}

/**
 * tRPC文档生成选项
 */
export interface TRPCDocumentationOptions {
  title?: string
  description?: string
  version?: string
  servers?: Array<{
    url: string
    description?: string
  }>
  tags?: Array<{
    name: string
    description?: string
  }>
  includeExamples?: boolean
  includeSchemas?: boolean
  format?: 'openapi' | 'markdown' | 'html'
  theme?: 'default' | 'dark' | 'minimal'
}

/**
 * tRPC安全选项
 */
export interface TRPCSecurityOptions {
  cors?: {
    enabled: boolean
    origin: string | string[]
    credentials?: boolean
  }
  csrf?: {
    enabled: boolean
    cookieName?: string
    headerName?: string
  }
  rateLimit?: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
  auth?: {
    required: boolean
    allowAnonymous?: string[]
    tokenValidation?: (token: string) => Promise<{ valid: boolean; user?: unknown }>
  }
  encryption?: {
    enabled: boolean
    algorithm?: string
    key?: string
  }
}

/**
 * tRPC插件接口
 */
export interface TRPCPlugin {
  name: string
  version?: string
  install: (router: TRPCRouter, options?: Record<string, unknown>) => void | Promise<void>
  uninstall?: (router: TRPCRouter) => void | Promise<void>
  dependencies?: string[]
  meta?: {
    description?: string
    author?: string
    homepage?: string
  }
}
