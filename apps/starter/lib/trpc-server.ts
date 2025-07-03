/**
 * tRPC 服务端配置
 * 基于 @linch-kit/trpc 和 @linch-kit/auth 的服务端配置
 */

import { 
  router, 
  publicProcedure, 
  protectedProcedure,
  adminProcedure,
  createTRPCContext,
  healthRouter,
  systemRouter
} from '@linch-kit/trpc/server'
import { Logger } from '@linch-kit/core'
import { z } from 'zod'

/**
 * 用户相关路由
 */
const userRouter = router({
  getProfile: protectedProcedure
    .output(z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      role: z.string(),
      createdAt: z.date(),
    }))
    .query(async ({ ctx }) => {
      Logger.info('获取用户资料', { userId: ctx.user?.id })
      
      // 这里应该从数据库获取用户信息
      // 暂时返回模拟数据
      return {
        id: ctx.user?.id || 'unknown',
        name: ctx.user?.name || '未知用户',
        email: ctx.user?.email || null,
        role: 'user',
        createdAt: new Date(),
      }
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      Logger.info('更新用户资料', { userId: ctx.user?.id, input })
      
      // 这里应该更新数据库中的用户信息
      // 暂时返回成功响应
      return {
        success: true,
        message: '用户资料更新成功',
      }
    }),
})

/**
 * 文章相关路由（示例业务逻辑）
 */
const postRouter = router({
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .output(z.object({
      posts: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
        createdAt: z.date(),
        author: z.object({
          id: z.string(),
          name: z.string().nullable(),
        }),
      })),
      total: z.number(),
    }))
    .query(async ({ input }) => {
      Logger.info('获取文章列表', input)
      
      // 这里应该从数据库获取文章列表
      // 暂时返回模拟数据
      return {
        posts: [
          {
            id: '1',
            title: 'Welcome to LinchKit',
            content: 'This is a sample post created with LinchKit framework.',
            published: true,
            createdAt: new Date(),
            author: {
              id: '1',
              name: 'LinchKit Team',
            },
          },
        ],
        total: 1,
      }
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      published: z.boolean().default(false),
    }))
    .output(z.object({
      id: z.string(),
      title: z.string(),
      published: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      Logger.info('创建文章', { userId: ctx.user?.id, input })
      
      // 这里应该在数据库中创建文章
      // 暂时返回模拟数据
      return {
        id: Math.random().toString(36).substring(7),
        title: input.title,
        published: input.published,
      }
    }),
})

/**
 * 统计数据路由
 */
const statsRouter = router({
  dashboard: publicProcedure
    .output(z.object({
      users: z.number(),
      posts: z.number(),
      activeUsers: z.number(),
      revenue: z.number(),
    }))
    .query(async () => {
      Logger.info('获取仪表板统计数据')
      
      // 这里应该从数据库获取真实统计数据
      // 暂时返回模拟数据
      return {
        users: 1250,
        posts: 89,
        activeUsers: 340,
        revenue: 15420,
      }
    }),

  userGrowth: adminProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month']).default('week'),
    }))
    .output(z.array(z.object({
      date: z.string(),
      count: z.number(),
    })))
    .query(async ({ input }) => {
      Logger.info('获取用户增长数据', input)
      
      // 模拟数据
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()
      
      return dates.map((date) => ({
        date,
        count: Math.floor(Math.random() * 50) + 10,
      }))
    }),
})

/**
 * 主应用路由器
 * 整合所有子路由器
 */
export const appRouter = router({
  // 来自 @linch-kit/trpc 的基础路由
  health: healthRouter,
  system: systemRouter,
  
  // 应用特定路由
  user: userRouter,
  post: postRouter,
  stats: statsRouter,
})

/**
 * 创建增强的上下文
 * 集成 @linch-kit/auth 认证
 */
export const createContext = async (opts: { req: Request; res?: Response }) => {
  // 基础上下文（来自 @linch-kit/trpc）
  const baseContext = await createTRPCContext(opts)
  
  // 在这里可以添加认证逻辑
  // 例如：从请求头中获取用户信息
  let user: { id: string; email?: string; name?: string } | undefined
  
  try {
    // 简化的认证检查 - 实际应用中应该集成 @linch-kit/auth
    const authHeader = opts.req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // 这里应该验证 JWT token
      // const token = authHeader.substring(7)
      // user = await verifyToken(token)
      
      // 暂时使用模拟用户数据
      user = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Demo User',
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    Logger.warn('认证失败', { error: errorMessage })
  }
  
  return {
    ...baseContext,
    user,
  }
}

// 导出类型
export type AppRouter = typeof appRouter