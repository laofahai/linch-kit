/**
 * 用户管理扩展实体
 * 
 * 扩展 @linch-kit/auth 包中的用户实体，添加企业级管理功能
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 扩展用户实体 - 基于 @linch-kit/auth 的 LinchKitUser
 * 添加企业级管理功能
 */
export const ConsoleUserEntity = defineEntity('ConsoleUser', {
  // 基础字段继承自 LinchKitUser
  id: defineField.string({ 
    required: true, 
    unique: true,
    description: '用户唯一标识符'
  }),
  email: defineField.email({ 
    required: true, 
    unique: true,
    description: '用户邮箱'
  }),
  name: defineField.string({
    maxLength: 100,
    description: '用户姓名'
  }),
  image: defineField.url({
    description: '用户头像URL(兼容NextAuth字段)'
  }),
  
  // 多租户支持
  tenantId: defineField.string({ 
    required: true,
    index: true,
    description: '所属租户ID'
  }),
  
  // Console 特有的企业级字段
  employeeId: defineField.string({
    unique: true,
    maxLength: 50,
    description: '员工编号'
  }),
  department: defineField.string({
    maxLength: 100,
    description: '部门'
  }),
  position: defineField.string({
    maxLength: 100,
    description: '职位'
  }),
  managerId: defineField.string({
    description: '直属主管用户ID'
  }),
  
  // 扩展状态管理
  status: defineField.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'DELETED'], {
    required: true,
    defaultValue: 'ACTIVE',
    description: '用户状态'
  }),
  
  // 多因子认证扩展
  mfaEnabled: defineField.boolean({ 
    required: true,
    defaultValue: false,
    description: 'MFA是否启用'
  }),
  mfaSecret: defineField.string({
    description: 'TOTP密钥(加密存储)'
  }),
  backupCodes: defineField.text({
    description: '备份代码(JSON数组，加密存储)'
  }),
  
  // 安全相关
  loginAttempts: defineField.int({ 
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '失败登录尝试次数'
  }),
  lockedUntil: defineField.date({
    description: '账户锁定解除时间'
  }),
  lastLoginAt: defineField.date({
    index: true,
    description: '最后成功登录时间'
  }),
  lastLoginIp: defineField.string({
    maxLength: 45, // IPv6 最大长度
    description: '最后登录IP地址'
  }),
  lastActiveAt: defineField.date({
    description: '最后活跃时间'
  }),
  
  // 偏好设置
  locale: defineField.string({ 
    required: true,
    defaultValue: 'zh-CN',
    maxLength: 10,
    description: '语言环境'
  }),
  timezone: defineField.string({ 
    required: true,
    defaultValue: 'Asia/Shanghai',
    maxLength: 50,
    description: '时区'
  }),
  theme: defineField.enum(['light', 'dark', 'auto'], { 
    required: true,
    defaultValue: 'light',
    description: '主题偏好'
  }),
  
  // 通知设置
  notificationSettings: defineField.json({
    description: '通知偏好设置(JSON格式)'
  }),
  
  // 审计字段
  emailVerified: defineField.date({
    description: '邮箱验证时间'
  }),
  createdAt: defineField.date({ 
    required: true,
    defaultValue: 'now',
    index: true,
    description: '创建时间'
  }),
  updatedAt: defineField.date({ 
    required: true,
    description: '更新时间'
  }),
  deletedAt: defineField.date({
    description: '软删除时间'
  })
})

/**
 * 用户活动日志实体 - 追踪用户行为
 */
export const UserActivityEntity = defineEntity('UserActivity', {
  id: defineField.string({ 
    required: true, 
    unique: true,
    description: '活动记录标识符'
  }),
  userId: defineField.string({ 
    required: true,
    index: true,
    description: '用户ID'
  }),
  tenantId: defineField.string({ 
    required: true,
    index: true,
    description: '租户ID'
  }),
  
  // 活动信息
  action: defineField.string({ 
    required: true,
    maxLength: 100,
    description: '操作类型'
  }),
  resource: defineField.string({
    maxLength: 100,
    description: '操作的资源类型'
  }),
  resourceId: defineField.string({
    description: '操作的资源ID'
  }),
  
  // 请求信息
  ipAddress: defineField.string({
    maxLength: 45,
    description: 'IP地址'
  }),
  userAgent: defineField.text({
    description: '用户代理字符串'
  }),
  
  // 结果和详情
  success: defineField.boolean({ 
    required: true,
    description: '操作是否成功'
  }),
  details: defineField.json({
    description: '操作详细信息(JSON格式)'
  }),
  
  // 时间戳
  createdAt: defineField.date({ 
    required: true,
    defaultValue: 'now',
    index: true,
    description: '活动时间'
  })
})