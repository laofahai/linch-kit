/**
 * 租户管理实体定义
 * 
 * 多租户架构的核心实体，包括租户和配额管理
 */

import { defineEntity, defineField } from '@linch-kit/schema'
import { z } from 'zod'

// 定义租户设置类型
export interface TenantSettings {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  features?: string[]
}

// 定义租户元数据类型
export interface TenantMetadata {
  industry?: string
  size?: 'small' | 'medium' | 'large' | 'enterprise'
  contactEmail?: string
  contactPhone?: string
  businessLicenseIssuer?: string  // 营业执照颁发机构
  businessLicenseExpiry?: string  // 营业执照到期日期 (YYYY-MM-DD)
  [key: string]: unknown
}

/**
 * 租户实体 - 核心多租户支持
 */
export const TenantEntity = defineEntity('Tenant', {
  // 基础字段
  name: defineField.string()
    .required()
    .unique()
    .max(100)
    .description('租户名称'),
  
  domain: defineField.string()
    .unique()
    .max(255)
    .optional()
    .description('自定义域名'),
  
  slug: defineField.string()
    .required()
    .unique()
    .max(50)
    .description('URL友好标识符'),
  
  description: defineField.text()
    .optional()
    .description('租户描述'),
  
  businessLicense: defineField.string()
    .optional()
    .max(50)
    .description('营业执照号码'),
  
  status: defineField.enum(['active', 'suspended', 'deleted', 'pending'])
    .required()
    .default('active')
    .description('租户状态'),
  
  // 计费信息
  plan: defineField.enum(['free', 'starter', 'professional', 'enterprise'])
    .required()
    .default('free')
    .description('订阅计划'),
  
  billingCycle: defineField.enum(['monthly', 'yearly'])
    .optional()
    .description('计费周期'),
  
  maxUsers: defineField.int()
    .required()
    .default(10)
    .min(1)
    .description('最大用户数限制'),
  
  maxStorage: defineField.bigint()
    .required()
    .default(1073741824n) // 1GB
    .min(0n)
    .description('最大存储限制(字节)'),
  
  // 扩展字段
  settings: defineField.json<TenantSettings>()
    .default({})
    .description('租户特定设置'),
  
  metadata: defineField.json<TenantMetadata>()
    .default({})
    .description('扩展元数据'),
  
  // 关系字段
  users: defineField.relation('User').oneToMany(),
  plugins: defineField.relation('Plugin').manyToMany(),
  quotas: defineField.relation('TenantQuotas').oneToOne(),
  auditLogs: defineField.relation('AuditLog').oneToMany(),
  
  // 审计字段
  createdAt: defineField.datetime()
    .default('now')
    .description('创建时间'),
  
  updatedAt: defineField.datetime()
    .updatedAt()
    .description('更新时间'),
  
  deletedAt: defineField.datetime()
    .optional()
    .description('软删除时间')
})

/**
 * 租户配额实体 - 资源配额管理
 */
export const TenantQuotasEntity = defineEntity('TenantQuotas', {
  // 关系字段
  tenant: defineField.relation('Tenant')
    .oneToOne()
    .required()
    .description('关联租户'),
  
  // 用户配额
  maxUsers: defineField.int()
    .required()
    .default(10)
    .min(0)
    .description('最大用户数'),
  
  currentUsers: defineField.int()
    .required()
    .default(0)
    .min(0)
    .description('当前用户数'),
  
  // 存储配额
  maxStorage: defineField.bigint()
    .required()
    .default(1073741824n) // 1GB
    .min(0n)
    .description('最大存储限制(字节)'),
  
  currentStorage: defineField.bigint()
    .required()
    .default(0n)
    .min(0n)
    .description('当前存储使用量(字节)'),
  
  // API配额
  maxApiCalls: defineField.int()
    .required()
    .default(10000)
    .min(0)
    .description('最大API调用次数(每月)'),
  
  currentApiCalls: defineField.int()
    .required()
    .default(0)
    .min(0)
    .description('当前API调用次数'),
  
  apiResetAt: defineField.datetime()
    .optional()
    .description('API配额重置时间'),
  
  // 插件配额
  maxPlugins: defineField.int()
    .required()
    .default(5)
    .min(0)
    .description('最大插件数'),
  
  currentPlugins: defineField.int()
    .required()
    .default(0)
    .min(0)
    .description('当前插件数'),
  
  // 数据模型配额
  maxSchemas: defineField.int()
    .required()
    .default(10)
    .min(0)
    .description('最大Schema数'),
  
  currentSchemas: defineField.int()
    .required()
    .default(0)
    .min(0)
    .description('当前Schema数'),
  
  // 时间戳
  createdAt: defineField.datetime()
    .default('now')
    .description('创建时间'),
  
  updatedAt: defineField.datetime()
    .updatedAt()
    .description('更新时间')
})

// 导出类型
export type Tenant = z.infer<typeof TenantEntity.zodSchema>
export type TenantInput = z.infer<typeof TenantEntity.createSchema>
export type TenantUpdate = z.infer<typeof TenantEntity.updateSchema>

export type TenantQuotas = z.infer<typeof TenantQuotasEntity.zodSchema>
export type TenantQuotasInput = z.infer<typeof TenantQuotasEntity.createSchema>
export type TenantQuotasUpdate = z.infer<typeof TenantQuotasEntity.updateSchema>

// 导出 schemas 供路由使用
export const tenantCreateSchema = TenantEntity.createSchema
export const tenantUpdateSchema = TenantEntity.updateSchema
export const tenantQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'deleted', 'pending']).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  tenantId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})