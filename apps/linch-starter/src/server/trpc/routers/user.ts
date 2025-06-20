import { z } from 'zod'
import { nanoid } from 'nanoid'

import { router, protectedProcedure, adminProcedure } from '../trpc'
import { db } from '../../../lib/db'

/**
 * User Router
 *
 * Handles all user-related operations including:
 * - User registration and authentication
 * - User profile management
 * - User listing and administration
 */

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
      const offset = (page - 1) * limit

      const where = search ? {
        OR: [
          { name: { contains: search } },
          { globalEmail: { contains: search } },
          { globalUsername: { contains: search } },
        ],
        deletedAt: null,
      } : {
        deletedAt: null,
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            globalEmail: true,
            globalUsername: true,
            globalPhone: true,
            avatar: true,
            globalStatus: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.user.count({ where }),
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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

      const user = await db.user.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          userDepartments: {
            include: {
              department: true,
            },
          },
        },
      })

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
      const user = await db.user.findUnique({
        where: {
          id: ctx.user.id,
          deletedAt: null,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          userDepartments: {
            include: {
              department: true,
            },
          },
        },
      })

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
      globalEmail: z.string().email(),
      name: z.string().min(1).max(100),
      globalUsername: z.string().min(1).max(50).optional(),
      globalPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { globalEmail, name, globalUsername, globalPhone } = input

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { globalEmail },
            ...(globalUsername ? [{ globalUsername }] : []),
          ],
          deletedAt: null,
        },
      })

      if (existingUser) {
        throw new Error('User with this email or username already exists')
      }

      // Create new user
      const newUser = await db.user.create({
        data: {
          id: nanoid(),
          globalEmail,
          name,
          globalUsername,
          globalPhone,
          globalStatus: 'active',
        },
      })

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
      globalEmail: z.string().email().optional(),
      globalUsername: z.string().min(1).max(50).optional(),
      globalPhone: z.string().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input

      // Users can only update their own data unless they're admin
      if (ctx.user.id !== id && ctx.user.role !== 'ADMIN') {
        throw new Error('Forbidden: You can only update your own user data')
      }

      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id, deletedAt: null },
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      // Check for email/username conflicts
      if (updates.globalEmail || updates.globalUsername) {
        const conflictUser = await db.user.findFirst({
          where: {
            OR: [
              ...(updates.globalEmail ? [{ globalEmail: updates.globalEmail }] : []),
              ...(updates.globalUsername ? [{ globalUsername: updates.globalUsername }] : []),
            ],
            NOT: { id },
            deletedAt: null,
          },
        })

        if (conflictUser) {
          throw new Error('Email or username already exists')
        }
      }

      // Update user
      const updatedUser = await db.user.update({
        where: { id },
        data: updates,
      })

      return {
        success: true,
        user: updatedUser,
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

      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id, deletedAt: null },
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      // Soft delete user
      const deletedUser = await db.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          globalStatus: 'deleted',
        },
      })

      return {
        success: true,
        user: deletedUser,
        message: 'User deleted successfully',
      }
    }),
})
