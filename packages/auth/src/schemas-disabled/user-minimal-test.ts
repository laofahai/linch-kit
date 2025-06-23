import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 最小化测试用户实体模板
 * 
 * 用于测试 DTS 构建性能，只包含最基本的字段
 */
export const MinimalTestUserTemplate = defineEntity(
  'User',
  {
    id: defineField(z.string(), {
      primary: true,
      label: 'auth.user.id',
    }),

    name: defineField(z.string().optional(), {
      label: 'auth.user.name',
    }),

    email: defineField(z.string().email().optional(), {
      unique: true,
      label: 'auth.user.email',
    }),

    createdAt: defineField(z.date(), {
      createdAt: true,
      label: 'auth.user.createdAt',
    }),

    updatedAt: defineField(z.date(), {
      updatedAt: true,
      label: 'auth.user.updatedAt',
    }),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.displayName',
      description: 'auth.user.description',
    },
  }
)
