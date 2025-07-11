/**
 * tRPC Middleware for platform package
 * @module platform/trpc/middleware
 */

import type { ExtensionContext } from '@linch-kit/core'

/**
 * tRPC中间件上下文
 */
export interface TRPCMiddlewareContext {
  req?: {
    headers: Record<string, string>
    url: string
    method: string
    body?: unknown
  }
  res?: {
    headers: Record<string, string>
    status: number
  }
  user?: {
    id: string
    role: string
    permissions: string[]
  }
  session?: {
    id: string
    data: Record<string, unknown>
  }
  extensionContext?: ExtensionContext
  metadata: Record<string, unknown>
}

/**
 * tRPC中间件函数类型
 */
export type TRPCMiddleware = (
  context: TRPCMiddlewareContext,
  next: () => Promise<unknown>
) => Promise<unknown>

/**
 * 中间件执行结果
 */
export interface MiddlewareResult {
  success: boolean
  data?: unknown
  error?: Error
  metadata?: Record<string, unknown>
}

/**
 * 中间件管理器
 */
export class MiddlewareManager {
  private middlewares: TRPCMiddleware[] = []
  private extensionContext?: ExtensionContext

  constructor(extensionContext?: ExtensionContext) {
    this.extensionContext = extensionContext
  }

  /**
   * 添加中间件
   */
  use(middleware: TRPCMiddleware): this {
    this.middlewares.push(middleware)
    this.extensionContext?.logger.info('Added tRPC middleware')
    return this
  }

  /**
   * 批量添加中间件
   */
  useMany(middlewares: TRPCMiddleware[]): this {
    this.middlewares.push(...middlewares)
    this.extensionContext?.logger.info(`Added ${middlewares.length} tRPC middlewares`)
    return this
  }

