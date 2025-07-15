/**
 * tRPC API 路由处理器
 * Next.js App Router 集成
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter, createTRPCContext } from '@/lib/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }