import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 最小化用户实体模板
 *
 * 只包含最基本的字段：id 和 name（显示名称）
 */
export const MinimalUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),

  name: defineField(z.string().optional(), {
    label: 'auth.user.name'
  })
}, {
  tableName: 'users',
  ui: {
    displayName: 'auth.user.displayName',
    description: 'auth.user.description'
  }
})

/**
 * 基础用户实体模板（包含常用字段）
 */
export const BasicUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),
  
  // 可选的标识字段，用户可以选择使用
  email: defineField(z.string().email().optional(), {
    unique: true,
    label: 'auth.user.email'
  }),
  
  phone: defineField(z.string().optional(), {
    unique: true,
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
  })
}, {
  tableName: 'users',
  ui: {
    displayName: 'auth.user.displayName',
    description: 'auth.user.description',
    groups: [
      {
        name: 'identity',
        label: 'auth.user.groups.identity',
        fields: ['email', 'phone', 'username']
      },
      {
        name: 'profile',
        label: 'auth.user.groups.profile',
        fields: ['name', 'avatar']
      }
    ]
  }
})

/**
 * 企业用户实体模板（包含角色和权限）
 */
export const EnterpriseUserTemplate = defineEntity('User', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.user.id'
  }),
  
  // 身份标识
  email: defineField(z.string().email().optional(), {
    unique: true,
    label: 'auth.user.email'
  }),
  
  phone: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.phone'
  }),
  
  username: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.username'
  }),
  
  // 基本信息
  name: defineField(z.string().optional(), {
    label: 'auth.user.name'
  }),
  
  avatar: defineField(z.string().url().optional(), {
    label: 'auth.user.avatar'
  }),
  
  // 企业信息
  employeeId: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.employeeId'
  }),
  
  department: defineField(z.string().optional(), {
    label: 'auth.user.department'
  }),
  
  jobTitle: defineField(z.string().optional(), {
    label: 'auth.user.jobTitle'
  }),
  
  // 角色和权限
  roles: defineField(z.array(z.string()).optional(), {
    label: 'auth.user.roles'
  }),
  
  permissions: defineField(z.array(z.string()).optional(), {
    label: 'auth.user.permissions'
  }),
  
  // 多租户支持
  tenantId: defineField(z.string().optional(), {
    label: 'auth.user.tenantId'
  }),
  
  // 状态
  status: defineField(z.enum(['active', 'inactive', 'suspended']), {
    default: 'active',
    label: 'auth.user.status'
  }),
  
  // 扩展字段
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.user.metadata',
    db: { type: 'JSON' }
  }),
  
  // 时间戳
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
  ui: {
    displayName: 'auth.user.displayName',
    description: 'auth.user.enterprise.description',
    groups: [
      {
        name: 'identity',
        label: 'auth.user.groups.identity',
        fields: ['email', 'phone', 'username', 'employeeId']
      },
      {
        name: 'profile',
        label: 'auth.user.groups.profile',
        fields: ['name', 'avatar', 'department', 'jobTitle']
      },
      {
        name: 'permissions',
        label: 'auth.user.groups.permissions',
        fields: ['roles', 'permissions', 'status']
      },
      {
        name: 'tenant',
        label: 'auth.user.groups.tenant',
        fields: ['tenantId']
      }
    ]
  }
})

/**
 * 多租户用户实体模板
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
  
  globalPhone: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.globalPhone'
  }),
  
  globalUsername: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.user.globalUsername'
  }),
  
  // 基本信息
  name: defineField(z.string().optional(), {
    label: 'auth.user.name'
  }),
  
  avatar: defineField(z.string().url().optional(), {
    label: 'auth.user.avatar'
  }),
  
  // 租户关联
  tenants: defineField(z.array(z.object({
    tenantId: z.string(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
    joinedAt: z.date(),
    metadata: z.record(z.any()).optional()
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
  
  // 扩展字段
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.user.metadata',
    db: { type: 'JSON' }
  }),
  
  // 时间戳
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
  ui: {
    displayName: 'auth.user.multiTenant.displayName',
    description: 'auth.user.multiTenant.description',
    groups: [
      {
        name: 'global',
        label: 'auth.user.groups.global',
        fields: ['globalEmail', 'globalPhone', 'globalUsername', 'name', 'avatar']
      },
      {
        name: 'tenants',
        label: 'auth.user.groups.tenants',
        fields: ['tenants', 'currentTenantId']
      },
      {
        name: 'status',
        label: 'auth.user.groups.status',
        fields: ['globalStatus']
      }
    ]
  }
})
