import { router, publicProcedure } from './trpc'
import { userRouter } from './routers/user'
import { authRouter } from './routers/auth'

/**
 * Main tRPC Router
 * 
 * This is the main router that combines all sub-routers.
 * Add new routers here as you create them.
 */
export const appRouter = router({
  // Authentication routes
  auth: authRouter,
  
  // User management routes
  user: userRouter,
  
  // Health check
  health: router({
    check: publicProcedure.query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })),
  }),
})

// Export type definition of API
export type AppRouter = typeof appRouter
