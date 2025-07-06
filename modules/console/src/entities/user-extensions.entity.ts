/**
 * 用户扩展实体定义
 * 
 * 扩展 @linch-kit/auth 的用户实体，添加 Console 特定的字段
 */

import { defineEntity, defineField } from '@linch-kit/schema'
// import { UserEntity } from '@linch-kit/auth'  // 暂时注释，等 Auth 包完善后启用
import { z } from 'zod'

// 定义用户偏好设置类型
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  dashboard?: {
    layout?: string
    widgets?: string[]
  }
}

/**
 * Console 用户扩展 - 为 Console 模块扩展用户字段
 * 注意：这不是一个独立的实体，而是对 UserEntity 的扩展
 */
function createConsoleUserExtensions() {
  return {
    // Console 特定字段
    lastLoginAt: defineField.datetime()
      .optional()
      .description('console.entities.user.fields.lastLoginAt')
      .build(),
    
    lastActiveAt: defineField.datetime()
      .optional()
      .description('console.entities.user.fields.lastActiveAt')
      .build(),
    
    lastLoginIp: defineField.string()
      .optional()
      .max(45) // 支持 IPv6
      .description('console.entities.user.fields.lastLoginIp')
      .build(),
    
    loginCount: defineField.int()
      .default(0)
      .min(0)
      .description('console.entities.user.fields.loginCount')
      .build(),
    
    preferences: defineField.json<UserPreferences>()
      .default({})
      .description('console.entities.user.fields.preferences')
      .build(),
    
    // 多租户支持
    currentTenantId: defineField.string()
      .optional()
      .description('console.entities.user.fields.currentTenantId')
      .build(),
    
    // 系统角色
    isSystemAdmin: defineField.boolean()
      .default(false)
      .description('console.entities.user.fields.isSystemAdmin')
      .build(),
    
    // API 访问
    apiKey: defineField.string()
      .optional()
      .unique()
      .description('console.entities.user.fields.apiKey')
      .build(),
    
    apiKeyCreatedAt: defineField.datetime()
      .optional()
      .description('console.entities.user.fields.apiKeyCreatedAt')
      .build(),
    
    apiKeyLastUsedAt: defineField.datetime()
      .optional()
      .description('console.entities.user.fields.apiKeyLastUsedAt')
      .build()
  }
}

export const ConsoleUserExtensions = createConsoleUserExtensions()

/**
 * 用户活动实体 - 用户活动追踪
 */
export const UserActivityEntity = defineEntity('UserActivity', {
  // 关系
  user: defineField.relation('User')
    .required()
    .description('console.entities.userActivity.fields.user'),
  
  tenant: defineField.relation('Tenant')
    .optional()
    .description('console.entities.userActivity.fields.tenant'),
  
  // 活动信息
  type: defineField.enum([
    'login',
    'logout',
    'page_view',
    'api_call',
    'data_export',
    'settings_change',
    'password_change',
    'role_change'
  ])
    .required()
    .description('console.entities.userActivity.fields.type'),
  
  action: defineField.string()
    .required()
    .max(100)
    .description('console.entities.userActivity.fields.action'),
  
  resource: defineField.string()
    .optional()
    .max(100)
    .description('console.entities.userActivity.fields.resource'),
  
  resourceId: defineField.string()
    .optional()
    .description('console.entities.userActivity.fields.resourceId'),
  
  // 上下文信息
  ipAddress: defineField.string()
    .optional()
    .max(45)
    .description('console.entities.userActivity.fields.ipAddress'),
  
  userAgent: defineField.string()
    .optional()
    .max(500)
    .description('console.entities.userActivity.fields.userAgent'),
  
  metadata: defineField.json()
    .optional()
    .description('console.entities.userActivity.fields.metadata'),
  
  // 时间戳
  createdAt: defineField.datetime()
    .default('now')
    .index()
    .description('console.entities.userActivity.fields.createdAt')
})

/**
 * 用户通知实体 - 系统通知
 */
export const UserNotificationEntity = defineEntity('UserNotification', {
  // 关系
  user: defineField.relation('User')
    .required()
    .description('console.entities.userNotification.fields.user'),
  
  // 通知内容
  type: defineField.enum([
    'info',
    'warning',
    'error',
    'success',
    'system',
    'security'
  ])
    .required()
    .description('console.entities.userNotification.fields.type'),
  
  title: defineField.string()
    .required()
    .max(200)
    .description('console.entities.userNotification.fields.title'),
  
  message: defineField.text()
    .required()
    .description('console.entities.userNotification.fields.message'),
  
  // 操作链接
  actionUrl: defineField.string()
    .optional()
    .max(500)
    .description('console.entities.userNotification.fields.actionUrl'),
  
  actionLabel: defineField.string()
    .optional()
    .max(50)
    .description('console.entities.userNotification.fields.actionLabel'),
  
  // 状态
  isRead: defineField.boolean()
    .default(false)
    .description('console.entities.userNotification.fields.isRead'),
  
  readAt: defineField.datetime()
    .optional()
    .description('console.entities.userNotification.fields.readAt'),
  
  // 元数据
  metadata: defineField.json()
    .optional()
    .description('console.entities.userNotification.fields.metadata'),
  
  // 时间戳
  createdAt: defineField.datetime()
    .default('now')
    .description('console.entities.userNotification.fields.createdAt'),
  
  expiresAt: defineField.datetime()
    .optional()
    .description('console.entities.userNotification.fields.expiresAt')
})

// 导出类型
export type UserActivity = z.infer<typeof UserActivityEntity.zodSchema>
export type UserActivityInput = z.infer<typeof UserActivityEntity.createSchema>

export type UserNotification = z.infer<typeof UserNotificationEntity.zodSchema>
export type UserNotificationInput = z.infer<typeof UserNotificationEntity.createSchema>
export type UserNotificationUpdate = z.infer<typeof UserNotificationEntity.updateSchema>