  /**
   * 执行中间件链
   */
  async execute(
    context: TRPCMiddlewareContext,
    handler: () => Promise<unknown>
  ): Promise<MiddlewareResult> {
    let index = 0

    const next = async (): Promise<unknown> => {
      if (index >= this.middlewares.length) {
        return handler()
      }

      const middleware = this.middlewares[index++]
      return middleware(context, next)
    }

    try {
      const result = await next()
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      this.extensionContext?.logger.error('Middleware execution failed', error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  /**
   * 移除所有中间件
   */
  clear(): void {
    this.middlewares = []
    this.extensionContext?.logger.info('Cleared all tRPC middlewares')
  }

  /**
   * 获取中间件数量
   */
  count(): number {
    return this.middlewares.length
  }
}

/**
 * 日志中间件
 */
export const loggingMiddleware: TRPCMiddleware = async (context, next) => {
  const startTime = Date.now()
  const { req, extensionContext } = context

  extensionContext?.logger.info('tRPC request started', {
    method: req?.method,
    url: req?.url,
    userId: context.user?.id,
  })

  try {
    const result = await next()
    const duration = Date.now() - startTime

    extensionContext?.logger.info('tRPC request completed', {
      method: req?.method,
      url: req?.url,
      userId: context.user?.id,
      duration,
      success: true,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    extensionContext?.logger.error('tRPC request failed', {
      method: req?.method,
      url: req?.url,
      userId: context.user?.id,
      duration,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/**
 * 认证中间件
 */
export const authMiddleware: TRPCMiddleware = async (context, next) => {
  const { req, extensionContext } = context

  // 检查认证头
  const authHeader = req?.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.slice(7)

  try {
    // 简化的令牌验证（实际应该调用认证服务）
    if (token === 'invalid') {
      throw new Error('Invalid token')
    }

    // 模拟用户信息解析
    context.user = {
      id: 'user-123',
      role: 'user',
      permissions: ['read', 'write'],
    }

    extensionContext?.logger.info('User authenticated', { userId: context.user.id })

    return next()
  } catch (error) {
    extensionContext?.logger.error('Authentication failed', error)
    throw new Error('Authentication failed')
  }
}

/**
 * 权限中间件
 */
export const permissionMiddleware = (requiredPermissions: string[]): TRPCMiddleware => {
  return async (context, next) => {
    const { user, extensionContext } = context

    if (!user) {
      throw new Error('User not authenticated')
    }

    // 检查用户权限
    const hasPermission = requiredPermissions.every(
      permission => user.permissions.includes(permission) || user.permissions.includes('*')
    )

    if (!hasPermission) {
      extensionContext?.logger.warn('Permission denied', {
        userId: user.id,
        required: requiredPermissions,
        userPermissions: user.permissions,
      })
      throw new Error('Insufficient permissions')
    }

    extensionContext?.logger.info('Permission granted', {
      userId: user.id,
      permissions: requiredPermissions,
    })

    return next()
  }
}

/**
 * 速率限制中间件
 */
export const rateLimitMiddleware = (
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
): TRPCMiddleware => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return async (context, next) => {
    const { user, req, extensionContext } = context
    const key =
      user?.id || req?.headers['x-real-ip'] || req?.headers['x-forwarded-for'] || 'anonymous'
    const now = Date.now()

    // 清理过期记录
    for (const [k, v] of requests.entries()) {
      if (now > v.resetTime) {
        requests.delete(k)
      }
    }

    // 获取或创建请求记录
    let record = requests.get(key)
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
      }
      requests.set(key, record)
    }

    // 检查速率限制
    if (record.count >= options.maxRequests) {
      extensionContext?.logger.warn('Rate limit exceeded', {
        key,
        count: record.count,
        limit: options.maxRequests,
      })
      throw new Error('Rate limit exceeded')
    }

    // 增加请求计数
    record.count++

    // 添加响应头
    if (context.res) {
      context.res.headers['X-Rate-Limit-Limit'] = String(options.maxRequests)
      context.res.headers['X-Rate-Limit-Remaining'] = String(options.maxRequests - record.count)
      context.res.headers['X-Rate-Limit-Reset'] = String(record.resetTime)
    }

    return next()
  }
}

/**
 * 缓存中间件
 */
export const cacheMiddleware = (
  options: { ttl: number; keyGenerator?: (context: TRPCMiddlewareContext) => string } = { ttl: 300 }
): TRPCMiddleware => {
  const cache = new Map<string, { data: unknown; expiresAt: number }>()

  return async (context, next) => {
    const { req, extensionContext } = context

    // 只缓存GET请求
    if (req?.method !== 'GET') {
      return next()
    }

    // 生成缓存键
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(context)
      : `${req?.url || 'unknown'}-${JSON.stringify(req?.body || {})}`

    const now = Date.now()

    // 检查缓存
    const cached = cache.get(cacheKey)
    if (cached && now < cached.expiresAt) {
      extensionContext?.logger.info('Cache hit', { key: cacheKey })

      if (context.res) {
        context.res.headers['X-Cache'] = 'HIT'
      }

      return cached.data
    }

    // 执行请求
    const result = await next()

    // 缓存结果
    cache.set(cacheKey, {
      data: result,
      expiresAt: now + options.ttl * 1000,
    })

    if (context.res) {
      context.res.headers['X-Cache'] = 'MISS'
      context.res.headers['Cache-Control'] = `max-age=${options.ttl}`
    }

    extensionContext?.logger.info('Cache miss, result cached', { key: cacheKey })

    return result
  }
}

/**
 * 错误处理中间件
 */
export const errorHandlingMiddleware: TRPCMiddleware = async (context, next) => {
  const { extensionContext } = context

  try {
    return await next()
  } catch (error) {
    // 记录错误
    extensionContext?.logger.error('tRPC error caught by middleware', error)

    // 触发Extension事件
    extensionContext?.events.emit('trpc:error', {
      error,
      context: {
        method: context.req?.method,
        url: context.req?.url,
        userId: context.user?.id,
      },
    })

    // 转换错误为标准格式
    if (error instanceof Error) {
      throw {
        code: 'INTERNAL_ERROR',
        message: error.message,
        data: {
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      }
    }

    throw {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    }
  }
}

/**
 * CORS中间件
 */
export const corsMiddleware = (
  options: {
    origin?: string | string[]
    credentials?: boolean
    methods?: string[]
    headers?: string[]
  } = {}
): TRPCMiddleware => {
  return async (context, next) => {
    const { req, res } = context

    if (res) {
      // 设置CORS头
      const origin = req?.headers['origin']
      if (origin && options.origin) {
        const allowedOrigins = Array.isArray(options.origin) ? options.origin : [options.origin]
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          res.headers['Access-Control-Allow-Origin'] = origin
        }
      }

      if (options.credentials) {
        res.headers['Access-Control-Allow-Credentials'] = 'true'
      }

      if (options.methods) {
        res.headers['Access-Control-Allow-Methods'] = options.methods.join(', ')
      }

      if (options.headers) {
        res.headers['Access-Control-Allow-Headers'] = options.headers.join(', ')
      }
    }

    return next()
  }
}

/**
 * 创建中间件管理器的便捷函数
 */
export function createMiddlewareManager(extensionContext?: ExtensionContext): MiddlewareManager {
  return new MiddlewareManager(extensionContext)
}

/**
 * 预设中间件组合
 */
export const PresetMiddlewares = {
  /**
   * 基础中间件栈
   */
  basic: [loggingMiddleware, errorHandlingMiddleware],

  /**
   * 安全中间件栈
   */
  secure: [
    loggingMiddleware,
    corsMiddleware({ origin: '*', credentials: true }),
    authMiddleware,
    rateLimitMiddleware(),
    errorHandlingMiddleware,
  ],

  /**
   * 性能优化中间件栈
   */
  performance: [
    loggingMiddleware,
    cacheMiddleware({ ttl: 300 }),
    rateLimitMiddleware({ maxRequests: 1000, windowMs: 60000 }),
    errorHandlingMiddleware,
  ],
}
