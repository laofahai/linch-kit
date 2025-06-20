import { z } from 'zod'

import { router, protectedProcedure, adminProcedure } from '../trpc'

/**
 * User Router
 * 
 * Handles all user-related operations including:
 * - User registration and authentication
 * - User profile management
 * - User listing and administration
 */

// Mock user data for development
// TODO: Replace with actual database operations
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
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
    isActive: true,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const userRouter = router({
  /**
   * Get all users (admin only)
   */
  list: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search } = input
      
      // Filter users based on search
      let filteredUsers = mockUsers
      if (search) {
        filteredUsers = mockUsers.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      // Paginate results
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const users = filteredUsers.slice(startIndex, endIndex)
      
      return {
        users,
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit),
        },
      }
    }),

  /**
   * Get user by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { id } = input
      
      // Users can only access their own data unless they're admin
      if (ctx.user.id !== id && ctx.user.role !== 'ADMIN') {
        throw new Error('Forbidden: You can only access your own user data')
      }
      
      const user = mockUsers.find(u => u.id === id)
      if (!user) {
        throw new Error('User not found')
      }
      
      return user
    }),

  /**
   * Get current user profile
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = mockUsers.find(u => u.id === ctx.user.id)
      if (!user) {
        throw new Error('User not found')
      }
      
      return user
    }),

  /**
   * Create new user (admin only)
   */
  create: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
      role: z.enum(['USER', 'ADMIN', 'MODERATOR']).default('USER'),
    }))
    .mutation(async ({ input }) => {
      const { email, name, role } = input
      
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
        role,
        isActive: true,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockUsers.push(newUser)
      
      return {
        success: true,
        user: newUser,
        message: 'User created successfully',
      }
    }),

  /**
   * Update user
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input
      
      // Users can only update their own data unless they're admin
      if (ctx.user.id !== id && ctx.user.role !== 'ADMIN') {
        throw new Error('Forbidden: You can only update your own user data')
      }
      
      const userIndex = mockUsers.findIndex(u => u.id === id)
      if (userIndex === -1) {
        throw new Error('User not found')
      }
      
      // Update user
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updatedAt: new Date(),
      }
      
      return {
        success: true,
        user: mockUsers[userIndex],
        message: 'User updated successfully',
      }
    }),

  /**
   * Delete user (admin only)
   */
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { id } = input
      
      const userIndex = mockUsers.findIndex(u => u.id === id)
      if (userIndex === -1) {
        throw new Error('User not found')
      }
      
      // Remove user from array
      const deletedUser = mockUsers.splice(userIndex, 1)[0]
      
      return {
        success: true,
        user: deletedUser,
        message: 'User deleted successfully',
      }
    }),
})
