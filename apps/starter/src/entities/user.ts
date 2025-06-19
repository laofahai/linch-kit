import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 用户实体定义
 * 使用 @linch-kit/schema 定义用户数据结构
 */
export const UserEntity = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true,
    label: 'user.id.label'
  }),

  name: defineField(z.string().min(1).max(100), {
    label: 'user.name.label',
    required: true,
    order: 1
  }),

  email: defineField(z.string().email().optional(), {
    unique: true,
    label: 'user.email.label',
    order: 2
  }),

  avatar: defineField(z.string().url().optional(), {
    label: 'user.avatar.label',
    order: 3
  }),

  role: defineField(z.enum(['admin', 'user', 'moderator']), {
    default: 'user',
    label: 'user.role.label',
    order: 4
  }),

  status: defineField(z.enum(['active', 'inactive', 'suspended']), {
    default: 'active',
    label: 'user.status.label',
    order: 5
  }),

  permissions: defineField(z.array(z.string()).optional(), {
    label: 'user.permissions.label',
    order: 6
  }),

  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'user.createdAt.label'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'user.updatedAt.label'
  })
}, {
  tableName: 'users',
  ui: {
    displayName: 'user.displayName',
    description: 'user.description'
  }
})

// 导出类型
export type User = z.infer<typeof UserEntity.schema>
export type CreateUserInput = z.infer<typeof UserEntity.createSchema>
export type UpdateUserInput = z.infer<typeof UserEntity.updateSchema>
