import { createNextApiHandler } from '@trpc/server/adapters/next'
import { createTRPCContext } from '@linch-kit/trpc'
import { appRouter } from '@/server/routers/app'

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
          )
        }
      : undefined,
})