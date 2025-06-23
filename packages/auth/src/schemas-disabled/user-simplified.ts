import { z } from 'zod'
import { defineEntity } from '@linch-kit/schema'

/**
 * 简化版用户实体模板 - 不使用defineField
 * 
 * 这是临时解决方案，用于验证defineEntity修复的有效性
 * 后续需要恢复使用defineField的完整功能
 */

/**
 * 最小化用户实体模板
 */
export const MinimalUserTemplate = defineEntity(
  'User',
  {
    id: z.string(),
    name: z.string().optional(),
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
 * 基础用户实体模板
 */
export const BasicUserTemplate = defineEntity(
  'User',
  {
    id: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().url().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
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
 * 企业用户实体模板
 */
export const EnterpriseUserTemplate = defineEntity(
  'User',
  {
    id: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().url().optional(),
    employeeId: z.string().optional(),
    department: z.string().optional(),
    jobTitle: z.string().optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    departments: z.array(z.object({
      departmentId: z.string(),
      position: z.string().optional(),
      isManager: z.boolean().default(false),
      level: z.number().int().min(0).optional(),
      reportTo: z.string().optional(),
      joinedAt: z.date(),
      leftAt: z.date().optional(),
      isPrimary: z.boolean().default(false),
      metadata: z.record(z.unknown()).optional(),
    })).optional(),
    tenantId: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
    metadata: z.record(z.unknown()).optional(),
    lastLoginAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.displayName',
      description: 'auth.user.enterprise.description',
    },
  }
)

/**
 * 多租户用户实体模板
 */
export const MultiTenantUserTemplate = defineEntity(
  'User',
  {
    id: z.string(),
    globalEmail: z.string().email().optional(),
    globalPhone: z.string().optional(),
    globalUsername: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().url().optional(),
    tenants: z.array(z.object({
      tenantId: z.string(),
      roles: z.array(z.string()).optional(),
      permissions: z.array(z.string()).optional(),
      status: z.enum(['active', 'inactive', 'suspended']).default('active'),
      joinedAt: z.date(),
      metadata: z.record(z.unknown()).optional(),
    })).optional(),
    currentTenantId: z.string().optional(),
    globalStatus: z.enum(['active', 'inactive', 'suspended']).default('active'),
    metadata: z.record(z.unknown()).optional(),
    lastLoginAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.multiTenant.displayName',
      description: 'auth.user.multiTenant.description',
    },
  }
)
