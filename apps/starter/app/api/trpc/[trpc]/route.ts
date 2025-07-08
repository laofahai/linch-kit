/**
 * Next.js App Router tRPC API 处理器
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@/lib/trpc-server'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  })

export { handler as GET, handler as POST }
