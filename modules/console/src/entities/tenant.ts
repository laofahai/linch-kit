/**
 * 租户管理实体定义
 * 
 * 多租户架构的核心实体，包括租户和配额管理
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 租户实体 - 核心多租户支持
 */
export const TenantEntity = defineEntity('Tenant', {
  id: defineField.string({ 
    required: true, 
    unique: true,
    description: '租户唯一标识符'
  }),
  name: defineField.string({ 
    required: true, 
    unique: true,
    maxLength: 100,
    description: '租户名称'
  }),
  domain: defineField.string({ 
    unique: true,
    maxLength: 255,
    description: '自定义域名'
  }),
  slug: defineField.string({ 
    required: true, 
    unique: true,
    maxLength: 50,
    description: 'URL友好标识符'
  }),
  description: defineField.text({
    description: '租户描述'
  }),
  status: defineField.enum(['ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING'], {
    required: true,
    defaultValue: 'ACTIVE',
    description: '租户状态'
  }),
  
  // 计费信息
  planType: defineField.string({ 
    required: true,
    defaultValue: 'free',
    description: '计费计划类型'
  }),
  maxUsers: defineField.int({ 
    required: true,
    defaultValue: 10,
    minimum: 1,
    description: '最大用户数限制'
  }),
  maxStorage: defineField.number({ 
    required: true,
    defaultValue: 1073741824, // 1GB
    minimum: 0,
    description: '最大存储限制(字节)'
  }),
  
  // 扩展字段
  settings: defineField.json({
    description: '租户特定设置'
  }),
  metadata: defineField.json({
    description: '扩展元数据'
  }),
  
  // 审计字段
  createdAt: defineField.date({ 
    required: true,
    defaultValue: 'now',
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
 * 租户配额实体 - 资源配额管理
 */
export const TenantQuotasEntity = defineEntity('TenantQuotas', {
  id: defineField.string({ 
    required: true, 
    unique: true,
    description: '配额记录标识符'
  }),
  tenantId: defineField.string({ 
    required: true, 
    unique: true,
    description: '关联租户ID'
  }),
  
  // 用户配额
  maxUsers: defineField.int({ 
    required: true,
    defaultValue: 10,
    minimum: 0,
    description: '最大用户数'
  }),
  currentUsers: defineField.int({ 
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '当前用户数'
  }),
  
  // 存储配额
  maxStorage: defineField.number({ 
    required: true,
    defaultValue: 1073741824,
    minimum: 0,
    description: '最大存储限制'
  }),
  currentStorage: defineField.number({ 
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '当前存储使用量'
  }),
  
  // API配额
  maxApiCalls: defineField.int({ 
    required: true,
    defaultValue: 10000,
    minimum: 0,
    description: '最大API调用次数'
  }),
  currentApiCalls: defineField.int({ 
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '当前API调用次数'
  }),
  
  // 插件配额
  maxPlugins: defineField.int({ 
    required: true,
    defaultValue: 5,
    minimum: 0,
    description: '最大插件数'
  }),
  currentPlugins: defineField.int({ 
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '当前插件数'
  }),
  
  // 数据模型配额
  maxSchemas: defineField.int({ 
    required: true,
    defaultValue: 10,
    minimum: 0,
    description: '最大Schema数'
  }),
  currentSchemas: defineField.int({ 
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '当前Schema数'
  }),
  
  updatedAt: defineField.date({ 
    required: true,
    description: '更新时间'
  })
})