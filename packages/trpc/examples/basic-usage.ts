/**
 * @linch-kit/trpc 基础使用示例
 */

import { z } from 'zod'
import {
  createTRPCRouter,
  router,
  procedure,
  protectedProcedure,
  adminProcedure,
  createPermissionProcedure,
  createContext
} from '@linch-kit/trpc'

// 1. 创建基础路由
const userRouter = router({
  // 公开接口 - 获取用户列表
  list: procedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10)
    }))
    .query(async ({ input, ctx }) => {
      // 模拟数据库查询
      return {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
        ],
        pagination: {
          page: input.page,
          limit: input.limit,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    }),

  // 受保护接口 - 获取当前用户信息
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: ctx.user!.id,
        name: ctx.user!.name,
        email: ctx.user!.email
      }
    }),

  // 权限控制接口 - 创建用户
  create: createPermissionProcedure('user', 'create')
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email()
    }))
    .mutation(async ({ input, ctx }) => {
      // 模拟创建用户
      const newUser = {
        id: Math.random().toString(36).substring(7),
        name: input.name,
        email: input.email,
        createdAt: new Date().toISOString()
      }
      
      return {
        success: true,
        data: newUser,
        message: 'User created successfully'
      }
    }),

  // 管理员接口 - 删除用户
  delete: adminProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // 模拟删除用户
      return {
        success: true,
        message: `User ${input.id} deleted successfully`
      }
    })
})

// 2. 创建文章路由
const postRouter = router({
  list: procedure
    .input(z.object({
      authorId: z.string().optional(),
      published: z.boolean().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10)
    }))
    .query(async ({ input }) => {
      // 模拟文章查询
      return {
        posts: [
          {
            id: '1',
            title: 'Getting Started with tRPC',
            content: 'tRPC is amazing...',
            authorId: '1',
            published: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: input.page,
          limit: input.limit,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      published: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const newPost = {
        id: Math.random().toString(36).substring(7),
        title: input.title,
        content: input.content,
        published: input.published,
        authorId: ctx.user!.id,
        createdAt: new Date().toISOString()
      }

      return {
        success: true,
        data: newPost,
        message: 'Post created successfully'
      }
    })
})

// 3. 组合应用路由
export const appRouter = router({
  user: userRouter,
  post: postRouter,
  
  // 健康检查
  health: procedure
    .query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }))
})

// 4. 导出类型
export type AppRouter = typeof appRouter

// 5. 创建服务端调用器
export const { trpcServer, trpcServerWithUser } = createTrpcServer(appRouter)

// 6. 使用示例
async function examples() {
  // 服务端调用示例
  const health = await trpcServer.health.query()
  console.log('Health check:', health)

  // 带用户上下文的调用
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  }
  
  const userInfo = await trpcServerWithUser(mockUser).user.me.query()
  console.log('User info:', userInfo)
}

// 7. Next.js API 路由集成示例
export async function createTRPCHandler(req: any, res: any) {
  const context = await createContext({ req, res })
  
  // 这里会集成 @trpc/server 的 HTTP 适配器
  // 实际实现需要根据具体的 Next.js 版本调整
  return {
    context,
    router: appRouter
  }
}
