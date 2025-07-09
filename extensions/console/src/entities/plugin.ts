/**
 * 插件管理实体定义
 *
 * 插件市场和管理相关的实体模型
 */

import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 插件实体 - 插件市场和管理
 */
export const PluginEntity = defineEntity('Plugin', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '插件唯一标识符',
  }),
  name: defineField.string({
    required: true,
    unique: true,
    maxLength: 100,
    description: '插件名称',
  }),
  version: defineField.string({
    required: true,
    maxLength: 20,
    description: '插件版本',
  }),
  description: defineField.text({
    description: '插件描述',
  }),
  author: defineField.string({
    required: true,
    maxLength: 100,
    description: '插件作者',
  }),
  authorId: defineField.string({
    description: '创建者用户ID',
  }),

  // 插件分类和标签
  category: defineField.enum(
    ['UI', 'DATA', 'INTEGRATION', 'SECURITY', 'MONITORING', 'AUTOMATION', 'WORKFLOW', 'OTHER'],
    {
      required: true,
      description: '插件分类',
    }
  ),
  tags: defineField.array(defineField.string(), {
    description: '标签数组',
  }),

  // 链接信息
  homepage: defineField.url({
    description: '插件主页URL',
  }),
  repository: defineField.url({
    description: '源码仓库URL',
  }),
  documentation: defineField.url({
    description: '文档URL',
  }),
  license: defineField.string({
    maxLength: 50,
    description: '许可证类型',
  }),

  // 安装和配置
  downloadUrl: defineField.url({
    description: '下载URL',
  }),
  installCommand: defineField.string({
    description: '安装命令',
  }),
  configSchema: defineField.json({
    description: '配置Schema(JSON Schema格式)',
  }),
  defaultConfig: defineField.json({
    description: '默认配置(JSON格式)',
  }),

  // 兼容性信息
  minLinchKitVersion: defineField.string({
    maxLength: 20,
    description: '最低LinchKit版本要求',
  }),
  maxLinchKitVersion: defineField.string({
    maxLength: 20,
    description: '最高LinchKit版本支持',
  }),
  dependencies: defineField.array(defineField.string(), {
    description: '依赖的其他插件',
  }),

  // 状态管理
  status: defineField.enum(['DRAFT', 'PUBLISHED', 'DEPRECATED', 'REMOVED'], {
    required: true,
    defaultValue: 'DRAFT',
    description: '插件状态',
  }),
  isOfficial: defineField.boolean({
    required: true,
    defaultValue: false,
    description: '是否为官方插件',
  }),
  isFeatured: defineField.boolean({
    required: true,
    defaultValue: false,
    description: '是否为推荐插件',
  }),

  // 统计信息
  downloads: defineField.int({
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '总下载次数',
  }),
  weeklyDownloads: defineField.int({
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '周下载次数',
  }),
  rating: defineField.number({
    minimum: 1,
    maximum: 5,
    description: '平均评分(1-5)',
  }),
  ratingCount: defineField.int({
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '评分总数',
  }),

  // 审核和发布
  reviewStatus: defineField.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    description: '审核状态',
  }),
  reviewNotes: defineField.text({
    description: '审核备注',
  }),
  reviewedAt: defineField.date({
    description: '审核时间',
  }),
  reviewedBy: defineField.string({
    description: '审核人员ID',
  }),

  // 审计字段
  createdAt: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '创建时间',
  }),
  updatedAt: defineField.date({
    required: true,
    description: '更新时间',
  }),
  publishedAt: defineField.date({
    description: '发布时间',
  }),
})

/**
 * 插件版本实体 - 插件版本历史管理
 */
export const PluginVersionEntity = defineEntity('PluginVersion', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '版本记录标识符',
  }),
  pluginId: defineField.string({
    required: true,
    index: true,
    description: '插件ID',
  }),
  version: defineField.string({
    required: true,
    maxLength: 20,
    description: '版本号',
  }),

  // 版本信息
  changelog: defineField.text({
    description: '版本更新日志',
  }),
  breakingChanges: defineField.text({
    description: '破坏性变更说明',
  }),
  downloadUrl: defineField.url({
    description: '该版本的下载URL',
  }),

  // 兼容性
  minLinchKitVersion: defineField.string({
    maxLength: 20,
    description: '最低LinchKit版本要求',
  }),

  // 状态
  isStable: defineField.boolean({
    required: true,
    defaultValue: true,
    description: '是否为稳定版本',
  }),
  isLatest: defineField.boolean({
    required: true,
    defaultValue: false,
    description: '是否为最新版本',
  }),

  // 统计
  downloads: defineField.int({
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '该版本下载次数',
  }),

  // 审计字段
  createdAt: defineField.date({
    required: true,
    defaultValue: 'now',
    index: true,
    description: '发布时间',
  }),
})

/**
 * 租户插件关联实体 - 租户安装的插件
 */
export const TenantPluginEntity = defineEntity('TenantPlugin', {
  id: defineField.string({
    required: true,
    unique: true,
    description: '安装记录标识符',
  }),
  tenantId: defineField.string({
    required: true,
    index: true,
    description: '租户ID',
  }),
  pluginId: defineField.string({
    required: true,
    index: true,
    description: '插件ID',
  }),

  // 安装信息
  version: defineField.string({
    required: true,
    maxLength: 20,
    description: '安装的版本',
  }),
  status: defineField.enum(['INSTALLED', 'ACTIVE', 'INACTIVE', 'ERROR', 'UPDATING'], {
    required: true,
    defaultValue: 'INSTALLED',
    description: '插件状态',
  }),

  // 配置
  config: defineField.json({
    description: '插件配置(JSON格式)',
  }),

  // 自动更新设置
  autoUpdate: defineField.boolean({
    required: true,
    defaultValue: false,
    description: '是否自动更新',
  }),
  updateChannel: defineField.enum(['stable', 'beta', 'alpha'], {
    required: true,
    defaultValue: 'stable',
    description: '更新通道',
  }),

  // 错误信息
  lastError: defineField.text({
    description: '最后一次错误信息',
  }),
  errorCount: defineField.int({
    required: true,
    defaultValue: 0,
    minimum: 0,
    description: '错误次数',
  }),

  // 审计字段
  installedAt: defineField.date({
    required: true,
    defaultValue: 'now',
    description: '安装时间',
  }),
  updatedAt: defineField.date({
    required: true,
    description: '更新时间',
  }),
  lastUsedAt: defineField.date({
    description: '最后使用时间',
  }),
})
