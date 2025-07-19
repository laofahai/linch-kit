/**
 * 用户实体定义
 * 
 * LinchKit 认证系统的核心用户实体
 * 基于 NextAuth.js 扩展，支持多租户和企业级功能
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 用户状态枚举
 */
export const UserStatusEnum = ['active', 'inactive', 'disabled', 'pending'] as const
export type UserStatus = typeof UserStatusEnum[number]

/**
 * 用户实体定义
 */
export const UserEntity = defineEntity('User', {
  // 基础信息
  id: defineField.string().required().description('用户唯一标识'),
  email: defineField.email().required().unique().description('用户邮箱'),
  name: defineField.string().optional().max(255).description('用户姓名'),
  image: defineField.string().optional().max(500).description('用户头像URL'),
  
  // 状态信息
  status: defineField.enum(UserStatusEnum).default('active').description('用户状态'),
  emailVerified: defineField.date().optional().description('邮箱验证时间'),
  
  // 个人信息
  birthday: defineField.date().optional().description('生日'),
  
  // 多租户支持
  tenantId: defineField.string().optional().description('所属租户ID'),
  
  // 元数据
  metadata: defineField.json<Record<string, unknown>>().default({}).description('用户元数据'),
  
  // 审计字段
  createdAt: defineField.date().default('now').description('创建时间'),
  updatedAt: defineField.date().default('now').description('更新时间'),
  deletedAt: defineField.date().optional().description('删除时间（软删除）'),
  
  // 登录相关
  lastLoginAt: defineField.date().optional().description('最后登录时间'),
  
  // 关系
  roles: defineField.relation('Role').manyToMany().description('用户角色'),
  sessions: defineField.relation('AuthSession').oneToMany().description('用户会话'),
  auditLogs: defineField.relation('AuditLog').oneToMany().description('审计日志'),
  mfaMethods: defineField.relation('MFAMethod').oneToMany().description('多因子认证方法'),
  activities: defineField.relation('UserActivity').oneToMany().description('用户活动'),
  notifications: defineField.relation('UserNotification').oneToMany().description('用户通知'),
}, {
  // 实体选项
  tableName: 'users',
  timestamps: true,
  softDelete: true,
  
  // 索引
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['tenantId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
    { fields: ['lastLoginAt'] },
  ],
})

/**
 * 多因子认证方法类型
 */
export const MFAMethodTypeEnum = ['totp', 'sms', 'email', 'backup_codes'] as const
export type MFAMethodType = typeof MFAMethodTypeEnum[number]

/**
 * MFA方法实体
 */
export const MFAMethodEntity = defineEntity('MFAMethod', {
  // 基础信息
  id: defineField.string().required().description('MFA方法ID'),
  userId: defineField.string().required().description('用户ID'),
  methodType: defineField.enum(MFAMethodTypeEnum).required().description('MFA方法类型'),
  
  // 方法配置
  config: defineField.json<Record<string, unknown>>().required().description('MFA方法配置'),
  secret: defineField.string().optional().description('密钥'),
  
  // 状态信息
  isEnabled: defineField.boolean().default(true).description('是否启用'),
  isVerified: defineField.boolean().default(false).description('是否已验证'),
  backupCodes: defineField.array(defineField.string()).optional().description('备用代码'),
  
  // 审计字段
  createdAt: defineField.date().default('now').description('创建时间'),
  updatedAt: defineField.date().default('now').description('更新时间'),
  verifiedAt: defineField.date().optional().description('验证时间'),
  lastUsedAt: defineField.date().optional().description('最后使用时间'),
  
  // 关系
  user: defineField.relation('User').manyToOne().description('所属用户'),
}, {
  tableName: 'mfa_methods',
  timestamps: true,
  
  // 索引
  indexes: [
    { fields: ['userId'] },
    { fields: ['methodType'] },
    { fields: ['isEnabled'] },
  ],
})

/**
 * 用户-角色关联实体
 */
export const UserRoleEntity = defineEntity('UserRole', {
  // 基础信息
  id: defineField.string().required().description('关联ID'),
  userId: defineField.string().required().description('用户ID'),
  roleId: defineField.string().required().description('角色ID'),
  
  // 权限上下文
  context: defineField.json<Record<string, unknown>>().optional().description('权限上下文'),
  
  // 生效时间
  grantedAt: defineField.date().default('now').description('授权时间'),
  grantedBy: defineField.string().optional().description('授权人ID'),
  expiresAt: defineField.date().optional().description('过期时间'),
  
  // 审计字段
  createdAt: defineField.date().default('now').description('创建时间'),
  updatedAt: defineField.date().default('now').description('更新时间'),
  
  // 关系
  user: defineField.relation('User').manyToOne().description('用户'),
  role: defineField.relation('Role').manyToOne().description('角色'),
  grantedByUser: defineField.relation('User').manyToOne().foreignKey('grantedBy').description('授权人'),
}, {
  tableName: 'user_roles',
  timestamps: true,
  
  // 索引
  indexes: [
    { fields: ['userId'] },
    { fields: ['roleId'] },
    { fields: ['expiresAt'] },
    { fields: ['userId', 'roleId'], unique: true },
  ],
})

/**
 * 导出认证相关实体
 */
export const AuthEntities = {
  User: UserEntity,
  MFAMethod: MFAMethodEntity,
  UserRole: UserRoleEntity,
} as const