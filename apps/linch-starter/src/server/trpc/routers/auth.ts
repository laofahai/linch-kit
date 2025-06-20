import { z } from 'zod'

import { router, publicProcedure, protectedProcedure } from '../trpc'

/**
 * Authentication Router
 * 
 * Handles authentication operations including:
 * - User registration
 * - User login
 * - Session management
 * - Password reset
 */

// Mock authentication data
// TODO: Replace with actual authentication service
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    password: 'admin123', // In real app, this would be hashed
    isActive: true,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'USER',
    password: 'user123', // In real app, this would be hashed
    isActive: true,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockSessions: Array<{
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}> = []

export const authRouter = router({
  /**
   * User registration
   */
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
      password: z.string().min(6).max(100),
    }))
    .mutation(async ({ input }) => {
      const { email, name, password } = input
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }
      
      // Create new user
      const newUser = {
        id: (mockUsers.length + 1).toString(),
        email,
        name,
        role: 'USER' as const,
        password, // In real app, hash this password
        isActive: true,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockUsers.push(newUser)
      
      // Create session
      const session = {
        id: Math.random().toString(36).substring(7),
        userId: newUser.id,
        token: Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      }
      
      mockSessions.push(session)
      
      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
        },
        message: 'Registration successful',
      }
    }),

  /**
   * User login
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input
      
      // Find user
      const user = mockUsers.find(u => u.email === email)
      if (!user) {
        throw new Error('Invalid email or password')
      }
      
      // Check password (in real app, compare hashed passwords)
      if (user.password !== password) {
        throw new Error('Invalid email or password')
      }
      
      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated')
      }
      
      // Create session
      const session = {
        id: Math.random().toString(36).substring(7),
        userId: user.id,
        token: Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      }
      
      mockSessions.push(session)
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
        },
        message: 'Login successful',
      }
    }),

  /**
   * User logout
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Remove all sessions for the user
      const sessionIndex = mockSessions.findIndex(s => s.userId === ctx.user.id)
      if (sessionIndex !== -1) {
        mockSessions.splice(sessionIndex, 1)
      }
      
      return {
        success: true,
        message: 'Logout successful',
      }
    }),

  /**
   * Get current session info
   */
  session: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        user: ctx.user,
        session: ctx.session,
      }
    }),

  /**
   * Refresh session
   */
  refresh: protectedProcedure
    .mutation(async ({ ctx }) => {
      const session = mockSessions.find(s => s.userId === ctx.user.id)
      if (!session) {
        throw new Error('Session not found')
      }
      
      // Extend session expiry
      session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      
      return {
        success: true,
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
        },
        message: 'Session refreshed',
      }
    }),
})
