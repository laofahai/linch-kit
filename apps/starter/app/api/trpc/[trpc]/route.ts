import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '@/_lib/trpc-context'
import { appRouter } from '@/_lib/trpc-router'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  })

export { handler as GET, handler as POST }
