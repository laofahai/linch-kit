/**
 * 系统监控实体定义
 *
 * 系统监控、指标和审计日志相关的实体模型
 */

import { defineEntity, defineField } from '@linch-kit/schema'
import { z } from 'zod'

// 定义指标数据类型
export interface MetricData {
  value: number
  unit?: string
  tags?: Record<string, string>
  metadata?: Record<string, unknown>
}

// 定义日志上下文类型
export interface LogContext {
  userId?: string
  tenantId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  [key: string]: unknown
}

/**
 * 系统指标实体 - 性能和资源监控
 */
export const SystemMetricEntity = defineEntity('SystemMetric', {
  // 基础字段
  type: defineField
    .enum(['cpu', 'memory', 'disk', 'network', 'database', 'api', 'cache', 'queue', 'custom'])
    .required()
    .description('console.entities.systemMetric.fields.type'),

  name: defineField
    .string()
    .required()
    .max(100)
    .description('console.entities.systemMetric.fields.name'),

  // 指标数据
  data: defineField
    .json<MetricData>()
    .required()
    .description('console.entities.systemMetric.fields.data'),

  // 来源信息
  source: defineField
    .string()
    .optional()
    .max(50)
    .description('console.entities.systemMetric.fields.source'),

  hostname: defineField
    .string()
    .optional()
    .max(255)
    .description('console.entities.systemMetric.fields.hostname'),

  // 关系字段
  tenant: defineField
    .relation('Tenant')
    .optional()
    .description('console.entities.systemMetric.fields.tenant'),

  // 时间戳
  timestamp: defineField
    .date()
    .required()
    .default('now')
    .description('console.entities.systemMetric.fields.timestamp'),

  // 索引优化
  createdAt: defineField.date().default('now').index(),
})

/**
 * 审计日志实体 - 操作审计和合规
 */
export const AuditLogEntity = defineEntity('AuditLog', {
  // 操作信息
  action: defineField
    .string()
    .required()
    .max(100)
    .description('console.entities.auditLog.fields.action'),

  resource: defineField
    .string()
    .required()
    .max(100)
    .description('console.entities.auditLog.fields.resource'),

  resourceId: defineField
    .string()
    .optional()
    .description('console.entities.auditLog.fields.resourceId'),

  // 结果信息
  status: defineField
    .enum(['success', 'failure', 'warning'])
    .required()
    .description('console.entities.auditLog.fields.status'),

  message: defineField.text().optional().description('console.entities.auditLog.fields.message'),

  // 变更信息
  changes: defineField.json().optional().description('console.entities.auditLog.fields.changes'),

  // 上下文
  context: defineField
    .json<LogContext>()
    .default({})
    .description('console.entities.auditLog.fields.context'),

  // 关系字段
  user: defineField
    .relation('User')
    .optional()
    .description('console.entities.auditLog.fields.user'),

  tenant: defineField
    .relation('Tenant')
    .optional()
    .description('console.entities.auditLog.fields.tenant'),

  // 时间戳
  createdAt: defineField
    .date()
    .default('now')
    .index()
    .description('console.entities.auditLog.fields.createdAt'),
})

/**
 * 告警规则实体 - 监控告警配置
 */
export const AlertRuleEntity = defineEntity('AlertRule', {
  // 基础信息
  name: defineField
    .string()
    .required()
    .max(100)
    .description('console.entities.alertRule.fields.name'),

  description: defineField
    .text()
    .optional()
    .description('console.entities.alertRule.fields.description'),

  // 规则配置
  metricType: defineField
    .string()
    .required()
    .max(50)
    .description('console.entities.alertRule.fields.metricType'),

  condition: defineField
    .enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq'])
    .required()
    .description('console.entities.alertRule.fields.condition'),

  threshold: defineField
    .number()
    .required()
    .description('console.entities.alertRule.fields.threshold'),

  duration: defineField
    .int()
    .required()
    .min(1)
    .description('console.entities.alertRule.fields.duration'),

  // 告警配置
  severity: defineField
    .enum(['low', 'medium', 'high', 'critical'])
    .required()
    .default('medium')
    .description('console.entities.alertRule.fields.severity'),

  enabled: defineField
    .boolean()
    .default(true)
    .description('console.entities.alertRule.fields.enabled'),

  // 通知配置
  notificationChannels: defineField
    .array(defineField.string())
    .default([])
    .description('console.entities.alertRule.fields.notificationChannels'),

  // 关系字段
  tenant: defineField
    .relation('Tenant')
    .optional()
    .description('console.entities.alertRule.fields.tenant'),

  // 时间戳
  createdAt: defineField
    .date()
    .default('now')
    .description('console.entities.alertRule.fields.createdAt'),

  updatedAt: defineField
    .date()
    .default('now')
    .description('console.entities.alertRule.fields.updatedAt'),
})

/**
 * 告警事件实体 - 触发的告警记录
 */
export const AlertEventEntity = defineEntity('AlertEvent', {
  // 关系
  rule: defineField
    .relation('AlertRule')
    .required()
    .description('console.entities.alertEvent.fields.rule'),

  // 事件信息
  status: defineField
    .enum(['triggered', 'acknowledged', 'resolved'])
    .required()
    .default('triggered')
    .description('console.entities.alertEvent.fields.status'),

  value: defineField.number().required().description('console.entities.alertEvent.fields.value'),

  message: defineField.text().optional().description('console.entities.alertEvent.fields.message'),

  // 处理信息
  acknowledgedBy: defineField
    .relation('User')
    .optional()
    .description('console.entities.alertEvent.fields.acknowledgedBy'),

  acknowledgedAt: defineField
    .date()
    .optional()
    .description('console.entities.alertEvent.fields.acknowledgedAt'),

  resolvedBy: defineField
    .relation('User')
    .optional()
    .description('console.entities.alertEvent.fields.resolvedBy'),

  resolvedAt: defineField
    .date()
    .optional()
    .description('console.entities.alertEvent.fields.resolvedAt'),

  // 时间戳
  triggeredAt: defineField
    .date()
    .default('now')
    .description('console.entities.alertEvent.fields.triggeredAt'),
})

// 导出类型
export type SystemMetric = z.infer<typeof SystemMetricEntity.zodSchema>
export type SystemMetricInput = z.infer<typeof SystemMetricEntity.createSchema>

export type AuditLog = z.infer<typeof AuditLogEntity.zodSchema>
export type AuditLogInput = z.infer<typeof AuditLogEntity.createSchema>

export type AlertRule = z.infer<typeof AlertRuleEntity.zodSchema>
export type AlertRuleInput = z.infer<typeof AlertRuleEntity.createSchema>
export type AlertRuleUpdate = z.infer<typeof AlertRuleEntity.updateSchema>

export type AlertEvent = z.infer<typeof AlertEventEntity.zodSchema>
export type AlertEventInput = z.infer<typeof AlertEventEntity.createSchema>
export type AlertEventUpdate = z.infer<typeof AlertEventEntity.updateSchema>
