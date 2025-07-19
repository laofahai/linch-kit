/**
 * @linch-kit/auth 实体导出
 * 
 * 认证系统的所有实体定义
 */

export * from './user.entity'
export * from './role.entity'

// 重新导出Console扩展中的认证相关实体
export * from '../../../../extensions/console/src/entities/auth-session.entity'
export * from '../../../../extensions/console/src/entities/tenant.entity'
export * from '../../../../extensions/console/src/entities/user-extensions.entity'

// 组合所有认证相关实体
export const AllAuthEntities = {
  // 核心用户实体
  User: () => import('./user.entity').then(m => m.UserEntity),
  MFAMethod: () => import('./user.entity').then(m => m.MFAMethodEntity),
  UserRole: () => import('./user.entity').then(m => m.UserRoleEntity),
  
  // 角色权限实体
  Role: () => import('./role.entity').then(m => m.RoleEntity),
  Permission: () => import('./role.entity').then(m => m.PermissionEntity),
  JWTBlacklist: () => import('./role.entity').then(m => m.JWTBlacklistEntity),
  
  // Console扩展实体
  AuthSession: () => import('../../../../extensions/console/src/entities/auth-session.entity').then(m => m.AuthSessionEntity),
  AuthMetrics: () => import('../../../../extensions/console/src/entities/auth-session.entity').then(m => m.AuthMetricsEntity),
  AuthConfig: () => import('../../../../extensions/console/src/entities/auth-session.entity').then(m => m.AuthConfigEntity),
  Tenant: () => import('../../../../extensions/console/src/entities/tenant.entity').then(m => m.TenantEntity),
  TenantQuota: () => import('../../../../extensions/console/src/entities/tenant.entity').then(m => m.TenantQuotaEntity),
  UserActivity: () => import('../../../../extensions/console/src/entities/user-extensions.entity').then(m => m.UserActivityEntity),
  UserNotification: () => import('../../../../extensions/console/src/entities/user-extensions.entity').then(m => m.UserNotificationEntity),
} as const