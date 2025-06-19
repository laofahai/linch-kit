/**
 * 验证和限流中间件
 */

import { TRPCError } from '@trpc/server'

import { middleware } from '../server/router'

// 临时类型定义，等待 zod 集成
interface ZodSchema<T> {
  safeParse(input: any): { success: true; data: T } | { success: false; error: any }
}

/**
 * 通用验证中间件
 */
export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return middleware(async ({ input, next }) => {
    const result = schema.safeParse(input)

    if (!result.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        cause: {
          error: result.error
        }
      })
    }

    return next({ input: result.data })
  })
}

/**
 * 基础验证中间件
 */
export const validationMiddleware = createValidationMiddleware

/**
 * 简单的内存限流器
 */
class SimpleRateLimiter {
  private requests = new Map<string, number[]>()
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // 获取当前窗口内的请求
    const userRequests = this.requests.get(key) || []
    const validRequests = userRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    // 添加当前请求
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return true
  }
  
  // 清理过期数据
  cleanup() {
    const now = Date.now()
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > now - this.windowMs)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

// 全局限流器实例
const globalRateLimiter = new SimpleRateLimiter(100, 60000) // 每分钟100次请求

// 定期清理过期数据
setInterval(() => globalRateLimiter.cleanup(), 60000)

/**
 * 限流中间件
 */
export function createRateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60000,
  keyGenerator?: (ctx: any) => string
) {
  const rateLimiter = new SimpleRateLimiter(maxRequests, windowMs)
  
  return middleware(async ({ ctx, next }) => {
    // 生成限流键
    const key = keyGenerator 
      ? keyGenerator(ctx)
      : ctx.user?.id || ctx.req?.ip || 'anonymous'
    
    if (!rateLimiter.isAllowed(key)) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`
      })
    }
    
    return next()
  })
}

/**
 * 基础限流中间件 (每分钟100次请求)
 */
export const rateLimitMiddleware = createRateLimitMiddleware()

/**
 * 严格限流中间件 (每分钟10次请求)
 */
export const strictRateLimitMiddleware = createRateLimitMiddleware(10, 60000)

/**
 * 宽松限流中间件 (每分钟1000次请求)
 */
export const relaxedRateLimitMiddleware = createRateLimitMiddleware(1000, 60000)

/**
 * IP 限流中间件
 */
export const ipRateLimitMiddleware = createRateLimitMiddleware(
  200, // 每分钟200次请求
  60000,
  (ctx) => ctx.req?.ip || 'unknown-ip'
)

/**
 * 用户限流中间件
 */
export const userRateLimitMiddleware = createRateLimitMiddleware(
  500, // 每分钟500次请求
  60000,
  (ctx) => ctx.user?.id || 'anonymous'
)

/**
 * 输入大小验证中间件
 */
export const inputSizeMiddleware = (maxSizeBytes: number = 1024 * 1024) => // 默认1MB
  middleware(async ({ input, next }) => {
    const inputSize = JSON.stringify(input).length
    
    if (inputSize > maxSizeBytes) {
      throw new TRPCError({
        code: 'PAYLOAD_TOO_LARGE',
        message: `Input size ${inputSize} bytes exceeds maximum allowed size ${maxSizeBytes} bytes`
      })
    }
    
    return next()
  })

/**
 * 请求日志中间件
 */
export const loggingMiddleware = middleware(async ({ path, type, ctx, next }) => {
  const start = Date.now()
  const userId = ctx.user?.id || 'anonymous'
  
  console.log(`[tRPC] ${type.toUpperCase()} ${path} - User: ${userId}`)
  
  try {
    const result = await next()
    const duration = Date.now() - start
    console.log(`[tRPC] ${type.toUpperCase()} ${path} - Success (${duration}ms)`)
    return result
  } catch (error) {
    const duration = Date.now() - start
    console.error(`[tRPC] ${type.toUpperCase()} ${path} - Error (${duration}ms):`, error)
    throw error
  }
})
