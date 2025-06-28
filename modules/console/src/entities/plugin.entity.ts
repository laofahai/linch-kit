/**
 * 插件管理实体定义
 * 
 * 插件市场和管理相关的实体模型
 */

import { defineEntity, defineField } from '@linch-kit/schema'
import { z } from 'zod'

// 定义插件配置类型
export interface PluginConfig {
  [key: string]: unknown
}

// 定义插件依赖类型
export interface PluginDependency {
  pluginId: string
  version: string
  optional?: boolean
}

/**
 * 插件实体 - 插件市场和管理
 */
export const PluginEntity = defineEntity('Plugin', {
  // 基础信息
  name: defineField.string()
    .required()
    .unique()
    .max(100)
    .description('插件名称'),
  
  version: defineField.string()
    .required()
    .max(20)
    .description('插件版本'),
  
  description: defineField.text()
    .optional()
    .description('插件描述'),
  
  authorName: defineField.string()
    .required()
    .max(100)
    .description('插件作者名称'),
  
  // 插件分类和标签
  category: defineField.enum([
    'ui',
    'data',
    'integration',
    'security',
    'monitoring',
    'automation',
    'workflow',
    'other'
  ])
    .required()
    .description('插件分类'),
  
  tags: defineField.string()
    .array()
    .default([])
    .description('标签数组'),
  
  // 链接信息
  homepage: defineField.string()
    .optional()
    .url()
    .description('插件主页URL'),
  
  repository: defineField.string()
    .optional()
    .url()
    .description('源码仓库URL'),
  
  documentation: defineField.string()
    .optional()
    .url()
    .description('文档URL'),
  
  license: defineField.string()
    .optional()
    .max(50)
    .description('许可证类型'),
  
  // 安装和配置
  downloadUrl: defineField.string()
    .optional()
    .url()
    .description('下载URL'),
  
  configSchema: defineField.json()
    .optional()
    .description('配置Schema(JSON Schema格式)'),
  
  defaultConfig: defineField.json<PluginConfig>()
    .default({})
    .description('默认配置'),
  
  // 兼容性信息
  minLinchKitVersion: defineField.string()
    .optional()
    .max(20)
    .description('最低LinchKit版本要求'),
  
  maxLinchKitVersion: defineField.string()
    .optional()
    .max(20)
    .description('最高LinchKit版本支持'),
  
  dependencies: defineField.json<PluginDependency[]>()
    .default([])
    .description('依赖的其他插件'),
  
  // 状态管理
  status: defineField.enum(['draft', 'published', 'deprecated', 'removed'])
    .required()
    .default('draft')
    .description('插件状态'),
  
  isOfficial: defineField.boolean()
    .default(false)
    .description('是否为官方插件'),
  
  isFeatured: defineField.boolean()
    .default(false)
    .description('是否为推荐插件'),
  
  // 统计信息
  downloads: defineField.int()
    .default(0)
    .min(0)
    .description('总下载次数'),
  
  weeklyDownloads: defineField.int()
    .default(0)
    .min(0)
    .description('周下载次数'),
  
  rating: defineField.float()
    .optional()
    .min(1)
    .max(5)
    .description('平均评分(1-5)'),
  
  ratingCount: defineField.int()
    .default(0)
    .min(0)
    .description('评分总数'),
  
  // 审核信息
  reviewStatus: defineField.enum(['pending', 'approved', 'rejected'])
    .optional()
    .description('审核状态'),
  
  reviewNotes: defineField.text()
    .optional()
    .description('审核备注'),
  
  reviewedAt: defineField.datetime()
    .optional()
    .description('审核时间'),
  
  reviewedBy: defineField.relation('User')
    .optional()
    .description('审核人员'),
  
  // 关系字段
  author: defineField.relation('User')
    .required()
    .description('插件作者'),
  
  versions: defineField.relation('PluginVersion')
    .oneToMany()
    .description('插件版本历史'),
  
  installations: defineField.relation('TenantPlugin')
    .oneToMany()
    .description('安装记录'),
  
  // 审计字段
  createdAt: defineField.datetime()
    .default('now')
    .description('创建时间'),
  
  updatedAt: defineField.datetime()
    .updatedAt()
    .description('更新时间'),
  
  publishedAt: defineField.datetime()
    .optional()
    .description('发布时间')
})

/**
 * 插件版本实体 - 插件版本历史管理
 */
export const PluginVersionEntity = defineEntity('PluginVersion', {
  // 关系
  plugin: defineField.relation('Plugin')
    .required()
    .description('所属插件'),
  
  // 版本信息
  version: defineField.string()
    .required()
    .max(20)
    .description('版本号'),
  
  changelog: defineField.text()
    .optional()
    .description('版本更新日志'),
  
  breakingChanges: defineField.text()
    .optional()
    .description('破坏性变更说明'),
  
  downloadUrl: defineField.string()
    .optional()
    .url()
    .description('该版本的下载URL'),
  
  // 兼容性
  minLinchKitVersion: defineField.string()
    .optional()
    .max(20)
    .description('最低LinchKit版本要求'),
  
  // 状态
  isStable: defineField.boolean()
    .default(true)
    .description('是否为稳定版本'),
  
  isLatest: defineField.boolean()
    .default(false)
    .description('是否为最新版本'),
  
  // 统计
  downloads: defineField.int()
    .default(0)
    .min(0)
    .description('该版本下载次数'),
  
  // 审计字段
  createdAt: defineField.datetime()
    .default('now')
    .description('发布时间')
})

/**
 * 租户插件关联实体 - 租户安装的插件
 */
export const TenantPluginEntity = defineEntity('TenantPlugin', {
  // 关系
  tenant: defineField.relation('Tenant')
    .required()
    .description('租户'),
  
  plugin: defineField.relation('Plugin')
    .required()
    .description('插件'),
  
  // 安装信息
  version: defineField.string()
    .required()
    .max(20)
    .description('安装的版本'),
  
  status: defineField.enum(['installed', 'active', 'inactive', 'error', 'updating'])
    .required()
    .default('installed')
    .description('插件状态'),
  
  // 配置
  config: defineField.json<PluginConfig>()
    .default({})
    .description('插件配置'),
  
  // 自动更新设置
  autoUpdate: defineField.boolean()
    .default(false)
    .description('是否自动更新'),
  
  updateChannel: defineField.enum(['stable', 'beta', 'alpha'])
    .default('stable')
    .description('更新通道'),
  
  // 错误信息
  lastError: defineField.text()
    .optional()
    .description('最后一次错误信息'),
  
  errorCount: defineField.int()
    .default(0)
    .min(0)
    .description('错误次数'),
  
  // 审计字段
  installedAt: defineField.datetime()
    .default('now')
    .description('安装时间'),
  
  updatedAt: defineField.datetime()
    .updatedAt()
    .description('更新时间'),
  
  lastUsedAt: defineField.datetime()
    .optional()
    .description('最后使用时间')
})

// 导出类型
export type Plugin = z.infer<typeof PluginEntity.zodSchema>
export type PluginInput = z.infer<typeof PluginEntity.createSchema>
export type PluginUpdate = z.infer<typeof PluginEntity.updateSchema>

export type PluginVersion = z.infer<typeof PluginVersionEntity.zodSchema>
export type PluginVersionInput = z.infer<typeof PluginVersionEntity.createSchema>

export type TenantPlugin = z.infer<typeof TenantPluginEntity.zodSchema>
export type TenantPluginInput = z.infer<typeof TenantPluginEntity.createSchema>
export type TenantPluginUpdate = z.infer<typeof TenantPluginEntity.updateSchema>