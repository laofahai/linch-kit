/**
 * tRPC 服务器配置 - 集成 @linch-kit/trpc
 */

import { 
  appRouter,
  createLinchKitContext,
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure
} from '@linch-kit/trpc/server'
import { z } from 'zod'

import { userRouter } from './user-router'

/**
 * 创建 LinchKit tRPC 上下文
 */
export const createContext = createLinchKitContext({
  services: {
    logger: {
      info: (message: string, meta?: Record<string, unknown>) => console.log(`[INFO] ${message}`, meta),
      warn: (message: string, meta?: Record<string, unknown>) => console.warn(`[WARN] ${message}`, meta),
      error: (message: string, meta?: Record<string, unknown>) => console.error(`[ERROR] ${message}`, meta),
      debug: (message: string, meta?: Record<string, unknown>) => console.debug(`[DEBUG] ${message}`, meta)
    },
    config: {
      get: (_key: string) => undefined
    }
  }
})

// 重新导出基础构建器
export { 
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure
}

// 导出类型
export type { AppRouter } from '@linch-kit/trpc/server'

/**
 * Starter App 专用路由器扩展
 */

const starterRouter = router({
  hello: router({
    world: publicProcedure
      .output(z.object({
        message: z.string(),
        timestamp: z.string(),
        features: z.array(z.string())
      }))
      .query(() => {
        return {
          message: '欢迎使用 LinchKit Starter App！',
          timestamp: new Date().toISOString(),
          features: [
            'Schema驱动开发',
            '端到端类型安全',
            'tRPC API层',
            '认证权限系统',
            '国际化支持',
            '插件化架构'
          ]
        }
      })
  })
})

/**
 * 扩展基础 appRouter，添加 starter 专用功能
 */
export const starterAppRouter = router({
  // 保留基础路由
  health: appRouter.health,
  auth: appRouter.auth, 
  system: appRouter.system,
  // 添加 starter 专用路由
  starter: starterRouter,
  user: userRouter  // 使用starter-app自定义的用户路由
})

export type StarterAppRouter = typeof starterAppRouter