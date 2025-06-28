/**
 * tRPC API 路由处理器
 */

import { createNextApiHandler } from '@trpc/server/adapters/next'
import { starterAppRouter, createContext } from '../../../server/trpc'

// 导出 API 处理器
export default createNextApiHandler({
  router: starterAppRouter,
  createContext,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
          )
        }
      : undefined,
})

// 导出路由器类型
export type { StarterAppRouter } from '../../../server/trpc'