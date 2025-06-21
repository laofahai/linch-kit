import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 角色实体模板
 */
export const RoleTemplate = defineEntity('Role', {
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
  
  // 权限列表
  permissions: defineField(z.array(z.string()).optional(), {
    label: 'auth.role.permissions',
    db: { type: 'JSON' }
  }),
  
  // 角色继承
  inherits: defineField(z.array(z.string()).optional(), {
    label: 'auth.role.inherits',
    db: { type: 'JSON' }
  }),
  
  // 多租户支持
  tenantId: defineField(z.string().optional(), {
    label: 'auth.role.tenantId'
  }),
  
  // 角色类型
  type: defineField(z.enum(['system', 'tenant', 'custom']), {
    default: 'custom',
    label: 'auth.role.type'
  }),
  
  // 是否启用
  enabled: defineField(z.boolean(), {
    default: true,
    label: 'auth.role.enabled'
  }),
  
  // 优先级
  priority: defineField(z.number().int(), {
    default: 0,
    label: 'auth.role.priority'
  }),
  
  // 扩展数据
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
  })
}, {
  tableName: 'roles',
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['tenantId'] },
    { fields: ['type'] },
    { fields: ['enabled'] }
  ],
  ui: {
    displayName: 'auth.role.displayName',
    description: 'auth.role.description',
    groups: [
      {
        name: 'basic',
        label: 'auth.role.groups.basic',
        fields: ['name', 'displayName', 'description', 'type']
      },
      {
        name: 'permissions',
        label: 'auth.role.groups.permissions',
        fields: ['permissions', 'inherits']
      },
      {
        name: 'settings',
        label: 'auth.role.groups.settings',
        fields: ['enabled', 'priority', 'tenantId']
      }
    ]
  }
})

/**
 * 权限实体模板
 */
export const PermissionTemplate = defineEntity('Permission', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.permission.id'
  }),
  
  resource: defineField(z.string(), {
    label: 'auth.permission.resource'
  }),
  
  action: defineField(z.string(), {
    label: 'auth.permission.action'
  }),
  
  // 权限标识符（resource:action）
  identifier: defineField(z.string(), {
    unique: true,
    label: 'auth.permission.identifier'
  }),
  
  displayName: defineField(z.string().optional(), {
    label: 'auth.permission.displayName'
  }),
  
  description: defineField(z.string().optional(), {
    label: 'auth.permission.description'
  }),
  
  // 权限条件（ABAC）
  conditions: defineField(z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains']),
    value: z.any()
  })).optional(), {
    label: 'auth.permission.conditions',
    db: { type: 'JSON' }
  }),
  
  // 权限分组
  group: defineField(z.string().optional(), {
    label: 'auth.permission.group'
  }),
  
  // 多租户支持
  tenantId: defineField(z.string().optional(), {
    label: 'auth.permission.tenantId'
  }),
  
  // 是否启用
  enabled: defineField(z.boolean(), {
    default: true,
    label: 'auth.permission.enabled'
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.permission.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'auth.permission.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'auth.permission.updatedAt'
  })
}, {
  tableName: 'permissions',
  indexes: [
    { fields: ['identifier'], unique: true },
    { fields: ['resource'] },
    { fields: ['action'] },
    { fields: ['resource', 'action'] },
    { fields: ['group'] },
    { fields: ['tenantId'] },
    { fields: ['enabled'] }
  ],
  ui: {
    displayName: 'auth.permission.displayName',
    description: 'auth.permission.description',
    groups: [
      {
        name: 'basic',
        label: 'auth.permission.groups.basic',
        fields: ['resource', 'action', 'identifier', 'displayName', 'description']
      },
      {
        name: 'conditions',
        label: 'auth.permission.groups.conditions',
        fields: ['conditions']
      },
      {
        name: 'settings',
        label: 'auth.permission.groups.settings',
        fields: ['group', 'enabled', 'tenantId']
      }
    ]
  }
})

/**
 * 用户角色关联实体模板
 */
