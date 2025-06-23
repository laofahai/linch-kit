import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

// 现在可以直接使用 Schema 包的 defineEntity 和 defineField

/**
 * 最小化用户实体模板
 *
 * 只包含最基本的字段：id 和 name（显示名称）
 * 性能优化版本：使用简化的实体定义
 */
export const MinimalUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),
  name: defineField(z.string().optional(), {
    label: 'auth.user.name'
  }),
}, {
  tableName: 'users',
  ui: {
    displayName: 'auth.user.displayName',
    description: 'auth.user.description',
  },
})

/**
 * 基础用户实体模板（包含常用字段）
 *
 * 性能优化版本：使用简化的实体定义，避免复杂的类型推导
 */
export const BasicUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),
  email: defineField(z.string().email().optional(), {
    unique: true,
    label: 'auth.user.email'
  }),
  phone: defineField(z.string().optional(), {
    label: 'auth.user.phone'
  }),
  username: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.username'
  }),
  name: defineField(z.string().optional(), {
    label: 'auth.user.name'
  }),
  avatar: defineField(z.string().url().optional(), {
    label: 'auth.user.avatar'
  }),
  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'auth.user.createdAt'
  }),
  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'auth.user.updatedAt'
  }),
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true }
  ],
  ui: {
    displayName: 'auth.user.basic.displayName',
    description: 'auth.user.basic.description',
  },
})
// 注释掉复杂的企业用户和多租户用户模板，避免 DTS 构建超时
// TODO: 在解决 DTS 构建性能问题后恢复这些模板

/**
 * 企业用户实体模板（包含角色和权限）
 *
 * 优化版本：使用 JSON 字段替代复杂关系，提升 DTS 构建性能
 */
export const EnterpriseUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),

  email: defineField(z.string().email(), {
    unique: true,
    label: 'auth.user.email'
  }),

  username: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.username'
  }),

  name: defineField(z.string(), {
    label: 'auth.user.name'
  }),

  // 企业信息
  employeeId: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.employeeId'
  }),

  // 部门信息（JSON 字段）
  departments: defineField(z.array(z.object({
    departmentId: z.string(),
    position: z.string().optional(),
    isManager: z.boolean().default(false),
    joinedAt: z.date(),
    isPrimary: z.boolean().default(false)
  })).optional(), {
    label: 'auth.user.departments',
    db: { type: 'JSON' }
  }),

  // 角色信息（JSON 字段）
  roles: defineField(z.array(z.string()).optional(), {
    label: 'auth.user.roles',
    db: { type: 'JSON' }
  }),

  // 权限信息（JSON 字段）
  permissions: defineField(z.array(z.string()).optional(), {
    label: 'auth.user.permissions',
    db: { type: 'JSON' }
  }),

  status: defineField(z.enum(['active', 'inactive', 'suspended']), {
    default: 'active',
    label: 'auth.user.status'
  }),

  emailVerified: defineField(z.boolean(), {
    default: false,
    label: 'auth.user.emailVerified'
  }),

  lastLoginAt: defineField(z.date().optional(), {
    label: 'auth.user.lastLoginAt'
  }),

  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'auth.user.createdAt'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'auth.user.updatedAt'
  })
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['employeeId'], unique: true },
    { fields: ['status'] }
  ],
  ui: {
    displayName: 'auth.user.enterprise.displayName',
    description: 'auth.user.enterprise.description'
  }
})

/**
 * 多租户用户实体模板
 *
 * 优化版本：使用 JSON 字段替代复杂关系，提升 DTS 构建性能
 */
export const MultiTenantUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),

  // 全局身份标识
  globalEmail: defineField(z.string().email().optional(), {
    unique: true,
    label: 'auth.user.globalEmail'
  }),

  globalUsername: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.globalUsername'
  }),

  name: defineField(z.string(), {
    label: 'auth.user.name'
  }),

  // 租户关联（JSON 字段）
  tenants: defineField(z.array(z.object({
    tenantId: z.string(),
    email: z.string().email().optional(),
    username: z.string().optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    departments: z.array(z.object({
      departmentId: z.string(),
      position: z.string().optional(),
      isManager: z.boolean().default(false)
    })).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
    joinedAt: z.date(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })).optional(), {
    label: 'auth.user.tenants',
    db: { type: 'JSON' }
  }),

  // 当前活跃租户
  currentTenantId: defineField(z.string().optional(), {
    label: 'auth.user.currentTenantId'
  }),

  // 全局状态
  globalStatus: defineField(z.enum(['active', 'inactive', 'suspended']), {
    default: 'active',
    label: 'auth.user.globalStatus'
  }),

  emailVerified: defineField(z.boolean(), {
    default: false,
    label: 'auth.user.emailVerified'
  }),

  lastLoginAt: defineField(z.date().optional(), {
    label: 'auth.user.lastLoginAt'
  }),

  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'auth.user.createdAt'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'auth.user.updatedAt'
  })
}, {
  tableName: 'users',
  indexes: [
    { fields: ['globalEmail'], unique: true },
    { fields: ['globalUsername'], unique: true },
    { fields: ['currentTenantId'] },
    { fields: ['globalStatus'] }
  ],
  ui: {
    displayName: 'auth.user.multiTenant.displayName',
    description: 'auth.user.multiTenant.description'
  }
})
