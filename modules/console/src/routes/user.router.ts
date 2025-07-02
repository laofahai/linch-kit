import { z } from 'zod'
import { router, publicProcedure } from '@linch-kit/trpc'

import { userService, CreateUserInput, UpdateUserInput } from '../services/user.service'

/**
 * 用户管理路由器
 * 提供用户 CRUD 操作的 tRPC 接口
 */
export const userRouter = router({
  /**
   * 获取用户列表
   */
  list: publicProcedure
    .input(z.object({
      tenantId: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const users = await userService.listUsers()
      
      // 简化的分页和搜索逻辑
      let filteredUsers = users
      if (input.search) {
        filteredUsers = users.filter(user => 
          user.name?.toLowerCase().includes(input.search!.toLowerCase()) ||
          user.email?.toLowerCase().includes(input.search!.toLowerCase())
        )
      }
      
      const start = (input.page - 1) * input.limit
      const end = start + input.limit
      const paginatedUsers = filteredUsers.slice(start, end)
      
      return {
        users: paginatedUsers,
        total: filteredUsers.length,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(filteredUsers.length / input.limit)
      }
    }),

  /**
   * 获取用户详情
   */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await userService.getUser(input.id)
    }),

  /**
   * 创建用户
   */
  create: publicProcedure
    .input(CreateUserInput)
    .mutation(async ({ input }) => {
      return await userService.createUser(input)
    }),

  /**
   * 更新用户
   */
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: UpdateUserInput,
    }))
    .mutation(async ({ input }) => {
      return await userService.updateUser(input.id, input.data)
    }),

  /**
   * 删除用户
   */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await userService.deleteUser(input.id)
    }),

  /**
   * 获取用户统计信息
   */
  stats: publicProcedure
    .query(async () => {
      const users = await userService.listUsers()
      
      return {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        inactiveUsers: users.filter(u => u.status === 'inactive').length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
      }
    }),
})

export type UserRouter = typeof userRouter