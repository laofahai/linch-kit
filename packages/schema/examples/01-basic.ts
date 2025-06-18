import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * Basic Usage Example
 *
 * Demonstrates basic usage of defineField and defineEntity
 */

// === 1. Simplest Usage ===

const SimpleUser = defineEntity('SimpleUser', {
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().min(0).max(120).optional(),
  createdAt: z.date(),
})

// === 2. Using defineField with Configuration ===

const User = defineEntity('User', {
  // Primary key field
  id: defineField(z.string().uuid(), {
    primary: true
  }),

  // Unique field
  email: defineField(z.string().email(), {
    unique: true,
    label: 'Email Address'
  }),

  // Field with default value
  role: defineField(z.enum(['USER', 'ADMIN']), {
    default: 'USER',
    label: 'Role'
  }),

  // Timestamp fields
  createdAt: defineField(z.date(), {
    createdAt: true
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true
  })
}, {
  tableName: 'users'
})

// === 3. Export Types and Validators ===

export const CreateUserSchema = User.createSchema
export const UpdateUserSchema = User.updateSchema
export const UserResponseSchema = User.responseSchema

export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>

// === 4. Usage Examples ===

// Validate creation data
const userData: CreateUser = {
  email: 'user@example.com',
  role: 'USER'
}

const validatedUser = CreateUserSchema.parse(userData)

// Validate update data
const updateData: UpdateUser = {
  role: 'ADMIN'
}

const validatedUpdate = UpdateUserSchema.parse(updateData)

console.log('Validated user:', validatedUser)
console.log('Validated update:', validatedUpdate)

export { SimpleUser, User }
