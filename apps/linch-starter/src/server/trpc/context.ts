import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type NextRequest } from 'next/server'

/**
 * tRPC Context
 * 
 * This is the context that will be available in all tRPC procedures.
 * It includes request information and any authentication data.
 */
export interface Context {
  req: NextRequest | Request
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
  session?: {
    id: string
    userId: string
    expiresAt: Date
  }
}

/**
 * Create context for tRPC procedures
 * 
 * This function is called for every tRPC request and creates the context
 * that will be available in all procedures.
 */
export async function createContext(opts: CreateNextContextOptions): Promise<Context> {
  const { req } = opts

  // TODO: Add authentication logic here
  // For now, we'll return a basic context
  // In a real app, you would:
  // 1. Extract JWT token from headers/cookies
  // 2. Validate the token
  // 3. Fetch user data from database
  // 4. Return user and session information

  return {
    req,
    // user: undefined, // Will be set by auth middleware
    // session: undefined, // Will be set by auth middleware
  }
}

export type TRPCContext = Context
