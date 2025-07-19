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
  [key: string]: unknown
}

/**
 * 租户实体 - 核心多租户支持
 */
export const TenantEntity = defineEntity('Tenant', {
  // 基础字段
  name: defineField
    .string()
    .required()
    .unique()
    .max(100)
    .description('console.entities.tenant.fields.name'),

  domain: defineField
    .string()
    .unique()
    .max(255)
    .optional()
    .description('console.entities.tenant.fields.domain'),

  slug: defineField
    .string()
    .required()
    .unique()
    .max(50)
    .description('console.entities.tenant.fields.slug'),

  description: defineField
    .text()
    .optional()
    .description('console.entities.tenant.fields.description'),

  status: defineField
    .enum(['active', 'suspended', 'deleted', 'pending'])
    .required()
    .default('active')
    .description('console.entities.tenant.fields.status'),

  // 计费信息
  plan: defineField
    .enum(['free', 'starter', 'professional', 'enterprise'])
    .required()
    .default('free')
    .description('console.entities.tenant.fields.plan'),

  billingCycle: defineField
    .enum(['monthly', 'yearly'])
    .optional()
    .description('console.entities.tenant.fields.billingCycle'),

  maxUsers: defineField
    .int()
    .required()
    .default(10)
    .min(1)
    .description('console.entities.tenant.fields.maxUsers'),

  maxStorage: defineField
    .number()
    .required()
    .default(1073741824) // 1GB
    .min(0)
    .description('console.entities.tenant.fields.maxStorage'),

  // 扩展字段
  settings: defineField
    .json<TenantSettings>()
    .default({})
    .description('console.entities.tenant.fields.settings'),

  metadata: defineField
    .json<TenantMetadata>()
    .default({})
    .description('console.entities.tenant.fields.metadata'),

  // 关系字段
  users: defineField.relation('User').oneToMany(),
  plugins: defineField.relation('Plugin').manyToMany(),
  quotas: defineField.relation('TenantQuotas').oneToOne(),
  auditLogs: defineField.relation('AuditLog').oneToMany(),

  // 审计字段
  createdAt: defineField
    .date()
    .default('now')
    .description('console.entities.tenant.fields.createdAt'),

  updatedAt: defineField
    .date()
    .default('now')
    .description('console.entities.tenant.fields.updatedAt'),

  deletedAt: defineField
    .date()
    .optional()
    .description('console.entities.tenant.fields.deletedAt'),
})

/**
 * 租户配额实体 - 资源配额管理
 */
export const TenantQuotasEntity = defineEntity('TenantQuotas', {
  // 关系字段
  tenant: defineField
    .relation('Tenant')
    .oneToOne()
    .required()
    .description('console.entities.tenantQuotas.fields.tenant'),

  // 用户配额
  maxUsers: defineField
    .int()
    .required()
    .default(10)
    .min(0)
    .description('console.entities.tenantQuotas.fields.maxUsers'),

  currentUsers: defineField
    .int()
    .required()
    .default(0)
    .min(0)
    .description('console.entities.tenantQuotas.fields.currentUsers'),

  // 存储配额
  maxStorage: defineField
    .number()
    .required()
    .default(1073741824) // 1GB
    .min(0)
    .description('console.entities.tenantQuotas.fields.maxStorage'),

  currentStorage: defineField
    .number()
    .required()
    .default(0)
    .min(0)
    .description('console.entities.tenantQuotas.fields.currentStorage'),

  // API配额
  maxApiCalls: defineField
    .int()
    .required()
    .default(10000)
    .min(0)
    .description('console.entities.tenantQuotas.fields.maxApiCalls'),

  currentApiCalls: defineField
    .int()
    .required()
    .default(0)
    .min(0)
    .description('console.entities.tenantQuotas.fields.currentApiCalls'),

  apiResetAt: defineField
    .date()
    .optional()
    .description('console.entities.tenantQuotas.fields.apiResetAt'),

  // 插件配额
  maxPlugins: defineField
    .int()
    .required()
    .default(5)
    .min(0)
    .description('console.entities.tenantQuotas.fields.maxPlugins'),

  currentPlugins: defineField
    .int()
    .required()
    .default(0)
    .min(0)
    .description('console.entities.tenantQuotas.fields.currentPlugins'),

  // 数据模型配额
  maxSchemas: defineField
    .int()
    .required()
    .default(10)
    .min(0)
    .description('console.entities.tenantQuotas.fields.maxSchemas'),

  currentSchemas: defineField
    .int()
    .required()
    .default(0)
    .min(0)
    .description('console.entities.tenantQuotas.fields.currentSchemas'),

  // 时间戳
  createdAt: defineField
    .date()
    .default('now')
    .description('console.entities.tenantQuotas.fields.createdAt'),

  updatedAt: defineField
    .date()
    .default('now')
    .description('console.entities.tenantQuotas.fields.updatedAt'),
})

// 导出类型
export type Tenant = z.infer<typeof TenantEntity.zodSchema>
export type TenantInput = z.infer<typeof TenantEntity.createSchema>
export type TenantUpdate = z.infer<typeof TenantEntity.updateSchema>

export type TenantQuotas = z.infer<typeof TenantQuotasEntity.zodSchema>
export type TenantQuotasInput = z.infer<typeof TenantQuotasEntity.createSchema>
export type TenantQuotasUpdate = z.infer<typeof TenantQuotasEntity.updateSchema>
