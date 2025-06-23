/**
 * 简化用户模板 - 不使用复杂的 Schema API
 * 
 * 使用基础 Zod Schema，避免复杂的类型推导
 * 目标：实现快速 DTS 构建
 */

import { z } from 'zod'

/**
 * 基础用户 Schema
 */
export const SimpleUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  emailVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

/**
 * 标准用户 Schema - 包含更多字段但保持简单
 */
export const StandardUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50).optional(),
  name: z.string().min(1).max(100),
  
  // 个人资料 - 使用简单的 JSON 字段
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().optional(),
    timezone: z.string().default('UTC'),
    locale: z.string().default('en-US')
  }).optional(),
  
  // 偏好设置
  preferences: z.object({
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
  }),
  
  // 角色和权限 - 使用简单数组
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  
  // 状态字段
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('pending'),
  emailVerified: z.boolean().default(false),
  lastLoginAt: z.date().optional(),
  
  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
})

/**
 * 企业用户 Schema - 包含企业相关字段
 */
export const EnterpriseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50).optional(),
  name: z.string().min(1).max(100),
  
  // 企业信息
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  manager: z.string().optional(),
  
  // 基本资料
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().optional(),
    workPhone: z.string().optional(),
    timezone: z.string().default('UTC'),
    locale: z.string().default('en-US')
  }).optional(),
  
  // 角色和权限
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  
  // 部门关联 - 简化版本
  departments: z.array(z.object({
    departmentId: z.string(),
    position: z.string().optional(),
    isManager: z.boolean().default(false)
  })).optional(),
  
  // 状态字段
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('pending'),
  emailVerified: z.boolean().default(false),
  lastLoginAt: z.date().optional(),
  
  // 扩展数据
  metadata: z.record(z.string(), z.unknown()).optional(),
  
  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
})

/**
 * 类型导出
 */
export type SimpleUser = z.infer<typeof SimpleUserSchema>
export type StandardUser = z.infer<typeof StandardUserSchema>
export type EnterpriseUser = z.infer<typeof EnterpriseUserSchema>

/**
 * 创建 Schema 导出
 */
export const CreateSimpleUserSchema = SimpleUserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const CreateStandardUserSchema = StandardUserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const CreateEnterpriseUserSchema = EnterpriseUserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

/**
 * 更新 Schema 导出
 */
export const UpdateSimpleUserSchema = CreateSimpleUserSchema.partial()
export const UpdateStandardUserSchema = CreateStandardUserSchema.partial()
export const UpdateEnterpriseUserSchema = CreateEnterpriseUserSchema.partial()

/**
 * 查询 Schema
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

/**
 * 类型导出
 */
export type CreateSimpleUser = z.infer<typeof CreateSimpleUserSchema>
export type UpdateSimpleUser = z.infer<typeof UpdateSimpleUserSchema>
export type CreateStandardUser = z.infer<typeof CreateStandardUserSchema>
export type UpdateStandardUser = z.infer<typeof UpdateStandardUserSchema>
export type CreateEnterpriseUser = z.infer<typeof CreateEnterpriseUserSchema>
export type UpdateEnterpriseUser = z.infer<typeof UpdateEnterpriseUserSchema>
export type QueryUser = z.infer<typeof QueryUserSchema>

/**
 * 简化认证套件
 */
export const SimpleAuthKit = {
  SimpleUser: SimpleUserSchema,
  StandardUser: StandardUserSchema,
  EnterpriseUser: EnterpriseUserSchema,
  CreateSimpleUser: CreateSimpleUserSchema,
  CreateStandardUser: CreateStandardUserSchema,
  CreateEnterpriseUser: CreateEnterpriseUserSchema,
  UpdateSimpleUser: UpdateSimpleUserSchema,
  UpdateStandardUser: UpdateStandardUserSchema,
  UpdateEnterpriseUser: UpdateEnterpriseUserSchema,
  QueryUser: QueryUserSchema
}

/**
 * 默认导出
 */
export default SimpleAuthKit
