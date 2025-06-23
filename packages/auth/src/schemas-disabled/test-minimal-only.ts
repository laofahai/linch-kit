/**
 * 测试：只导入最基本的用户模板，验证 DTS 构建性能
 */

import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 最小化用户实体模板 - 只包含最基本的字段
 */
export const MinimalUserTemplate = defineEntity(
  'User',
  {
    id: z.string(),
    name: defineField(z.string().optional(), {
      label: 'auth.user.name',
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

/**
 * 基础用户实体模板 - 包含常用字段但不包含复杂的 JSON 字段
 */
export const BasicUserTemplate = defineEntity(
  'User',
  {
    id: defineField(z.string(), {
      primary: true,
      label: 'auth.user.id',
    }),

    email: defineField(z.string().email().optional(), {
      unique: true,
      label: 'auth.user.email',
    }),

    name: defineField(z.string().optional(), {
      label: 'auth.user.name',
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

export const TestMinimalAuthKit = {
  User: MinimalUserTemplate,
}

export const TestBasicAuthKit = {
  User: BasicUserTemplate,
}
