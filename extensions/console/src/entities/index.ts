/**
 * Console 模块实体导出
 *
 * 提供所有 Console 模块定义的实体和类型
 */

// 导出所有实体定义
export * from './tenant.entity'
export * from './plugin.entity'
export * from './monitoring.entity'
export * from './user-extensions.entity'

// 导入实体以创建集合
import { TenantEntity, TenantQuotasEntity } from './tenant.entity'
import { PluginEntity, PluginVersionEntity, TenantPluginEntity } from './plugin.entity'
import {
  SystemMetricEntity,
  AuditLogEntity,
  AlertRuleEntity,
  AlertEventEntity,
} from './monitoring.entity'
import { UserActivityEntity, UserNotificationEntity } from './user-extensions.entity'

/**
 * Console 模块的所有实体集合
 * 用于 Schema 生成和类型导出
 */
export const ConsoleEntities = {
  // 租户相关
  Tenant: TenantEntity,
  TenantQuotas: TenantQuotasEntity,

  // 插件相关
  Plugin: PluginEntity,
  PluginVersion: PluginVersionEntity,
  TenantPlugin: TenantPluginEntity,

  // 监控相关
  SystemMetric: SystemMetricEntity,
  AuditLog: AuditLogEntity,
  AlertRule: AlertRuleEntity,
  AlertEvent: AlertEventEntity,

  // 用户相关
  UserActivity: UserActivityEntity,
  UserNotification: UserNotificationEntity,
} as const

/**
 * Console 模块的用户扩展字段
 * 这些字段会被合并到 @linch-kit/auth 的 UserEntity 中
 */
export { ConsoleUserExtensions } from './user-extensions.entity'

// 导出实体名称类型
export type ConsoleEntityName = keyof typeof ConsoleEntities

// 导出用于 Prisma 生成的配置
export const consoleSchemaConfig = {
  entities: ConsoleEntities,
  namespace: 'console',
  description: 'LinchKit Console module entities',
}
