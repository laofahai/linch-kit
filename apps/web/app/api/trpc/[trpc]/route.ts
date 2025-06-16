import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/_lib/trpc'
import { createContext } from '@/_lib/trpc/context'

export const runtime = 'edge' // 使用边缘运行时

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const context = await createContext()
      return context
    },
    onError({ error }: any) {
      console.error('tRPC error:', error)
    },
  })

export { handler as GET, handler as POST }
