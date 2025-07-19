/**
 * 角色和权限实体定义
 * 
 * LinchKit 认证系统的 RBAC (Role-Based Access Control) 实体
 * 支持角色继承、字段级权限、CASL集成等企业级功能
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 权限动作枚举
 */
export const PermissionActionEnum = [
  'create', 'read', 'update', 'delete', 'manage',
  'execute', 'view', 'edit', 'publish', 'approve'
] as const
export type PermissionAction = typeof PermissionActionEnum[number]

/**
 * 权限主体枚举
 */
export const PermissionSubjectEnum = [
  'User', 'Role', 'Permission', 'Category', 'Tag', 'Config', 'AuditLog', 'all'
] as const
export type PermissionSubject = typeof PermissionSubjectEnum[number]

/**
 * 角色实体定义
 */
export const RoleEntity = defineEntity('Role', {
  // 基础信息
  id: defineField.string().required().description('角色ID'),
  name: defineField.string().required().max(100).description('角色名称'),
  description: defineField.text().optional().description('角色描述'),
  
  // 权限列表
  permissions: defineField.array(defineField.string()).default([]).description('权限列表'),
  
  // 角色继承
  parentRoleId: defineField.string().optional().description('父角色ID'),
  inherits: defineField.array(defineField.string()).optional().description('继承的角色'),
  
  // 系统角色标识
  isSystemRole: defineField.boolean().default(false).description('是否为系统角色'),
  
  // 多租户支持
  tenantId: defineField.string().optional().description('租户ID'),
  
  // 审计字段
  createdAt: defineField.date().default('now').description('创建时间'),
  updatedAt: defineField.date().default('now').description('更新时间'),
  
  // 关系
  parentRole: defineField.relation('Role').manyToOne().foreignKey('parentRoleId').description('父角色'),
  childRoles: defineField.relation('Role').oneToMany().foreignKey('parentRoleId').description('子角色'),
  users: defineField.relation('User').manyToMany().description('拥有此角色的用户'),
  tenant: defineField.relation('Tenant').manyToOne().foreignKey('tenantId').description('所属租户'),
}, {
  tableName: 'roles',
  timestamps: true,
  
  // 索引
  indexes: [
    { fields: ['name'] },
    { fields: ['tenantId'] },
    { fields: ['isSystemRole'] },
    { fields: ['name', 'tenantId'], unique: true },
  ],
})

/**
 * 权限实体定义
 */
export const PermissionEntity = defineEntity('Permission', {
  // 基础信息
  id: defineField.string().required().description('权限ID'),
  name: defineField.string().required().max(100).description('权限名称'),
  action: defineField.string().required().max(50).description('权限动作'),
  subject: defineField.string().required().max(100).description('权限主体'),
  
  // CASL权限条件
  conditions: defineField.json<Record<string, unknown>>().optional().description('权限条件'),
  
  // 字段级权限
  fields: defineField.array(defineField.string()).optional().description('字段列表'),
  allowedFields: defineField.array(defineField.string()).optional().description('允许的字段'),
  deniedFields: defineField.array(defineField.string()).optional().description('拒绝的字段'),
  
  // 描述信息
  description: defineField.text().optional().description('权限描述'),
  isSystemPermission: defineField.boolean().default(false).description('是否为系统权限'),
  
  // 审计字段
  createdAt: defineField.date().default('now').description('创建时间'),
  updatedAt: defineField.date().default('now').description('更新时间'),
}, {
  tableName: 'permissions',
  timestamps: true,
  
  // 索引
  indexes: [
    { fields: ['name'] },
    { fields: ['action'] },
    { fields: ['subject'] },
    { fields: ['isSystemPermission'] },
  ],
})

/**
 * JWT黑名单实体
 */
export const JWTBlacklistEntity = defineEntity('JWTBlacklist', {
  // 基础信息
  id: defineField.string().required().description('黑名单记录ID'),
  jti: defineField.string().required().unique().description('JWT ID'),
  userId: defineField.string().optional().description('用户ID'),
  tokenHash: defineField.string().required().description('Token哈希'),
  
  // 过期时间
  expiresAt: defineField.date().required().description('过期时间'),
  
  // 撤销信息
  revokedAt: defineField.date().default('now').description('撤销时间'),
  revokedBy: defineField.string().optional().description('撤销人ID'),
  revokedReason: defineField.text().optional().description('撤销原因'),
  
  // 审计字段
  createdAt: defineField.date().default('now').description('创建时间'),
  
  // 关系
  user: defineField.relation('User').manyToOne().foreignKey('userId').description('用户'),
  revokedByUser: defineField.relation('User').manyToOne().foreignKey('revokedBy').description('撤销人'),
}, {
  tableName: 'jwt_blacklist',
  timestamps: false,
  
  // 索引
  indexes: [
    { fields: ['jti'], unique: true },
    { fields: ['expiresAt'] },
    { fields: ['userId'] },
  ],
})

/**
 * 导出权限管理相关实体
 */
export const RolePermissionEntities = {
  Role: RoleEntity,
  Permission: PermissionEntity,
  JWTBlacklist: JWTBlacklistEntity,
} as const