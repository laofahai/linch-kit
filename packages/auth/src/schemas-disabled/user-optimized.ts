/**
 * 使用优化版 Schema API 的用户模板
 * 
 * 这个文件演示如何使用性能优化的 Schema API 来定义用户实体
 * 目标：验证 DTS 构建性能改进
 */

import { z } from 'zod'
import {
  defineField,
  defineEntity,
  primary,
  unique,
  createdAt,
  updatedAt,
  label,
  type CoreEntityDefinition,
} from '@linch-kit/schema'

/**
 * 超级简化用户模板 - 使用优化版 API
 *
 * 只包含最基本的字段，用于性能测试
 */
export const UltraMinimalUserOptimized = defineEntity('UltraMinimalUser', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string().min(1).max(100),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date())
}, {
  tableName: 'users'
})

/**
 * 基础用户模板 - 使用优化版 API
 *
 * 包含常用字段，但避免复杂的嵌套结构
 */
export const BasicUserOptimized = defineEntity('BasicUser', {
  // 主键
  id: primary(z.string().uuid()),

  // 基本信息
  email: defineField(z.string().email(), {
    label: 'auth.user.email',
    placeholder: 'auth.user.email.placeholder',
    order: 1,
    unique: true
  }),

  username: defineField(z.string().min(3).max(50), {
    label: 'auth.user.username',
    placeholder: 'auth.user.username.placeholder',
    order: 2,
    unique: true
  }),

  name: defineField(z.string().min(1).max(100), {
    label: 'auth.user.name',
    placeholder: 'auth.user.name.placeholder',
    order: 3
  }),

  // 状态字段
  status: defineField(z.enum(['active', 'inactive', 'suspended']).default('active'), {
    label: 'auth.user.status',
    order: 10
  }),

  emailVerified: defineField(z.boolean().default(false), {
    label: 'auth.user.emailVerified',
    order: 11
  }),

  // 时间戳
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date())
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['status'] }
  ]
})

/**
 * 标准用户模板 - 使用优化版 API
 * 
 * 包含更多字段，但使用简化的 JSON 字段而非复杂关系
 */
export const StandardUserOptimized = defineEntity('StandardUser', {
  // 主键
  id: primary(z.string().uuid()),

  // 基本信息
  email: defineField(z.string().email(), {
    label: 'auth.user.email',
    placeholder: 'auth.user.email.placeholder',
    order: 1,
    unique: true
  }),

  username: defineField(z.string().min(3).max(50).optional(), {
    label: 'auth.user.username',
    placeholder: 'auth.user.username.placeholder',
    order: 2,
    unique: true
  }),

  name: defineField(z.string().min(1).max(100), {
    label: 'auth.user.name',
    placeholder: 'auth.user.name.placeholder',
    order: 3
  }),
  
  // 个人资料 - 使用 JSON 字段避免复杂关系
  profile: defineField(z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().optional(),
    timezone: z.string().default('UTC'),
    locale: z.string().default('en-US')
  }).optional(), {
    label: 'auth.user.profile',
    order: 4,
    db: { type: 'JSON' }
  }),

  // 偏好设置 - 使用 JSON 字段
  preferences: defineField(z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    language: z.string().default('en'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false)
    }).default({
      email: true,
      push: true,
      sms: false
    })
  }).default({
    theme: 'auto',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }), {
    label: 'auth.user.preferences',
    order: 5,
    db: { type: 'JSON' }
  }),

  // 角色 - 使用简单的字符串数组而非关系表
  roles: defineField(z.array(z.string()).default([]), {
    label: 'auth.user.roles',
    order: 6,
    db: { type: 'JSON' }
  }),

  // 权限 - 使用简单的字符串数组
  permissions: defineField(z.array(z.string()).default([]), {
    label: 'auth.user.permissions',
    order: 7,
    db: { type: 'JSON' }
  }),
  
  // 状态字段
  status: defineField(z.enum(['active', 'inactive', 'suspended', 'pending']).default('pending'), {
    label: 'auth.user.status',
    order: 10
  }),

  emailVerified: defineField(z.boolean().default(false), {
    label: 'auth.user.emailVerified',
    order: 11
  }),

  lastLoginAt: defineField(z.date().optional(), {
    label: 'auth.user.lastLoginAt',
    order: 12
  }),

  // 时间戳
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date())
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['status'] },
    { fields: ['lastLoginAt'] }
  ]
})

/**
 * 认证套件 - 使用优化版 API
 */
export const OptimizedAuthKit = {
  UltraMinimalUser: UltraMinimalUserOptimized,
  BasicUser: BasicUserOptimized,
  StandardUser: StandardUserOptimized
}

/**
 * 类型导出
 */
export type UltraMinimalUser = z.infer<typeof UltraMinimalUserOptimized.schema>
export type BasicUser = z.infer<typeof BasicUserOptimized.schema>
export type StandardUser = z.infer<typeof StandardUserOptimized.schema>

/**
 * 创建和更新 Schema 导出
 */
export const CreateUltraMinimalUserSchema = UltraMinimalUserOptimized.schema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateUltraMinimalUserSchema = CreateUltraMinimalUserSchema.partial()

export const CreateBasicUserSchema = BasicUserOptimized.schema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateBasicUserSchema = CreateBasicUserSchema.partial()

export const CreateStandardUserSchema = StandardUserOptimized.schema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateStandardUserSchema = CreateStandardUserSchema.partial()

/**
 * 查询 Schema 导出
 */
export const QueryUserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  emailVerified: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastLoginAt', 'email', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type QueryUser = z.infer<typeof QueryUserSchema>
export type CreateUltraMinimalUser = z.infer<typeof CreateUltraMinimalUserSchema>
export type UpdateUltraMinimalUser = z.infer<typeof UpdateUltraMinimalUserSchema>
export type CreateBasicUser = z.infer<typeof CreateBasicUserSchema>
export type UpdateBasicUser = z.infer<typeof UpdateBasicUserSchema>
export type CreateStandardUser = z.infer<typeof CreateStandardUserSchema>
export type UpdateStandardUser = z.infer<typeof UpdateStandardUserSchema>
