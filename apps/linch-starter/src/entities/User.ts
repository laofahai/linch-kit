import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * User Entity
 * 
 * Demonstrates Linch Kit schema definition with authentication integration
 */
export const User = defineEntity('User', {
  // Primary key
  id: defineField(z.string().uuid(), {
    primary: true,
    label: 'User ID'
  }),

  // Authentication fields
  email: defineField(z.string().email(), {
    unique: true,
    label: 'Email Address',
    description: 'User email for authentication'
  }),

  name: defineField(z.string().min(1).max(100), {
    label: 'Full Name',
    description: 'User display name'
  }),

  // Optional profile fields
  avatar: defineField(z.string().url().optional(), {
    label: 'Avatar URL',
    description: 'Profile picture URL'
  }),

  // Role-based access control
  role: defineField(z.enum(['USER', 'ADMIN', 'MODERATOR']), {
    default: 'USER',
    label: 'User Role',
    description: 'User permission level'
  }),

  // Account status
  isActive: defineField(z.boolean(), {
    default: true,
    label: 'Active Status',
    description: 'Whether the user account is active'
  }),

  // Email verification
  emailVerified: defineField(z.date().nullable(), {
    label: 'Email Verified At',
    description: 'When the email was verified'
  }),

  // Timestamps
  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'Created At'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'Updated At'
  })
}, {
  tableName: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['role']
    }
  ]
})

// Export types for use in the application
export type UserType = z.infer<typeof User.schema>
export type CreateUserInput = z.infer<typeof User.createSchema>
export type UpdateUserInput = z.infer<typeof User.updateSchema>
export type UserResponse = z.infer<typeof User.responseSchema>

export default User
