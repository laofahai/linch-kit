/**
 * tRPC 服务端配置 - Starter 应用版本
 * 基于 @linch-kit/trpc 和 @linch-kit/auth 的服务端配置
 * 遵循 LinchKit 架构原则：使用 console 模块提供的功能
 */

import { initTRPC } from '@trpc/server'
// import { createConsoleRouter } from '@linch-kit/console'
import { z } from 'zod'
import superjson from 'superjson'

import { db } from './db'
import { auth } from './auth'

/**
 * 初始化 tRPC 实例
 */
const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

/**
 * 基础路由构造器
 */
export const router = t.router

/**
 * 公开过程
 */
export const publicProcedure = t.procedure

/**
 * 受保护过程 - 需要认证
 */
export const protectedProcedure = t.procedure.use(async ({ next }) => {
  const session = await auth()

  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }

  return next({
    ctx: {
      user: session.user,
    },
  })
})

/**
 * 创建 tRPC 上下文
 */
export async function createTRPCContext() {
  const session = await auth()

  return {
    user: session?.user || null,
    db,
  }
}

/**
 * 用户基础路由 - 仅保留必要功能
 * 管理功能已迁移到 @linch-kit/console
 */
const userRouter = router({
  getProfile: protectedProcedure
    .output(
      z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string().nullable(),
        role: z.string(),
        createdAt: z.date(),
      })
    )
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        throw new Error('用户未登录')
      }

      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })

      if (!user) {
        throw new Error('用户不存在')
      }

      return user
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error('用户未登录')
      }

      try {
        // 检查邮箱是否已被其他用户使用
        if (input.email) {
          const existingUser = await db.user.findFirst({
            where: {
              email: input.email,
              id: { not: ctx.user.id },
            },
          })

          if (existingUser) {
            throw new Error('该邮箱已被其他用户使用')
          }
        }

        await db.user.update({
          where: { id: ctx.user.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.email && { email: input.email }),
          },
        })

        return {
          success: true,
          message: '用户资料更新成功',
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新失败'
        return {
          success: false,
          message,
        }
      }
    }),
})

/**
 * 统计相关路由 - 简化版本，仅用于展示
 */
const statsRouter = router({
  dashboard: publicProcedure
    .output(
      z.object({
        totalUsers: z.number(),
        activeUsers: z.number(),
        totalSessions: z.number(),
        revenue: z.number(),
      })
    )
    .query(async () => {
      const [totalUsers, activeUsers, totalSessions] = await Promise.all([
        db.user.count(),
        db.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天内登录
            },
          },
        }),
        db.session.count({
          where: {
            expiresAt: {
              gte: new Date(), // 有效会话
            },
          },
        }),
      ])

      return {
        totalUsers,
        activeUsers,
        totalSessions,
        revenue: Math.floor(Math.random() * 50000) + 10000, // 模拟收入数据
      }
    }),

  userGrowth: protectedProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .output(
      z.array(
        z.object({
          date: z.string(),
          count: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      // 根据period计算日期范围
      const days = input.period === 'day' ? 1 : input.period === 'week' ? 7 : 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 获取时间段内的用户数据
      const users = await db.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      // 按日期分组统计
      const countsByDate = new Map<string, number>()

      // 初始化日期
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        countsByDate.set(dateStr, 0)
      }

      // 统计用户数
      users.forEach(user => {
        const dateStr = user.createdAt.toISOString().split('T')[0]
        const currentCount = countsByDate.get(dateStr) || 0
        countsByDate.set(dateStr, currentCount + 1)
      })

      // 转换为数组并排序
      return Array.from(countsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }),
})

/**
 * Console 路由 - 暂时禁用
 */
// const consoleRouterInstance = createConsoleRouter({
//   router,
//   protectedProcedure,
// })

/**
 * 基础健康检查路由
 */
const healthRouter = router({
  status: publicProcedure
    .output(
      z.object({
        status: z.literal('ok'),
        timestamp: z.number(),
        uptime: z.number(),
      })
    )
    .query(async () => ({
      status: 'ok' as const,
      timestamp: Date.now(),
      uptime: process.uptime(),
    })),
})

/**
 * 系统信息路由
 */
const systemRouter = router({
  info: publicProcedure
    .output(
      z.object({
        version: z.string(),
        environment: z.string(),
        nodeVersion: z.string(),
      })
    )
    .query(async () => ({
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    })),
})

/**
 * 主应用路由器 - 简化版本
 * 仅包含 starter 应用必需的路由
 * 用户管理功能已迁移到 @linch-kit/console
 */
export const appRouter = router({
  // 基础路由
  health: healthRouter,
  system: systemRouter,

  // starter 应用特定路由
  user: userRouter,
  stats: statsRouter,

  // Console 模块路由（暂时禁用）
  // console: consoleRouterInstance,
})

/**
 * 创建上下文 - 使用 @linch-kit/trpc 标准实现
 * 认证逻辑由 @linch-kit/auth 处理
 */
export const createContext = createTRPCContext

// 导出类型
export type AppRouter = typeof appRouter

/**
 * 注意：用户管理相关功能已迁移到 @linch-kit/console
 * 如需使用完整的用户管理功能，请导入 console 模块的路由：
 *
 * import { consoleRouter } from '@linch-kit/console'
 *
 * export const appRouter = router({
 *   ...baseRouters,
 *   console: consoleRouter,
 * })
 */
