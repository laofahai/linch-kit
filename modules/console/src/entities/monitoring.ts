/**
 * 监控和审计实体定义
 *
 * 系统监控、指标收集、审计日志等相关实体
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 系统指标实体 - 性能监控
 */
export const SystemMetricEntity = defineEntity('SystemMetric', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '指标记录标识符',
  }),
  type: defineField.enum(
    ['CPU', 'MEMORY', 'DISK', 'NETWORK', 'DATABASE', 'API', 'USER', 'BUSINESS'],
    {
      required: true,
      description: '指标类型',
    }
  ),
  name: defineField.string({
    required: true,
    maxLength: 100,
    description: '指标名称',
  }),
  value: defineField.number({
    required: true,
    description: '指标值',
  }),
  unit: defineField.string({
    maxLength: 20,
    description: '指标单位',
  }),
  tags: defineField.json({
    description: '指标标签(JSON格式)',
  }),

  // 多租户支持
  tenantId: defineField.string({
    index: true,
    description: '租户ID(系统级指标为null)',
  }),

  // 时间戳
  timestamp: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '指标时间戳',
  }),
})

/**
 * 审计日志实体 - 操作审计
 */
export const AuditLogEntity = defineEntity('AuditLog', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '审计记录标识符',
  }),
  action: defineField.string({
    required: true,
    maxLength: 100,
    description: '操作类型',
  }),
  resource: defineField.string({
    required: true,
    maxLength: 100,
    description: '资源类型',
  }),
  resourceId: defineField.string({
    description: '资源ID',
  }),

  // 用户信息
  userId: defineField.string({
    index: true,
    description: '操作用户ID',
  }),
  userEmail: defineField.string({
    description: '用户邮箱',
  }),
  actorId: defineField.string({
    description: '代理用户ID(如管理员代理操作)',
  }),

  // 请求信息
  ipAddress: defineField.string({
    maxLength: 45, // IPv6 最大长度
    description: 'IP地址',
  }),
  userAgent: defineField.text({
    description: '用户代理字符串',
  }),
  requestId: defineField.string({
    description: '请求ID',
  }),

  // 详细信息
  details: defineField.json({
    description: '操作详细信息(JSON格式)',
  }),
  oldValues: defineField.json({
    description: '变更前的值(JSON格式)',
  }),
  newValues: defineField.json({
    description: '变更后的值(JSON格式)',
  }),

  // 审计分类
  category: defineField.enum(['SECURITY', 'DATA', 'SYSTEM', 'BUSINESS', 'PERMISSION', 'PLUGIN'], {
    required: true,
    defaultValue: 'SYSTEM',
    description: '审计分类',
  }),
  severity: defineField.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required: true,
    defaultValue: 'LOW',
    description: '严重程度',
  }),
  result: defineField.enum(['SUCCESS', 'FAILURE', 'WARNING'], {
    required: true,
    defaultValue: 'SUCCESS',
    description: '操作结果',
  }),

  // 多租户支持
  tenantId: defineField.string({
    index: true,
    description: '租户ID',
  }),

  // 时间戳
  timestamp: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '审计时间戳',
  }),
})

/**
 * 系统通知实体 - 告警和通知
 */
export const NotificationEntity = defineEntity('Notification', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '通知标识符',
  }),

  // 多语言标题和内容
  title: defineField.json({
    required: true,
    description: '通知标题(多语言JSON格式: {"zh-CN": "标题", "en": "Title"})',
  }),
  message: defineField.json({
    required: true,
    description: '通知内容(多语言JSON格式)',
  }),

  type: defineField.enum(['ALERT', 'INFO', 'WARNING', 'SUCCESS', 'MAINTENANCE'], {
    required: true,
    description: '通知类型',
  }),
  severity: defineField.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO'], {
    required: true,
    defaultValue: 'INFO',
    description: '通知严重程度',
  }),

  // 接收者
  userId: defineField.string({
    index: true,
    description: '特定用户ID(全局通知为null)',
  }),
  tenantId: defineField.string({
    index: true,
    description: '特定租户ID(全局通知为null)',
  }),
  roleId: defineField.string({
    description: '特定角色ID(角色通知)',
  }),

  // 状态
  status: defineField.enum(['UNREAD', 'READ', 'ARCHIVED'], {
    required: true,
    defaultValue: 'UNREAD',
    index: true,
    description: '通知状态',
  }),
  readAt: defineField.date({
    description: '阅读时间',
  }),

  // 通知渠道
  channels: defineField.array(defineField.enum(['WEB', 'EMAIL', 'SMS', 'WEBHOOK']), {
    description: '通知渠道',
  }),

  // 元数据
  metadata: defineField.json({
    description: '扩展元数据(JSON格式)',
  }),

  // 时间管理
  createdAt: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '创建时间',
  }),
  scheduledAt: defineField.date({
    description: '计划发送时间',
  }),
  sentAt: defineField.date({
    description: '实际发送时间',
  }),
  expiresAt: defineField.date({
    description: '过期时间',
  }),
})

