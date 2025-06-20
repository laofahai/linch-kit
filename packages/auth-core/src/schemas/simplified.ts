import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 简化的用户实体 - JSON 优先架构
 * 
 * 使用 JSON 字段替代复杂的多对多关系表，减少数据库复杂性
 */
export const SimplifiedUserTemplate = defineEntity('User', {
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
  
  // 租户关联（JSON 字段，替代 UserRole 关联表）
  tenants: defineField(z.array(z.object({
    tenantId: z.string(),
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
      isPrimary: z.boolean().default(false)
    })).optional(),
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
  }),
  
  // 软删除字段
  deletedAt: defineField(z.date().optional(), {
    softDelete: true,
    label: 'auth.user.deletedAt',
    map: 'deleted_at'
  })
}, {
  tableName: 'users',
  ui: {
    displayName: 'auth.user.simplified.displayName',
    description: 'auth.user.simplified.description',
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

/**
 * 简化的角色实体
 */
export const SimplifiedRoleTemplate = defineEntity('Role', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.role.id'
  }),
  
  name: defineField(z.string(), {
    unique: true,
    label: 'auth.role.name'
  }),
  
  displayName: defineField(z.string().optional(), {
    label: 'auth.role.displayName'
  }),
  
  description: defineField(z.string().optional(), {
    label: 'auth.role.description'
  }),
  
  // 权限列表（JSON 字段）
  permissions: defineField(z.array(z.string()).optional(), {
    label: 'auth.role.permissions',
    db: { type: 'JSON' }
  }),
  
  // 角色继承（JSON 字段）
  inherits: defineField(z.array(z.string()).optional(), {
    label: 'auth.role.inherits',
    db: { type: 'JSON' }
  }),
  
  // 多租户支持
  tenantId: defineField(z.string().optional(), {
    label: 'auth.role.tenantId'
  }),
  
  type: defineField(z.enum(['system', 'custom']), {
    default: 'custom',
    label: 'auth.role.type'
  }),
  
  enabled: defineField(z.boolean(), {
    default: true,
    label: 'auth.role.enabled'
  }),
  
  priority: defineField(z.number().int(), {
    default: 0,
    label: 'auth.role.priority'
  }),
  
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.role.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'auth.role.createdAt'
  }),
  
  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'auth.role.updatedAt'
  }),
  
  // 软删除字段
  deletedAt: defineField(z.date().optional(), {
    softDelete: true,
    label: 'auth.role.deletedAt',
    map: 'deleted_at'
  })
}, {
  tableName: 'roles',
  indexes: [
    { fields: ['tenantId'] },
    { fields: ['type'] },
    { fields: ['enabled'] }
  ],
  ui: {
    displayName: 'auth.role.simplified.displayName',
    description: 'auth.role.simplified.description'
  }
})

/**
 * 简化的部门实体
 */
export const SimplifiedDepartmentTemplate = defineEntity('Department', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.department.id'
  }),

  name: defineField(z.string(), {
    label: 'auth.department.name'
  }),

  // 上级部门（简化为字符串 ID，避免自引用关系）
  parentId: defineField(z.string().optional(), {
    label: 'auth.department.parentId'
  }),

  // 部门路径（便于查询）
  path: defineField(z.string(), {
    unique: true,
    label: 'auth.department.path'
  }),

  // 部门层级
  level: defineField(z.number().int().min(0), {
    default: 0,
    label: 'auth.department.level'
  }),

  // 部门负责人（简化为字符串 ID）
  managerId: defineField(z.string().optional(), {
    label: 'auth.department.managerId'
  }),

  description: defineField(z.string().optional(), {
    label: 'auth.department.description'
  }),

  status: defineField(z.enum(['active', 'inactive']), {
    default: 'active',
    label: 'auth.department.status'
  }),

  sort: defineField(z.number().int(), {
    default: 0,
    label: 'auth.department.sort'
  }),

  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.department.metadata',
    db: { type: 'JSON' }
  }),

  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'auth.department.createdAt'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'auth.department.updatedAt'
  }),
  
  // 软删除字段
  deletedAt: defineField(z.date().optional(), {
    softDelete: true,
    label: 'auth.department.deletedAt',
    map: 'deleted_at'
  })
}, {
  tableName: 'departments',
  indexes: [
    { fields: ['level'] },
    { fields: ['status'] }
  ],
  ui: {
    displayName: 'auth.department.simplified.displayName',
    description: 'auth.department.simplified.description'
  }
})
