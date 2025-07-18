/**
 * 认证会话实体定义
 * 
 * 用于Console认证管理功能的会话数据模型
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 认证会话状态
 */
export const AuthSessionStatusEnum = ['active', 'expired', 'revoked', 'inactive'] as const
export type AuthSessionStatus = typeof AuthSessionStatusEnum[number]

/**
 * 认证会话实体
 */
export const AuthSessionEntity = defineEntity('AuthSession', {
  // 基础信息
  id: defineField.string().required(),
  userId: defineField.string().required(),
  userEmail: defineField.string().email().required(),
  userRole: defineField.string().default('user'),
  
  // 会话信息
  sessionId: defineField.string().required().unique(),
  accessToken: defineField.string().required(),
  refreshToken: defineField.string().optional(),
  tokenType: defineField.string().default('Bearer'),
  
  // 状态管理
  status: defineField.enum(AuthSessionStatusEnum).default('active'),
  
  // 时间信息
  issuedAt: defineField.datetime().default('now'),
  expiresAt: defineField.datetime().required(),
  lastAccessAt: defineField.datetime().default('now'),
  
  // 设备信息
  deviceInfo: defineField.json<{
    userAgent?: string
    ipAddress?: string
    deviceId?: string
    platform?: string
    browser?: string
    location?: string
  }>().optional(),
  
  // 权限信息
  permissions: defineField.array(defineField.string()).default([]),
  scopes: defineField.array(defineField.string()).default([]),
  
  // 安全信息
  securityFlags: defineField.json<{
    isSuspicious?: boolean
    isFromTrustedDevice?: boolean
    mfaVerified?: boolean
    riskLevel?: 'low' | 'medium' | 'high'
  }>().optional(),
  
  // 审计信息
  createdAt: defineField.datetime().default('now'),
  updatedAt: defineField.datetime().updatedAt(),
  revokedAt: defineField.datetime().optional(),
  revokedBy: defineField.string().optional(),
  revokedReason: defineField.string().optional(),
  
  // 关系
  user: defineField.relation('User').belongsTo(),
  auditLogs: defineField.relation('AuditLog').hasMany(),
})

/**
 * 认证性能指标实体
 */
export const AuthMetricsEntity = defineEntity('AuthMetrics', {
  // 基础信息
  id: defineField.string().required(),
  metricType: defineField.enum([
    'login_attempt',
    'login_success',
    'login_failure',
    'token_refresh',
    'token_revoke',
    'session_expire',
    'mfa_challenge',
    'password_reset'
  ]).required(),
  
  // 指标数据
  value: defineField.number().required(),
  tags: defineField.json<Record<string, string>>().optional(),
  
  // 时间信息
  timestamp: defineField.datetime().default('now'),
  
  // 关联信息
  userId: defineField.string().optional(),
  sessionId: defineField.string().optional(),
  
  // 元数据
  metadata: defineField.json<{
    userAgent?: string
    ipAddress?: string
    duration?: number
    errorCode?: string
    errorMessage?: string
  }>().optional(),
  
  // 聚合字段
  hourlyBucket: defineField.string().optional(), // 格式: YYYY-MM-DD-HH
  dailyBucket: defineField.string().optional(),  // 格式: YYYY-MM-DD
  
  createdAt: defineField.datetime().default('now'),
})

/**
 * 认证配置实体
 */
export const AuthConfigEntity = defineEntity('AuthConfig', {
  // 基础信息
  id: defineField.string().required(),
  configKey: defineField.string().required().unique(),
  configValue: defineField.json<unknown>().required(),
  
  // 分类信息
  category: defineField.enum([
    'jwt',
    'session',
    'security',
    'oauth',
    'mfa',
    'rate_limit',
    'password_policy'
  ]).required(),
  
  // 描述信息
  description: defineField.string().optional(),
  isRequired: defineField.boolean().default(false),
  isSecret: defineField.boolean().default(false),
  
  // 版本控制
  version: defineField.number().default(1),
  
  // 时间信息
  createdAt: defineField.datetime().default('now'),
  updatedAt: defineField.datetime().updatedAt(),
  
  // 关系
  auditLogs: defineField.relation('AuditLog').hasMany(),
})

/**
 * 导出认证管理实体集合
 */
export const AuthManagementEntities = {
  AuthSession: AuthSessionEntity,
  AuthMetrics: AuthMetricsEntity,
  AuthConfig: AuthConfigEntity,
} as const