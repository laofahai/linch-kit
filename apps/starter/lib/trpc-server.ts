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
  systemRouter,
} from '@linch-kit/trpc/server'
import { Logger } from '@linch-kit/core'
import { z } from 'zod'
import { db } from './db'

/**
 * 用户相关路由
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
      Logger.info('获取用户资料', { userId: ctx.user?.id })

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
      Logger.info('更新用户资料', { userId: ctx.user?.id, input })

      if (!ctx.user?.id) {
        throw new Error('用户未登录')
      }

      // 检查邮箱是否已被其他用户使用
      if (input.email) {
        const existingUser = await db.user.findFirst({
          where: {
            email: input.email,
            id: { not: ctx.user.id },
          },
        })

        if (existingUser) {
          return {
            success: false,
            message: '该邮箱已被其他用户使用',
          }
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
    }),

  // 获取用户列表（管理员权限）
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        role: z.enum(['USER', 'TENANT_ADMIN', 'SUPER_ADMIN']).optional(),
      })
    )
    .output(
      z.object({
        users: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.enum(['USER', 'TENANT_ADMIN', 'SUPER_ADMIN']),
            status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
            createdAt: z.date(),
            lastLoginAt: z.date().nullable(),
          })
        ),
        total: z.number(),
      })
    )
    .query(async ({ input }) => {
      Logger.info('获取用户列表', input)

      const where = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
        ...(input.role && { role: input.role }),
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        }),
        db.user.count({ where }),
      ])

      return { users, total }
    }),

  // 更新用户状态（管理员权限）
  updateStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      Logger.info('更新用户状态', { adminId: ctx.user?.id, input })

      await db.user.update({
        where: { id: input.userId },
        data: { status: input.status },
      })

      return {
        success: true,
        message: '用户状态更新成功',
      }
    }),
})

/**
 * 统计数据路由
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
      Logger.info('获取仪表板统计数据')

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

  userGrowth: adminProcedure
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
      Logger.info('获取用户增长数据', input)

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
 * 主应用路由器
 * 整合所有子路由器
 */
export const appRouter = router({
  // 来自 @linch-kit/trpc 的基础路由
  health: healthRouter,
  system: systemRouter,

  // 应用特定路由
  user: userRouter,
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
