import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'

import type { Context } from './context'

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router
export const procedure = t.procedure

/**
 * Middleware to check if user is authenticated
 */
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type-safe user context
    },
  })
})

/**
 * Middleware to check if user has admin role
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }
  
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this resource',
    })
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = procedure

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = procedure.use(isAuthenticated)

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = procedure.use(isAdmin)
