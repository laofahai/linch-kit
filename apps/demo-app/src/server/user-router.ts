/**
 * Starter App 用户路由 - 演示用户CRUD功能
 */

import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@linch-kit/trpc/server'

/**
 * 用户Schema定义
 */
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true })

/**
 * 用户路由器 - 提供完整的用户CRUD演示
 */
export const userRouter = router({
  // 获取用户列表
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .output(
      z.object({
        data: z.array(userSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      // 生成模拟用户数据
      const mockData = Array.from({ length: input.limit }, (_, i) => ({
        id: `user_${input.page}_${i + 1}`,
        email: `user${input.page}_${i + 1}@example.com`,
        name: `用户 ${input.page}_${i + 1}`,
        roles: ['user'],
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      const result = {
        data: mockData,
        total: 1000,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(1000 / input.limit),
      }

      return result
    }),

  // 创建用户 (需要认证)
  create: protectedProcedure
    .input(createUserSchema)
    .output(userSchema)
    .mutation(async ({ input }) => {
      // 模拟创建用户
      const newUser = {
        id: `user_${Date.now()}`,
        email: input.email,
        name: input.name,
        roles: input.roles || ['user'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return newUser
    }),

  // 搜索用户
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .output(
      z.object({
        data: z.array(userSchema),
        total: z.number(),
      })
    )
    .query(async ({ input }) => {
      // 模拟搜索结果
      const mockResults = [
        {
          id: 'search_user_1',
          email: `${input.query}@example.com`,
          name: `搜索用户 ${input.query}`,
          roles: ['user'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'search_user_2',
          email: `${input.query}.demo@example.com`,
          name: `${input.query} Demo User`,
          roles: ['user', 'demo'],
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      return {
        data: mockResults,
        total: mockResults.length,
      }
    }),
})

export type UserRouter = typeof userRouter