export const UserRoleTemplate = defineEntity('UserRole', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.userRole.id'
  }),
  
  userId: defineField(z.string(), {
    label: 'auth.userRole.userId',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'userId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),
  
  roleId: defineField(z.string(), {
    label: 'auth.userRole.roleId',
    relation: {
      type: 'many-to-one',
      model: 'Role',
      foreignKey: 'roleId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),
  
  // 多租户支持
  tenantId: defineField(z.string().optional(), {
    label: 'auth.userRole.tenantId'
  }),
  
  // 分配时间
  assignedAt: defineField(z.date(), {
    default: new Date(),
    label: 'auth.userRole.assignedAt'
  }),
  
  // 分配者
  assignedBy: defineField(z.string().optional(), {
    label: 'auth.userRole.assignedBy'
  }),
  
  // 过期时间
  expiresAt: defineField(z.date().optional(), {
    label: 'auth.userRole.expiresAt'
  }),
  
  // 是否启用
  enabled: defineField(z.boolean(), {
    default: true,
    label: 'auth.userRole.enabled'
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.userRole.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'auth.userRole.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'auth.userRole.updatedAt'
  })
}, {
  tableName: 'user_roles',
  indexes: [
    { fields: ['userId', 'roleId', 'tenantId'], unique: true },
    { fields: ['userId'] },
    { fields: ['roleId'] },
    { fields: ['tenantId'] },
    { fields: ['enabled'] },
    { fields: ['expiresAt'] }
  ],
  ui: {
    displayName: 'auth.userRole.displayName',
    description: 'auth.userRole.description'
  }
})

/**
 * 部门实体模板（层级权限支持）
 */
export const DepartmentTemplate = defineEntity('Department', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.department.id'
  }),

  name: defineField(z.string(), {
    label: 'auth.department.name'
  }),

  // 上级部门
  parentId: defineField(z.string().optional(), {
    label: 'auth.department.parentId',
    relation: {
      type: 'many-to-one',
      model: 'Department',
      foreignKey: 'parentId',
      references: 'id'
    }
  }),

  // 部门路径（便于查询）
  path: defineField(z.string(), {
    label: 'auth.department.path'
  }),

  // 部门层级
  level: defineField(z.number().int().min(0), {
    default: 0,
    label: 'auth.department.level'
  }),

  // 部门负责人
  managerId: defineField(z.string().optional(), {
    label: 'auth.department.managerId',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'managerId',
      references: 'id'
    }
  }),

  // 部门描述
  description: defineField(z.string().optional(), {
    label: 'auth.department.description'
  }),

  // 部门状态
  status: defineField(z.enum(['active', 'inactive']), {
    default: 'active',
    label: 'auth.department.status'
  }),

  // 排序
  sort: defineField(z.number().int(), {
    default: 0,
    label: 'auth.department.sort'
  }),

  // 扩展数据
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
  })
}, {
  tableName: 'departments',
  indexes: [
    { fields: ['parentId'] },
    { fields: ['path'], unique: true },
    { fields: ['level'] },
    { fields: ['managerId'] },
    { fields: ['status'] }
  ],
  ui: {
    displayName: 'auth.department.displayName',
    description: 'auth.department.description',
    groups: [
      {
        name: 'basic',
        label: 'auth.department.groups.basic',
        fields: ['name', 'parentId', 'description']
      },
      {
        name: 'hierarchy',
        label: 'auth.department.groups.hierarchy',
        fields: ['path', 'level', 'sort']
      },
      {
        name: 'management',
        label: 'auth.department.groups.management',
        fields: ['managerId', 'status']
      }
    ]
  }
})

/**
 * 用户部门关联实体模板
 */
export const UserDepartmentTemplate = defineEntity('UserDepartment', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.userDepartment.id'
  }),

  userId: defineField(z.string(), {
    label: 'auth.userDepartment.userId',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'userId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),

  departmentId: defineField(z.string(), {
    label: 'auth.userDepartment.departmentId',
    relation: {
      type: 'many-to-one',
      model: 'Department',
      foreignKey: 'departmentId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),

  // 职位
  position: defineField(z.string().optional(), {
    label: 'auth.userDepartment.position'
  }),

  // 是否为部门负责人
  isManager: defineField(z.boolean(), {
    default: false,
    label: 'auth.userDepartment.isManager'
  }),

  // 在部门中的层级
  level: defineField(z.number().int().min(0).optional(), {
    label: 'auth.userDepartment.level'
  }),

  // 直接上级
  reportTo: defineField(z.string().optional(), {
    label: 'auth.userDepartment.reportTo',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'reportTo',
      references: 'id'
    }
  }),

  // 加入时间
  joinedAt: defineField(z.date(), {
    default: new Date(),
    label: 'auth.userDepartment.joinedAt'
  }),

  // 离开时间
  leftAt: defineField(z.date().optional(), {
    label: 'auth.userDepartment.leftAt'
  }),

  // 是否为主部门
  isPrimary: defineField(z.boolean(), {
    default: false,
    label: 'auth.userDepartment.isPrimary'
  }),

  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.userDepartment.metadata',
    db: { type: 'JSON' }
  }),

  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'auth.userDepartment.createdAt'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'auth.userDepartment.updatedAt'
  })
}, {
  tableName: 'user_departments',
  indexes: [
    { fields: ['userId', 'departmentId'], unique: true },
    { fields: ['userId'] },
    { fields: ['departmentId'] },
    { fields: ['reportTo'] },
    { fields: ['isPrimary'] },
    { fields: ['leftAt'] }
  ],
  ui: {
    displayName: 'auth.userDepartment.displayName',
    description: 'auth.userDepartment.description'
  }
})

/**
 * 租户实体模板（多租户支持）
 */
export const TenantTemplate = defineEntity('Tenant', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.tenant.id'
  }),
  
  name: defineField(z.string(), {
    label: 'auth.tenant.name'
  }),
  
  slug: defineField(z.string(), {
    unique: true,
    label: 'auth.tenant.slug'
  }),
  
  domain: defineField(z.string().optional(), {
    unique: true,
    label: 'auth.tenant.domain'
  }),
  
  description: defineField(z.string().optional(), {
    label: 'auth.tenant.description'
  }),
  
  // 租户配置
  settings: defineField(z.record(z.any()).optional(), {
    label: 'auth.tenant.settings',
    db: { type: 'JSON' }
  }),
  
  // 租户状态
  status: defineField(z.enum(['active', 'inactive', 'suspended']), {
    default: 'active',
    label: 'auth.tenant.status'
  }),
  
  // 订阅信息
  plan: defineField(z.string().optional(), {
    label: 'auth.tenant.plan'
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.tenant.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'auth.tenant.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'auth.tenant.updatedAt'
  })
}, {
  tableName: 'tenants',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['domain'], unique: true },
    { fields: ['status'] }
  ],
  ui: {
    displayName: 'auth.tenant.displayName',
    description: 'auth.tenant.description',
    groups: [
      {
        name: 'basic',
        label: 'auth.tenant.groups.basic',
        fields: ['name', 'slug', 'domain', 'description']
      },
      {
        name: 'settings',
        label: 'auth.tenant.groups.settings',
        fields: ['settings', 'status', 'plan']
      }
    ]
  }
})
