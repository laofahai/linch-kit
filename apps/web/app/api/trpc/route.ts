import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/_lib/trpc/routers'
import { getSessionUser } from '@flex-report/auth'
import type { Context } from '@flex-report/trpc'

// 标准 Node.js 运行环境
// export const runtime = 'edge'

const handler = async (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async (): Promise<Context> => {
      // 使用 getServerSession 直接获取会话
      const session = await getSessionUser()
      // 从会话中提取用户信息
      return {
        user: session?.user,
      }
    },
    onError({ error }: any) {
      console.error('tRPC error:', error)
    },
  })

export { handler as GET, handler as POST }