/**
 * 系统健康检查实体 - 健康状态记录
 */
export const HealthCheckEntity = defineEntity('HealthCheck', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '健康检查记录标识符',
  }),
  service: defineField.string({
    required: true,
    maxLength: 100,
    description: '服务名称',
  }),
  status: defineField.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY'], {
    required: true,
    description: '健康状态',
  }),
  responseTime: defineField.number({
    minimum: 0,
    description: '响应时间(毫秒)',
  }),

  // 检查详情
  details: defineField.json({
    description: '健康检查详情(JSON格式)',
  }),
  errorMessage: defineField.text({
    description: '错误信息',
  }),

  // 依赖服务
  dependencies: defineField.array(defineField.string(), {
    description: '依赖的服务列表',
  }),

  // 时间戳
  checkedAt: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '检查时间',
  }),
})

/**
 * 告警规则实体 - 告警配置
 */
export const AlertRuleEntity = defineEntity('AlertRule', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '告警规则标识符',
  }),

  // 规则信息
  name: defineField.json({
    required: true,
    description: '告警规则名称(多语言)',
  }),
  description: defineField.json({
    description: '告警规则描述(多语言)',
  }),

  // 监控目标
  metricType: defineField.string({
    required: true,
    maxLength: 50,
    description: '监控指标类型',
  }),
  metricName: defineField.string({
    required: true,
    maxLength: 100,
    description: '监控指标名称',
  }),

  // 触发条件
  operator: defineField.enum(['>', '<', '>=', '<=', '==', '!='], {
    required: true,
    description: '比较操作符',
  }),
  threshold: defineField.number({
    required: true,
    description: '阈值',
  }),
  duration: defineField.int({
    required: true,
    minimum: 1,
    description: '持续时间(秒)',
  }),

  // 告警级别
  severity: defineField.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required: true,
    description: '告警级别',
  }),

  // 通知配置
  notificationChannels: defineField.array(defineField.enum(['WEB', 'EMAIL', 'SMS', 'WEBHOOK']), {
    required: true,
    description: '通知渠道',
  }),
  recipients: defineField.array(defineField.string(), {
    description: '接收人列表(用户ID)',
  }),

  // 状态
  enabled: defineField.boolean({
    required: true,
    defaultValue: true,
    description: '是否启用',
  }),

  // 多租户支持
  tenantId: defineField.string({
    index: true,
    description: '租户ID(全局规则为null)',
  }),

  // 审计字段
  createdAt: defineField.date({
    required: true,
    defaultValue: 'now',
    description: '创建时间',
  }),
  updatedAt: defineField.date({
    required: true,
    description: '更新时间',
  }),
  createdBy: defineField.string({
    description: '创建人ID',
  }),
})

/**
 * 告警事件实体 - 告警触发记录
 */
export const AlertEventEntity = defineEntity('AlertEvent', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '告警事件标识符',
  }),
  ruleId: defineField.string({
    required: true,
    index: true,
    description: '告警规则ID',
  }),

  // 事件信息
  status: defineField.enum(['TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED'], {
    required: true,
    defaultValue: 'TRIGGERED',
    description: '告警状态',
  }),
  severity: defineField.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required: true,
    description: '告警级别',
  }),

  // 触发数据
  currentValue: defineField.number({
    required: true,
    description: '当前指标值',
  }),
  threshold: defineField.number({
    required: true,
    description: '触发阈值',
  }),

  // 事件详情
  details: defineField.json({
    description: '告警详情(JSON格式)',
  }),

  // 处理信息
  acknowledgedAt: defineField.date({
    description: '确认时间',
  }),
  acknowledgedBy: defineField.string({
    description: '确认人ID',
  }),
  resolvedAt: defineField.date({
    description: '解决时间',
  }),
  resolvedBy: defineField.string({
    description: '解决人ID',
  }),
  notes: defineField.text({
    description: '处理备注',
  }),

  // 多租户支持
  tenantId: defineField.string({
    index: true,
    description: '租户ID',
  }),

  // 时间戳
  triggeredAt: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '触发时间',
  }),
})
